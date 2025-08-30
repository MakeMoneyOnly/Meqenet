import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { RedisService } from '../redis/redis.service';

const CACHE_TTL_SECONDS = 60; // Cache for 60 seconds

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = request.originalUrl;
    const cachedResponse = await this.redisService.get(cacheKey);

    if (cachedResponse) {
      return of(JSON.parse(cachedResponse));
    }

    return next.handle().pipe(
      tap(response => {
        this.redisService.set(
          cacheKey,
          JSON.stringify(response),
          CACHE_TTL_SECONDS
        );
      })
    );
  }
}
