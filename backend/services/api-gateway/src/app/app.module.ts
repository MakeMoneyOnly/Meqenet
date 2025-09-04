import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { IdempotencyMiddleware } from '../idempotency/idempotency.middleware';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import appConfig from '../shared/config/app.config';
import { pinoConfig } from '../shared/config/pino.config';
import { GlobalExceptionFilter } from '../shared/filters/global-exception.filter';
import { LoggingInterceptor } from '../shared/interceptors/logging.interceptor';
import { RedisModule } from '../shared/redis/redis.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    // Disable ThrottlerModule in test mode to avoid Redis dependency
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        if (configService.get<string>('NODE_ENV') === 'test') {
          return [];
        }
        return [
          {
            ttl: 60_000,
            limit: 100,
          },
        ];
      },
      inject: [ConfigService],
    }),
    LoggerModule.forRootAsync(pinoConfig),
    // Disable Redis-dependent modules in test mode
     
    ...(process.env.NODE_ENV === 'test' ? [] : [IdempotencyModule, RedisModule]),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // IdempotencyMiddleware is disabled in test mode since RedisModule is not loaded
     
    const isTest = process.env.NODE_ENV === 'test';
    if (!isTest) {
      consumer
        .apply(IdempotencyMiddleware)
        .forRoutes(
          { path: '*', method: RequestMethod.POST },
          { path: '*', method: RequestMethod.PUT },
          { path: '*', method: RequestMethod.PATCH }
        );
    }
  }
}
