import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { IdempotencyMiddleware } from '../idempotency/idempotency.middleware';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import appConfig from '../shared/config/app.config';
import { pinoConfig } from '../shared/config/pino.config';
import { GlobalExceptionFilter } from '../shared/filters/global-exception.filter';
import { CachingInterceptor } from '../shared/interceptors/caching.interceptor';
import { LoggingInterceptor } from '../shared/interceptors/logging.interceptor';
import { RedisModule } from '../shared/redis/redis.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRoot(
      [
        {
          ttl: 60_000,
          limit: 100,
        },
      ],
      {
        ignoreUserAgents: [/test/i], // Ignore test user agents for rate limiting
      }
    ),
    LoggerModule.forRootAsync(pinoConfig),
    IdempotencyModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CachingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(IdempotencyMiddleware)
      .forRoutes(
        { path: '*', method: RequestMethod.POST },
        { path: '*', method: RequestMethod.PUT },
        { path: '*', method: RequestMethod.PATCH }
      );
  }
}
