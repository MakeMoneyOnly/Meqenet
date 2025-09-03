import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthEvent, UserRegisteredPayload } from '../../shared/events';
import { EventService } from '../../shared/services/event.service';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventService: EventService
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
    _context?: { language?: string }
  ): Promise<{ accessToken: string }> {
    const { email, password } = registerUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException({
        errorCode: 'USER_ALREADY_EXISTS',
        message: 'User with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user with password hash directly in the User model
    const createdUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
    });

    const eventPayload: UserRegisteredPayload = {
      userId: createdUser.id,
      email: createdUser.email,
      timestamp: new Date().toISOString(),
    };
    await this.eventService.publish(AuthEvent.USER_REGISTERED, eventPayload);

    const payload = {
      sub: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    };
    const accessToken = this.signAccessToken(payload);

    return { accessToken };
  }

  async login(
    loginUserDto: LoginUserDto,
    _context?: { language?: string }
  ): Promise<{ accessToken: string }> {
    const { email, password } = loginUserDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.signAccessToken(payload);

    return { accessToken };
  }

  private signAccessToken(payload: {
    sub: string;
    email: string;
    role: string;
  }): string {
    // RS256 signing parameters are configured in JwtModule with keyid
    return this.jwtService.sign(payload);
  }

  /**
   * Secure refresh token rotation placeholder. In production, this would:
   * - Validate the provided refresh token signature and status (revocation list)
   * - Enforce token binding (device/IP/UA) and rotation with one-time use
   * - Issue a new access token and a rotated refresh token
   */
  async refresh(
    dto: RefreshTokenDto,
    _context?: { language?: string }
  ): Promise<{ accessToken: string }> {
    try {
      const decoded = await this.jwtService.verifyAsync<{ sub: string }>(
        dto.refreshToken
      );

      if (!decoded?.sub) {
        throw new UnauthorizedException({
          errorCode: 'INVALID_TOKEN',
          message: 'Invalid refresh token',
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException({
          errorCode: 'INVALID_TOKEN',
          message: 'Invalid refresh token',
        });
      }

      const accessToken = this.signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return { accessToken };
    } catch (error: unknown) {
      // Map token expiration to domain-specific error
      const message =
        error instanceof Error ? error.message : 'Unknown error during refresh';
      if (message?.toLowerCase().includes('expired')) {
        throw new UnauthorizedException({
          errorCode: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token has expired. Please login again.',
        });
      }
      throw new UnauthorizedException({
        errorCode: 'INVALID_TOKEN',
        message: 'Invalid refresh token',
      });
    }
  }
}
