import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, originalUrl, ip, body, headers } = request;

    // Generate a unique request ID if not already present
    const requestId = headers['x-request-id'] || uuidv4();

    // Add request ID to response headers
    response.setHeader('x-request-id', requestId);

    // Add request ID to request object for use in controllers
    (request as any)['requestId'] = requestId;

    // Log the request
    this.logger.log({
      message: `Incoming request: ${method} ${originalUrl}`,
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent: headers['user-agent'],
      // Don't log sensitive data like passwords or tokens
      body: this.sanitizeBody(body),
    });

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;

          // Log the response
          this.logger.log({
            message: `Response sent: ${method} ${originalUrl} ${response.statusCode} ${responseTime}ms`,
            requestId,
            method,
            url: originalUrl,
            statusCode: response.statusCode,
            responseTime,
            // Don't log sensitive response data
            responseSize: JSON.stringify(data)?.length || 0,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          // Log the error response
          this.logger.error({
            message: `Error response: ${method} ${originalUrl} ${error.status || 500} ${responseTime}ms`,
            requestId,
            method,
            url: originalUrl,
            statusCode: error.status || 500,
            responseTime,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          });
        },
      }),
    );
  }

  /**
   * Sanitize request body to remove sensitive data
   * @param body Request body
   * @returns Sanitized body
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = [
      'password',
      'newPassword',
      'currentPassword',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'apiKey',
      'cardNumber',
      'cvv',
      'pin',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
