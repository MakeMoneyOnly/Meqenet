import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { sanitizeObject } from '../utils/logging-sanitizer.util';

/**
 * Logging Interceptor for Meqenet FinTech Services
 *
 * This interceptor provides comprehensive request/response logging
 * with financial data sanitization for security compliance.
 *
 * Features:
 * - Request correlation IDs for tracing
 * - Automatic PII/financial data sanitization
 * - Performance timing for NBE audit requirements
 * - Structured logging for security monitoring
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const correlationId = uuidv4();
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;

    // Start timing for performance monitoring
    const startTime = Date.now();

    // Log sanitized request (critical for NBE audit trails)
    this.logger.log(
      `📥 [${correlationId}] ${method} ${url} - Request started`,
      {
        correlationId,
        method,
        url,
        body: sanitizeObject(body),
        userAgent: headers['user-agent'],
        ip: request.ip,
        timestamp: new Date().toISOString(),
      }
    );

    return next.handle().pipe(
      tap({
        next: response => {
          const responseTime = Date.now() - startTime;

          // Log sanitized response (essential for financial transaction auditing)
          this.logger.log(
            `📤 [${correlationId}] ${method} ${url} - Response sent (${responseTime}ms)`,
            {
              correlationId,
              method,
              url,
              responseTime,
              statusCode: context.switchToHttp().getResponse().statusCode,
              response: sanitizeObject(response),
              timestamp: new Date().toISOString(),
            }
          );
        },
        error: error => {
          const responseTime = Date.now() - startTime;

          // Log errors with security context (critical for fraud detection)
          this.logger.error(
            `❌ [${correlationId}] ${method} ${url} - Error occurred (${responseTime}ms)`,
            {
              correlationId,
              method,
              url,
              responseTime,
              error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
              },
              timestamp: new Date().toISOString(),
            }
          );
        },
      })
    );
  }
}
