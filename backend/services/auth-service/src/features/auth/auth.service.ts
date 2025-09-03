import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthEvent, UserRegisteredPayload } from '../../shared/events';
import { EventService } from '../../shared/services/event.service';
import { SecurityMonitoringService } from '../../shared/services/security-monitoring.service';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

const BCRYPT_SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventService: EventService,
    private readonly securityMonitoring: SecurityMonitoringService
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
      this.securityMonitoring.recordRegister('failure');
      throw new ConflictException({
        errorCode: 'USER_ALREADY_EXISTS',
        message: 'User with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const createdUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        loginAttempts: 0,
        lockoutUntil: null,
      },
    });

    const eventPayload: UserRegisteredPayload = {
      userId: createdUser.id,
      email: createdUser.email,
      timestamp: new Date().toISOString(),
    };
    await this.eventService.publish(AuthEvent.USER_REGISTERED, eventPayload);

    const payload = { sub: createdUser.id, email: createdUser.email };
    const accessToken = this.jwtService.sign(payload);

    this.securityMonitoring.recordRegister('success');
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
      this.securityMonitoring.recordLogin('failure');
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Check lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException({
        errorCode: 'ACCOUNT_LOCKED',
        message: 'Account locked due to repeated failed attempts',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const attempts = (user.loginAttempts ?? 0) + 1;
      const update: Record<string, unknown> = { loginAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        update.lockoutUntil = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000
        );
      }
      await this.prisma.user.update({ where: { id: user.id }, data: update });
      this.securityMonitoring.recordLogin('failure');
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // reset attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockoutUntil: null },
    });

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    this.securityMonitoring.recordLogin('success');
    return { accessToken };
  }

  async requestPasswordReset(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = `${email}-${Date.now()}-${Math.random()}`;
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.passwordReset.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        token: rawToken,
        hashedToken,
        ipAddress: ipAddress || 'unknown',
        userAgent,
        expiresAt,
        isUsed: false,
      },
      update: {
        token: rawToken,
        hashedToken,
        ipAddress: ipAddress || 'unknown',
        userAgent,
        expiresAt,
        isUsed: false,
      },
    });
    // TODO: send email/SMS with rawToken (out of scope)
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<void> {
    const record = await this.prisma.passwordReset.findFirst({
      where: { token, isUsed: false, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      throw new BadRequestException({
        errorCode: 'RESET_TOKEN_INVALID',
        message: 'Invalid or expired password reset token.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: hashedPassword,
        loginAttempts: 0,
        lockoutUntil: null,
      },
    });

    await this.prisma.passwordReset.update({
      where: { id: record.id },
      data: { isUsed: true, usedAt: new Date() },
    });
  }
}
