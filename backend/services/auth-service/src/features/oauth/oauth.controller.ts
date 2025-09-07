import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

import {
  OAuth2Service,
  OAuthAuthorizationRequest,
  OAuthTokenRequest,
  OAuthTokenResponse,
} from '../../shared/services/oauth2.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AuditLoggingService } from '../../shared/services/audit-logging.service';

// Constants for magic numbers
const BASIC_AUTH_PREFIX_LENGTH = 6;
const TOKEN_LOG_PREFIX_LENGTH = 8;
const MILLISECONDS_PER_SECOND = 1000;

// Type definitions
interface RequestUser {
  id: string;
  email: string;
  role?: string;
}

interface OAuthClientResponse {
  id: string;
  clientId: string;
  clientName: string;
  clientDescription?: string | null;
  redirectUris: string[];
  scopes: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OAuthClientCreateResponse extends OAuthClientResponse {
  clientSecret: string;
}

interface TokenIntrospectionResponse {
  active: boolean;
  client_id?: string;
  username?: string;
  scope?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  sub?: string;
}

@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oauth2Service: OAuth2Service,
    private readonly auditLogging: AuditLoggingService
  ) {}

  /**
   * OAuth 2.0 Authorization Endpoint
   * GET /oauth/authorize
   */
  @Get('authorize')
  @UseGuards(JwtAuthGuard)
  async authorize(
    @Query() query: OAuthAuthorizationRequest,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const userId = (req.user as RequestUser)?.id;

      // Validate authorization request
      const validation =
        await this.oauth2Service.validateAuthorizationRequest(query);

      if (!validation.isValid) {
        return res.redirect(
          `${query.redirectUri}?error=invalid_request&state=${query.state || ''}`
        );
      }

      // Generate authorization code
      const code = await this.oauth2Service.generateAuthorizationCode(
        query.clientId,
        userId || '',
        query.redirectUri,
        validation.scopes,
        query.codeChallenge,
        query.codeChallengeMethod
      );

      // Log successful authorization
      await this.auditLogging.logAuthEvent({
        eventType: 'OAUTH_AUTHORIZATION_SUCCESS',
        entityType: 'oauth_authorization_code',
        userId: userId || 'unknown',
        userEmail: (req.user as RequestUser)?.email,
        userRole: (req.user as RequestUser)?.role || '',
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
        eventData: {
          clientId: query.clientId,
          scopes: validation.scopes,
          success: true,
        },
      });

      // Redirect back to client with authorization code
      const redirectUrl = new URL(query.redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (query.state) {
        redirectUrl.searchParams.set('state', query.state);
      }

      res.redirect(redirectUrl.toString());
    } catch (error: unknown) {
      // Log failed authorization
      await this.auditLogging.logAuthEvent({
        eventType: 'OAUTH_AUTHORIZATION_FAILURE',
        entityType: 'oauth_authorization_code',
        userId: (req.user as RequestUser)?.id || 'unknown',
        userEmail: (req.user as RequestUser)?.email,
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
        eventData: {
          clientId: query.clientId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Redirect with error
      const redirectUrl = new URL(query.redirectUri || '');
      redirectUrl.searchParams.set(
        'error',
        error instanceof Error &&
          typeof (error as Error & { error?: string }).error === 'string'
          ? (error as Error & { error: string }).error
          : 'server_error'
      );
      if (query.state) {
        redirectUrl.searchParams.set('state', query.state);
      }

      res.redirect(redirectUrl.toString());
    }
  }

  /**
   * OAuth 2.0 Token Endpoint
   * POST /oauth/token
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async token(
    @Body() body: OAuthTokenRequest,
    @Req() req: Request,
    @Headers('authorization') _authHeader?: string
  ): Promise<OAuthTokenResponse> {
    try {
      // Extract client credentials from Authorization header if present
      if (_authHeader?.startsWith('Basic ')) {
        const credentials = Buffer.from(
          _authHeader.slice(BASIC_AUTH_PREFIX_LENGTH),
          'base64'
        )
          .toString()
          .split(':');
        body.clientId = credentials[0];
        body.clientSecret = credentials[1];
      }

      let result;

      if (body.grantType === 'authorization_code') {
        result = await this.oauth2Service.exchangeCodeForTokens(body);
      } else if (body.grantType === 'refresh_token') {
        result = await this.oauth2Service.refreshAccessToken(body);
      } else {
        throw new Error('unsupported_grant_type');
      }

      // Log successful token issuance
      await this.auditLogging.logAuthEvent({
        eventType: 'OAUTH_TOKEN_ISSUANCE_SUCCESS',
        entityType: 'oauth_access_token',
        userId: 'unknown', // OAuth tokens don't necessarily have user context at this point
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
        eventData: {
          clientId: body.clientId,
          grantType: body.grantType,
          success: true,
          scopes: result.scope?.split(' ') || [],
        },
      });

      return result;
    } catch (error: unknown) {
      // Log failed token issuance
      await this.auditLogging.logAuthEvent({
        eventType: 'OAUTH_TOKEN_ISSUANCE_FAILURE',
        entityType: 'oauth_access_token',
        userId: 'unknown',
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
        eventData: {
          clientId: body.clientId,
          grantType: body.grantType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * OAuth 2.0 Token Introspection Endpoint
   * POST /oauth/introspect
   */
  @Post('introspect')
  @HttpCode(HttpStatus.OK)
  async introspect(
    @Body() body: { token: string; token_type_hint?: string },
    @Headers('authorization') _authHeader?: string
  ): Promise<TokenIntrospectionResponse> {
    try {
      // Basic authentication validation would go here
      // For now, allowing introspection for valid tokens

      const tokenData = await this.oauth2Service.validateAccessToken(
        body.token
      );

      return {
        active: true,
        client_id: tokenData.clientId,
        username: tokenData.user.email,
        scope: tokenData.scopes.join(' '),
        token_type: 'Bearer',
        exp: Math.floor(
          tokenData.expiresAt.getTime() / MILLISECONDS_PER_SECOND
        ),
        iat: Math.floor(
          tokenData.createdAt.getTime() / MILLISECONDS_PER_SECOND
        ),
        sub: tokenData.userId,
      };
    } catch {
      return { active: false };
    }
  }

  /**
   * OAuth 2.0 Token Revocation Endpoint
   * POST /oauth/revoke
   */
  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Body() body: { token: string; token_type_hint?: string },
    @Req() req: Request,
    @Headers('authorization') _authHeader?: string
  ): Promise<{ revoked: boolean }> {
    try {
      await this.oauth2Service.revokeToken(body.token, body.token_type_hint);

      // Log token revocation
      await this.auditLogging.logAuthEvent({
        eventType: 'OAUTH_TOKEN_REVOCATION_SUCCESS',
        entityType: 'oauth_token',
        userId: 'unknown',
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
        eventData: {
          token: body.token.substring(0, TOKEN_LOG_PREFIX_LENGTH) + '...', // Partial token for logging
          tokenTypeHint: body.token_type_hint,
          success: true,
        },
      });

      return { revoked: true };
    } catch (error: unknown) {
      // Log failed revocation
      await this.auditLogging.logAuthEvent({
        eventType: 'OAUTH_TOKEN_REVOCATION_FAILURE',
        entityType: 'oauth_token',
        userId: 'unknown',
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
        eventData: {
          token: body.token.substring(0, TOKEN_LOG_PREFIX_LENGTH) + '...',
          tokenTypeHint: body.token_type_hint,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get user's OAuth clients
   * GET /oauth/clients
   */
  @Get('clients')
  @UseGuards(JwtAuthGuard)
  async getClients(@Req() req: Request): Promise<OAuthClientResponse[]> {
    const userId = (req.user as RequestUser)?.id;
    return await this.oauth2Service.getUserClients(userId || '');
  }

  /**
   * Create OAuth client
   * POST /oauth/clients
   */
  @Post('clients')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createClient(
    @Body()
    body: {
      name: string;
      description?: string;
      redirectUris: string[];
      scopes: string[];
    },
    @Req() req: Request
  ): Promise<OAuthClientCreateResponse> {
    const userId = (req.user as RequestUser)?.id;

    const client = await this.oauth2Service.createClient(userId, body);

    // Log client creation
    await this.auditLogging.logAuthEvent({
      eventType: 'OAUTH_CLIENT_CREATION_SUCCESS',
      entityType: 'oauth_client',
      entityId: client.clientId,
      userId: userId || 'unknown',
      userEmail: (req.user as RequestUser)?.email,
      userRole: (req.user as RequestUser)?.role || '',
      ipAddress: this.getClientIp(req),
      userAgent: req.headers['user-agent'] as string,
      eventData: {
        clientId: client.clientId,
        clientName: client.clientName,
        success: true,
      },
    });

    return client;
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIp) {
      return realIp;
    }
    return req.ip || 'unknown';
  }
}
