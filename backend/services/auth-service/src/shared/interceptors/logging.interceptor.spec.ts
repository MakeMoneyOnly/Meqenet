import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { PinoLogger } from 'nestjs-pino';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { SecurityMonitoringService } from '../services/security-monitoring.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: import('vitest').MockedObject<PinoLogger>;
  let anomalyDetectionService: import('vitest').MockedObject<AnomalyDetectionService>;
  let securityMonitoringService: import('vitest').MockedObject<SecurityMonitoringService>;
  let mockContext: ExecutionContext;
  let mockNext: CallHandler;

  const mockRequest = {
    headers: {
      'x-request-id': 'test-request-id',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    method: 'POST',
    url: '/api/users',
    body: { email: 'test@example.com', password: 'secret123' },
    ip: '127.0.0.1',
    user: { id: 'user-123' },
    correlationId: undefined,
    route: { path: '/api/users' },
  };

  const mockResponse = {
    statusCode: 200,
    setHeader: vi.fn(),
  };

  beforeEach(async () => {
    const mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      setContext: vi.fn(),
    };

    // Set up setContext to return the logger itself
    mockLogger.setContext.mockReturnValue(mockLogger);

    const mockAnomalyService = {
      analyzeBehavior: vi.fn().mockResolvedValue({ risk: 'low', score: 0.1 }),
    };

    const mockSecurityService = {
      recordSecurityEvent: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Date.now for consistent testing
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01 00:00:00 UTC

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: AnomalyDetectionService,
          useValue: mockAnomalyService,
        },
        {
          provide: SecurityMonitoringService,
          useValue: mockSecurityService,
        },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    logger = mockLogger as any;
    anomalyDetectionService = mockAnomalyService as any;
    securityMonitoringService = mockSecurityService as any;

    // Manually assign the mocks to the interceptor instance
    (interceptor as any).logger = mockLogger;
    (interceptor as any).anomalyDetectionService = mockAnomalyService;
    (interceptor as any).securityMonitoringService = mockSecurityService;

    mockContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
        getResponse: vi.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    mockNext = {
      handle: vi.fn().mockReturnValue(of({ success: true })),
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should add correlation ID to request if not present', async () => {
      const requestWithoutId = {
        ...mockRequest,
        headers: { 'user-agent': 'test-agent' },
      };

      mockContext.switchToHttp().getRequest.mockReturnValue(requestWithoutId);

      const observable = await interceptor.intercept(mockContext, mockNext);
      await new Promise<void>(resolve => {
        observable.subscribe(() => {
          expect(requestWithoutId.correlationId).toBeDefined();
          expect(typeof requestWithoutId.correlationId).toBe('string');
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            requestWithoutId.correlationId
          );
          resolve();
        });
      });
    });

    it('should use existing correlation ID from headers', async () => {
      const observable = await interceptor.intercept(mockContext, mockNext);
      await new Promise<void>(resolve => {
        observable.subscribe(() => {
          expect(mockRequest.correlationId).toBe('test-request-id');
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            'test-request-id'
          );
          resolve();
        });
      });
    });

    it('should log incoming request with sanitized body', async () => {
      const observable = await interceptor.intercept(mockContext, mockNext);
      await new Promise<void>(resolve => {
        observable.subscribe(() => {
          expect(logger.info).toHaveBeenCalledWith(
            '[test-request-id] ==> POST /api/users | User: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 | Body: {"email":"test@example.com","password":"[REDACTED]"}'
          );
          resolve();
        });
      });
    });

    it('should log outgoing response with duration', async () => {
      const observable = await interceptor.intercept(mockContext, mockNext);
      await new Promise<void>(resolve => {
        observable.subscribe(() => {
          expect(logger.info).toHaveBeenCalledWith(
            expect.stringMatching(
              /\[test-request-id\] <== POST \/api\/users \| Status: 200 \| Duration: \d+ms \| Response: \{"success":true\}/
            )
          );
          resolve();
        });
      });
    });

    it('should record security events for client errors', async () => {
      mockResponse.statusCode = 400;
      mockRequest.user = { id: 'user-123' };

      const observable = await interceptor.intercept(mockContext, mockNext);
      await new Promise<void>(resolve => {
        observable.subscribe(() => {
          expect(
            securityMonitoringService.recordSecurityEvent
          ).toHaveBeenCalledWith({
            type: 'authorization',
            severity: 'medium',
            userId: 'user-123',
            ipAddress: '127.0.0.1',
            userAgent: 'Unknown',
            correlationId: 'test-request-id',
            description: 'HTTP 400 response for POST /api/users',
            metadata: {
              statusCode: 400,
              method: 'POST',
              url: '/api/users',
              duration: 0,
              userAgent: 'Unknown',
            },
          });
          resolve();
        });
      });
    });

    it('should record security events for server errors as high severity', async () => {
      mockResponse.statusCode = 500;
      mockRequest.user = { id: 'user-123' };

      const observable = await interceptor.intercept(mockContext, mockNext);
      await new Promise<void>(resolve => {
        observable.subscribe(() => {
          expect(
            securityMonitoringService.recordSecurityEvent
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              severity: 'high',
              type: 'authorization',
              userAgent: 'Unknown',
              metadata: expect.objectContaining({
                duration: 0,
                userAgent: 'Unknown',
              }),
            })
          );
          resolve();
        });
      });
    });

    it('should perform anomaly detection for authenticated users', async () => {
      const mockAnomalyResult = {
        riskScore: 50,
        anomalies: ['unusual_login_time'],
      };

      anomalyDetectionService.analyzeBehavior.mockResolvedValue(
        mockAnomalyResult
      );

      // Ensure mockRequest has user
      mockRequest.user = { id: 'user-123' };

      // Trigger the interceptor and wait for completion
      const observable = interceptor.intercept(mockContext, mockNext);

      // Wait for the tap to complete
      await new Promise<void>(resolve => {
        observable.subscribe({
          next: () => {
            // Wait a bit for the async tap to complete
            setTimeout(resolve, 10);
          },
          error: () => {
            setTimeout(resolve, 10);
          },
          complete: () => {
            setTimeout(resolve, 10);
          },
        });
      });

      expect(anomalyDetectionService.analyzeBehavior).toHaveBeenCalledWith(
        'user-123',
        {
          endpoint: '/api/users',
          method: 'POST',
          ipAddress: '127.0.0.1',
          userAgent: 'Unknown',
          timestamp: expect.any(Date),
          sessionStart: undefined,
        }
      );

      expect(mockRequest.anomalyAnalysis).toEqual(mockAnomalyResult);
    });

    it('should log high-risk anomalies', async () => {
      const mockAnomalyResult = {
        riskScore: 80,
        anomalies: ['suspicious_location', 'unusual_device'],
      };

      anomalyDetectionService.analyzeBehavior.mockResolvedValue(
        mockAnomalyResult
      );

      // Ensure mockRequest has user
      mockRequest.user = { id: 'user-123' };

      // Trigger the interceptor and wait for completion
      const observable = interceptor.intercept(mockContext, mockNext);

      // Wait for the tap to complete
      await new Promise<void>(resolve => {
        observable.subscribe({
          next: () => {
            // Wait a bit for the async tap to complete
            setTimeout(resolve, 10);
          },
          error: () => {
            setTimeout(resolve, 10);
          },
          complete: () => {
            setTimeout(resolve, 10);
          },
        });
      });

      expect(logger.warn).toHaveBeenCalledWith(
        '🚨 High-risk behavior detected for user user-123: Risk Score 80',
        {
          correlationId: 'test-request-id',
          anomalies: mockAnomalyResult.anomalies.length,
          riskScore: 80,
        }
      );
    });

    it('should handle anomaly detection errors gracefully', async () => {
      const error = new Error('Anomaly detection failed');
      anomalyDetectionService.analyzeBehavior.mockRejectedValue(error);

      // Ensure mockRequest has user
      mockRequest.user = { id: 'user-123' };

      // Trigger the interceptor and wait for completion
      const observable = interceptor.intercept(mockContext, mockNext);

      // Wait for the tap to complete
      await new Promise<void>(resolve => {
        observable.subscribe({
          next: () => {
            // Wait a bit for the async tap to complete
            setTimeout(resolve, 10);
          },
          error: () => {
            setTimeout(resolve, 10);
          },
          complete: () => {
            setTimeout(resolve, 10);
          },
        });
      });

      expect(logger.error).toHaveBeenCalledWith(
        '❌ Anomaly detection failed:',
        error
      );
    });
  });

  describe('isSuspiciousUserAgent', () => {
    it('should detect suspicious user agents', () => {
      const suspiciousAgents = [
        'sqlmap/1.0',
        'nmap/1.0',
        'nikto/1.0',
        'dirbuster/1.0',
        'burpsuite/1.0',
        'owasp/1.0',
        'acunetix/1.0',
        'qualysguard/1.0',
        'rapid7/1.0',
        'nessus/1.0',
        'metasploit/1.0',
        'wpscan/1.0',
        'joomlavs/1.0',
        'python-requests/2.0',
        'gobuster/1.0',
        'dirb/1.0',
        'gospider/1.0',
        'nuclei/1.0',
        'xsser/1.0',
      ];

      suspiciousAgents.forEach(agent => {
        expect((interceptor as any).isSuspiciousUserAgent(agent)).toBe(true);
      });
    });

    it('should return false for normal user agents', () => {
      const normalAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'PostmanRuntime/7.26.8',
        'curl/7.68.0',
      ];

      normalAgents.forEach(agent => {
        expect((interceptor as any).isSuspiciousUserAgent(agent)).toBe(false);
      });
    });

    it('should return true for very short user agents', () => {
      expect((interceptor as any).isSuspiciousUserAgent('a')).toBe(true);
      expect((interceptor as any).isSuspiciousUserAgent('')).toBe(true);
    });

    it('should handle undefined user agent', () => {
      expect((interceptor as any).isSuspiciousUserAgent(undefined)).toBe(false);
    });
  });

  describe('security monitoring', () => {
    it('should record security events for suspicious user agents', async () => {
      mockRequest.headers['user-agent'] = 'sqlmap/1.0';

      // Trigger the interceptor
      await interceptor.intercept(mockContext, mockNext).toPromise();

      expect(
        securityMonitoringService.recordSecurityEvent
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'authorization',
          severity: 'high',
          ipAddress: '127.0.0.1',
          userAgent: 'Unknown',
          correlationId: 'test-request-id',
          description: 'HTTP 500 response for POST /api/users',
          metadata: expect.objectContaining({
            statusCode: 500,
            method: 'POST',
            url: '/api/users',
            duration: 0,
            userAgent: 'Unknown',
          }),
        })
      );
    });
  });
});
