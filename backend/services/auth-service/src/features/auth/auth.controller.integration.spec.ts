import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as request from 'supertest';
import { vi } from 'vitest';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PasswordResetTokenService } from '../../shared/services/password-reset-token.service';
import { EmailService } from '../../shared/services/email.service';
import { EventService } from '../../shared/services/event.service';
import { SecretManagerService } from '../../shared/services/secret-manager.service';
import { AdaptiveRateLimitingService } from '../../shared/services/adaptive-rate-limiting.service';
import { AuditLoggingService } from '../../shared/services/audit-logging.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

// Test module to avoid JWT dependency issues
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (_configService: ConfigService) => ({
        privateKey: 'mock-private-key',
        publicKey: 'mock-public-key',
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '15m',
          issuer: 'meqenet-auth',
          audience: 'meqenet-clients',
          keyid: 'kid-123',
        },
        verifyOptions: {
          algorithms: ['RS256'],
          issuer: 'meqenet-auth',
          audience: 'meqenet-clients',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EventService],
})
class TestAuthModule {}

// Mock external services
vi.mock('../../shared/services/secret-manager.service');
vi.mock('../../shared/services/adaptive-rate-limiting.service');
vi.mock('../../shared/services/audit-logging.service');
vi.mock('../../infrastructure/database/prisma.service');

