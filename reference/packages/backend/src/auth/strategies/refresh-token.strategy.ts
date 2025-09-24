import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/services/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Passport strategy for validating refresh tokens
 * Uses a separate strategy from the access token to allow different validation rules
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  /**
   * Validate the refresh token
   * @param req Express request object
   * @param payload JWT payload
   * @returns User object if token is valid
   */
  async validate(req: Request, payload: JwtPayload) {
    // Extract refresh token from request
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    
    // Validate refresh token against stored token
    const isValid = await this.usersService.validateRefreshToken(
      payload.sub,
      refreshToken,
    );
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    // Get user
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return user;
  }
}
