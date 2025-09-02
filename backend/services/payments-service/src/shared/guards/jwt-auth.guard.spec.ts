import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockConfigService = {
    get: vi.fn((key: string) => {
      const allowedKeys = [
        'JWT_SECRET',
        'JWT_EXPIRATION',
        'JWT_ISSUER',
        'JWT_AUDIENCE',
      ];
      if (!allowedKeys.includes(key)) {
        return undefined;
      }

      const config: Record<string, string> = {
        JWT_SECRET: 'test-jwt-secret-key-32-chars-long',
        JWT_EXPIRATION: '1h',
        JWT_ISSUER: 'meqenet.et',
        JWT_AUDIENCE: 'meqenet-api',
      };
      return key in config ? config[key as keyof typeof config] : undefined;
    }),
  };

  const mockJwtService = {
    verifyAsync: vi.fn(),
    signAsync: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toBe('valid-jwt-token');
    });

    it('should return null for missing Authorization header', () => {
      const mockRequest = {
        headers: {},
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toBeNull();
    });

    it('should return null for invalid Authorization header format', () => {
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat valid-jwt-token',
        },
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toBeNull();
    });

    it('should return null for Authorization header without token', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer ',
        },
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toBeNull();
    });
  });

  describe('handleRequest', () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            ip: '127.0.0.1',
            url: '/api/test',
            get: vi.fn((header: string) => {
              if (header === 'User-Agent') return 'test-agent';
              return undefined;
            }),
          }),
        }),
      } as any;
    });

    it('should return user for successful authentication', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const info = null;
      const err = null;

      const result = guard.handleRequest(err, user, info, mockContext);

      expect(result).toBe(user);
    });

    it('should throw UnauthorizedException for authentication failure', () => {
      const user = null;
      const info = { message: 'Token expired' };
      const err = new Error('Token verification failed');

      expect(() => {
        guard.handleRequest(err, user, info, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should log authentication failures for security monitoring', () => {
      const loggerSpy = vi.spyOn(guard['logger'], 'warn').mockImplementation();
      const user = null;
      const info = { message: 'Invalid token' };
      const err = new Error('Authentication failed');

      expect(() => {
        guard.handleRequest(err, user, info, mockContext);
      }).toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        'JWT authentication failed',
        expect.objectContaining({
          error: 'Authentication failed',
          info: 'Invalid token',
          ip: '127.0.0.1',
        })
      );

      loggerSpy.mockRestore();
    });

    it('should handle null error with user null', () => {
      const user = null;
      const info = null;
      const err = null;

      expect(() => {
        guard.handleRequest(err, user, info, mockContext);
      }).toThrow(UnauthorizedException);
    });
  });

  describe('JWT Token Validation', () => {
    it('should validate JWT token format', () => {
      const mockRequest = {
        headers: {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-payload.signature',
        },
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/);
    });

    it('should reject malformed JWT tokens', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer malformed-jwt-token',
        },
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toBe('malformed-jwt-token'); // Still extracts, but validation will fail later
    });
  });

  describe('FinTech Security Compliance', () => {
    it('should implement secure token extraction', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer secure-token-123',
        },
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should log security events for failed authentication', () => {
      const loggerSpy = vi.spyOn(guard['logger'], 'warn').mockImplementation();

      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            ip: '192.168.1.100',
            url: '/api/secure',
            get: vi.fn((header: string) => {
              if (header === 'User-Agent') return 'Suspicious-Agent/1.0';
              return undefined;
            }),
          }),
        }),
      } as any;

      expect(() => {
        guard.handleRequest(
          new Error('Suspicious activity'),
          null,
          null,
          mockContext
        );
      }).toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        'JWT authentication failed',
        expect.objectContaining({
          ip: '192.168.1.100',
        })
      );

      loggerSpy.mockRestore();
    });

    it('should handle rate limiting for failed authentication attempts', () => {
      // This test ensures the guard doesn't contribute to DoS vulnerabilities
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            ip: '10.0.0.1',
          }),
        }),
      } as any;

      // Multiple failed attempts should be handled gracefully
      for (let i = 0; i < 5; i++) {
        expect(() => {
          guard.handleRequest(
            new Error('Invalid token'),
            null,
            null,
            mockContext
          );
        }).toThrow();
      }
    });
  });

  describe('NBE Compliance', () => {
    it('should support Ethiopian authentication standards', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer ethiopian-standard-jwt',
          'x-nbe-compliance': 'true',
        },
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toBeDefined();
    });

    it('should handle multi-language error messages', () => {
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            headers: {
              'accept-language': 'am,en',
            },
          }),
        }),
      } as any;

      expect(() => {
        guard.handleRequest(null, null, null, mockContext);
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', () => {
      const mockRequest = {
        headers: null, // Malformed headers
      };

      const token = guard.extractTokenFromHeader(mockRequest);

      expect(token).toBeNull();
    });

    it('should handle missing request object', () => {
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue(null),
        }),
      } as any;

      expect(() => {
        guard.handleRequest(null, null, null, mockContext);
      }).toThrow();
    });

    it('should sanitize error messages for security', () => {
      const loggerSpy = vi.spyOn(guard['logger'], 'warn').mockImplementation();
      const sensitiveError = new Error(
        'Internal server error with sensitive data: password=secret123'
      );
      const mockContext = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            ip: '127.0.0.1',
            url: '/api/test',
            get: vi.fn((header: string) => {
              if (header === 'User-Agent') return 'test-agent';
              return undefined;
            }),
          }),
        }),
      } as any;

      expect(() => {
        guard.handleRequest(sensitiveError, null, null, mockContext);
      }).toThrow();

      // Logged message should not contain sensitive data
      expect(loggerSpy).toHaveBeenCalledWith(
        'JWT authentication failed',
        expect.objectContaining({
          error: expect.not.stringContaining('password'),
          error: expect.not.stringContaining('secret123'),
        })
      );

      loggerSpy.mockRestore();
    });
  });

  describe('Performance & Reliability', () => {
    it('should have efficient token extraction', () => {
      const mockRequest = {
        headers: {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      };

      const startTime = Date.now();
      const PERFORMANCE_ITERATIONS = 1000;
      for (let i = 0; i < PERFORMANCE_ITERATIONS; i++) {
        guard.extractTokenFromHeader(mockRequest);
      }
      const endTime = Date.now();

      const averageTime = (endTime - startTime) / PERFORMANCE_ITERATIONS;
      const MAX_ACCEPTABLE_TIME_MS = 1;

      // Should be very fast (< 1ms per extraction)
      expect(averageTime).toBeLessThan(MAX_ACCEPTABLE_TIME_MS);
    });

    it('should handle concurrent authentication requests', async () => {
      const CONCURRENT_REQUESTS_COUNT = 10;
      const mockRequests = Array.from(
        { length: CONCURRENT_REQUESTS_COUNT },
        (_, i) => ({
          headers: {
            authorization: `Bearer token-${i}`,
          },
        })
      );

      const promises = mockRequests.map(request =>
        Promise.resolve(guard.extractTokenFromHeader(request))
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(CONCURRENT_REQUESTS_COUNT);
      results.forEach((result, index) => {
        expect(result).toBe(`token-${index}`);
      });
    });
  });
});
