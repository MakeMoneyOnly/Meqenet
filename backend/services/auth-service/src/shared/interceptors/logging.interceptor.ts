import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { SecurityMonitoringService } from '../services/security-monitoring.service';
import { sanitizeObject } from '../utils/logging-sanitizer.util';

// Constants for magic numbers
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_SERVER_ERROR_MIN = 500;
const ANOMALY_RISK_THRESHOLD = 75;
const MIN_USER_AGENT_LENGTH = 10;

/**
 * Logging Interceptor
 *
 * Logs incoming requests and outgoing responses
 * for auditing and debugging purposes, including correlation IDs
 * and sanitized bodies.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: PinoLogger,
    private readonly securityMonitoringService: SecurityMonitoringService,
    private readonly anomalyDetectionService: AnomalyDetectionService
  ) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check for existing request ID from headers, generate if not present
    let correlationId =
      request.headers['x-request-id'] ?? request.headers['X-Request-ID'];
    if (!correlationId) {
      correlationId = uuidv4();
      request.headers['x-request-id'] = correlationId;
    }

    // Attach correlation ID to request for use throughout the app
    request.correlationId = correlationId;

    const { method, url, body, headers } = request;
    const user = headers['user-agent'] ?? 'Unknown';

    this.logger.info(
      `[${correlationId}] ==> ${method} ${url} | User: ${user} | Body: ${JSON.stringify(sanitizeObject(body))}`
    );

    // Set correlation ID in response headers
    response.setHeader('X-Request-ID', correlationId);

    const now = Date.now();
    return next.handle().pipe(
      tap(async data => {
        const duration = Date.now() - now;

        this.logger.info(
          `[${correlationId}] <== ${method} ${url} | Status: ${response.statusCode} | Duration: ${duration}ms | Response: ${JSON.stringify(sanitizeObject(data))}`
        );

        // Record security monitoring for suspicious activities
        if (response.statusCode >= HTTP_CLIENT_ERROR_MIN) {
          await this.securityMonitoringService.recordSecurityEvent({
            type: 'authorization',
            severity:
              response.statusCode >= HTTP_SERVER_ERROR_MIN ? 'high' : 'medium',
            userId: request.user?.id,
            ipAddress: request.ip ?? request.connection?.remoteAddress,
            userAgent: request.get?.('User-Agent') ?? 'Unknown',
            correlationId,
            description: `HTTP ${response.statusCode} response for ${method} ${url}`,
            metadata: {
              statusCode: response.statusCode,
              method,
              url,
              duration,
              userAgent: request.get?.('User-Agent') ?? 'Unknown',
            },
          });
        }

        // Monitor for potential attacks (suspicious patterns)
        const userAgent = request.get?.('User-Agent') ?? 'Unknown';
        if (this.isSuspiciousUserAgent(userAgent)) {
          await this.securityMonitoringService.recordSecurityEvent({
            type: 'threat_detection',
            severity: 'medium',
            ipAddress: request.ip ?? request.connection?.remoteAddress,
            userAgent,
            correlationId,
            description: 'Suspicious user agent detected',
            metadata: { userAgent },
          });
        }

        // Perform anomaly detection for authenticated users
        if (request.user?.id) {
          try {
            const anomalyResult =
              await this.anomalyDetectionService.analyzeBehavior(
                request.user.id,
                {
                  endpoint: request.route?.path ?? request.url,
                  method: request.method ?? 'GET',
                  ipAddress:
                    request.ip ?? request.connection?.remoteAddress ?? '',
                  userAgent,
                  timestamp: new Date(),
                  sessionStart: request.session?.startTime,
                }
              );

            // Log high-risk anomalies
            if (anomalyResult.riskScore > ANOMALY_RISK_THRESHOLD) {
              this.logger.warn(
                `🚨 High-risk behavior detected for user ${request.user.id}: Risk Score ${anomalyResult.riskScore}`,
                {
                  correlationId,
                  anomalies: anomalyResult.anomalies.length,
                  riskScore: anomalyResult.riskScore,
                }
              );
            }

            // Store anomaly result in request for use in other interceptors
            request.anomalyAnalysis = anomalyResult;
          } catch (error) {
            this.logger.error('❌ Anomaly detection failed:', error);
          }
        }
      })
    );
  }

  /**
   * Check if user agent appears suspicious (potential security threat)
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    if (!userAgent) return false;

    const suspiciousPatterns = [
      /sqlmap/i, // SQL injection tools
      /nmap/i, // Network scanning tools
      /nikto/i, // Web server scanner
      /dirbuster/i, // Directory busting tools
      /burpsuite/i, // Web vulnerability scanner
      /owasp/i, // OWASP testing tools
      /acunetix/i, // Web vulnerability scanner
      /qualysguard/i, // Vulnerability scanner
      /rapid7/i, // Vulnerability assessment
      /nessus/i, // Vulnerability scanner
      /metasploit/i, // Penetration testing framework
      /wpscan/i, // WordPress vulnerability scanner
      /joomlavs/i, // Joomla vulnerability scanner
      /drupal/i, // Could be legitimate or scanning
      /python-requests/i, // Automated tools
      /gobuster/i, // Directory busting tool
      /dirb/i, // Web content scanner
      /gospider/i, // Web spider
      /nuclei/i, // Vulnerability scanner
      /xsser/i, // XSS testing tool
    ];

    // Check for empty or very short user agents (often bots)
    if (userAgent.length < MIN_USER_AGENT_LENGTH) return true;

    // Check for suspicious patterns
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
}
