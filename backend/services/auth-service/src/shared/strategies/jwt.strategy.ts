import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get('AUTH_SERVICE_URL')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>('JWT_AUDIENCE') || undefined,
      issuer: configService.get<string>('JWT_ISSUER') || undefined,
      algorithms: ['RS256'],
    });
  }

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
