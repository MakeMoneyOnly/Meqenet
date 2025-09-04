import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
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
