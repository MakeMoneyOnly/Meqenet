import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logging Interceptor
 * Enterprise FinTech compliant request/response logging
 * Captures performance metrics and security events
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Log incoming request (exclude sensitive data)
    this.logRequest(request);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logResponse(request, response, duration, 'SUCCESS');
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logResponse(request, response, duration, 'ERROR', error);
        },
      })
    );
  }

  /**
   * Log incoming request details
   * @param request HTTP request object
   */
  private logRequest(request: any): void {
    const sanitizedHeaders = this.sanitizeHeaders(request.headers);
    const sanitizedBody = this.sanitizeBody(request.body);

    this.logger.log('Incoming request', {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      headers: sanitizedHeaders,
      body: sanitizedBody,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log response details
   * @param request HTTP request object
   * @param response HTTP response object
   * @param duration Request duration in milliseconds
   * @param status Success or error status
   * @param error Optional error object
   */
  private logResponse(
    request: any,
    response: any,
    duration: number,
    status: string,
    error?: any
  ): void {
    const logLevel = status === 'ERROR' ? 'error' : 'log';

    this.logger[logLevel]('Request completed', {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      status,
      error: error ? this.sanitizeError(error) : undefined,
      timestamp: new Date().toISOString(),
    });

    // Log performance warnings
    if (duration > 5000) {
      this.logger.warn('Slow request detected', {
        method: request.method,
        url: request.url,
        duration: `${duration}ms`,
        threshold: '5000ms',
      });
    }
  }

  /**
   * Sanitize request headers to remove sensitive information
   * @param headers Request headers object
   * @returns Sanitized headers object
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers || typeof headers !== 'object') {
      return headers;
    }

    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   * @param body Request body object
   * @returns Sanitized body object
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize error object for logging
   * @param error Error object
   * @returns Sanitized error information
   */
  private sanitizeError(error: any): any {
    return {
      message: error.message,
      name: error.name,
      status: error.status,
      // Don't include stack trace in production logs for security
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }
}
