import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// JWT security constants
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * JwtStrategy
 *
 * Validates Bearer tokens and attaches a minimal user principal to the request.
 * Aligns with enterprise security best practices by using configurable issuer,
 * audience, and secret, and by not trusting expired tokens.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // CRITICAL SECURITY: Ensure JWT secret is always provided
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is required for secure authentication. ' +
          'Please configure a strong, randomly generated secret key.'
      );
    }

    // Validate JWT secret strength
    if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security. ' +
          'Use a cryptographically secure random string.'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      issuer: configService.get<string>('JWT_ISSUER') || undefined,
      audience: configService.get<string>('JWT_AUDIENCE') || undefined,
    });
  }

  /**
   * Map validated JWT payload to the request user principal.
   */
  async validate(payload: {
    sub: string;
    email: string;
    role?: string;
  }): Promise<{ id: string; email: string; role?: string }> {
    return {
      id: payload.sub,
      email: payload.email,
      ...(payload.role && { role: payload.role }),
    };
  }
}
