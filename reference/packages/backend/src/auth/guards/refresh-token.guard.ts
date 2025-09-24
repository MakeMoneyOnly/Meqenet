import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for protecting routes that require a valid refresh token
 * Uses the jwt-refresh passport strategy
 */
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
