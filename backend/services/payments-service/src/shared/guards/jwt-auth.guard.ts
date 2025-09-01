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
  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
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
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any
  ): any {
    if (err || !user) {
      this.logger.warn('JWT authentication failed', {
        error: err?.message,
        info: info?.message,
        ip: context.switchToHttp().getRequest().ip,
      });
      throw err || new UnauthorizedException('JWT authentication failed');
    }

    return user;
  }
}
