import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as crypto from 'crypto';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SecurityMonitoringService } from './security-monitoring.service';
import { OAuthAccessToken, OAuthRefreshToken } from '@prisma/client';

// Constants for magic numbers
const AUTHORIZATION_CODE_EXPIRY_MINUTES = 10;
const ACCESS_TOKEN_EXPIRY_HOURS = 60;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const TOKEN_BYTES = 32; // 32 bytes -> 64 hex chars
const CLIENT_ID_BYTES = 16;

export interface OAuthAuthorizationRequest {
  responseType: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

export interface OAuthTokenRequest {
  grantType: string;
  code?: string;
  redirectUri?: string;
  clientId?: string;
  clientSecret?: string;
  codeVerifier?: string;
  refreshToken?: string;
  scope?: string;
}

export interface OAuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
}

@Injectable()
export class OAuth2Service {
  private readonly logger = new Logger(OAuth2Service.name);

  // OAuth 2.0 constants
  private readonly AUTHORIZATION_CODE_EXPIRY =
    AUTHORIZATION_CODE_EXPIRY_MINUTES *
    SECONDS_PER_MINUTE *
    MILLISECONDS_PER_SECOND; // 10 minutes
  private readonly ACCESS_TOKEN_EXPIRY =
    ACCESS_TOKEN_EXPIRY_HOURS *
    MINUTES_PER_HOUR *
    SECONDS_PER_MINUTE *
    MILLISECONDS_PER_SECOND; // 1 hour
  private readonly REFRESH_TOKEN_EXPIRY =
    REFRESH_TOKEN_EXPIRY_DAYS *
    HOURS_PER_DAY *
    MINUTES_PER_HOUR *
    SECONDS_PER_MINUTE *
    MILLISECONDS_PER_SECOND; // 30 days

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SecurityMonitoringService))
    private readonly securityMonitoring: SecurityMonitoringService
  ) {}

  /**
   * Validate authorization request and prepare for consent
   */
  async validateAuthorizationRequest(
    request: OAuthAuthorizationRequest
  ): Promise<{
    client: {
      id: string;
      clientId: string;
      clientName: string;
      redirectUris: string[];
      scopes: string[];
      status: string;
    };
    scopes: string[];
    isValid: boolean;
  }> {
    try {
      // Validate response type
      if (request.responseType !== 'code') {
        throw new BadRequestException({
          error: 'unsupported_response_type',
          errorDescription: 'Only authorization code flow is supported',
        });
      }

      // Validate client
      const client = await this.prisma.oAuthClient.findUnique({
        where: { clientId: request.clientId },
      });

      if (!client) {
        throw new BadRequestException({
          error: 'invalid_client',
          errorDescription: 'Client not found',
        });
      }

      if (client.status !== 'active') {
        throw new BadRequestException({
          error: 'unauthorized_client',
          errorDescription: 'Client is not active',
        });
      }

      // Validate redirect URI
      if (!client.redirectUris.includes(request.redirectUri)) {
        throw new BadRequestException({
          error: 'invalid_request',
          errorDescription: 'Invalid redirect URI',
        });
      }

      // Validate scopes
      const requestedScopes = request.scope ? request.scope.split(' ') : [];
      const allowedScopes = this.validateScopes(requestedScopes, client.scopes);

      if (allowedScopes.length === 0) {
        throw new BadRequestException({
          error: 'invalid_scope',
          errorDescription: 'No valid scopes requested',
        });
      }

      // Validate PKCE parameters (now mandatory)
      if (!request.codeChallenge) {
        throw new BadRequestException({
          error: 'invalid_request',
          errorDescription: 'PKCE code challenge is required',
        });
      }
      this.validatePKCEParameters(
        request.codeChallenge,
        request.codeChallengeMethod
      );

      return {
        client,
        scopes: allowedScopes,
        isValid: true,
      };
    } catch (error) {
      await this.securityMonitoring.recordSecurityEvent({
        type: 'authorization',
        severity: 'medium',
        description: `OAuth authorization validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          clientId: request.clientId,
          responseType: request.responseType,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Generate authorization code
   */
  async generateAuthorizationCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    scopes: string[],
    codeChallenge?: string,
    codeChallengeMethod?: string
  ): Promise<string> {
    try {
      const code = crypto.randomBytes(TOKEN_BYTES).toString('hex');
      const expiresAt = new Date(Date.now() + this.AUTHORIZATION_CODE_EXPIRY);

      await this.prisma.oAuthAuthorizationCode.create({
        data: {
          code,
          codeChallenge: codeChallenge || null,
          codeChallengeMethod: codeChallengeMethod || null,
          clientId,
          userId,
          redirectUri,
          scopes,
          expiresAt,
        },
      });

      await this.securityMonitoring.recordSecurityEvent({
        type: 'authorization',
        severity: 'low',
        userId,
        description: 'OAuth authorization code generated',
        metadata: {
          clientId,
          scopes,
          hasPKCE: Boolean(codeChallenge),
        },
      });

      return code;
    } catch (error) {
      this.logger.error('Failed to generate authorization code:', error);
      throw new BadRequestException({
        error: 'server_error',
        errorDescription: 'Failed to generate authorization code',
      });
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    request: OAuthTokenRequest
  ): Promise<OAuthTokenResponse> {
    try {
      if (request.grantType !== 'authorization_code') {
        throw new BadRequestException({
          error: 'unsupported_grant_type',
          errorDescription: 'Only authorization_code grant type is supported',
        });
      }

      if (!request.code || !request.redirectUri || !request.clientId) {
        throw new BadRequestException({
          error: 'invalid_request',
          errorDescription: 'Missing required parameters',
        });
      }

      // Validate client
      const client = await this.prisma.oAuthClient.findUnique({
        where: { clientId: request.clientId },
      });

      if (!client) {
        throw new BadRequestException({
          error: 'invalid_client',
          errorDescription: 'Client not found',
        });
      }

      // Validate client secret if required
      if (client.tokenEndpointAuthMethod === 'client_secret_basic') {
        if (
          !request.clientSecret ||
          request.clientSecret !== client.clientSecret
        ) {
          throw new UnauthorizedException({
            error: 'invalid_client',
            errorDescription: 'Invalid client credentials',
          });
        }
      }

      // Find and validate authorization code
      const authCode = await this.prisma.oAuthAuthorizationCode.findUnique({
        where: { code: request.code },
        include: { client: true, user: true },
      });

      if (!authCode) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Invalid authorization code',
        });
      }

      if (authCode.used) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Authorization code already used',
        });
      }

      if (authCode.expiresAt < new Date()) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Authorization code expired',
        });
      }

      if (authCode.clientId !== request.clientId) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Client ID mismatch',
        });
      }

      if (authCode.redirectUri !== request.redirectUri) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Redirect URI mismatch',
        });
      }

      // Validate PKCE if present
      if (authCode.codeChallenge) {
        if (!request.codeVerifier) {
          throw new BadRequestException({
            error: 'invalid_request',
            errorDescription: 'Code verifier required for PKCE',
          });
        }
        this.validatePKCECodeVerifier(authCode, request.codeVerifier);
      }

      // Mark authorization code as used
      await this.prisma.oAuthAuthorizationCode.update({
        where: { id: authCode.id },
        data: { used: true },
      });

      // Generate tokens
      const accessToken = await this.generateAccessToken(
        authCode.userId,
        authCode.clientId,
        authCode.scopes
      );

      const refreshToken = await this.createRefreshToken(
        authCode.clientId,
        authCode.userId,
        authCode.scopes,
        accessToken.id
      );

      await this.securityMonitoring.recordSecurityEvent({
        type: 'authorization',
        severity: 'low',
        userId: authCode.userId,
        description: 'OAuth tokens issued',
        metadata: {
          clientId: authCode.clientId,
          scopes: authCode.scopes,
          grantType: 'authorization_code',
        },
      });

      return {
        accessToken: accessToken.token,
        tokenType: 'Bearer',
        expiresIn: Math.floor(
          (accessToken.expiresAt.getTime() - Date.now()) /
            MILLISECONDS_PER_SECOND
        ),
        refreshToken: refreshToken.token,
        scope: authCode.scopes.join(' '),
      };
    } catch (error) {
      await this.securityMonitoring.recordSecurityEvent({
        type: 'authorization',
        severity: 'high',
        description: `OAuth token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          clientId: request.clientId,
          grantType: request.grantType,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Refresh access token with token rotation for enhanced security
   */
  async refreshAccessToken(
    request: OAuthTokenRequest
  ): Promise<OAuthTokenResponse> {
    try {
      if (request.grantType !== 'refresh_token') {
        throw new BadRequestException({
          error: 'unsupported_grant_type',
          errorDescription: 'Only refresh_token grant type is supported',
        });
      }

      if (!request.refreshToken) {
        throw new BadRequestException({
          error: 'invalid_request',
          errorDescription: 'Refresh token required',
        });
      }

      // Find refresh token
      const refreshTokenRecord = await this.prisma.oAuthRefreshToken.findUnique(
        {
          where: { token: request.refreshToken },
          include: { client: true, user: true },
        }
      );

      if (!refreshTokenRecord) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Invalid refresh token',
        });
      }

      if (refreshTokenRecord.revoked) {
        // SECURITY: REUSE DETECTED!
        // A revoked token was used, which indicates a potential compromise.
        // Invalidate the entire token family.
        this.logger.warn(
          `Refresh token reuse detected for user ${refreshTokenRecord.userId} and client ${refreshTokenRecord.clientId}. Invalidating token family.`
        );

        if (refreshTokenRecord.familyId) {
          await this.prisma.oAuthRefreshToken.updateMany({
            where: { familyId: refreshTokenRecord.familyId },
            data: { revoked: true, revokedAt: new Date() },
          });
        }

        await this.securityMonitoring.recordSecurityEvent({
          type: 'authorization',
          severity: 'high',
          userId: refreshTokenRecord.userId,
          description:
            'Refresh token reuse detected. All tokens in family invalidated.',
          metadata: {
            clientId: refreshTokenRecord.clientId,
            familyId: refreshTokenRecord.familyId,
          },
        });

        throw new UnauthorizedException({
          // Use 401 for security issues
          error: 'invalid_grant',
          errorDescription: 'Invalid refresh token', // Keep generic message
        });
      }

      if (refreshTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Refresh token expired',
        });
      }

      // Validate client if provided
      if (
        request.clientId &&
        refreshTokenRecord.clientId !== request.clientId
      ) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Client ID mismatch',
        });
      }

      // Generate new access token
      const accessToken = await this.generateAccessToken(
        refreshTokenRecord.userId,
        refreshTokenRecord.clientId,
        refreshTokenRecord.scopes
      );

      // SECURITY: Implement refresh token rotation
      // Generate a new refresh token to replace the old one
      const newRefreshToken = await this.createRefreshToken(
        refreshTokenRecord.clientId,
        refreshTokenRecord.userId,
        refreshTokenRecord.scopes,
        accessToken.id,
        refreshTokenRecord.familyId
      );

      // Mark the old refresh token as revoked (security best practice)
      await this.prisma.oAuthRefreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: {
          revoked: true,
          revokedAt: new Date(),
          rotatedAt: new Date(),
          rotatedToTokenId: newRefreshToken.id,
        },
      });

      await this.securityMonitoring.recordSecurityEvent({
        type: 'authorization',
        severity: 'low',
        userId: refreshTokenRecord.userId,
        description: 'OAuth tokens refreshed with rotation',
        metadata: {
          clientId: refreshTokenRecord.clientId,
          scopes: refreshTokenRecord.scopes,
          oldTokenRevoked: true,
          newTokenGenerated: true,
        },
      });

      return {
        accessToken: accessToken.token,
        tokenType: 'Bearer',
        expiresIn: Math.floor(
          (accessToken.expiresAt.getTime() - Date.now()) /
            MILLISECONDS_PER_SECOND
        ),
        refreshToken: newRefreshToken.token, // Return the new refresh token
        scope: refreshTokenRecord.scopes.join(' '),
      };
    } catch (error) {
      await this.securityMonitoring.recordSecurityEvent({
        type: 'authorization',
        severity: 'medium',
        description: `OAuth token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          grantType: request.grantType,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Validate and decode access token
   */
  async validateAccessToken(token: string): Promise<{
    userId: string;
    clientId: string;
    scopes: string[];
    expiresAt: Date;
    createdAt: Date;
    client: {
      id: string;
      clientId: string;
      clientName: string;
      redirectUris: string[];
      scopes: string[];
      status: string;
    };
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }> {
    try {
      // Check if token exists in database and is not revoked
      const tokenRecord = await this.prisma.oAuthAccessToken.findUnique({
        where: { token },
        include: { client: true, user: true },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid access token');
      }

      if (tokenRecord.revoked) {
        throw new UnauthorizedException('Access token revoked');
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Access token expired');
      }

      // Update last used timestamp
      await this.prisma.oAuthAccessToken.update({
        where: { id: tokenRecord.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        userId: tokenRecord.userId,
        clientId: tokenRecord.clientId,
        scopes: tokenRecord.scopes,
        expiresAt: tokenRecord.expiresAt,
        createdAt: tokenRecord.createdAt,
        client: tokenRecord.client,
        user: tokenRecord.user,
      };
    } catch (error) {
      this.logger.error('Access token validation failed:', error);
      throw error;
    }
  }

  /**
   * Revoke tokens
   */
  async revokeToken(token: string, tokenTypeHint?: string): Promise<void> {
    try {
      if (tokenTypeHint === 'refresh_token') {
        await this.prisma.oAuthRefreshToken.updateMany({
          where: { token },
          data: { revoked: true },
        });
      } else {
        await this.prisma.oAuthAccessToken.updateMany({
          where: { token },
          data: { revoked: true },
        });
      }

      await this.securityMonitoring.recordSecurityEvent({
        type: 'authorization',
        severity: 'low',
        description: `OAuth token revoked: ${tokenTypeHint || 'unknown'}`,
        metadata: { tokenTypeHint },
      });
    } catch (error) {
      this.logger.error('Token revocation failed:', error);
      throw error;
    }
  }

  /**
   * Validate scopes against allowed scopes
   */
  private validateScopes(
    requestedScopes: string[],
    allowedScopes: string[]
  ): string[] {
    return requestedScopes.filter(scope => allowedScopes.includes(scope));
  }

  /**
   * Validate PKCE parameters
   */
  private validatePKCEParameters(
    codeChallenge: string,
    codeChallengeMethod?: string
  ): void {
    const method = codeChallengeMethod || 'plain';

    if (!['plain', 'S256'].includes(method)) {
      throw new BadRequestException({
        error: 'invalid_request',
        errorDescription: 'Invalid code challenge method',
      });
    }

    // Validate code challenge format
    if (method === 'S256' && !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) {
      throw new BadRequestException({
        error: 'invalid_request',
        errorDescription: 'Invalid code challenge format for S256',
      });
    }
  }

  /**
   * Validate PKCE code verifier
   */
  private validatePKCECodeVerifier(
    authCode: {
      codeChallenge?: string | null;
      codeChallengeMethod?: string | null;
    },
    codeVerifier: string
  ): void {
    if (!authCode.codeChallenge) {
      return; // No PKCE required
    }

    const method = authCode.codeChallengeMethod || 'plain';

    if (method === 'S256') {
      // Compute SHA256 hash of code verifier
      const hash = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // Use timing-safe comparison to prevent timing attacks
      const hashBuffer = Buffer.from(hash, 'utf8');
      const challengeBuffer = Buffer.from(authCode.codeChallenge || '', 'utf8');

      if (
        hashBuffer.length !== challengeBuffer.length ||
        !crypto.timingSafeEqual(hashBuffer, challengeBuffer)
      ) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Code verifier does not match code challenge',
        });
      }
    } else if (method === 'plain') {
      // Use timing-safe comparison to prevent timing attacks
      const verifierBuffer = Buffer.from(codeVerifier, 'utf8');
      const challengeBuffer = Buffer.from(authCode.codeChallenge || '', 'utf8');

      if (
        verifierBuffer.length !== challengeBuffer.length ||
        !crypto.timingSafeEqual(verifierBuffer, challengeBuffer)
      ) {
        throw new BadRequestException({
          error: 'invalid_grant',
          errorDescription: 'Code verifier does not match code challenge',
        });
      }
    }

    // Validate code verifier format
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(codeVerifier)) {
      throw new BadRequestException({
        error: 'invalid_request',
        errorDescription: 'Invalid code verifier format',
      });
    }
  }

  /**
   * Generate access token
   */
  private async generateAccessToken(
    userId: string,
    clientId: string,
    scopes: string[]
  ): Promise<OAuthAccessToken> {
    const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY);

    return await this.prisma.oAuthAccessToken.create({
      data: {
        token,
        clientId,
        userId,
        scopes,
        expiresAt,
      },
    });
  }

  /**
   * Generate refresh token
   */
  private async createRefreshToken(
    clientId: string,
    userId: string,
    scopes: string[],
    accessTokenId: string,
    familyId?: string | null
  ): Promise<OAuthRefreshToken> {
    const REFRESH_TOKEN_BYTE_LENGTH = 48;
    const FAMILY_ID_BYTE_LENGTH = 16;

    const token = crypto.randomBytes(REFRESH_TOKEN_BYTE_LENGTH).toString('hex');
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY);
    const newFamilyId =
      familyId || crypto.randomBytes(FAMILY_ID_BYTE_LENGTH).toString('hex');

    return await this.prisma.oAuthRefreshToken.create({
      data: {
        token,
        clientId,
        userId,
        scopes,
        expiresAt,
        accessTokenId,
        familyId: newFamilyId,
      },
    });
  }

  /**
   * Create OAuth client
   */
  async createClient(
    ownerId: string,
    clientData: {
      name: string;
      description?: string;
      redirectUris: string[];
      scopes: string[];
    }
  ): Promise<OAuthClientCreateResponse> {
    try {
      const clientId = crypto.randomBytes(CLIENT_ID_BYTES).toString('hex');
      const clientSecret = crypto.randomBytes(TOKEN_BYTES).toString('hex');

      const client = await this.prisma.oAuthClient.create({
        data: {
          clientId,
          clientSecret,
          clientName: clientData.name,
          clientDescription: clientData.description || null,
          redirectUris: clientData.redirectUris,
          grantTypes: ['authorization_code', 'refresh_token'],
          responseTypes: ['code'],
          scopes: clientData.scopes,
          ownerId,
        },
      });

      await this.securityMonitoring.recordSecurityEvent({
        type: 'authorization',
        severity: 'low',
        userId: ownerId,
        description: 'OAuth client created',
        metadata: {
          clientId: client.clientId,
          clientName: client.clientName,
          scopes: client.scopes,
        },
      });

      return {
        ...client,
        clientSecret, // Only returned on creation
      };
    } catch (error) {
      this.logger.error('Failed to create OAuth client:', error);
      throw error;
    }
  }

  /**
   * Get OAuth client by ID
   */
  async getClient(clientId: string): Promise<OAuthClientResponse | null> {
    const client = await this.prisma.oAuthClient.findUnique({
      where: { clientId },
    });
    if (!client) return null;
    const { clientSecret, ...rest } = client;
    return rest;
  }

  /**
   * Get user's OAuth clients
   */
  async getUserClients(userId: string): Promise<OAuthClientResponse[]> {
    const clients = await this.prisma.oAuthClient.findMany({
      where: { ownerId: userId },
    });
    return clients.map(c => {
      const { clientSecret, ...rest } = c;
      return rest;
    });
  }
}

export interface OAuthClientCreateResponse {
  id: string;
  clientId: string;
  clientSecret: string;
  clientName: string;
  clientDescription?: string | null;
  redirectUris: string[];
  scopes: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthClientResponse {
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
