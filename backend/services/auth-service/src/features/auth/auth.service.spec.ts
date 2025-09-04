import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { vi } from 'vitest';

import { MessagingProducerService } from '../../infrastructure/messaging/messaging.producer.service';
import { OutboxService } from '../../shared/outbox/outbox.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EventService } from '../../shared/services/event.service';
import { PasswordResetTokenService } from '../../shared/services/password-reset-token.service';
import { EmailService } from '../../shared/services/email.service';
import { SecurityMonitoringService } from '../../shared/services/security-monitoring.service';
import { AuditLoggingService } from '../../shared/services/audit-logging.service';
// DTO imports not used in this test suite
// import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
// import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

import { AuthService } from './auth.service';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let _prismaService: PrismaService;
  let _jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    passwordReset: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn(),
  };

  const mockOutboxService = {
    store: vi.fn(),
  };

  const mockEventService = {
    publish: vi.fn(),
  };

  const mockPasswordResetTokenService = {
    generateToken: vi.fn(),
    validateToken: vi.fn(),
    consumeToken: vi.fn(),
    hasActiveToken: vi.fn(),
  };

  const mockEmailService = {
    sendPasswordResetEmail: vi.fn(),
  };

  const mockSecurityMonitoringService = {
    recordRegister: vi.fn(),
    recordLogin: vi.fn(),
  };

  const mockAuditLoggingService = {
    logRegistration: vi.fn(),
    logLoginSuccess: vi.fn(),
    logLoginFailure: vi.fn(),
    logPasswordResetRequest: vi.fn(),
    logPasswordResetSuccess: vi.fn(),
    logPasswordResetFailure: vi.fn(),
    logAccountLockout: vi.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks to clear call history
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
        {
          provide: MessagingProducerService,
          useValue: {},
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
        {
          provide: PasswordResetTokenService,
          useValue: mockPasswordResetTokenService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: SecurityMonitoringService,
          useValue: mockSecurityMonitoringService,
        },
        {
          provide: AuditLoggingService,
          useValue: mockAuditLoggingService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // Mock the prisma property directly on the service instance
    (service as any).prisma = mockPrismaService;
    (service as any).jwtService = mockJwtService;
    (service as any).outboxService = mockOutboxService;
    (service as any).eventService = mockEventService;
    (service as any).passwordResetTokenService = mockPasswordResetTokenService;
    (service as any).emailService = mockEmailService;
    (service as any).securityMonitoring = mockSecurityMonitoringService;
    (service as any).auditLogging = mockAuditLoggingService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      // Mock bcrypt.hash for registration
      const bcryptHashMock = vi.mocked(bcrypt.hash);
      bcryptHashMock.mockResolvedValue('hashed-password');

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerUserDto);

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerUserDto.email },
      });
      expect(mockEventService.publish).toHaveBeenCalledWith(
        'user.registered',
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
        })
      );
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(bcryptHashMock).toHaveBeenCalledWith(registerUserDto.password, 12);
    });

    it('should throw error if user already exists', async () => {
      const registerUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      });

      await expect(service.register(registerUserDto)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: '$2b$10$hashedpassword',
        createdAt: new Date(),
      };

      // Mock bcrypt.compare to return true for valid password
      const bcryptCompareMock = vi.mocked(bcrypt.compare);
      bcryptCompareMock.mockResolvedValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginUserDto);

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginUserDto.email },
      });
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        loginUserDto.password,
        mockUser.passwordHash
      );
    });

    it('should throw error for invalid credentials', async () => {
      const loginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: '$2b$10$hashedpassword',
        createdAt: new Date(),
      };

      // Mock bcrypt.compare to return false for invalid password
      const bcryptCompareMock = vi.mocked(bcrypt.compare);
      bcryptCompareMock.mockResolvedValue(false as never);

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid email or password'
      );
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        loginUserDto.password,
        mockUser.passwordHash
      );
    });
  });

  describe('requestPasswordReset', () => {
    const mockPasswordResetRequestDto = {
      email: 'user@example.com',
      clientId: 'web-app',
    };

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      preferredLanguage: 'en',
      emailVerified: true,
      status: 'ACTIVE',
    };

    const mockTokenData = {
      userId: 'user-123',
      token: 'secure-reset-token',
      hashedToken: 'hashed-reset-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    it('should successfully request password reset for existing active user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordResetTokenService.hasActiveToken.mockResolvedValue(false);
      mockPasswordResetTokenService.generateToken.mockResolvedValue(
        mockTokenData
      );
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);

      const result = await service.requestPasswordReset(
        mockPasswordResetRequestDto,
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          language: 'en',
        }
      );

      expect(result).toEqual({
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockPasswordResetRequestDto.email },
      });

      expect(mockPasswordResetTokenService.hasActiveToken).toHaveBeenCalledWith(
        mockUser.id
      );
      expect(mockPasswordResetTokenService.generateToken).toHaveBeenCalledWith(
        mockUser.id,
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        email: mockUser.email,
        resetToken: mockTokenData.token,
        clientId: mockPasswordResetRequestDto.clientId,
        language: mockUser.preferredLanguage,
      });
    });

    it('should return generic message for non-existent email (security)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset(
        mockPasswordResetRequestDto,
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          language: 'en',
        }
      );

      expect(result).toEqual({
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });

      expect(
        mockPasswordResetTokenService.generateToken
      ).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return generic message for inactive user account (security)', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' };
      mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);

      const result = await service.requestPasswordReset(
        mockPasswordResetRequestDto,
        {}
      );

      expect(result).toEqual({
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });

      expect(
        mockPasswordResetTokenService.generateToken
      ).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return message when user already has active token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordResetTokenService.hasActiveToken.mockResolvedValue(true);

      const result = await service.requestPasswordReset(
        mockPasswordResetRequestDto,
        {
          language: 'en',
        }
      );

      expect(result).toEqual({
        message:
          'A password reset link has already been sent. Please check your email.',
      });

      expect(
        mockPasswordResetTokenService.generateToken
      ).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should handle Amharic language preference', async () => {
      const amharicUser = { ...mockUser, preferredLanguage: 'am' };
      mockPrismaService.user.findUnique.mockResolvedValue(amharicUser);
      mockPasswordResetTokenService.hasActiveToken.mockResolvedValue(false);
      mockPasswordResetTokenService.generateToken.mockResolvedValue(
        mockTokenData
      );
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);

      const result = await service.requestPasswordReset(
        mockPasswordResetRequestDto,
        {
          language: 'en',
        }
      );

      expect(result).toEqual({
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });

      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'am',
        })
      );
    });

    it('should handle email service failure', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordResetTokenService.hasActiveToken.mockResolvedValue(false);
      mockPasswordResetTokenService.generateToken.mockResolvedValue(
        mockTokenData
      );
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(false);

      await expect(
        service.requestPasswordReset(mockPasswordResetRequestDto, {})
      ).rejects.toThrow(
        'Failed to send password reset email. Please try again.'
      );
    });

    it('should handle database errors during user lookup', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.user.findUnique.mockRejectedValue(dbError);

      await expect(
        service.requestPasswordReset(mockPasswordResetRequestDto, {})
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle token generation errors', async () => {
      const tokenError = new Error('Token generation failed');
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordResetTokenService.hasActiveToken.mockResolvedValue(false);
      mockPasswordResetTokenService.generateToken.mockRejectedValue(tokenError);

      await expect(
        service.requestPasswordReset(mockPasswordResetRequestDto, {})
      ).rejects.toThrow(
        'Failed to send password reset email. Please try again.'
      );
    });

    it('should use default values when context is undefined', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordResetTokenService.hasActiveToken.mockResolvedValue(false);
      mockPasswordResetTokenService.generateToken.mockResolvedValue(
        mockTokenData
      );
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);

      await service.requestPasswordReset(mockPasswordResetRequestDto, {});

      expect(mockPasswordResetTokenService.generateToken).toHaveBeenCalledWith(
        mockUser.id,
        'unknown',
        undefined
      );
    });
  });

  describe('confirmPasswordReset', () => {
    const mockPasswordResetConfirmDto = {
      token: 'valid-reset-token',
      newPassword: 'NewStrongP@ssw0rd123',
      confirmPassword: 'NewStrongP@ssw0rd123',
    };

    const mockUserId = 'user-123';
    const mockUser = {
      id: mockUserId,
      email: 'user@example.com',
      passwordHash: 'old-hashed-password',
      updatedAt: new Date(),
    };

    it('should successfully confirm password reset', async () => {
      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: mockUserId,
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = {
        ...mockUser,
        passwordHash: 'new-hashed-password',
        loginAttempts: 0,
        lockoutUntil: null,
        updatedAt: new Date(),
      };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);
      mockPasswordResetTokenService.consumeToken.mockResolvedValue(true);

      // Mock bcrypt.hash
      const bcryptHashMock = vi.mocked(bcrypt.hash);
      bcryptHashMock.mockImplementation(async (password, saltRounds) => {
        if (
          password === mockPasswordResetConfirmDto.newPassword &&
          saltRounds === 12
        ) {
          return 'new-hashed-password';
        }
        return 'password123'; // fallback for other calls
      });

      const result = await service.confirmPasswordReset(
        mockPasswordResetConfirmDto
      );

      expect(result).toEqual({
        message: 'Password has been successfully reset.',
      });

      expect(mockPasswordResetTokenService.validateToken).toHaveBeenCalledWith(
        mockPasswordResetConfirmDto.token
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          passwordHash: 'new-hashed-password',
          loginAttempts: 0,
          lockoutUntil: null,
          updatedAt: expect.any(Date),
        },
      });
      expect(mockPasswordResetTokenService.consumeToken).toHaveBeenCalledWith(
        mockPasswordResetConfirmDto.token
      );
      expect(mockEventService.publish).toHaveBeenCalledWith(
        'user.password_reset',
        {
          userId: mockUserId,
          timestamp: expect.any(String),
          eventType: 'PASSWORD_RESET_SUCCESSFUL',
        }
      );
      expect(bcryptHashMock).toHaveBeenCalledWith(
        mockPasswordResetConfirmDto.newPassword,
        12
      );
    });

    it('should throw error when passwords do not match', async () => {
      const mismatchedDto = {
        ...mockPasswordResetConfirmDto,
        confirmPassword: 'DifferentP@ssw0rd123',
      };

      await expect(service.confirmPasswordReset(mismatchedDto)).rejects.toThrow(
        'New password and confirmation do not match.'
      );
    });

    it('should throw error for invalid token', async () => {
      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: '',
        isValid: false,
      });

      await expect(
        service.confirmPasswordReset(mockPasswordResetConfirmDto)
      ).rejects.toThrow('Invalid or expired password reset token.');
    });

    it('should throw error when token consumption fails', async () => {
      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: mockUserId,
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });
      mockPasswordResetTokenService.consumeToken.mockResolvedValue(false);

      await expect(
        service.confirmPasswordReset(mockPasswordResetConfirmDto)
      ).rejects.toThrow('Failed to reset password. Please try again.');
    });

    it('should handle Amharic error messages', async () => {
      const mismatchedDto = {
        ...mockPasswordResetConfirmDto,
        confirmPassword: 'DifferentP@ssw0rd123',
      };

      await expect(
        service.confirmPasswordReset(mismatchedDto, { language: 'am' })
      ).rejects.toThrow('አዲስ የይለፍ ቃል እና ማስተያወቂያ አይመሳሰሉም።');
    });

    it('should handle bcrypt hashing errors', async () => {
      const bcryptError = new Error('Hashing failed');
      const bcryptHashMock = vi.mocked(bcrypt.hash);
      bcryptHashMock.mockRejectedValue(bcryptError);

      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: mockUserId,
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.confirmPasswordReset(mockPasswordResetConfirmDto)
      ).rejects.toThrow('Failed to reset password. Please try again.');
    });

    it('should handle database update errors', async () => {
      const dbError = new Error('Database update failed');
      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: mockUserId,
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockRejectedValue(dbError);

      await expect(
        service.confirmPasswordReset(mockPasswordResetConfirmDto)
      ).rejects.toThrow('Failed to reset password. Please try again.');
    });

    it('should use default English language when context is undefined', async () => {
      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: mockUserId,
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
        loginAttempts: 0,
        lockoutUntil: null,
        updatedAt: new Date(),
      });
      mockPasswordResetTokenService.consumeToken.mockResolvedValue(true);

      // Mock bcrypt.hash
      const bcryptHashMock = vi.mocked(bcrypt.hash);
      bcryptHashMock.mockResolvedValue('new-hashed-password');

      const result = await service.confirmPasswordReset(
        mockPasswordResetConfirmDto
      );

      expect(result).toEqual({
        message: 'Password has been successfully reset.',
      });
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(100) + 'A1!'; // Very long but valid password
      const longPasswordDto = {
        ...mockPasswordResetConfirmDto,
        newPassword: longPassword,
        confirmPassword: longPassword,
      };

      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: mockUserId,
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed-long-password',
        loginAttempts: 0,
        lockoutUntil: null,
        updatedAt: new Date(),
      });
      mockPasswordResetTokenService.consumeToken.mockResolvedValue(true);

      // Mock bcrypt.hash for long password
      const bcryptHashMock = vi.mocked(bcrypt.hash);
      bcryptHashMock.mockResolvedValue('hashed-long-password');

      const result = await service.confirmPasswordReset(longPasswordDto);

      expect(result).toEqual({
        message: 'Password has been successfully reset.',
      });
    });
  });

  describe('password reset security features', () => {
    it('should use bcrypt with configured salt rounds', async () => {
      const bcryptHashMock = vi.mocked(bcrypt.hash);
      bcryptHashMock.mockResolvedValue('hashed-password');

      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: 'user-123',
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'old-hash',
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'new-hash',
        updatedAt: new Date(),
      });
      mockPasswordResetTokenService.consumeToken.mockResolvedValue(true);

      await service.confirmPasswordReset({
        token: 'valid-token',
        newPassword: 'NewP@ssw0rd123',
        confirmPassword: 'NewP@ssw0rd123',
      });

      expect(bcryptHashMock).toHaveBeenCalledWith('NewP@ssw0rd123', 12);
    });

    it('should update user updatedAt timestamp', async () => {
      const beforeCall = new Date();
      const bcryptHashMock = vi.mocked(bcrypt.hash);
      bcryptHashMock.mockResolvedValue('new-hash');

      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: 'user-123',
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'old-hash',
      });
      const updatedAt = new Date();
      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'new-hash',
        loginAttempts: 0,
        lockoutUntil: null,
        updatedAt,
      });
      mockPasswordResetTokenService.consumeToken.mockResolvedValue(true);

      await service.confirmPasswordReset({
        token: 'valid-token',
        newPassword: 'NewP@ssw0rd123',
        confirmPassword: 'NewP@ssw0rd123',
      });

      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      expect(updateCall.data.updatedAt).toBeInstanceOf(Date);
      expect(updateCall.data.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime()
      );
    });

    it('should publish password reset event with correct payload', async () => {
      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: 'user-123',
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'old-hash',
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'new-hash',
        updatedAt: new Date(),
      });
      mockPasswordResetTokenService.consumeToken.mockResolvedValue(true);

      await service.confirmPasswordReset({
        token: 'valid-token',
        newPassword: 'NewP@ssw0rd123',
        confirmPassword: 'NewP@ssw0rd123',
      });

      expect(mockEventService.publish).toHaveBeenCalledWith(
        'user.password_reset',
        {
          userId: 'user-123',
          timestamp: expect.any(String),
          eventType: 'PASSWORD_RESET_SUCCESSFUL',
        }
      );

      const eventCall = mockEventService.publish.mock.calls[0];
      const eventPayload = eventCall[1];
      expect(eventPayload.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      ); // ISO string format
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined context gracefully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset({
        email: 'nonexistent@example.com',
        clientId: 'web-app',
      });

      expect(result).toEqual({
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });
    });

    it('should handle empty token strings', async () => {
      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: '',
        isValid: false,
      });

      await expect(
        service.confirmPasswordReset({
          token: '',
          newPassword: 'ValidP@ssw0rd123',
          confirmPassword: 'ValidP@ssw0rd123',
        })
      ).rejects.toThrow('Invalid or expired password reset token.');
    });

    it('should handle concurrent password reset attempts', async () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        preferredLanguage: 'en',
        emailVerified: true,
        status: 'ACTIVE',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPasswordResetTokenService.hasActiveToken.mockResolvedValue(true);

      const result = await service.requestPasswordReset({
        email: 'user@example.com',
        clientId: 'web-app',
      });

      expect(result).toEqual({
        message:
          'A password reset link has already been sent. Please check your email.',
      });
      expect(
        mockPasswordResetTokenService.generateToken
      ).not.toHaveBeenCalled();
    });

    it('should handle database transaction failures', async () => {
      const dbError = new Error('Transaction failed');
      mockPrismaService.user.update.mockRejectedValue(dbError);
      mockPasswordResetTokenService.validateToken.mockResolvedValue({
        userId: 'user-123',
        isValid: true,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'old-hash',
      });

      await expect(
        service.confirmPasswordReset({
          token: 'valid-token',
          newPassword: 'NewP@ssw0rd123',
          confirmPassword: 'NewP@ssw0rd123',
        })
      ).rejects.toThrow('Failed to reset password. Please try again.');
    });
  });

  describe('audit logging integration', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'CUSTOMER' as const,
      loginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date(),
    };

    describe('registration audit logging', () => {
      it('should log successful registration with audit context', async () => {
        const registerUserDto = {
          email: 'newuser@example.com',
          password: 'SecureP@ssw0rd123',
        };

        const bcryptHashMock = vi.mocked(bcrypt.hash);
        bcryptHashMock.mockResolvedValue('hashed-password');

        mockPrismaService.user.findUnique.mockResolvedValue(null);
        mockPrismaService.user.create.mockResolvedValue({
          ...mockUser,
          email: registerUserDto.email,
        });
        mockJwtService.sign.mockReturnValue('jwt-token');

        const auditContext = {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'Addis Ababa, Ethiopia',
          deviceFingerprint: 'abc123def',
        };

        await service.register(registerUserDto, auditContext);

        expect(mockAuditLoggingService.logRegistration).toHaveBeenCalledWith(
          true,
          {
            userId: mockUser.id,
            userEmail: registerUserDto.email,
            userRole: mockUser.role,
            ...auditContext,
          },
          expect.objectContaining({
            userAgent: auditContext.userAgent,
            registrationMethod: 'EMAIL_PASSWORD',
          })
        );
      });
    });

    describe('JWT signing and token generation', () => {
      it('should generate JWT with correct payload structure', async () => {
        const registerUserDto = {
          email: 'newuser@example.com',
          password: 'SecureP@ssw0rd123',
        };

        const bcryptHashMock = vi.mocked(bcrypt.hash);
        bcryptHashMock.mockResolvedValue('hashed-password');

        mockPrismaService.user.findUnique.mockResolvedValue(null);
        mockPrismaService.user.create.mockResolvedValue({
          ...mockUser,
          email: registerUserDto.email,
        });

        const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-payload.signature';
        mockJwtService.sign.mockReturnValue(expectedToken);

        const result = await service.register(registerUserDto);

        expect(result.accessToken).toBe(expectedToken);
        expect(mockJwtService.sign).toHaveBeenCalledWith({
          sub: mockUser.id,
          email: registerUserDto.email,
        });
      });
    });

    describe('password hashing security', () => {
      const BCRYPT_SALT_ROUNDS = 12;

      it('should use configured bcrypt salt rounds for password hashing', async () => {
        const registerUserDto = {
          email: 'newuser@example.com',
          password: 'SecureP@ssw0rd123',
        };

        const bcryptHashMock = vi.mocked(bcrypt.hash);
        bcryptHashMock.mockResolvedValue('hashed-password');

        mockPrismaService.user.findUnique.mockResolvedValue(null);
        mockPrismaService.user.create.mockResolvedValue({
          id: 'user-123',
          email: registerUserDto.email,
          createdAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('jwt-token');

        await service.register(registerUserDto);

        expect(bcryptHashMock).toHaveBeenCalledWith(
          registerUserDto.password,
          BCRYPT_SALT_ROUNDS
        );
      });

      it('should use bcrypt for password comparison during login', async () => {
        const loginUserDto = {
          email: 'test@example.com',
          password: 'ValidP@ssw0rd123',
        };

        const loginMockUser = {
          id: 'user-123',
          email: 'test@example.com',
          passwordHash: '$2b$12$hashedpassword',
          loginAttempts: 0,
          lockoutUntil: null,
          createdAt: new Date(),
        };

        const bcryptCompareMock = vi.mocked(bcrypt.compare);
        bcryptCompareMock.mockResolvedValue(true);

        mockPrismaService.user.findUnique.mockResolvedValue(loginMockUser);
        mockPrismaService.user.update.mockResolvedValue({
          ...loginMockUser,
          loginAttempts: 0,
          lockoutUntil: null,
        });
        mockJwtService.sign.mockReturnValue('jwt-token');

        await service.login(loginUserDto);

        expect(bcryptCompareMock).toHaveBeenCalledWith(
          loginUserDto.password,
          loginMockUser.passwordHash
        );
      });
    });
  });
});
