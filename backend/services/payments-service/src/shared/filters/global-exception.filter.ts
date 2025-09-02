import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

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

    // Generate unique request ID for NBE compliance
    const requestId = uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let errorCategory = 'TECHNICAL_ERROR';

    // Sanitize request headers before processing
    const sanitizedHeaders = this.sanitizeHeaders(request.headers);

    // Modify the original request headers for logging purposes
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'] as const;
    sensitiveHeaders.forEach(headerKey => {
      const headerValue =
        request.headers[headerKey as keyof typeof request.headers];
      const sanitizedValue =
        sanitizedHeaders[headerKey as keyof typeof sanitizedHeaders];
      if (sanitizedValue !== headerValue) {
        // eslint-disable-next-line security/detect-object-injection
        (request.headers as Record<string, string>)[headerKey] = sanitizedValue;
      }
    });

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
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = responseObj.message || message;
        errorCode = responseObj.error || this.getErrorCodeFromStatus(status);

        // Handle custom error codes
        if (status === HttpStatus.TOO_MANY_REQUESTS) {
          errorCode = 'RATE_LIMIT_EXCEEDED';
          errorCategory = 'RATE_LIMIT_ERROR';
        }
      }
    } else if (this.isCustomException(exception)) {
      // Handle custom exceptions with status property
      const customException = exception as {
        status?: number;
        message?: string;
      };
      status = customException.status || HttpStatus.INTERNAL_SERVER_ERROR;
      message = customException.message || message;
      errorCode =
        customException.response?.error || this.getErrorCodeFromStatus(status);
      errorCategory = this.getErrorCategoryFromStatus(status);

      // Handle custom error codes
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        errorCode = 'RATE_LIMIT_EXCEEDED';
        errorCategory = 'RATE_LIMIT_ERROR';
      }
    } else if (exception instanceof Error) {
      // Handle generic errors
      errorCode = 'GENERIC_ERROR';
      errorCategory = 'SYSTEM_ERROR';
      message = 'An unexpected error occurred';

      // Log the actual error for debugging (never expose to client)
      this.logger.error('Unhandled exception', {
        error: exception.message,
        stack: exception.stack,
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: sanitizedHeaders['user-agent'],
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - Date.parse(new Date().toISOString()), // Simplified performance metric
      });
    }

    // Sanitize error message for production
    const sanitizedMessage = this.sanitizeErrorMessage(message);

    // Log security-relevant errors
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn('Security-related error', {
        status,
        error: sanitizedMessage,
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: sanitizedHeaders['user-agent'],
        requestId,
      });
    }

    // Log financial transaction errors for audit (NBE compliance)
    if (this.isFinancialTransactionError(request.url, exception)) {
      this.logger.error('Financial transaction error', {
        error: sanitizedMessage,
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: sanitizedHeaders['user-agent'],
        requestId,
        timestamp: new Date().toISOString(),
        isFinancialTransaction: true,
      });
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId, // NBE compliance
      error: {
        code: errorCode,
        message: sanitizedMessage,
        category: errorCategory, // NBE compliance
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

    // eslint-disable-next-line security/detect-object-injection
    return statusMap[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Check if the exception is a custom exception with status property
   * @param exception The exception to check
   * @returns True if it's a custom exception
   */
  private isCustomException(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      typeof (exception as { status?: unknown }).status === 'number'
    );
  }

  /**
   * Get error category from HTTP status code
   * @param status HTTP status code
   * @returns Error category string
   */
  private getErrorCategoryFromStatus(status: number): string {
    const CLIENT_ERROR_MIN = 400;
    const CLIENT_ERROR_MAX = 500;
    const SERVER_ERROR_MIN = 500;

    if (status >= CLIENT_ERROR_MIN && status < CLIENT_ERROR_MAX) {
      return 'CLIENT_ERROR';
    } else if (status >= SERVER_ERROR_MIN) {
      return 'SERVER_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Sanitize headers to prevent sensitive information leakage in logs
   * @param headers Request headers
   * @returns Sanitized headers object
   */
  private sanitizeHeaders(
    headers: Record<string, string | string[] | undefined>
  ): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveHeaderKeys = [
      'authorization',
      'x-api-key',
      'x-auth-token',
      'x-csrf-token',
      'x-xsrf-token',
      'cookie',
      'set-cookie',
    ];

    for (const key of sensitiveHeaderKeys) {
      const headerValue = sanitized[key as keyof typeof sanitized];
      if (headerValue && typeof headerValue === 'string') {
        // eslint-disable-next-line security/detect-object-injection
        (sanitized as Record<string, string>)[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Check if the error is related to financial transactions for audit logging
   * @param url Request URL
   * @param exception The exception that occurred
   * @returns True if this is a financial transaction error
   */
  private isFinancialTransactionError(
    url: string,
    exception: unknown
  ): boolean {
    const financialPaths = [
      '/api/payments',
      '/api/transactions',
      '/api/transfers',
      '/api/bank',
      '/api/financial',
    ];

    return (
      financialPaths.some(path => url.includes(path)) &&
      (exception instanceof HttpException || exception instanceof Error)
    );
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
