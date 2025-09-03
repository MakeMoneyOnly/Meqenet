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

    // Determine language preference
    const acceptLanguage = (request.headers['accept-language'] as string) || 'en';
    const preferredLang = acceptLanguage.includes('am') ? 'am' : 'en';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message: { en: string; am: string } = {
      en: 'Internal server error',
      am: 'የውስጥ ስህተት ተፈጥሯል።',
    };
    let details: unknown = undefined;

    // Handle validation errors from class-validator
    if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        details = resp.message; // array of bilingual messages or structured map if provided

        if (Array.isArray(resp.message) && resp.message.length > 0) {
          const first = resp.message[0] as { en?: string; am?: string } | string;
          if (typeof first === 'string') {
            try {
              const parsed = JSON.parse(first) as { en?: string; am?: string };
              message = {
                en: parsed.en || 'Validation failed',
                am: parsed.am || 'ማረጋገጥ አልተሳካም።',
              };
            } catch {
              message = {
                en: first,
                am: 'የማረጋገጫ ስህተት ተፈጥሯል።',
              } as unknown as { en: string; am: string };
            }
          } else if (typeof first === 'object' && first) {
            const obj = first as { en?: string; am?: string };
            message = {
              en: obj.en || 'Validation failed',
              am: obj.am || 'ማረጋገጥ አልተሳካም።',
            };
          }
          errorCode = 'VALIDATION_ERROR';
        } else {
          message = {
            en: 'Validation failed. Please check your input.',
            am: 'ማረጋገጥ አልተሳካም። እባክዎ ግብዓትዎን ይመልከቱ።',
          };
          errorCode = 'VALIDATION_ERROR';
        }
      }
    }
    // Handle HTTP exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;

        if (
          responseObj.errorCode &&
          typeof responseObj.errorCode === 'string'
        ) {
          errorCode = responseObj.errorCode;
          message = {
            en: getAuthErrorMessage(errorCode, 'en'),
            am: getAuthErrorMessage(errorCode, 'am'),
          };
        } else if (responseObj.message) {
          if (typeof responseObj.message === 'string') {
            const en = responseObj.message;
            message = {
              en,
              am: preferredLang === 'am'
                ? getAuthErrorMessage(this.getErrorCodeFromStatus(status), 'am')
                : 'ስህተት ተፈጥሯል።',
            };
          } else if (
            typeof responseObj.message === 'object' &&
            responseObj.message !== null
          ) {
            const msgObj = responseObj.message as Record<string, unknown>;
            const en = typeof msgObj.en === 'string' ? (msgObj.en as string) : 'An error occurred';
            const am = typeof msgObj.am === 'string' ? (msgObj.am as string) : getAuthErrorMessage(this.getErrorCodeFromStatus(status), 'am');
            message = { en, am };
          } else {
            message = {
              en: 'Unknown error occurred',
              am: 'ያልታወቀ ስህተት ተፈጥሯል።',
            };
          }
          errorCode = this.getErrorCodeFromStatus(status);
        }

        // Map specific status codes to error codes/messages
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
      } else if (typeof exceptionResponse === 'string') {
        message = {
          en: exceptionResponse,
          am: getAuthErrorMessage(this.getErrorCodeFromStatus(status), 'am'),
        };
        errorCode = this.getErrorCodeFromStatus(status);
      }
    }
    // Handle generic errors
    else if (exception instanceof Error) {
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

    // Audit logs
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

    // Set response correlation header and standardized error
    response.setHeader('X-Request-ID', requestId);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId, // NBE compliance requirement
      language: preferredLang,
      error: {
        code: errorCode,
        message, // Always bilingual
        category: this.getErrorCategory(errorCode),
        details,
      },
    };

    response.status(status).json(errorResponse);
  }

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

  private getErrorCategory(errorCode: string): string {
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
