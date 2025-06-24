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
 * Logging Interceptor
 *
 * Logs incoming requests and outgoing responses
 * for auditing and debugging purposes, including correlation IDs
 * and sanitized bodies.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const correlationId = uuidv4();
    const request = context.switchToHttp().getRequest();

    const { method, url, body, headers } = request;
    const user = headers['user-agent'] ?? 'Unknown';

    this.logger.log(
      `[${correlationId}] ==> ${method} ${url} | User: ${user} | Body: ${JSON.stringify(sanitizeObject(body))}`
    );

    const now = Date.now();
    return next.handle().pipe(
      tap(data => {
        this.logger.log(
          `[${correlationId}] <== ${method} ${url} | Status: ${context.switchToHttp().getResponse().statusCode} | Duration: ${Date.now() - now}ms | Response: ${JSON.stringify(sanitizeObject(data))}`
        );
      })
    );
  }
}
