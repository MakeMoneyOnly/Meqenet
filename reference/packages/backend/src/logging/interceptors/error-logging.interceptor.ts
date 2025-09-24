import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Exception');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const { method, originalUrl, ip, headers } = request;

        // Get request ID if available
        const requestId = (request as any)['requestId'] || headers['x-request-id'] || 'unknown';

        // Determine if this is a known HTTP exception
        const isHttpException = error instanceof HttpException;
        const status = isHttpException ? error.getStatus() : 500;
        const errorResponse = isHttpException ? error.getResponse() : undefined;

        // Log the error with context
        this.logger.error({
          message: `Exception caught: ${method} ${originalUrl} ${status}`,
          requestId,
          method,
          url: originalUrl,
          ip,
          userAgent: headers['user-agent'],
          statusCode: status,
          errorName: error.name,
          errorMessage: error.message,
          errorResponse,
          stack: error.stack,
        });

        // If it's not an HTTP exception, wrap it in an InternalServerErrorException
        // to avoid exposing sensitive error details to the client
        if (!isHttpException) {
          return throwError(() => new InternalServerErrorException({
            statusCode: 500,
            message: 'Internal server error',
            error: 'Internal Server Error',
            requestId,
          }));
        }

        // Add request ID to the error response
        if (typeof errorResponse === 'object') {
          (errorResponse as any).requestId = requestId;
        }

        // Return the original error
        return throwError(() => error);
      }),
    );
  }
}
