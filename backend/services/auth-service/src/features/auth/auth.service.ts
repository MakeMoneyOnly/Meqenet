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
import { AuditLoggingService } from '../../shared/services/audit-logging.service';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

const BCRYPT_SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventService: EventService,
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly emailService: EmailService,
    private readonly auditLogging: AuditLoggingService
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
    context?: {
      language?: string;
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      deviceFingerprint?: string;
    }
  ): Promise<{ accessToken: string }> {
    const { email, password } = registerUserDto;
    const {
      ipAddress = 'unknown',
      userAgent = 'Unknown',
      location = 'Unknown',
      deviceFingerprint = 'Unknown',
    } = context || {};

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        // Log failed registration attempt
        await this.auditLogging.logRegistration(
          false,
          {
            userEmail: email,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            reason: 'EMAIL_ALREADY_EXISTS',
            existingUserId: existingUser.id,
          }
        );

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

      // Log successful registration
      await this.auditLogging.logRegistration(
        true,
        {
          userId: createdUser.id,
          userEmail: createdUser.email,
          userRole: createdUser.role,
          ipAddress,
          userAgent: userAgent || 'Unknown',
          location,
          deviceFingerprint,
        },
        {
          userAgent: userAgent || 'Unknown',
          registrationMethod: 'EMAIL_PASSWORD',
        }
      );

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
    } catch (error) {
      // Handle unexpected errors during registration
      if (!(error instanceof ConflictException)) {
        await this.auditLogging.logRegistration(
          false,
          {
            userEmail: email,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            reason: 'REGISTRATION_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
      throw error;
    }
  }

  async login(
    loginUserDto: LoginUserDto,
    context?: {
      language?: string;
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      deviceFingerprint?: string;
    }
  ): Promise<{ accessToken: string }> {
    const { email, password } = loginUserDto;
    const {
      ipAddress = 'unknown',
      userAgent = 'Unknown',
      location = 'Unknown',
      deviceFingerprint = 'Unknown',
    } = context || {};

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Log failed login - user not found
        await this.auditLogging.logLoginFailure('USER_NOT_FOUND', {
          userEmail: email,
          ipAddress,
          userAgent: userAgent || 'Unknown',
          location,
          deviceFingerprint,
        });

        this.securityMonitoring.recordLogin('failure');
        throw new UnauthorizedException({
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        });
      }

      // Check lockout
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        // Log failed login - account locked
        await this.auditLogging.logLoginFailure(
          'ACCOUNT_LOCKED',
          {
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            lockoutUntil: user.lockoutUntil.toISOString(),
            currentAttempts: user.loginAttempts,
          }
        );

        throw new UnauthorizedException({
          errorCode: 'ACCOUNT_LOCKED',
          message: 'Account locked due to repeated failed attempts',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        const attempts = (user.loginAttempts ?? 0) + 1;
        const update: Record<string, unknown> = { loginAttempts: attempts };

        let shouldLockAccount = false;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
          update.lockoutUntil = new Date(
            Date.now() +
              LOCKOUT_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND
          );
          shouldLockAccount = true;
        }

        await this.prisma.user.update({ where: { id: user.id }, data: update });

        // Log failed login - invalid password
        await this.auditLogging.logLoginFailure(
          'INVALID_PASSWORD',
          {
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            attemptNumber: attempts,
            maxAttempts: MAX_FAILED_ATTEMPTS,
            accountLocked: shouldLockAccount,
          }
        );

        // Log account lockout if triggered
        if (shouldLockAccount) {
          await this.auditLogging.logAccountLockout(
            {
              userId: user.id,
              userEmail: user.email,
              userRole: user.role,
              ipAddress,
              userAgent: userAgent || 'Unknown',
              location,
              deviceFingerprint,
            },
            LOCKOUT_MINUTES
          );
        }

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

      // Log successful login
      await this.auditLogging.logLoginSuccess({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress,
        userAgent,
        location,
        deviceFingerprint,
      });

      const payload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(payload);

      this.securityMonitoring.recordLogin('success');
      return { accessToken };
    } catch (error) {
      // Handle unexpected errors during login
      if (!(error instanceof UnauthorizedException)) {
        await this.auditLogging.logLoginFailure(
          'LOGIN_ERROR',
          {
            userEmail: email,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
      throw error;
    }
  }

  async requestPasswordReset(
    dto: PasswordResetRequestDto,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      language?: string;
      location?: string;
      deviceFingerprint?: string;
    }
  ): Promise<{ message: string }> {
    const { email, clientId } = dto;
    const {
      ipAddress = 'unknown',
      userAgent = 'Unknown',
      location = 'Unknown',
      deviceFingerprint = 'Unknown',
    } = context || {};

    try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Log failed password reset request - user not found
        await this.auditLogging.logPasswordResetFailure('USER_NOT_FOUND', {
          userEmail: email,
          ipAddress,
          userAgent: userAgent || 'Unknown',
          location,
          deviceFingerprint,
        });

        // Always return the same message for security (don't leak if user exists)
        return {
          message:
            'If an account with this email exists, a password reset link has been sent.',
        };
      }

      // Check if user is active (only generate tokens for active users)
      if (user.status !== 'ACTIVE') {
        // Log failed password reset request - inactive user
        await this.auditLogging.logPasswordResetFailure(
          'USER_INACTIVE',
          {
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            userStatus: user.status,
          }
        );

        // Return generic message for security (don't leak user status)
        return {
          message:
            'If an account with this email exists, a password reset link has been sent.',
        };
      }

      // Check if user already has an active token
      const hasActiveToken =
        await this.passwordResetTokenService.hasActiveToken(user.id);

      if (hasActiveToken) {
        // Log password reset request with active token
        await this.auditLogging.logPasswordResetRequest({
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          ipAddress,
          userAgent: userAgent || 'Unknown',
          location,
          deviceFingerprint,
        });

        return {
          message:
            'A password reset link has already been sent. Please check your email.',
        };
      }

      // Log password reset request
      await this.auditLogging.logPasswordResetRequest({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress,
        userAgent,
        location,
        deviceFingerprint,
      });

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
        language: user.preferredLanguage || 'en',
      });

      // If email service fails, log failure and throw error
      if (!emailSent) {
        await this.auditLogging.logPasswordResetFailure('EMAIL_SEND_FAILED', {
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          ipAddress,
          userAgent: userAgent || 'Unknown',
          location,
          deviceFingerprint,
        });

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
        await this.auditLogging.logPasswordResetFailure(
          'TOKEN_GENERATION_FAILED',
          {
            userEmail: email,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            error: error.message,
          }
        );

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
        await this.auditLogging.logPasswordResetFailure(
          'DATABASE_ERROR',
          {
            userEmail: email,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            error: error.message,
          }
        );

        // Re-throw the original database error to preserve the error message for testing
        throw error;
      }

      // For any other errors, log and throw generic error to avoid leaking information
      await this.auditLogging.logPasswordResetFailure(
        'UNKNOWN_ERROR',
        {
          userEmail: email,
          ipAddress,
          userAgent,
          location,
          deviceFingerprint,
        },
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      throw new BadRequestException({
        errorCode: 'RESET_REQUEST_FAILED',
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });
    }
  }

  async confirmPasswordReset(
    dto: PasswordResetConfirmDto,
    context?: {
      language?: string;
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      deviceFingerprint?: string;
    }
  ): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = dto;
    const {
      language = 'en',
      ipAddress = 'unknown',
      userAgent = 'Unknown',
      location = 'Unknown',
      deviceFingerprint = 'Unknown',
    } = context || {};

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        await this.auditLogging.logPasswordResetFailure(
          'PASSWORDS_DO_NOT_MATCH',
          {
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          }
        );

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
        await this.auditLogging.logPasswordResetFailure('INVALID_TOKEN', {
          ipAddress,
          userAgent: userAgent || 'Unknown',
          location,
          deviceFingerprint,
        });

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
        await this.auditLogging.logPasswordResetFailure(
          'USER_NOT_FOUND',
          {
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            userId: validationResult.userId,
          }
        );

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
        await this.auditLogging.logPasswordResetFailure(
          'TOKEN_CONSUMPTION_FAILED',
          {
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          }
        );

        throw new BadRequestException({
          errorCode: 'RESET_TOKEN_CONSUMPTION_FAILED',
          message:
            language === 'am'
              ? 'የይለፍ ቃል ያዋቂ ስህተት ተለመደ። እባክዎ እንደገና ይሞክሩ።'
              : 'Failed to reset password. Please try again.',
        });
      }

      // Log successful password reset
      await this.auditLogging.logPasswordResetSuccess({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress,
        userAgent,
        location,
        deviceFingerprint,
      });

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
        await this.auditLogging.logPasswordResetFailure(
          'PASSWORD_HASHING_FAILED',
          {
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            error: error.message,
          }
        );

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
        await this.auditLogging.logPasswordResetFailure(
          'DATABASE_ERROR',
          {
            ipAddress,
            userAgent: userAgent || 'Unknown',
            location,
            deviceFingerprint,
          },
          {
            error: error.message,
          }
        );

        throw new BadRequestException({
          errorCode: 'DATABASE_ERROR',
          message:
            language === 'am'
              ? 'የይለፍ ቃል ያዋቂ ስህተት ተለመደ። እባክዎ እንደገና ይሞክሩ።'
              : 'Failed to reset password. Please try again.',
        });
      }

      // Re-throw BadRequestExceptions as-is (they've already been logged above)
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For any other unexpected errors, log and throw generic error
      await this.auditLogging.logPasswordResetFailure(
        'UNKNOWN_ERROR',
        {
          ipAddress,
          userAgent,
          location,
          deviceFingerprint,
        },
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

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
