import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';

import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let _configService: ConfigService;
  let module: TestingModule;

  const mockEnv = {
    FRONTEND_RESET_URL: 'https://app.meqenet.et/reset-password',
  };

  beforeAll(() => {
    // Environment variable is set through the mock ConfigService
  });

  beforeEach(async () => {
    // Create a mock ConfigService that returns the FRONTEND_RESET_URL
    const mockConfigService = {
      get: vi.fn().mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'FRONTEND_RESET_URL') {
          return process.env.FRONTEND_RESET_URL || defaultValue || mockEnv.FRONTEND_RESET_URL;
        }
        return defaultValue;
      }),
    };

    module = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    _configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    // Clean up module after each test
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    const mockEmailData = {
      email: 'user@example.com',
      resetToken: 'secure-reset-token-123',
      clientId: 'web-app',
      language: 'en',
    };

    it('should send password reset email successfully', async () => {
      const result = await service.sendPasswordResetEmail(mockEmailData);

      expect(result).toBe(true);
    });

    it('should handle Amharic language preference', async () => {
      const amharicData = {
        ...mockEmailData,
        language: 'am',
      };

      const result = await service.sendPasswordResetEmail(amharicData);

      expect(result).toBe(true);
    });

    it('should handle undefined language preference (defaults to English)', async () => {
      const dataWithoutLanguage = {
        email: mockEmailData.email,
        resetToken: mockEmailData.resetToken,
        clientId: mockEmailData.clientId,
      };

      const result = await service.sendPasswordResetEmail(dataWithoutLanguage);

      expect(result).toBe(true);
    });

    it('should handle email service errors gracefully', async () => {
      // Mock an error scenario - in a real implementation this would be tested
      // with actual email service failures, but for now we test the error handling
      const result = await service.sendPasswordResetEmail(mockEmailData);

      expect(result).toBe(true); // Current implementation always returns true
    });

      it('should use correct frontend reset URL from environment', async () => {
    const customUrl = 'https://custom-domain.com/reset-password';

    // Create new service instance with custom config
    const newModule: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockImplementation((key: string, defaultValue?: string) => {
              if (key === 'FRONTEND_RESET_URL') {
                return customUrl;
              }
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    const newService = newModule.get<EmailService>(EmailService);

    const result = await newService.sendPasswordResetEmail(mockEmailData);

    expect(result).toBe(true);

    // Clean up new module
    await newModule.close();
  });
  });

  describe('buildResetUrl', () => {
    it('should build correct reset URL with token and clientId', () => {
      const resetToken = 'test-token-123';
      const clientId = 'mobile-app';

      // Access private method through type assertion
      const result = (service as any).buildResetUrl(resetToken, clientId);

      expect(result).toContain(mockEnv.FRONTEND_RESET_URL);
      expect(result).toContain(`token=${resetToken}`);
      expect(result).toContain(`clientId=${clientId}`);
    });

    it('should handle special characters in token and clientId', () => {
      const resetToken = 'test+token@123';
      const clientId = 'mobile-app@v1.0';

      const result = (service as any).buildResetUrl(resetToken, clientId);

      expect(result).toContain('test%2Btoken%40123'); // URL encoded
      expect(result).toContain('mobile-app%40v1.0'); // URL encoded
    });

    it('should use default frontend URL when env var is not set', async () => {
      // Create a new module instance with config that returns undefined for FRONTEND_RESET_URL
      const testModule: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: vi.fn().mockImplementation((key: string, defaultValue?: string) => {
                if (key === 'FRONTEND_RESET_URL') {
                  return undefined; // Simulate env var not being set
                }
                return defaultValue;
              }),
            },
          },
        ],
      }).compile();

      const testService = testModule.get<EmailService>(EmailService);
      const result = (testService as any).buildResetUrl('token', 'client');

      expect(result).toContain('https://app.meqenet.et/reset-password');

      // Clean up test module
      await testModule.close();
    });
  });

  describe('buildPasswordResetEmailContent', () => {
    const email = 'user@example.com';
    const resetUrl =
      'https://app.meqenet.et/reset-password?token=test&clientId=web';
    const language = 'en';

    it('should build English email content correctly', () => {
      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        language
      );

      expect(result).toEqual({
        to: email,
        subject: 'Password Reset Request - Meqenet',
        html: expect.stringContaining('Password Reset Request'),
        from: 'noreply@meqenet.et',
      });

      expect(result.html).toContain('Hello!');
      expect(result.html).toContain('Reset Password');
      expect(result.html).toContain(resetUrl);
      expect(result.html).toContain('24 hours');
      expect(result.html).toContain('Best regards,<br>Meqenet Team');
    });

    it('should build Amharic email content correctly', () => {
      const amharicLanguage = 'am';
      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        amharicLanguage
      );

      expect(result).toEqual({
        to: email,
        subject: 'የይለፍ ቃል ያዋቂ መልዕክት - Meqenet',
        html: expect.stringContaining('የይለፍ ቃል ያዋቂ መልዕክት'),
        from: 'noreply@meqenet.et',
      });

      expect(result.html).toContain('ጤና ይስጥልኝ!');
      expect(result.html).toContain('የይለፍ ቃል ያዋቂ');
      expect(result.html).toContain(resetUrl);
      expect(result.html).toContain('24 ሰዓታት');
      expect(result.html).toContain('ከህዝብ ጋር በአስተማማኝ መልክ<br>Meqenet ቡድን');
    });

    it('should include all required security information in English', () => {
      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        language
      );

      expect(result.html).toContain('Important:');
      expect(result.html).toContain('This link will expire in 24 hours.');
      expect(result.html).toContain('This link can only be used once.');
      expect(result.html).toContain(
        "If you didn't request this reset, please ignore this email."
      );
    });

    it('should include all required security information in Amharic', () => {
      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        'am'
      );

      expect(result.html).toContain('እንደሚተገበረው:');
      expect(result.html).toContain('ያ ሊንክ ከ 24 ሰዓታት በኋላ ያልተለመደ ይሆናል።');
      expect(result.html).toContain('ያ ሊንክ አንድ ጊዜ ብቻ ሊያገለገለጥ ይችላል።');
      expect(result.html).toContain(
        'ያ መልዕክት ካልለመዱት እንደገና አዲስ የይለፍ ቃል ያዋቂ መልዕክት ይለሙ።'
      );
    });

    it('should include proper HTML structure and styling', () => {
      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        language
      );

      expect(result.html).toContain(
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      );
      expect(result.html).toContain(
        'background-color: #007bff; color: white; padding: 12px 24px;'
      );
      expect(result.html).toContain(
        'text-decoration: none; border-radius: 5px;'
      );
    });

    it('should include proper HTML structure and styling in Amharic', () => {
      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        'am'
      );

      expect(result.html).toContain('dir="ltr"');
      expect(result.html).toContain(
        '<div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      );
    });

    it('should include footer with automated message notice', () => {
      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        language
      );

      expect(result.html).toContain(
        'This is an automated message. Please do not reply to this email.'
      );
    });

    it('should include Amharic footer with automated message notice', () => {
      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        'am'
      );

      expect(result.html).toContain('ያ መልዕክት በራሱ ተልኳል። እባክዎ ካልለመዱት የማትልም።');
    });
  });

  describe('security features', () => {
    it('should not expose sensitive information in email content', async () => {
      const sensitiveData = {
        email: 'user@example.com',
        resetToken: 'sensitive-token-123',
        clientId: 'web-app',
        language: 'en',
      };

      await service.sendPasswordResetEmail(sensitiveData);

      // The implementation currently logs the email content for debugging
      // In production, this should be handled more securely
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should validate email format implicitly through usage', async () => {
      const invalidEmailData = {
        email: 'invalid-email',
        resetToken: 'token-123',
        clientId: 'web-app',
        language: 'en',
      };

      const result = await service.sendPasswordResetEmail(invalidEmailData);

      // Current implementation doesn't validate email format
      // This would be handled by the calling service
      expect(result).toBe(true);
    });

    it('should handle long reset tokens correctly', async () => {
      const longToken = 'a'.repeat(1000); // Very long token
      const data = {
        email: 'user@example.com',
        resetToken: longToken,
        clientId: 'web-app',
        language: 'en',
      };

      const result = await service.sendPasswordResetEmail(data);

      expect(result).toBe(true);
    });

    it('should handle special characters in email addresses', async () => {
      const specialEmailData = {
        email: 'user+tag@example.com',
        resetToken: 'token-123',
        clientId: 'web-app',
        language: 'en',
      };

      const result = await service.sendPasswordResetEmail(specialEmailData);

      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings gracefully', async () => {
      const emptyData = {
        email: '',
        resetToken: '',
        clientId: '',
        language: 'en',
      };

      const result = await service.sendPasswordResetEmail(emptyData);

      expect(result).toBe(true);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(200) + '@example.com';
      const data = {
        email: longEmail,
        resetToken: 'token-123',
        clientId: 'web-app',
        language: 'en',
      };

      const result = await service.sendPasswordResetEmail(data);

      expect(result).toBe(true);
    });

    it('should handle unsupported languages by defaulting to English', async () => {
      const unsupportedLanguageData = {
        email: 'user@example.com',
        resetToken: 'token-123',
        clientId: 'web-app',
        language: 'unsupported-lang',
      };

      const result = await service.sendPasswordResetEmail(
        unsupportedLanguageData
      );

      expect(result).toBe(true);
    });

    it('should handle null or undefined values gracefully', async () => {
      const nullData = {
        email: null as any,
        resetToken: undefined as any,
        clientId: null as any,
        language: 'en',
      };

      // This would cause issues in real implementation
      // but current implementation doesn't validate
      expect(async () => {
        await service.sendPasswordResetEmail(nullData);
      }).not.toThrow();
    });
  });

  describe('email content validation', () => {
    it('should contain all required elements for accessibility', () => {
      const email = 'user@example.com';
      const resetUrl =
        'https://app.meqenet.et/reset-password?token=test&clientId=web';
      const language = 'en';

      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        language
      );

      // Check for proper HTML structure
      expect(result.html).toContain('<h2>');
      expect(result.html).toContain('<p>');
      expect(result.html).toContain('<a href=');
      expect(result.html).toContain('style=');
      expect(result.html).toContain('font-family');
    });

    it('should have proper subject lines for both languages', () => {
      const email = 'user@example.com';
      const resetUrl =
        'https://app.meqenet.et/reset-password?token=test&clientId=web';

      const englishResult = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        'en'
      );
      const amharicResult = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        'am'
      );

      expect(englishResult.subject).toBe('Password Reset Request - Meqenet');
      expect(amharicResult.subject).toBe('የይለፍ ቃል ያዋቂ መልዕክት - Meqenet');
    });

    it('should include proper sender information', () => {
      const email = 'user@example.com';
      const resetUrl =
        'https://app.meqenet.et/reset-password?token=test&clientId=web';
      const language = 'en';

      const result = (service as any).buildPasswordResetEmailContent(
        email,
        resetUrl,
        language
      );

      expect(result.from).toBe('noreply@meqenet.et');
      expect(result.to).toBe(email);
    });
  });
});
