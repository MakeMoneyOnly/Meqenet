import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
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
vi.mock('../../infrastructure/database/prisma.service');

const mockSecretManagerService = {
  getCurrentJwtPrivateKey: vi.fn().mockReturnValue('mock-private-key'),
  getCurrentJwtPublicKey: vi.fn().mockReturnValue('mock-public-key'),
  getCurrentJwtKeyId: vi.fn().mockReturnValue('kid-123'),
};

const mockAdaptiveRateLimitingService = {
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remainingRequests: 99,
  }),
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

describe('AuthService (E2E) - Password Reset Flow', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let _emailService: EmailService;
  let tokenService: PasswordResetTokenService;

  const testUser = {
    id: 'e2e-test-user-123',
    email: 'e2e-test@example.com',
    passwordHash: '$2b$12$e2e.hashed.password.test',
    preferredLanguage: 'en',
    emailVerified: true,
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
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
      .useValue(mockAdaptiveRateLimitingService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    _emailService = moduleFixture.get<EmailService>(EmailService);
    tokenService = moduleFixture.get<PasswordResetTokenService>(
      PasswordResetTokenService
    );
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Setup default mock behaviors
    mockPrismaService.user.findUnique.mockResolvedValue(testUser);
    mockPrismaService.user.create.mockResolvedValue(testUser);
    mockPrismaService.passwordReset.create.mockResolvedValue({
      userId: testUser.id,
      token: 'e2e-test-token',
      hashedToken: 'hashed-e2e-test-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    mockPrismaService.passwordReset.findFirst.mockResolvedValue(null);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Complete Password Reset Flow', () => {
    it('should complete full password reset flow successfully', async () => {
      // Step 1: Request password reset
      const requestResponse = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .set('Accept-Language', 'en')
        .set('User-Agent', 'E2E-Test/1.0')
        .set('X-Forwarded-For', '192.168.1.100')
        .expect(200);

      expect(requestResponse.body).toEqual({
        message: 'Password reset link has been sent to your email.',
      });

      // Verify token was created in database
      const tokens = await prismaService.passwordReset.findMany({
        where: { userId: testUser.id },
      });
      expect(tokens).toHaveLength(1);
      const createdToken = tokens[0];

      expect(createdToken.isUsed).toBe(false);
      expect(createdToken.ipAddress).toBe('192.168.1.100');
      expect(createdToken.userAgent).toBe('E2E-Test/1.0');
      expect(createdToken.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Step 2: Attempt to confirm with invalid token (should fail)
      const invalidConfirmResponse = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'invalid-token',
          newPassword: 'NewValidP@ssw0rd123',
          confirmPassword: 'NewValidP@ssw0rd123',
        })
        .expect(400);

      expect(invalidConfirmResponse.body).toHaveProperty(
        'errorCode',
        'INVALID_RESET_TOKEN'
      );

      // Step 3: Confirm password reset with valid token
      const confirmResponse = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'mockedhexstring', // This is what our mocked crypto returns
          newPassword: 'NewValidP@ssw0rd123',
          confirmPassword: 'NewValidP@ssw0rd123',
        })
        .set('Accept-Language', 'en')
        .expect(200);

      expect(confirmResponse.body).toEqual({
        message: 'Password has been successfully reset.',
      });

      // Verify token was consumed
      const updatedToken = await prismaService.passwordReset.findUnique({
        where: { id: createdToken.id },
      });
      expect(updatedToken?.isUsed).toBe(true);
      expect(updatedToken?.usedAt).toBeInstanceOf(Date);

      // Verify password was updated
      const updatedUser = await prismaService.user.findUnique({
        where: { id: testUser.id },
      });
      expect(updatedUser?.passwordHash).not.toBe(testUser.passwordHash);
      expect(updatedUser?.updatedAt.getTime()).toBeGreaterThan(
        testUser.updatedAt.getTime()
      );
    });

    it('should handle Amharic language throughout the flow', async () => {
      // Step 1: Request password reset in Amharic
      const requestResponse = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'mobile-app',
        })
        .set('Accept-Language', 'am')
        .expect(200);

      expect(requestResponse.body).toEqual({
        message: 'የይለፍ ቃል ያዋቂ መልዕክት ወደ ኢሜይልዎ ተልኳል።',
      });

      // Step 2: Confirm password reset in Amharic
      const confirmResponse = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'mockedhexstring',
          newPassword: 'አዲስያልፍቃልP@ssw0rd123',
          confirmPassword: 'አዲስያልፍቃልP@ssw0rd123',
        })
        .set('Accept-Language', 'am')
        .expect(200);

      expect(confirmResponse.body).toEqual({
        message: 'የይለፍ ቃል በተሳካ መልክ ተቀየረ።',
      });
    });

    it('should prevent reuse of consumed tokens', async () => {
      // First successful reset
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'mockedhexstring',
          newPassword: 'FirstResetP@ssw0rd123',
          confirmPassword: 'FirstResetP@ssw0rd123',
        })
        .expect(200);

      // Attempt to reuse the same token
      const reuseResponse = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'mockedhexstring',
          newPassword: 'SecondResetP@ssw0rd123',
          confirmPassword: 'SecondResetP@ssw0rd123',
        })
        .expect(400);

      expect(reuseResponse.body).toHaveProperty(
        'errorCode',
        'INVALID_RESET_TOKEN'
      );
    });

    it('should handle expired tokens correctly', async () => {
      // Create an expired token directly in database
      const _expiredToken = await prismaService.passwordReset.create({
        data: {
          userId: testUser.id,
          token: 'hashed-expired',
          hashedToken: 'hashed-expired',
          ipAddress: '192.168.1.1',
          userAgent: 'Test',
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          isUsed: false,
        },
      });

      const expiredResponse = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'expired-token',
          newPassword: 'NewP@ssw0rd123',
          confirmPassword: 'NewP@ssw0rd123',
        })
        .expect(400);

      expect(expiredResponse.body).toHaveProperty(
        'errorCode',
        'INVALID_RESET_TOKEN'
      );
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle non-existent user gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: 'nonexistent@example.com',
          clientId: 'web-app',
        })
        .expect(200);

      expect(response.body).toEqual({
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });
    });

    it('should handle inactive user accounts', async () => {
      // Update user to inactive
      await prismaService.user.update({
        where: { id: testUser.id },
        data: { status: 'INACTIVE' },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errorCode', 'ACCOUNT_INACTIVE');
    });

    it('should prevent spam by rejecting duplicate requests', async () => {
      // First request
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      // Immediate second request (should be rejected)
      const secondResponse = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      expect(secondResponse.body).toEqual({
        message:
          'A password reset link has already been sent. Please check your email.',
      });
    });

    it('should handle malformed requests', async () => {
      // Test various malformed payloads
      const malformedRequests = [
        {}, // Empty object
        { email: testUser.email }, // Missing clientId
        { clientId: 'web-app' }, // Missing email
        { email: '', clientId: 'web-app' }, // Empty email
        { email: testUser.email, clientId: '' }, // Empty clientId
      ];

      for (const malformedRequest of malformedRequests) {
        const response = await request(app.getHttpServer())
          .post('/auth/password-reset-request')
          .send(malformedRequest)
          .expect(400);

        expect(response.body).toHaveProperty('statusCode', 400);
      }
    });

    it('should handle very long input values', async () => {
      const longEmail = 'a'.repeat(200) + '@example.com';
      const longClientId = 'a'.repeat(100);

      const response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: longEmail,
          clientId: longClientId,
        })
        .expect(200);

      expect(response.body).toEqual({
        message:
          'If an account with this email exists, a password reset link has been sent.',
      });
    });

    it('should handle password validation errors', async () => {
      // First create a valid token
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      // Test various invalid passwords
      const invalidPasswords = [
        {
          newPassword: 'short',
          confirmPassword: 'short',
          expectedError: 'minLength',
        },
        {
          newPassword: 'nouppercasepassword123!',
          confirmPassword: 'nouppercasepassword123!',
          expectedError: 'matches',
        },
        {
          newPassword: 'ValidPassword123',
          confirmPassword: 'ValidPassword123',
          expectedError: 'matches',
        },
        {
          newPassword: 'ValidP@ssw0rd123',
          confirmPassword: 'DifferentP@ssw0rd123',
          expectedError: 'PASSWORDS_DO_NOT_MATCH',
        },
      ];

      for (const passwordTest of invalidPasswords) {
        const response = await request(app.getHttpServer())
          .post('/auth/password-reset-confirm')
          .send({
            token: 'mockedhexstring',
            ...passwordTest,
          })
          .expect(400);

        if (passwordTest.expectedError === 'PASSWORDS_DO_NOT_MATCH') {
          expect(response.body).toHaveProperty(
            'errorCode',
            passwordTest.expectedError
          );
        } else {
          expect(response.body.message).toContain(passwordTest.expectedError);
        }
      }
    });
  });

  describe('Security Features', () => {
    it('should not leak sensitive information', async () => {
      // Test that error messages don't reveal user existence
      const responses = await Promise.all([
        request(app.getHttpServer())
          .post('/auth/password-reset-request')
          .send({ email: 'nonexistent@example.com', clientId: 'web-app' }),
        request(app.getHttpServer()).post('/auth/password-reset-request').send({
          email: 'another-nonexistent@example.com',
          clientId: 'web-app',
        }),
      ]);

      // Both should return the same generic message
      responses.forEach(response => {
        expect(response.body).toEqual({
          message:
            'If an account with this email exists, a password reset link has been sent.',
        });
      });
    });

    it('should handle IP address extraction from various headers', async () => {
      const testCases = [
        { header: 'X-Forwarded-For', value: '203.0.113.1' },
        { header: 'X-Real-IP', value: '203.0.113.2' },
        { header: 'CF-Connecting-IP', value: '203.0.113.3' },
      ];

      for (const testCase of testCases) {
        const response = await request(app.getHttpServer())
          .post('/auth/password-reset-request')
          .send({
            email: testUser.email,
            clientId: 'web-app',
          })
          .set(testCase.header, testCase.value)
          .expect(200);

        expect(response.body).toEqual({
          message: 'Password reset link has been sent to your email.',
        });
      }
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      const mockCheckRateLimit = vi.mocked(
        mockAdaptiveRateLimitingService.checkRateLimit
      );
      mockCheckRateLimit.mockResolvedValueOnce({
        allowed: false,
        remainingRequests: 0,
      });

      const _response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(429);

      expect(mockCheckRateLimit).toHaveBeenCalled();
    });

    it('should validate password complexity according to NBE standards', async () => {
      // First create a valid token
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      // Test NBE-compliant password
      const nbeCompliantPassword = 'ValidNBEPassword123!@#';

      const response = await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'mockedhexstring',
          newPassword: nbeCompliantPassword,
          confirmPassword: nbeCompliantPassword,
        })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Password has been successfully reset.',
      });

      // Verify password was actually updated in database
      const updatedUser = await prismaService.user.findUnique({
        where: { id: testUser.id },
      });
      expect(updatedUser?.passwordHash).not.toBe(testUser.passwordHash);
    });
  });

  describe('Database Consistency', () => {
    it('should maintain database consistency during successful operations', async () => {
      const initialUserCount = await prismaService.user.count();
      const initialTokenCount = await prismaService.passwordReset.count();

      // Complete successful password reset flow
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'mockedhexstring',
          newPassword: 'SuccessfulResetP@ssw0rd123',
          confirmPassword: 'SuccessfulResetP@ssw0rd123',
        })
        .expect(200);

      // Verify database state
      const finalUserCount = await prismaService.user.count();
      const finalTokenCount = await prismaService.passwordReset.count();

      expect(finalUserCount).toBe(initialUserCount); // User count should remain the same
      expect(finalTokenCount).toBe(initialTokenCount + 1); // One token should be created

      const tokens = await prismaService.passwordReset.findMany();
      expect(tokens[0].isUsed).toBe(true); // Token should be marked as used
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockFindUnique = vi.spyOn(prismaService.user, 'findUnique');
      mockFindUnique.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(500);

      expect(response.body).toHaveProperty('statusCode', 500);
    });

    it('should clean up expired tokens', async () => {
      // Create some expired tokens
      const expiredTokens = [
        {
          userId: testUser.id,
          token: 'expired1',
          hashedToken: 'expired1',
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          isUsed: false,
        },
        {
          userId: testUser.id,
          token: 'expired2',
          hashedToken: 'expired2',
          expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isUsed: false,
        },
        {
          userId: testUser.id,
          token: 'used',
          hashedToken: 'used',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          isUsed: true,
        },
      ];

      for (const token of expiredTokens) {
        await prismaService.passwordReset.create({ data: token });
      }

      // Call cleanup method
      const cleanupResult = await tokenService.cleanupExpiredTokens();

      expect(cleanupResult).toBe(3); // Should cleanup 3 tokens (2 expired + 1 used)

      // Verify only valid tokens remain
      const remainingTokens = await prismaService.passwordReset.count();
      expect(remainingTokens).toBe(0);
    });
  });

  describe('Multi-language Support', () => {
    it('should support multiple languages throughout the flow', async () => {
      const languages = ['en', 'am'];

      for (const language of languages) {
        // Test password reset request
        const requestResponse = await request(app.getHttpServer())
          .post('/auth/password-reset-request')
          .send({
            email: testUser.email,
            clientId: 'web-app',
          })
          .set('Accept-Language', language)
          .expect(200);

        expect(requestResponse.body).toHaveProperty('message');

        // Test password reset confirmation with mismatched passwords
        const mismatchResponse = await request(app.getHttpServer())
          .post('/auth/password-reset-confirm')
          .send({
            token: 'mockedhexstring',
            newPassword: 'Password123!',
            confirmPassword: 'DifferentPassword123!',
          })
          .set('Accept-Language', language)
          .expect(400);

        expect(mismatchResponse.body).toHaveProperty('message');
      }
    });

    it('should handle unsupported languages gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .set('Accept-Language', 'unsupported-lang')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Password reset link has been sent to your email.',
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous requests correctly', async () => {
      const concurrentRequests = 5;
      const promises = [];

      // Create multiple concurrent password reset requests
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/password-reset-request')
            .send({
              email: testUser.email,
              clientId: `client-${i}`,
            })
            .set('X-Forwarded-For', `192.168.1.${i}`)
        );
      }

      const responses = await Promise.all(promises);

      // First request should succeed, subsequent should be rate-limited or rejected
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitCount = responses.filter(r => r.status === 429).length;

      expect(successCount + rateLimitCount).toBe(concurrentRequests);
    });

    it('should prevent race conditions during token validation', async () => {
      // Create a valid token
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      // Attempt multiple concurrent confirmations with the same token
      const concurrentConfirmations = 3;
      const promises = [];

      for (let i = 0; i < concurrentConfirmations; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/password-reset-confirm')
            .send({
              token: 'mockedhexstring',
              newPassword: `Password${i}@123`,
              confirmPassword: `Password${i}@123`,
            })
        );
      }

      const responses = await Promise.all(promises);

      // Only one should succeed, others should fail
      const successCount = responses.filter(r => r.status === 200).length;
      const failureCount = responses.filter(r => r.status === 400).length;

      expect(successCount).toBeLessThanOrEqual(1);
      expect(successCount + failureCount).toBe(concurrentConfirmations);
    });
  });

  describe('Audit Trail', () => {
    it('should create proper audit trail for password reset events', async () => {
      // Mock EventService to capture events
      const mockEventService = app.get(EventService);
      const mockPublish = vi.spyOn(mockEventService, 'publish');

      // Complete password reset flow
      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/password-reset-confirm')
        .send({
          token: 'mockedhexstring',
          newPassword: 'AuditTrailP@ssw0rd123',
          confirmPassword: 'AuditTrailP@ssw0rd123',
        })
        .expect(200);

      // Verify events were published
      expect(mockPublish).toHaveBeenCalledWith(
        'user.password_reset',
        expect.objectContaining({
          userId: testUser.id,
          timestamp: expect.any(String),
          eventType: 'PASSWORD_RESET_SUCCESSFUL',
        })
      );

      const eventCall = mockPublish.mock.calls.find(
        call => call[0] === 'user.password_reset'
      );
      expect(eventCall).toBeDefined();

      const eventPayload = eventCall[1];
      expect(eventPayload.userId).toBe(testUser.id);
      expect(eventPayload.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
      expect(eventPayload.eventType).toBe('PASSWORD_RESET_SUCCESSFUL');
    });

    it('should track IP addresses and user agents', async () => {
      const testIp = '10.0.0.100';
      const testUserAgent = 'Custom-Test-Agent/1.0';

      await request(app.getHttpServer())
        .post('/auth/password-reset-request')
        .send({
          email: testUser.email,
          clientId: 'web-app',
        })
        .set('X-Forwarded-For', testIp)
        .set('User-Agent', testUserAgent)
        .expect(200);

      // Verify token was created with correct tracking info
      const tokens = await prismaService.passwordReset.findMany({
        where: { userId: testUser.id },
      });

      expect(tokens).toHaveLength(1);
      expect(tokens[0].ipAddress).toBe(testIp);
      expect(tokens[0].userAgent).toBe(testUserAgent);
    });
  });
});
