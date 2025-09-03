import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAuthErrorMessage } from '../i18n/error-messages';

/**
 * Global Exception Filter for Authentication Service
 * Handles all exceptions and provides bilingual error responses
 * Ensures NBE compliance with proper error tracking and audit logging
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate unique request ID for NBE compliance and tracking
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    // Accept-Language header available for future bilingual support

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message: string | { en: string; am: string } = 'Internal server error';

    // Handle validation errors from class-validator
    if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const validationErrors = (exceptionResponse as Record<string, unknown>)
          .message;

        // Handle validation error messages
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          const firstError = validationErrors[0];

          // Try to parse bilingual message from validator
          try {
            message = JSON.parse(firstError);
          } catch {
            // If not JSON, use the message as-is
            message = {
              en: firstError,
              am: 'የማረጋገጫ ስህተት ተፈጥሯል።',
            };
          }

          errorCode = 'VALIDATION_ERROR';
        } else {
          message = {
            en: 'Validation failed. Please check your input.',
            am: 'ማረጋገጥ አልተሳካም። እባክዎ ግብዓትዎን ይመልከቱ።',
          };
        }
      }
    }
    // Handle HTTP exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract error details from exception
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;

        // Check for custom error code
        if (
          responseObj.errorCode &&
          typeof responseObj.errorCode === 'string'
        ) {
          errorCode = responseObj.errorCode;
          // Get bilingual error message for the specific error code
          message = {
            en: getAuthErrorMessage(errorCode, 'en'),
            am: getAuthErrorMessage(errorCode, 'am'),
          };
        } else if (responseObj.message) {
          if (typeof responseObj.message === 'string') {
            message = {
              en: responseObj.message,
              am: 'ስህተት ተፈጥሯል።',
            };
          } else if (Array.isArray(responseObj.message)) {
            // Handle array messages (maintain original format for compatibility)
            message = responseObj.message;
          } else if (
            typeof responseObj.message === 'object' &&
            responseObj.message !== null
          ) {
            // Check if it has the expected bilingual structure
            const msgObj = responseObj.message as Record<string, unknown>;
            if (
              typeof msgObj.en === 'string' &&
              typeof msgObj.am === 'string'
            ) {
              message = msgObj as { en: string; am: string };
            } else {
              message = 'Invalid error message format';
            }
          } else {
            message = 'Unknown error occurred';
          }
          errorCode = this.getErrorCodeFromStatus(status);
        }
      } else if (typeof exceptionResponse === 'string') {
        message = {
          en: exceptionResponse,
          am: 'ስህተት ተፈጥሯል።',
        };
        errorCode = this.getErrorCodeFromStatus(status);
      }

      // Map specific status codes to error codes
      switch (status) {
        case HttpStatus.UNAUTHORIZED:
          if (errorCode === 'UNAUTHORIZED') {
            errorCode = 'INVALID_CREDENTIALS';
            message = {
              en: getAuthErrorMessage(errorCode, 'en'),
              am: getAuthErrorMessage(errorCode, 'am'),
            };
          }
          break;
        case HttpStatus.FORBIDDEN:
          errorCode = 'FORBIDDEN';
          message = {
            en: getAuthErrorMessage(errorCode, 'en'),
            am: getAuthErrorMessage(errorCode, 'am'),
          };
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          errorCode = 'TOO_MANY_REQUESTS';
          message = {
            en: getAuthErrorMessage(errorCode, 'en'),
            am: getAuthErrorMessage(errorCode, 'am'),
          };
          break;
      }
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      // Log the actual error for debugging (never expose to client)
      this.logger.error('Unhandled exception', {
        error: exception.message,
        stack: exception.stack,
        url: request.url,
        method: request.method,
        ip: request.ip,
        requestId,
        timestamp: new Date().toISOString(),
      });

      message = {
        en: 'An unexpected error occurred. Please try again later.',
        am: 'ያልተጠበቀ ስህተት ተፈጥሯል። እባክዎ ቆየት ብለው እንደገና ይሞክሩ።',
      };
    }

    // Log security-relevant errors for audit
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn('Security-related error', {
        status,
        errorCode,
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        requestId,
      });
    }

    // Log authentication failures for compliance
    if (errorCode === 'INVALID_CREDENTIALS' || errorCode === 'ACCOUNT_LOCKED') {
      this.logger.error('Authentication failure', {
        errorCode,
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    // Create standardized error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId, // NBE compliance requirement
      error: {
        code: errorCode,
        message: message, // Bilingual message object
        category: this.getErrorCategory(errorCode),
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
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusMap[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Get error category from error code
   * @param errorCode Error code
   * @returns Error category
   */
  private getErrorCategory(errorCode: string): string {
    // Map error codes to categories
    const categoryMap: Record<string, string> = {
      INVALID_CREDENTIALS: 'AUTH',
      USER_NOT_FOUND: 'AUTH',
      USER_ALREADY_EXISTS: 'AUTH',
      TOKEN_EXPIRED: 'AUTH',
      INVALID_TOKEN: 'AUTH',
      REFRESH_TOKEN_EXPIRED: 'AUTH',
      RESET_TOKEN_INVALID: 'AUTH',
      RESET_TOKEN_EXPIRED: 'AUTH',

      EMAIL_REQUIRED: 'VALIDATION',
      EMAIL_INVALID: 'VALIDATION',
      PASSWORD_REQUIRED: 'VALIDATION',
      PASSWORD_TOO_SHORT: 'VALIDATION',
      PASSWORD_TOO_WEAK: 'VALIDATION',
      PHONE_REQUIRED: 'VALIDATION',
      PHONE_INVALID: 'VALIDATION',
      FAYDA_ID_REQUIRED: 'VALIDATION',
      FAYDA_ID_INVALID: 'VALIDATION',
      VALIDATION_ERROR: 'VALIDATION',
      BAD_REQUEST: 'VALIDATION',

      UNAUTHORIZED: 'SECURITY',
      FORBIDDEN: 'SECURITY',
      INSUFFICIENT_PERMISSIONS: 'SECURITY',
      ACCOUNT_LOCKED: 'SECURITY',
      TOO_MANY_REQUESTS: 'SECURITY',

      INTERNAL_ERROR: 'SYSTEM',
      SERVICE_UNAVAILABLE: 'SYSTEM',
      BAD_GATEWAY: 'SYSTEM',
      UNKNOWN_ERROR: 'SYSTEM',
    };

    return categoryMap[errorCode] || 'SYSTEM';
  }
}
