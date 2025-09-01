import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global Exception Filter
 * Enterprise FinTech compliant error handling
 * Ensures sensitive information is never leaked in error responses
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    // Handle known HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        errorCode = responseObj.error || this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      // Handle generic errors
      errorCode = 'GENERIC_ERROR';
      message = 'An unexpected error occurred';

      // Log the actual error for debugging (never expose to client)
      this.logger.error('Unhandled exception', {
        error: exception.message,
        stack: exception.stack,
        url: (request as any).url,
        method: (request as any).method,
        ip: (request as any).ip,
        userAgent: (request as any).get?.('User-Agent'),
      });
    }

    // Sanitize error message for production
    const sanitizedMessage = this.sanitizeErrorMessage(message);

    // Log security-relevant errors
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn('Security-related error', {
        status,
        url: (request as any).url,
        ip: (request as any).ip,
        userAgent: (request as any).get?.('User-Agent'),
      });
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: (request as any).url,
      method: (request as any).method,
      error: {
        code: errorCode,
        message: sanitizedMessage,
      },
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Get error code from HTTP status
   * @param status HTTP status code
   * @returns Error code string
   */
  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusMap[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Sanitize error messages to prevent information leakage
   * @param message Original error message
   * @returns Sanitized error message
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /credit.card/i,
      /cvv/i,
      /ssn/i,
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, // SSN pattern
    ];

    let sanitized = message;

    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }
}
