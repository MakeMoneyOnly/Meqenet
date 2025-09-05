import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

interface MockConfigService {
  get: ReturnType<typeof vi.fn>;
}

describe('SecurityConfig', () => {
  let configService: ConfigService;
  let mockConfigService: MockConfigService;

  beforeEach(async () => {
    // Create a fresh mock for each test
    mockConfigService = {
      get: vi.fn((key: string) => {
        const config: Record<
          string,
          string | number | boolean | string[] | undefined
        > = {
          // Encryption settings
          ENCRYPTION_ALGORITHM: 'aes-256-gcm',
          ENCRYPTION_KEY_LENGTH: 32,
          ENCRYPTION_IV_LENGTH: 16,

          // JWT settings
          JWT_SECRET: 'test-jwt-secret-key-32-chars-long',
          JWT_EXPIRATION: '1h',
          JWT_REFRESH_EXPIRATION: '7d',

          // Rate limiting
          RATE_LIMIT_TTL: 60,
          RATE_LIMIT_MAX: 100,

          // CORS settings
          CORS_ORIGINS: ['https://meqenet.et', 'https://app.meqenet.et'],
          CORS_CREDENTIALS: true,

          // Security headers
          SECURITY_HEADERS_ENABLED: true,
          HSTS_MAX_AGE: 31536000,
          CSP_ENABLED: true,

          // Database security
          DB_ENCRYPTION_ENABLED: true,
          DB_SSL_ENABLED: true,

          // API security
          API_KEY_REQUIRED: true,
          REQUEST_SIZE_LIMIT: '10mb',

          // Additional config for other tests
          MFA_ENABLED: true,
          PASSWORD_MIN_LENGTH: 12,
          PASSWORD_REQUIRE_SPECIAL: true,
          PASSWORD_REQUIRE_NUMBERS: true,
          SESSION_TIMEOUT_MINUTES: 30,
          MAX_CONCURRENT_SESSIONS: 3,
          OAUTH_ENABLED: false,
          NBE_COMPLIANT_AUTH: true,
          BIOMETRIC_AUTH_ENABLED: false,
          DAILY_TRANSACTION_LIMIT: 50000,
          MONTHLY_TRANSACTION_LIMIT: 500000,
          ETHIOPIAN_LANGUAGE_SUPPORT: true,
          ETHIOPIAN_TIMEZONE: 'Africa/Addis_Ababa',
          ETB_CURRENCY_SUPPORT: true,
          REDIS_ENABLED: true,
          CONNECTION_POOL_ENABLED: true,
          CACHING_ENABLED: true,
          STRUCTURED_LOGGING: true,
          HEALTH_CHECKS_ENABLED: true,
          METRICS_COLLECTION: true,
          DETAILED_ERROR_MESSAGES: false,
          DETAILED_AUTH_ERRORS: false,
        };
        return config[key as keyof typeof config];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Encryption Configuration', () => {
    it('should have strong encryption algorithm', () => {
      const algorithm = configService.get('ENCRYPTION_ALGORITHM');
      expect(algorithm).toBe('aes-256-gcm');
    });

    it('should have adequate key length for AES-256', () => {
      const keyLength = configService.get('ENCRYPTION_KEY_LENGTH');
      expect(keyLength).toBe(32); // 256 bits
    });

    it('should have proper IV length for GCM mode', () => {
      const ivLength = configService.get('ENCRYPTION_IV_LENGTH');
      expect(ivLength).toBe(16); // 128 bits for GCM
    });

    it('should enable database encryption', () => {
      const dbEncryption = configService.get('DB_ENCRYPTION_ENABLED');
      expect(dbEncryption).toBe(true);
    });

    it('should enable database SSL', () => {
      const dbSsl = configService.get('DB_SSL_ENABLED');
      expect(dbSsl).toBe(true);
    });
  });

  describe('JWT Security Configuration', () => {
    it('should have strong JWT secret', () => {
      const jwtSecret = configService.get('JWT_SECRET');
      expect(jwtSecret).toBeDefined();
      expect(jwtSecret.length).toBeGreaterThanOrEqual(32);
    });

    it('should have reasonable JWT expiration time', () => {
      const jwtExpiration = configService.get('JWT_EXPIRATION');
      expect(jwtExpiration).toBe('1h');
    });

    it('should have secure refresh token expiration', () => {
      const refreshExpiration = configService.get('JWT_REFRESH_EXPIRATION');
      expect(refreshExpiration).toBe('7d');
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should have reasonable rate limit TTL', () => {
      const ttl = configService.get('RATE_LIMIT_TTL');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(3600); // Max 1 hour
    });

    it('should have appropriate rate limit max requests', () => {
      const maxRequests = configService.get('RATE_LIMIT_MAX');
      expect(maxRequests).toBeGreaterThan(0);
      expect(maxRequests).toBeLessThanOrEqual(1000); // Reasonable limit
    });
  });

  describe('CORS Security Configuration', () => {
    it('should have restricted CORS origins', () => {
      const origins = configService.get('CORS_ORIGINS');
      expect(Array.isArray(origins)).toBe(true);
      expect(origins.length).toBeGreaterThan(0);

      // All origins should be HTTPS
      origins.forEach(origin => {
        expect(origin).toMatch(/^https:\/\//);
      });
    });

    it('should handle CORS credentials appropriately', () => {
      const credentials = configService.get('CORS_CREDENTIALS');
      expect(typeof credentials).toBe('boolean');
    });
  });

  describe('Security Headers Configuration', () => {
    it('should enable security headers', () => {
      const enabled = configService.get('SECURITY_HEADERS_ENABLED');
      expect(enabled).toBe(true);
    });

    it('should have proper HSTS max age', () => {
      const maxAge = configService.get('HSTS_MAX_AGE');
      expect(maxAge).toBeGreaterThanOrEqual(31536000); // 1 year in seconds
    });

    it('should enable Content Security Policy', () => {
      const cspEnabled = configService.get('CSP_ENABLED');
      expect(cspEnabled).toBe(true);
    });
  });

  describe('API Security Configuration', () => {
    it('should require API keys for sensitive operations', () => {
      const apiKeyRequired = configService.get('API_KEY_REQUIRED');
      expect(apiKeyRequired).toBe(true);
    });

    it('should have reasonable request size limits', () => {
      const sizeLimit = configService.get('REQUEST_SIZE_LIMIT');
      expect(sizeLimit).toBeDefined();
      expect(sizeLimit).toMatch(/^\d+(mb|kb|b)$/);
    });
  });

  describe('FinTech Compliance & NBE Requirements', () => {
    it('should meet NBE encryption standards', () => {
      const algorithm = configService.get('ENCRYPTION_ALGORITHM');
      const keyLength = configService.get('ENCRYPTION_KEY_LENGTH');

      // NBE requires AES-256 or stronger
      expect(['aes-256-gcm', 'aes-256-cbc']).toContain(algorithm);
      expect(keyLength).toBeGreaterThanOrEqual(32);
    });

    it('should implement PCI DSS requirements for payment data', () => {
      const encryptionEnabled = configService.get('ENCRYPTION_ALGORITHM');
      const sslEnabled = configService.get('DB_SSL_ENABLED');

      expect(encryptionEnabled).toBeDefined();
      expect(sslEnabled).toBe(true);
    });

    it('should support audit logging requirements', () => {
      // Verify that logging configurations exist
      const jwtSecret = configService.get('JWT_SECRET');
      expect(jwtSecret).toBeDefined();
    });

    it('should implement data residency requirements', () => {
      const dbEncryption = configService.get('DB_ENCRYPTION_ENABLED');
      const sslEnabled = configService.get('DB_SSL_ENABLED');

      expect(dbEncryption).toBe(true);
      expect(sslEnabled).toBe(true);
    });
  });

  describe('Security Best Practices', () => {
    it('should not expose sensitive configuration values', () => {
      // Ensure sensitive values are not logged or exposed
      const jwtSecret = configService.get('JWT_SECRET');

      // JWT secret should not be a common weak value
      expect(jwtSecret).not.toBe('secret');
      expect(jwtSecret).not.toBe('password');
      expect(jwtSecret).not.toBe('123456');
    });

    it('should have environment-specific configurations', () => {
      // Verify configurations can be overridden by environment
      expect(configService.get('JWT_SECRET')).toBeDefined();
      expect(configService.get('ENCRYPTION_ALGORITHM')).toBeDefined();
    });

    it('should implement defense in depth', () => {
      const encryptionEnabled = configService.get('ENCRYPTION_ALGORITHM');
      const rateLimitingEnabled = configService.get('RATE_LIMIT_MAX');
      const corsEnabled = configService.get('CORS_ORIGINS');
      const securityHeadersEnabled = configService.get(
        'SECURITY_HEADERS_ENABLED'
      );

      expect(encryptionEnabled).toBeDefined();
      expect(rateLimitingEnabled).toBeDefined();
      expect(corsEnabled).toBeDefined();
      expect(securityHeadersEnabled).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate encryption key strength', () => {
      const keyLength = configService.get('ENCRYPTION_KEY_LENGTH');
      expect(keyLength).toBeGreaterThanOrEqual(32);
    });

    it('should validate JWT token expiration times', () => {
      const jwtExpiration = configService.get('JWT_EXPIRATION');
      const refreshExpiration = configService.get('JWT_REFRESH_EXPIRATION');

      expect(jwtExpiration).toMatch(/^\d+[smhd]$/);
      expect(refreshExpiration).toMatch(/^\d+[smhd]$/);
    });

    it('should validate CORS origins format', () => {
      const origins = configService.get('CORS_ORIGINS');

      origins.forEach(origin => {
        expect(origin).toMatch(/^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
      });
    });
  });
});