const mockSecretManagerService = {
  getCurrentJwtPrivateKey: vi.fn().mockReturnValue('mock-private-key'),
  getCurrentJwtPublicKey: vi.fn().mockReturnValue('mock-public-key'),
  getCurrentJwtKeyId: vi.fn().mockReturnValue('kid-123'),
};

  const _mockAdaptiveRateLimitingService = {
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remainingRequests: 99,
  }),
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

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
  },
  passwordReset: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  },
  $disconnect: vi.fn(),
  $connect: vi.fn(),
};

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let passwordResetTokenService: PasswordResetTokenService;
  let emailService: EmailService;

  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    passwordHash: '$2b$12$test.hashed.password',
    preferredLanguage: 'en',
    emailVerified: true,
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testTokenData = {
    userId: testUser.id,
    token: 'secure-reset-token-123',
    hashedToken: 'hashed-reset-token-123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestAuthModule,
      ],
    })
      .overrideProvider(SecretManagerService)
      .useValue(mockSecretManagerService)
      .overrideProvider(AdaptiveRateLimitingService)
      .useValue(_mockAdaptiveRateLimitingService)
      .overrideProvider(AuditLoggingService)
      .useValue(mockAuditLoggingService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply the same middleware and pipes as the main application
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
      })
    );

    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    passwordResetTokenService = moduleFixture.get<PasswordResetTokenService>(
      PasswordResetTokenService
    );
    emailService = moduleFixture.get<EmailService>(EmailService);
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Setup default mock behaviors
    mockPrismaService.user.findUnique.mockResolvedValue(testUser);
    mockPrismaService.user.create.mockResolvedValue(testUser);
    mockPrismaService.passwordReset.create.mockResolvedValue(testTokenData);
    mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/password-reset-request', () => {
    const validRequest = {
      email: testUser.email,
      clientId: 'web-app',
    };

    it('should successfully request password reset for existing user', async () => {
      // Mock the services
      const mockGenerateToken = vi.spyOn(
        passwordResetTokenService,
        'generateToken'
      );
      const mockHasActiveToken = vi.spyOn(
        passwordResetTokenService,
        'hasActiveToken'
      );
      const mockSendEmail = vi.spyOn(emailService, 'sendPasswordResetEmail');

      mockHasActiveToken.mockResolvedValue(false);
      mockGenerateToken.mockResolvedValue(testTokenData);
      mockSendEmail.mockResolvedValue(true);

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(validRequest)
        .set('Accept-Language', 'en')
        .set('User-Agent', 'Test/1.0')
        .set('X-Forwarded-For', '192.168.1.1')
        .expect(200);

      expect(_response.body).toEqual({
        message: 'Password reset link has been sent to your email.',
      });

      expect(mockHasActiveToken).toHaveBeenCalledWith(testUser.id);
      expect(mockGenerateToken).toHaveBeenCalledWith(
        testUser.id,
        '192.168.1.1',
        'Test/1.0'
      );
      expect(mockSendEmail).toHaveBeenCalledWith({
        email: testUser.email,
        resetToken: testTokenData.token,
        clientId: 'web-app',
        language: testUser.preferredLanguage,
      });
    });

    it('should return generic message for non-existent email', async () => {
      const nonExistentEmailRequest = {
        email: 'nonexistent@example.com',
        clientId: 'web-app',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(nonExistentEmailRequest)
        .expect(200);

      expect(_response.body).toEqual({
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });
    });

    it('should handle Amharic language preference', async () => {
      const mockSendEmail = vi.spyOn(emailService, 'sendPasswordResetEmail');
      const mockGenerateToken = vi.spyOn(
        passwordResetTokenService,
        'generateToken'
      );
      const mockHasActiveToken = vi.spyOn(
        passwordResetTokenService,
        'hasActiveToken'
      );

      mockHasActiveToken.mockResolvedValue(false);
      mockGenerateToken.mockResolvedValue(testTokenData);
      mockSendEmail.mockResolvedValue(true);

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(validRequest)
        .set('Accept-Language', 'am')
        .expect(200);

      expect(_response.body).toEqual({
        message: 'የይለፍ ቃል ያዋቂ መልዕክት ወደ ኢሜይልዎ ተልኳል።',
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'en', // Should use user's preferred language
        })
      );
    });

    it('should reject request with invalid email format', async () => {
      const invalidEmailRequest = {
        email: 'invalid-email',
        clientId: 'web-app',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(invalidEmailRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
      expect(_response.body).toHaveProperty('message');
      expect(Array.isArray(_response.body.message)).toBe(true);
    });

    it('should reject request with missing email', async () => {
      const missingEmailRequest = {
        clientId: 'web-app',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(missingEmailRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
      expect(_response.body.message).toContain('email');
    });

    it('should reject request with missing clientId', async () => {
      const missingClientIdRequest = {
        email: testUser.email,
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(missingClientIdRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
      expect(_response.body.message).toContain('clientId');
    });

    it('should handle inactive user accounts', async () => {
      // Update user to inactive status
      await prismaService.user.update({
        where: { id: testUser.id },
        data: { status: 'INACTIVE' },
      });

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(validRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('errorCode', 'ACCOUNT_INACTIVE');
    });

    it('should handle existing active tokens', async () => {
      const mockHasActiveToken = vi.spyOn(
        passwordResetTokenService,
        'hasActiveToken'
      );
      mockHasActiveToken.mockResolvedValue(true);

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(validRequest)
        .expect(200);

      expect(_response.body).toEqual({
        message:
          'A password reset link has already been sent. Please check your email.',
      });
    });

    it('should handle email service failures', async () => {
      const mockGenerateToken = vi.spyOn(
        passwordResetTokenService,
        'generateToken'
      );
      const mockHasActiveToken = vi.spyOn(
        passwordResetTokenService,
        'hasActiveToken'
      );
      const mockSendEmail = vi.spyOn(emailService, 'sendPasswordResetEmail');

      mockHasActiveToken.mockResolvedValue(false);
      mockGenerateToken.mockResolvedValue(testTokenData);
      mockSendEmail.mockResolvedValue(false);

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(validRequest)
        .expect(400);

      expect(_response.body).toHaveProperty(
        'errorCode',
        'PASSWORD_RESET_FAILED'
      );
    });

    it('should extract IP address from various headers', async () => {
      const mockGenerateToken = vi.spyOn(
        passwordResetTokenService,
        'generateToken'
      );
      const mockHasActiveToken = vi.spyOn(
        passwordResetTokenService,
        'hasActiveToken'
      );
      const mockSendEmail = vi.spyOn(emailService, 'sendPasswordResetEmail');

      mockHasActiveToken.mockResolvedValue(false);
      mockGenerateToken.mockResolvedValue(testTokenData);
      mockSendEmail.mockResolvedValue(true);

      // Test X-Forwarded-For header
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(validRequest)
        .set('X-Forwarded-For', '10.0.0.1')
        .expect(200);

      expect(mockGenerateToken).toHaveBeenCalledWith(
        testUser.id,
        '10.0.0.1',
        expect.any(String)
      );

      // Test X-Real-IP header
      mockGenerateToken.mockClear();
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(validRequest)
        .set('X-Real-IP', '10.0.0.2')
        .expect(200);

      expect(mockGenerateToken).toHaveBeenCalledWith(
        testUser.id,
        '10.0.0.2',
        expect.any(String)
      );
    });

    it('should use default values when headers are missing', async () => {
      const mockGenerateToken = vi.spyOn(
        passwordResetTokenService,
        'generateToken'
      );
      const mockHasActiveToken = vi.spyOn(
        passwordResetTokenService,
        'hasActiveToken'
      );
      const mockSendEmail = vi.spyOn(emailService, 'sendPasswordResetEmail');

      mockHasActiveToken.mockResolvedValue(false);
      mockGenerateToken.mockResolvedValue(testTokenData);
      mockSendEmail.mockResolvedValue(true);

      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(validRequest)
        .expect(200);

      expect(mockGenerateToken).toHaveBeenCalledWith(
        testUser.id,
        'unknown',
        undefined
      );
    });
  });

  describe('POST /auth/password-reset-confirm', () => {
    const validConfirmRequest = {
      token: 'valid-reset-token',
      newPassword: 'NewStrongP@ssw0rd123',
      confirmPassword: 'NewStrongP@ssw0rd123',
    };

    beforeEach(async () => {
      // Create a password reset token in the database
      await prismaService.passwordReset.create({
        data: {
          userId: testUser.id,
          token: 'hashed-valid-token',
          hashedToken: 'hashed-valid-token',
          ipAddress: '192.168.1.1',
          userAgent: 'Test/1.0',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      });
    });

    it('should successfully confirm password reset', async () => {
      const mockValidateToken = vi.spyOn(
        passwordResetTokenService,
        'validateToken'
      );
      const mockConsumeToken = vi.spyOn(
        passwordResetTokenService,
        'consumeToken'
      );

      mockValidateToken.mockResolvedValue({
        userId: testUser.id,
        isValid: true,
      });
      mockConsumeToken.mockResolvedValue(true);

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(validConfirmRequest)
        .set('Accept-Language', 'en')
        .expect(200);

      expect(_response.body).toEqual({
        message: 'Password has been successfully reset.',
      });

      expect(mockValidateToken).toHaveBeenCalledWith(validConfirmRequest.token);
      expect(mockConsumeToken).toHaveBeenCalledWith(validConfirmRequest.token);

      // Verify password was updated in database
      const updatedUser = await prismaService.user.findUnique({
        where: { id: testUser.id },
      });
      expect(updatedUser?.passwordHash).not.toBe(testUser.passwordHash);
      expect(updatedUser?.updatedAt.getTime()).toBeGreaterThan(
        testUser.updatedAt.getTime()
      );
    });

    it('should reject request when passwords do not match', async () => {
      const mismatchedRequest = {
        ...validConfirmRequest,
        confirmPassword: 'DifferentPassword123!',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(mismatchedRequest)
        .expect(400);

      expect(_response.body).toHaveProperty(
        'errorCode',
        'PASSWORDS_DO_NOT_MATCH'
      );
    });

    it('should reject request with invalid token', async () => {
      const mockValidateToken = vi.spyOn(
        passwordResetTokenService,
        'validateToken'
      );
      mockValidateToken.mockResolvedValue({
        userId: '',
        isValid: false,
      });

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(validConfirmRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('errorCode', 'INVALID_RESET_TOKEN');
    });

    it('should reject request with missing token', async () => {
      const missingTokenRequest = {
        newPassword: 'NewStrongP@ssw0rd123',
        confirmPassword: 'NewStrongP@ssw0rd123',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(missingTokenRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
      expect(_response.body.message).toContain('token');
    });

    it('should reject request with missing newPassword', async () => {
      const missingPasswordRequest = {
        token: 'valid-token',
        confirmPassword: 'NewStrongP@ssw0rd123',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(missingPasswordRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
      expect(_response.body.message).toContain('newPassword');
    });

    it('should reject request with missing confirmPassword', async () => {
      const missingConfirmRequest = {
        token: 'valid-token',
        newPassword: 'NewStrongP@ssw0rd123',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(missingConfirmRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
      expect(_response.body.message).toContain('confirmPassword');
    });

    it('should reject request with weak password', async () => {
      const weakPasswordRequest = {
        token: 'valid-token',
        newPassword: 'weak',
        confirmPassword: 'weak',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(weakPasswordRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
      expect(_response.body.message).toContain('minLength');
    });

    it('should reject request with password missing required characters', async () => {
      const invalidPasswordRequest = {
        token: 'valid-token',
        newPassword: 'passwordwithoutspecialchars123',
        confirmPassword: 'passwordwithoutspecialchars123',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(invalidPasswordRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
      expect(_response.body.message).toContain('matches');
    });

    it('should handle Amharic error messages', async () => {
      const mismatchedRequest = {
        ...validConfirmRequest,
        confirmPassword: 'DifferentPassword123!',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(mismatchedRequest)
        .set('Accept-Language', 'am')
        .expect(400);

      expect(_response.body.message).toContain(
        'አዲስ የይለፍ ቃል እና ማስተያወቂያ አይመሳሰሉም።'
      );
    });

    it('should handle expired tokens', async () => {
      // Create an expired token
      await prismaService.passwordReset.deleteMany();
      await prismaService.passwordReset.create({
        data: {
          userId: testUser.id,
          token: 'hashed-expired-token',
          hashedToken: 'hashed-expired-token',
          ipAddress: '192.168.1.1',
          userAgent: 'Test/1.0',
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      });

      const expiredTokenRequest = {
        ...validConfirmRequest,
        token: 'expired-token',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(expiredTokenRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('errorCode', 'INVALID_RESET_TOKEN');
    });

    it('should handle used tokens', async () => {
      // Create a used token
      await prismaService.passwordReset.deleteMany();
      await prismaService.passwordReset.create({
        data: {
          userId: testUser.id,
          token: 'hashed-used-token',
          hashedToken: 'hashed-used-token',
          ipAddress: '192.168.1.1',
          userAgent: 'Test/1.0',
          isUsed: true,
          usedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const usedTokenRequest = {
        ...validConfirmRequest,
        token: 'used-token',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(usedTokenRequest)
        .expect(400);

      expect(_response.body).toHaveProperty('errorCode', 'INVALID_RESET_TOKEN');
    });

    it('should handle token consumption failures', async () => {
      const mockValidateToken = vi.spyOn(
        passwordResetTokenService,
        'validateToken'
      );
      const mockConsumeToken = vi.spyOn(
        passwordResetTokenService,
        'consumeToken'
      );

      mockValidateToken.mockResolvedValue({
        userId: testUser.id,
        isValid: true,
      });
      mockConsumeToken.mockResolvedValue(false);

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(validConfirmRequest)
        .expect(400);

      expect(_response.body).toHaveProperty(
        'errorCode',
        'PASSWORD_RESET_FAILED'
      );
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(100) + 'A1!';
      const longPasswordRequest = {
        token: 'valid-token',
        newPassword: longPassword,
        confirmPassword: longPassword,
      };

      const mockValidateToken = vi.spyOn(
        passwordResetTokenService,
        'validateToken'
      );
      const mockConsumeToken = vi.spyOn(
        passwordResetTokenService,
        'consumeToken'
      );

      mockValidateToken.mockResolvedValue({
        userId: testUser.id,
        isValid: true,
      });
      mockConsumeToken.mockResolvedValue(true);

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send(longPasswordRequest)
        .expect(200);

      expect(_response.body).toEqual({
        message: 'Password has been successfully reset.',
      });
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should apply rate limiting to password reset endpoints', async () => {
      const mockCheckRateLimit = vi.mocked(
        _mockAdaptiveRateLimitingService.checkRateLimit
      );
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remainingRequests: 0,
      });

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(429); // Too Many Requests

      expect(mockCheckRateLimit).toHaveBeenCalled();
    });

    it('should allow requests within rate limits', async () => {
      const mockCheckRateLimit = vi.mocked(
        _mockAdaptiveRateLimitingService.checkRateLimit
      );
      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        remainingRequests: 95,
      });

      const mockHasActiveToken = vi.spyOn(
        passwordResetTokenService,
        'hasActiveToken'
      );
      mockHasActiveToken.mockResolvedValue(true); // Skip token generation

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      expect(mockCheckRateLimit).toHaveBeenCalled();
      expect(_response.body).toEqual({
        message:
          'A password reset link has already been sent. Please check your email.',
      });
    });
  });

  describe('Security Headers', () => {
    it('should not leak sensitive information in responses', async () => {
      // Test non-existent email doesn't reveal information
      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: 'nonexistent@example.com',
          clientId: 'web-app',
        })
        .expect(200);

      expect(_response.body.message).toContain(
        'If an account with this email exists'
      );
      expect(_response.body.message).not.toContain('nonexistent@example.com');
    });

    it('should handle malformed JSON gracefully', async () => {
      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .set('Content-Type', 'application/json')
        .send('{invalid json')
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
    });

    it('should handle oversized payloads', async () => {
      const largePayload = {
        email: 'a'.repeat(10000) + '@example.com', // Very long email
        clientId: 'web-app',
      };

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send(largePayload)
        .expect(400);

      expect(_response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('Database Integration', () => {
    it('should properly clean up database state between tests', async () => {
      // Verify test user exists
      const userCount = await prismaService.user.count();
      expect(userCount).toBe(1);

      // Verify password reset table is clean
      const resetCount = await prismaService.passwordReset.count();
      expect(resetCount).toBe(0);
    });

    it('should handle database connection issues gracefully', async () => {
      // Mock database error
      const mockFindUnique = vi.spyOn(prismaService.user, 'findUnique');
      mockFindUnique.mockRejectedValue(new Error('Database connection failed'));

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(500);

      expect(_response.body).toHaveProperty('statusCode', 500);
    });

    it('should commit database transactions correctly on success', async () => {
      const mockValidateToken = vi.spyOn(
        passwordResetTokenService,
        'validateToken'
      );
      const mockConsumeToken = vi.spyOn(
        passwordResetTokenService,
        'consumeToken'
      );

      mockValidateToken.mockResolvedValue({
        userId: testUser.id,
        isValid: true,
      });
      mockConsumeToken.mockResolvedValue(true);

      await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'valid-token',
          newPassword: 'NewStrongP@ssw0rd123',
          confirmPassword: 'NewStrongP@ssw0rd123',
        })
        .expect(200);

      // Verify user was updated
      const updatedUser = await prismaService.user.findUnique({
        where: { id: testUser.id },
      });
      expect(updatedUser?.passwordHash).not.toBe(testUser.passwordHash);
    });
  });

  describe('Audit Logging Integration', () => {
    describe('POST /auth/register', () => {
      const validRegistrationRequest = {
        email: 'newuser@example.com',
        password: 'SecureP@ssw0rd123',
      };

      beforeEach(() => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);
        mockPrismaService.user.create.mockResolvedValue({
          ...testUser,
          email: validRegistrationRequest.email,
        });
      });

      it('should log successful registration with audit context', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(validRegistrationRequest)
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .set('Accept-Language', 'en')
          .expect(201);

        expect(mockAuditLoggingService.logRegistration).toHaveBeenCalledWith(
          true,
          {
            userId: testUser.id,
            userEmail: validRegistrationRequest.email,
            userRole: 'CUSTOMER',
            ipAddress: '192.168.1.100',
            userAgent: 'TestBrowser/1.0',
            location: undefined,
            deviceFingerprint: expect.any(String),
          },
          expect.objectContaining({
            registrationMethod: 'EMAIL_PASSWORD',
          })
        );
      });

      it('should log failed registration when user already exists', async () => {
        const existingUser = {
          id: 'existing-123',
          email: validRegistrationRequest.email,
          createdAt: new Date(),
        };

        mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(validRegistrationRequest)
          .expect(409);

        expect(mockAuditLoggingService.logRegistration).toHaveBeenCalledWith(
          false,
          {
            userEmail: validRegistrationRequest.email,
            ipAddress: 'unknown',
            userAgent: undefined,
            location: undefined,
            deviceFingerprint: expect.any(String),
          },
          {
            reason: 'EMAIL_ALREADY_EXISTS',
            existingUserId: existingUser.id,
          }
        );
      });

      it('should extract device fingerprint from headers', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(validRegistrationRequest)
          .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
          .set('Accept-Language', 'en-US,en;q=0.9')
          .set('Sec-Ch-Ua-Platform', '"Windows"')
          .expect(201);

        expect(mockAuditLoggingService.logRegistration).toHaveBeenCalledWith(
          true,
          expect.objectContaining({
            deviceFingerprint: expect.any(String),
          }),
          expect.any(Object)
        );
      });
    });

    describe('POST /auth/login', () => {
      const validLoginRequest = {
        email: testUser.email,
        password: 'ValidP@ssw0rd123',
      };

      beforeEach(() => {
        mockPrismaService.user.findUnique.mockResolvedValue(testUser);
        mockPrismaService.user.update.mockResolvedValue({
          ...testUser,
          loginAttempts: 0,
          lockoutUntil: null,
        });
      });

      it('should log successful login with audit context', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send(validLoginRequest)
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .set('Accept-Language', 'en')
          .expect(200);

        expect(mockAuditLoggingService.logLoginSuccess).toHaveBeenCalledWith({
          userId: testUser.id,
          userEmail: testUser.email,
          userRole: 'CUSTOMER',
          ipAddress: '192.168.1.100',
          userAgent: 'TestBrowser/1.0',
          location: undefined,
          deviceFingerprint: expect.any(String),
        });
      });

      it('should log failed login with specific failure reasons', async () => {
        const invalidLoginRequest = {
          email: testUser.email,
          password: 'WrongPassword123',
        };

        mockPrismaService.user.findUnique.mockResolvedValue(testUser);

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidLoginRequest)
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .expect(401);

        expect(mockAuditLoggingService.logLoginFailure).toHaveBeenCalledWith(
          'INVALID_PASSWORD',
          {
            userId: testUser.id,
            userEmail: testUser.email,
            userRole: 'CUSTOMER',
            ipAddress: '192.168.1.100',
            userAgent: 'TestBrowser/1.0',
            location: undefined,
            deviceFingerprint: expect.any(String),
          },
          {
            attemptNumber: 1,
            maxAttempts: 5,
            accountLocked: false,
          }
        );
      });

      it('should log account lockout when max attempts reached', async () => {
        const userWithMaxAttempts = {
          ...testUser,
          loginAttempts: 4,
        };

        mockPrismaService.user.findUnique.mockResolvedValue(userWithMaxAttempts);
        mockPrismaService.user.update.mockResolvedValue({
          ...userWithMaxAttempts,
          loginAttempts: 5,
          lockoutUntil: new Date(Date.now() + 15 * 60 * 1000),
        });

        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123',
          })
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .expect(401);

        expect(mockAuditLoggingService.logAccountLockout).toHaveBeenCalledWith(
          {
            userId: testUser.id,
            userEmail: testUser.email,
            userRole: 'CUSTOMER',
            ipAddress: '192.168.1.100',
            userAgent: 'TestBrowser/1.0',
            location: undefined,
            deviceFingerprint: expect.any(String),
          },
          15
        );
      });

      it('should log failed login for non-existent user', async () => {
        const nonExistentUserRequest = {
          email: 'nonexistent@example.com',
          password: 'AnyPassword123',
        };

        mockPrismaService.user.findUnique.mockResolvedValue(null);

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(nonExistentUserRequest)
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .expect(401);

        expect(mockAuditLoggingService.logLoginFailure).toHaveBeenCalledWith(
          'USER_NOT_FOUND',
          {
            userEmail: nonExistentUserRequest.email,
            ipAddress: '192.168.1.100',
            userAgent: 'TestBrowser/1.0',
            location: undefined,
            deviceFingerprint: expect.any(String),
          }
        );
      });
    });

    describe('Password Reset Audit Logging', () => {
      const validPasswordResetRequest = {
        email: testUser.email,
        clientId: 'web-app',
      };

      beforeEach(() => {
        mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      });

      it('should log successful password reset request', async () => {
        const mockHasActiveToken = vi.spyOn(
          passwordResetTokenService,
          'hasActiveToken'
        );
        const mockGenerateToken = vi.spyOn(
          passwordResetTokenService,
          'generateToken'
        );
        const mockSendEmail = vi.spyOn(emailService, 'sendPasswordResetEmail');

        mockHasActiveToken.mockResolvedValue(false);
        mockGenerateToken.mockResolvedValue(testTokenData);
        mockSendEmail.mockResolvedValue(true);

        await request(app.getHttpServer())
          .post('/auth/password-reset-request')
          .send(validPasswordResetRequest)
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .set('Accept-Language', 'en')
          .expect(200);

        expect(mockAuditLoggingService.logPasswordResetRequest).toHaveBeenCalledWith({
          userId: testUser.id,
          userEmail: testUser.email,
          userRole: 'CUSTOMER',
          ipAddress: '192.168.1.100',
          userAgent: 'TestBrowser/1.0',
          location: undefined,
          deviceFingerprint: expect.any(String),
        });
      });

      it('should log failed password reset for inactive user', async () => {
        const inactiveUser = { ...testUser, status: 'INACTIVE' as const };
        mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);

        await request(app.getHttpServer())
          .post('/auth/password-reset-request')
          .send(validPasswordResetRequest)
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .expect(200);

        expect(mockAuditLoggingService.logPasswordResetFailure).toHaveBeenCalledWith(
          'USER_INACTIVE',
          {
            userId: inactiveUser.id,
            userEmail: inactiveUser.email,
            userRole: 'CUSTOMER',
            ipAddress: '192.168.1.100',
            userAgent: 'TestBrowser/1.0',
            location: undefined,
            deviceFingerprint: expect.any(String),
          },
          {
            userStatus: inactiveUser.status,
          }
        );
      });

      it('should log successful password reset confirmation', async () => {
        const validConfirmRequest = {
          token: 'valid-reset-token',
          newPassword: 'NewStrongP@ssw0rd123',
          confirmPassword: 'NewStrongP@ssw0rd123',
        };

        const mockValidateToken = vi.spyOn(
          passwordResetTokenService,
          'validateToken'
        );
        const mockConsumeToken = vi.spyOn(
          passwordResetTokenService,
          'consumeToken'
        );

        mockValidateToken.mockResolvedValue({
          userId: testUser.id,
          isValid: true,
        });
        mockConsumeToken.mockResolvedValue(true);

        await request(app.getHttpServer())
          .post('/auth/password-reset-confirm')
          .send(validConfirmRequest)
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .set('Accept-Language', 'en')
          .expect(200);

        expect(mockAuditLoggingService.logPasswordResetSuccess).toHaveBeenCalledWith({
          userId: testUser.id,
          userEmail: testUser.email,
          userRole: 'CUSTOMER',
          ipAddress: '192.168.1.100',
          userAgent: 'TestBrowser/1.0',
          location: undefined,
          deviceFingerprint: expect.any(String),
        });
      });

      it('should log failed password reset confirmation with specific reasons', async () => {
        const invalidConfirmRequest = {
          token: 'valid-reset-token',
          newPassword: 'NewStrongP@ssw0rd123',
          confirmPassword: 'DifferentPassword123',
        };

        await request(app.getHttpServer())
          .post('/auth/password-reset-confirm')
          .send(invalidConfirmRequest)
          .set('User-Agent', 'TestBrowser/1.0')
          .set('X-Forwarded-For', '192.168.1.100')
          .expect(400);

        expect(mockAuditLoggingService.logPasswordResetFailure).toHaveBeenCalledWith(
          'PASSWORDS_DO_NOT_MATCH',
          {
            ipAddress: '192.168.1.100',
            userAgent: 'TestBrowser/1.0',
            location: undefined,
            deviceFingerprint: expect.any(String),
          }
        );
      });
    });

    describe('Location and Device Fingerprint Extraction', () => {
      it('should extract location from various headers', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'ValidP@ssw0rd123',
          })
          .set('X-Forwarded-For', '192.168.1.100')
          .set('CF-IPCountry', 'ET')
          .expect(200);

        expect(mockAuditLoggingService.logLoginSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            location: 'ET',
          })
        );
      });

      it('should handle multiple X-Forwarded-For values', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'ValidP@ssw0rd123',
          })
          .set('X-Forwarded-For', '192.168.1.100, 10.0.0.1, 203.0.113.1')
          .expect(200);

        expect(mockAuditLoggingService.logLoginSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '192.168.1.100',
          })
        );
      });

      it('should create consistent device fingerprints', async () => {
              const _fingerprint1 = 'test-fingerprint-1';
      const _fingerprint2 = 'test-fingerprint-2';

        // First request
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'ValidP@ssw0rd123',
          })
          .set('User-Agent', 'TestBrowser/1.0')
          .set('Accept-Language', 'en-US,en;q=0.9')
          .expect(200);

        // Second request with same headers
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'ValidP@ssw0rd123',
          })
          .set('User-Agent', 'TestBrowser/1.0')
          .set('Accept-Language', 'en-US,en;q=0.9')
          .expect(200);

        const calls = mockAuditLoggingService.logLoginSuccess.mock.calls;
        expect(calls[0][0].deviceFingerprint).toBe(calls[1][0].deviceFingerprint);
      });
    });
  });
});
