import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  AuthEvent,
  UserRegisteredPayload,
  UserPasswordResetPayload,
} from '../../shared/events';
import { EventService } from '../../shared/services/event.service';
import { SecurityMonitoringService } from '../../shared/services/security-monitoring.service';
import { PasswordResetTokenService } from '../../shared/services/password-reset-token.service';
import { EmailService } from '../../shared/services/email.service';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

const BCRYPT_SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventService: EventService,
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly emailService: EmailService
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
    dto: PasswordResetRequestDto,
    context?: { ipAddress?: string; userAgent?: string; language?: string }
  ): Promise<{ message: string }> {
    const { email, clientId } = dto;
    const { ipAddress = 'unknown', userAgent, language = 'en' } = context || {};

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Always return the same message for security (don't leak if user exists)
      return {
        message:
          'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Check if user is active (only generate tokens for active users)
    if (user.status !== 'ACTIVE') {
      // Return generic message for security (don't leak user status)
      return {
        message:
          'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Check if user already has an active token
    const hasActiveToken = await this.passwordResetTokenService.hasActiveToken(
      user.id
    );

    if (hasActiveToken) {
      return {
        message:
          'A password reset link has already been sent. Please check your email.',
      };
    }

    try {
      // Generate token using the service
      const tokenData = await this.passwordResetTokenService.generateToken(
        user.id,
        ipAddress,
        userAgent
      );

      // Send email using the service
      const emailSent = await this.emailService.sendPasswordResetEmail({
        email: user.email,
        resetToken: tokenData.token,
        clientId,
        language: user.preferredLanguage || language,
      });

      // If email service fails, throw error
      if (!emailSent) {
        throw new BadRequestException({
          errorCode: 'EMAIL_SEND_FAILED',
          message: 'Failed to send password reset email. Please try again.',
        });
      }

      // Always return the same message for security (don't leak if user exists)
      return {
        message:
          'If an account with this email exists, a password reset link has been sent.',
      };
    } catch (error) {
      // If it's a token generation error, throw specific error
      if (
        error instanceof Error &&
        (error.message.includes('Token generation failed') ||
          error.message.includes('generate'))
      ) {
        throw new BadRequestException({
          errorCode: 'RESET_TOKEN_GENERATION_FAILED',
          message: 'Failed to send password reset email. Please try again.',
        });
      }

      // Re-throw BadRequestExceptions as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For database errors during token generation, throw specific error
      if (
        error instanceof Error &&
        (error.message.includes('database') ||
          error.message.includes('connect'))
      ) {
        throw new BadRequestException({
          errorCode: 'RESET_REQUEST_FAILED',
          message: 'Failed to send password reset email. Please try again.',
        });
      }

      // For any other errors, throw generic error to avoid leaking information
      throw new BadRequestException({
        errorCode: 'RESET_REQUEST_FAILED',
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });
    }
  }

  async confirmPasswordReset(
    dto: PasswordResetConfirmDto,
    context?: { language?: string }
  ): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = dto;
    const { language = 'en' } = context || {};

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        if (language === 'am') {
          throw new BadRequestException({
            errorCode: 'PASSWORDS_DO_NOT_MATCH',
            message: 'አዲስ የይለፍ ቃል እና ማስተያወቂያ አይመሳሰሉም።',
          });
        } else {
          throw new BadRequestException({
            errorCode: 'PASSWORDS_DO_NOT_MATCH',
            message: 'New password and confirmation do not match.',
          });
        }
      }

      // Validate token using the service
      const validationResult =
        await this.passwordResetTokenService.validateToken(token);

      if (!validationResult.isValid) {
        throw new BadRequestException({
          errorCode: 'RESET_TOKEN_INVALID',
          message:
            language === 'am'
              ? 'የያዋቂ ማርከር ያልተለመደ ወይም ጊዜ ያለፈበት ነው።'
              : 'Invalid or expired password reset token.',
        });
      }

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: validationResult.userId },
      });

      if (!user) {
        throw new BadRequestException({
          errorCode: 'RESET_TOKEN_INVALID',
          message:
            language === 'am'
              ? 'የያዋቂ ማርከር ያልተለመደ ወይም ጊዜ ያለፈበት ነው።'
              : 'Invalid or expired password reset token.',
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

      // Update user password and reset security fields
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          loginAttempts: 0,
          lockoutUntil: null,
          updatedAt: new Date(),
        },
      });

      // Consume the token (mark as used)
      const tokenConsumed =
        await this.passwordResetTokenService.consumeToken(token);

      if (!tokenConsumed) {
        throw new BadRequestException({
          errorCode: 'RESET_TOKEN_CONSUMPTION_FAILED',
          message:
            language === 'am'
              ? 'የይለፍ ቃል ያዋቂ ስህተት ተለመደ። እባክዎ እንደገና ይሞክሩ።'
              : 'Failed to reset password. Please try again.',
        });
      }

      // Publish password reset event
      const eventPayload: UserPasswordResetPayload = {
        userId: user.id,
        timestamp: new Date().toISOString(),
        eventType: 'PASSWORD_RESET_SUCCESSFUL',
      };
      await this.eventService.publish(
        AuthEvent.USER_PASSWORD_RESET,
        eventPayload
      );

      return {
        message:
          language === 'am'
            ? 'የይለፍ ቃል በተሳካ መልክ ተቀየረ።'
            : 'Password has been successfully reset.',
      };
    } catch (error) {
      // Handle bcrypt hashing errors
      if (error instanceof Error && error.message.includes('hash')) {
        throw new BadRequestException({
          errorCode: 'PASSWORD_HASHING_FAILED',
          message:
            language === 'am'
              ? 'የይለፍ ቃል ያዋቂ ስህተት ተለመደ። እባክዎ እንደገና ይሞክሩ።'
              : 'Failed to reset password. Please try again.',
        });
      }

      // Handle database errors
      if (
        error instanceof Error &&
        (error.message.includes('update') || error.message.includes('find'))
      ) {
        throw new BadRequestException({
          errorCode: 'DATABASE_ERROR',
          message:
            language === 'am'
              ? 'የይለፍ ቃል ያዋቂ ስህተት ተለመደ። እባክዎ እንደገና ይሞክሩ።'
              : 'Failed to reset password. Please try again.',
        });
      }

      // Re-throw BadRequestExceptions as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For any other unexpected errors
      throw new BadRequestException({
        errorCode: 'RESET_CONFIRMATION_FAILED',
        message:
          language === 'am'
            ? 'የይለፍ ቃል ያዋቂ ስህተት ተለመደ። እባክዎ እንደገና ይሞክሩ።'
            : 'Failed to reset password. Please try again.',
      });
    }
  }
}
