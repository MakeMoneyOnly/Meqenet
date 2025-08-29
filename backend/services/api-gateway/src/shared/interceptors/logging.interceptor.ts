import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { sanitizeObject } from '../utils/logging-sanitizer.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check for existing request ID from headers, generate if not present
    let correlationId =
      request.headers['x-request-id'] ?? request.headers['X-Request-ID'];
    if (!correlationId) {
      correlationId = uuidv4();
      request.headers['x-request-id'] = correlationId;
    }

    // Attach correlation ID to request for use throughout the app
    request.correlationId = correlationId;

    const { method, url, body, headers } = request;
    const user = headers['user-agent'] ?? 'Unknown';

    this.logger.info(
      `[${correlationId}] ==> ${method} ${url} | User: ${user} | Body: ${JSON.stringify(sanitizeObject(body))}`
    );

    // Set correlation ID in response headers
    response.setHeader('X-Request-ID', correlationId);

    const now = Date.now();
    return next.handle().pipe(
      tap(data => {
        this.logger.info(
          `[${correlationId}] <== ${method} ${url} | Status: ${response.statusCode} | Duration: ${Date.now() - now}ms | Response: ${JSON.stringify(sanitizeObject(data))}`
        );
      })
    );
  }
}
