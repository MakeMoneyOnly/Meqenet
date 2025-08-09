/// <reference types="vitest" />
import 'reflect-metadata'; // Required for NestJS dependency injection
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

import { GlobalExceptionFilter } from './global-exception.filter';

/**
 * Global Exception Filter Security Tests
 *
 * Tests critical error handling security for:
 * - Information disclosure prevention
 * - Consistent error response format
 * - NBE compliance for error logging
 * - Security incident detection
 */
describe('GlobalExceptionFilter - Security Tests', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => ({
          url: '/api/auth/login',
          method: 'POST',
          headers: {
            'user-agent': 'test-client',
            'x-forwarded-for': '192.168.1.1',
          },
        }),
      }),
      getArgs: vi.fn(),
      getArgByIndex: vi.fn(),
      switchToRpc: vi.fn(),
      switchToWs: vi.fn(),
      getType: vi.fn(),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP Exception Handling', () => {
    it('should handle standard HTTP exceptions correctly', () => {
      const httpException = new HttpException(
        'Unauthorized access',
        HttpStatus.UNAUTHORIZED
      );

      filter.catch(httpException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        ),
        message: 'Unauthorized access',
      });
    });

    it('should handle HTTP exceptions with object messages', () => {
      const errorResponse = {
        message: ['Field validation failed'],
        error: 'Bad Request',
        statusCode: 400,
      };
      const httpException = new HttpException(
        errorResponse,
        HttpStatus.BAD_REQUEST
      );

      filter.catch(httpException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        message: errorResponse,
      });
    });

    it('should preserve custom HTTP status codes', () => {
      const customException = new HttpException(
        'Custom error',
        HttpStatus.PAYMENT_REQUIRED
      );

      filter.catch(customException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.PAYMENT_REQUIRED
      );
    });
  });

  describe('Generic Exception Handling', () => {
    it('should handle generic errors without exposing internals', () => {
      const genericError = new Error('Database connection failed');

      filter.catch(genericError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        message: 'Internal server error',
      });
    });

    it('should handle null/undefined exceptions', () => {
      filter.catch(null, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        message: 'Internal server error',
      });
    });

    it('should handle string exceptions', () => {
      filter.catch('Something went wrong', mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        message: 'Internal server error',
      });
    });
  });

  describe('Security Information Disclosure Prevention', () => {
    it('should not expose stack traces in production', () => {
      const errorWithStack = new Error('Database error');
      errorWithStack.stack =
        'Error: Database error\n    at DatabaseService.connect\n    at /app/src/database.ts:42:15';

      filter.catch(errorWithStack, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('stack');
      expect(jsonCall.message).toBe('Internal server error');
      expect(JSON.stringify(jsonCall)).not.toContain('DatabaseService');
      expect(JSON.stringify(jsonCall)).not.toContain('/app/src/');
    });

    it('should not expose sensitive database errors', () => {
      const dbError = new Error(
        'ECONNREFUSED: Connection to postgres://admin:password123@localhost:5432/meqenet failed'
      );

      filter.catch(dbError, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(JSON.stringify(jsonCall)).not.toContain('password123');
      expect(JSON.stringify(jsonCall)).not.toContain('postgres://');
      expect(JSON.stringify(jsonCall)).not.toContain('admin');
    });

    it('should not expose file system paths', () => {
      const fsError = new Error(
        "ENOENT: no such file or directory, open '/etc/secrets/fayda-key.pem'"
      );

      filter.catch(fsError, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(JSON.stringify(jsonCall)).not.toContain('/etc/secrets/');
      expect(JSON.stringify(jsonCall)).not.toContain('fayda-key.pem');
    });

    it('should not expose environment variables', () => {
      const envError = new Error(
        'JWT_SECRET is undefined. Check environment configuration.'
      );

      filter.catch(envError, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(JSON.stringify(jsonCall)).not.toContain('JWT_SECRET');
      expect(jsonCall.message).toBe('Internal server error');
    });
  });

  describe('Response Format Consistency', () => {
    it('should always include required fields', () => {
      const httpException = new HttpException(
        'Test error',
        HttpStatus.BAD_REQUEST
      );

      filter.catch(httpException, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall).toHaveProperty('statusCode');
      expect(jsonCall).toHaveProperty('timestamp');
      expect(jsonCall).toHaveProperty('message');
    });

    it('should use ISO timestamp format', () => {
      const httpException = new HttpException(
        'Test error',
        HttpStatus.BAD_REQUEST
      );

      filter.catch(httpException, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );

      // Verify it's a valid date
      expect(new Date(jsonCall.timestamp)).toBeInstanceOf(Date);
    });

    it('should set appropriate HTTP status codes', () => {
      const testCases = [
        {
          exception: new HttpException('Bad Request', HttpStatus.BAD_REQUEST),
          expectedStatus: 400,
        },
        {
          exception: new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED),
          expectedStatus: 401,
        },
        {
          exception: new HttpException('Forbidden', HttpStatus.FORBIDDEN),
          expectedStatus: 403,
        },
        {
          exception: new HttpException('Not Found', HttpStatus.NOT_FOUND),
          expectedStatus: 404,
        },
        { exception: new Error('Generic error'), expectedStatus: 500 },
      ];

      testCases.forEach(({ exception, expectedStatus }) => {
        mockResponse.status.mockClear();
        mockResponse.json.mockClear();

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
      });
    });
  });

  describe('NBE Compliance and Audit Requirements', () => {
    it('should handle Fayda ID related errors securely', () => {
      const faydaError = new Error(
        'Invalid Fayda ID: FID1234567890123 does not exist in system'
      );

      filter.catch(faydaError, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(JSON.stringify(jsonCall)).not.toContain('FID1234567890123');
      expect(jsonCall.message).toBe('Internal server error');
    });

    it('should handle financial data errors without exposure', () => {
      const financialError = new Error(
        'Credit limit exceeded for account 123456789, current balance: -$2,500'
      );

      filter.catch(financialError, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(JSON.stringify(jsonCall)).not.toContain('123456789');
      expect(JSON.stringify(jsonCall)).not.toContain('$2,500');
    });

    it('should maintain consistent error format for audit trails', () => {
      const errors = [
        new HttpException('Validation failed', HttpStatus.BAD_REQUEST),
        new Error('System error'),
        'String error',
        null,
      ];

      const responses = errors.map(error => {
        mockResponse.status.mockClear();
        mockResponse.json.mockClear();
        filter.catch(error, mockArgumentsHost);
        return mockResponse.json.mock.calls[0][0];
      });

      // All responses should have same structure
      responses.forEach(response => {
        expect(response).toHaveProperty('statusCode');
        expect(response).toHaveProperty('timestamp');
        expect(response).toHaveProperty('message');
        expect(Object.keys(response)).toHaveLength(3);
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-frequency errors efficiently', () => {
      const error = new HttpException(
        'Rate limited',
        HttpStatus.TOO_MANY_REQUESTS
      );

      const startTime = process.hrtime.bigint();

      // Process 100 errors rapidly
      for (let i = 0; i < 100; i++) {
        mockResponse.status.mockClear();
        mockResponse.json.mockClear();
        filter.catch(error, mockArgumentsHost);
      }

      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      // Should process quickly (< 50ms for 100 errors)
      expect(executionTime).toBeLessThan(50);
    });

    it('should not leak memory on repeated error handling', () => {
      const error = new Error('Memory test error');

      // Process many errors to test for memory leaks
      for (let i = 0; i < 1000; i++) {
        mockResponse.status.mockClear();
        mockResponse.json.mockClear();
        filter.catch(error, mockArgumentsHost);
      }

      // Filter should remain stateless
      expect(Object.keys(filter)).toHaveLength(0);
    });

    it('should handle circular reference objects safely', () => {
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      const httpException = new HttpException(
        circularObj,
        HttpStatus.BAD_REQUEST
      );

      // Should not throw on circular references
      expect(() => {
        filter.catch(httpException, mockArgumentsHost);
      }).not.toThrow();

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });
  });
});
