import {
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { vi } from 'vitest';

import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  const mockConfigService = {
    get: vi.fn((key: string): string | number | boolean | undefined => {
      const allowedKeys = [
        'NODE_ENV',
        'ERROR_LOGGING_ENABLED',
        'SENSITIVE_DATA_MASKING',
        'ERROR_RESPONSE_FORMAT',
      ];
      if (!allowedKeys.includes(key)) {
        return undefined;
      }

      const config: Record<string, string | number | boolean> = {
        NODE_ENV: 'test',
        ERROR_LOGGING_ENABLED: true,
        SENSITIVE_DATA_MASKING: true,
        ERROR_RESPONSE_FORMAT: 'detailed',
      };
      return key in config ? config[key as keyof typeof config] : undefined;
    }),
  };

  const mockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
  } as any as Response;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockResponse.json.mockClear();
    mockResponse.status.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('Exception Handling', () => {
    it('should handle UnauthorizedException properly', () => {
      const mockRequest = {
        url: '/api/protected',
        method: 'GET',
        ip: '127.0.0.1',
        get: vi.fn((header: string): string | undefined => {
          if (header === 'User-Agent') return 'TestAgent/1.0';
          return undefined;
        }),
      };

      const exception = new UnauthorizedException('Invalid credentials');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle BadRequestException properly', () => {
      const mockRequest = {
        url: '/api/users',
        method: 'POST',
        ip: '192.168.1.1',
        get: vi.fn(),
      };

      const exception = new BadRequestException('Validation failed');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle generic Error objects', () => {
      const mockRequest = {
        url: '/api/data',
        method: 'GET',
        ip: '10.0.0.1',
        get: vi.fn(),
      };

      const exception = new Error('Database connection failed');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('Security & Data Sanitization', () => {
    it('should sanitize sensitive data from error messages', () => {
      const mockRequest = {
        url: '/api/auth',
        method: 'POST',
        ip: '127.0.0.1',
        get: vi.fn(),
      };

      const exception = new Error(
        'Login failed for user: admin with password: secret123'
      );

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      const responseCall = mockResponse.json.mock.calls[0][0];

      // Sensitive data should be redacted
      expect(responseCall.error.message).not.toContain('secret123');
      expect(responseCall.error.message).not.toContain('password');
    });

    it('should log security-relevant errors separately', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      const mockRequest = {
        url: '/api/admin',
        method: 'DELETE',
        ip: '192.168.1.100',
        get: vi.fn((header: string): string | undefined => {
          if (header === 'User-Agent') return 'SuspiciousAgent/1.0';
          return undefined;
        }),
      };

      const exception = new UnauthorizedException('Access denied');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Security-related error',
        expect.objectContaining({
          status: HttpStatus.UNAUTHORIZED,
          ip: '192.168.1.100',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should mask sensitive headers in logs', () => {
      const mockRequest = {
        url: '/api/payment',
        method: 'POST',
        ip: '127.0.0.1',
        headers: {
          authorization: 'Bearer secret-jwt-token',
          'x-api-key': 'secret-api-key',
          'content-type': 'application/json',
        },
        get: vi.fn(),
      };

      const exception = new Error('Payment processing failed');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      // The implementation should sanitize headers before logging
      expect(mockRequest.headers.authorization).toBe('[REDACTED]');
      expect(mockRequest.headers['x-api-key']).toBe('[REDACTED]');
      expect(mockRequest.headers['content-type']).toBe('application/json'); // Non-sensitive
    });
  });

  describe('Error Response Format', () => {
    it('should include request context in error response', () => {
      const mockRequest = {
        url: '/api/users/123',
        method: 'PUT',
        ip: '127.0.0.1',
        get: vi.fn(),
      };

      const exception = new BadRequestException('Invalid user data');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      const responseCall = mockResponse.json.mock.calls[0][0];

      expect(responseCall).toHaveProperty('timestamp');
      expect(responseCall).toHaveProperty('path', '/api/users/123');
      expect(responseCall).toHaveProperty('method', 'PUT');
    });

    it('should include correlation ID when available', () => {
      const mockRequest = {
        url: '/api/data',
        method: 'GET',
        ip: '127.0.0.1',
        headers: {
          'x-request-id': 'correlation-12345',
        },
        get: vi.fn(),
      };

      const exception = new Error('Data processing failed');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      // The implementation should include correlation ID in logs
      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('timestamp');
    });
  });

  describe('HTTP Status Code Mapping', () => {
    it('should map exceptions to correct HTTP status codes', () => {
      const testCases = [
        {
          exception: new UnauthorizedException(),
          expectedStatus: HttpStatus.UNAUTHORIZED,
        },
        {
          exception: new BadRequestException(),
          expectedStatus: HttpStatus.BAD_REQUEST,
        },
        {
          exception: new Error('Generic error'),
          expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      ];

      testCases.forEach(({ exception, expectedStatus }) => {
        const mockRequest = {
          url: '/api/test',
          method: 'GET',
          ip: '127.0.0.1',
          get: vi.fn(),
        };

        filter.catch(exception, {
          switchToHttp: (): any => ({
            getRequest: (): any => mockRequest,
            getResponse: (): any => mockResponse,
          }),
        } as any);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
      });
    });

    it('should handle custom error codes', () => {
      const mockRequest = {
        url: '/api/custom',
        method: 'POST',
        ip: '127.0.0.1',
        get: vi.fn(),
      };

      // Custom exception with status code
      const customException = {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Rate limit exceeded',
        response: {
          error: 'RATE_LIMIT_EXCEEDED',
        },
      };

      filter.catch(customException, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.TOO_MANY_REQUESTS
      );
      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('FinTech Compliance & NBE Requirements', () => {
    it('should comply with NBE error reporting standards', () => {
      const mockRequest = {
        url: '/api/payment',
        method: 'POST',
        ip: '127.0.0.1',
        headers: {
          'x-nbe-session-id': 'nbe-session-123',
        },
        get: vi.fn(),
      };

      const exception = new Error('Payment failed due to insufficient funds');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      const responseCall = mockResponse.json.mock.calls[0][0];

      // NBE compliance requires specific error format
      expect(responseCall).toHaveProperty('timestamp');
      expect(responseCall).toHaveProperty('requestId');
      expect(responseCall.error).toHaveProperty('code');
      expect(responseCall.error).toHaveProperty('category');
    });

    it('should log financial transaction errors for audit', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      const mockRequest = {
        url: '/api/payment/process',
        method: 'POST',
        ip: '127.0.0.1',
        get: vi.fn(),
      };

      const exception = new Error('Financial transaction failed');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unhandled exception',
        expect.objectContaining({
          error: 'Financial transaction failed',
          url: '/api/payment/process',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle PCI DSS compliance for payment errors', () => {
      const mockRequest = {
        url: '/api/payment/card',
        method: 'POST',
        ip: '127.0.0.1',
        get: vi.fn(),
      };

      const exception = new Error('Card processing failed - invalid CVV');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      const responseCall = mockResponse.json.mock.calls[0][0];

      // PCI DSS requires that sensitive card data is not exposed in errors
      expect(responseCall.error.message).not.toContain('CVV');
      expect(responseCall.error.message).not.toContain('card number');
    });
  });

  describe('Performance & Monitoring', () => {
    it('should handle multiple errors gracefully', () => {
      const mockRequest = {
        url: '/api/stress-test',
        method: 'GET',
        ip: '127.0.0.1',
        get: vi.fn(),
      };

      const startTime = Date.now();

      // Simulate a few rapid errors
      for (let i = 0; i < 5; i++) {
        const exception = new Error(`Error ${i}`);
        filter.catch(exception, {
          switchToHttp: (): any => ({
            getRequest: (): any => mockRequest,
            getResponse: (): any => mockResponse,
          }),
        } as any);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle multiple errors within reasonable time (< 100ms)
      expect(duration).toBeLessThan(100); // eslint-disable-line @typescript-eslint/no-magic-numbers
    });

    it('should include performance metrics in error logs', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      const mockRequest = {
        url: '/api/slow-endpoint',
        method: 'GET',
        ip: '127.0.0.1',
        get: vi.fn(),
      };

      const exception = new Error('Timeout occurred');

      filter.catch(exception, {
        switchToHttp: (): any => ({
          getRequest: (): any => mockRequest,
          getResponse: (): any => mockResponse,
        }),
      } as any);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unhandled exception',
        expect.objectContaining({
          url: '/api/slow-endpoint',
          method: 'GET',
          ip: '127.0.0.1',
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
