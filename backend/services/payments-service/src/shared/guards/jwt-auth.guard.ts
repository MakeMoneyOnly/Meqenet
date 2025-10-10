import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Enterprise FinTech compliant JWT token validation
 * Implements security best practices for financial services
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  /**
   * Validate JWT token and extract user information
   * @param context Execution context
   * @returns Promise<boolean> indicating if request is authorized
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        this.logger.warn('JWT token missing in request', {
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          url: request.url,
        });
        throw new UnauthorizedException('JWT token is required');
      }

      // Call parent canActivate to validate token
      const isValid = await super.canActivate(context);

      if (isValid) {
        this.logger.debug('JWT token validated successfully', {
          userId: request.user?.id,
          url: request.url,
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('JWT validation failed', {
        error: error.message,
        stack: error.stack,
      });
      throw new UnauthorizedException('Invalid or expired JWT token');
    }
  }

  /**
   * Extract JWT token from Authorization header
   * @param request HTTP request object
   * @returns JWT token string or null
   */
  private extractTokenFromHeader(
    request: Record<string, unknown>
  ): string | null {
    const authHeader = (request.headers as Record<string, unknown>)
      ?.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  /**
   * Handle request with invalid JWT
   * @param err Error object
   * @param user User object (null if invalid)
   * @param info Additional info
   * @param context Execution context
   * @param status HTTP status (unused)
   * @returns User object or throws exception
   */
  handleRequest(
    err: Error | null,
    user: Record<string, unknown> | null,
    info: Record<string, unknown> | null,
    context: ExecutionContext,
    _status?: number
  ): Record<string, unknown> | null {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const sanitizedErrorMessage = this.sanitizeErrorMessage(
        err?.message ?? 'Unknown authentication error'
      );

      this.logger.warn('JWT authentication failed', {
        error: sanitizedErrorMessage,
        info: info?.message,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        url: request.url,
        timestamp: new Date().toISOString(),
      });

      // Always throw UnauthorizedException for security
      throw new UnauthorizedException('Invalid authentication credentials');
    }

    return user;
  }

  /**
   * Sanitize error messages to prevent information leakage
   * @param message Original error message
   * @returns Sanitized error message
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /database/i,
      /connection/i,
      /stack/i,
    ];

    let sanitized = message;

    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }
}
