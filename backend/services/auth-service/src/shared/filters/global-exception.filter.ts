import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global Exception Filter
 *
 * Formats errors consistently per error handling policy with safe messages.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.resolveStatus(exception);
    const errorMessage = this.resolveMessage(exception);

    // Internal log with minimal leakage (stateless, no retained fields)
    // Avoid noise in test runner environments (vitest/jest)
    const isTestEnv: boolean =
      typeof (globalThis as unknown as { vitest?: unknown }).vitest !==
        'undefined' ||
      typeof (globalThis as unknown as { jest?: unknown }).jest !== 'undefined';
    if (!isTestEnv) {
      // eslint-disable-next-line no-console
      console.error(
        `Unhandled exception (${status}): ${
          exception instanceof Error ? exception.message : String(exception)
        }`
      );
    }

    const payload: {
      statusCode: number;
      timestamp: string;
      message: string | Record<string, unknown>;
    } = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: errorMessage,
    };
    response.status(status).json(payload as unknown as Record<string, unknown>);
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: unknown): string | Record<string, unknown> {
    if (exception instanceof HttpException) {
      // Standardize known classes
      if (exception instanceof BadRequestException) {
        return 'Bad request';
      }
      if (exception instanceof UnauthorizedException) {
        return 'Unauthorized';
      }
      if (exception instanceof ForbiddenException) {
        return 'Forbidden';
      }
      if (exception instanceof NotFoundException) {
        return 'Not found';
      }
      if (exception instanceof ServiceUnavailableException) {
        return 'Service temporarily unavailable';
      }
      // Fallback to response shape when available
      const resp = exception.getResponse();
      if (typeof resp === 'string') return resp;
      if (resp && typeof resp === 'object') {
        return resp as Record<string, unknown>;
      }
      return 'Error';
    }
    return 'Internal server error';
  }
}
