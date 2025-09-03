import * as path from 'path';

import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
// import { ClientsModule, Transport, GrpcOptions } from '@nestjs/microservices';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-store';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import type { RedisClientOptions } from 'redis';

import { AuthModule } from '../features/auth/auth.module';
import { JwksModule } from '../features/jwks/jwks.module';
import { HealthModule } from '../health/health.module';
import { UserModule } from '../features/user/user.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { MessagingModule } from '../infrastructure/messaging/messaging.module';
import appConfig from '../shared/config/app.config';
import corsConfig from '../shared/config/cors.config';
import securityConfig from '../shared/config/security.config';
import loggerConfig from '../shared/config/logger.config';
import { pinoConfig } from '../shared/config/pino.config';
import { throttlerConfig } from '../shared/config/throttler.config';
import { DLQModule } from '../shared/dlq/dlq.module';
import { JwtStrategy } from '../shared/strategies/jwt.strategy';
import { GlobalExceptionFilter } from '../shared/filters/global-exception.filter';
import { AdaptiveRateLimitGuard } from '../shared/guards/adaptive-rate-limit.guard';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { LoggingInterceptor } from '../shared/interceptors/logging.interceptor';
import { SharedModule } from '../shared/shared.module';
import { ValidationModule } from '../shared/validation/validation.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Redis configuration constants for auth-service
 * Enterprise FinTech compliant Redis configuration
 */
const REDIS_CONFIG = {
  DEFAULT_PORT: 6379,
  DEFAULT_TTL_SECONDS: 60,
} as const;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, corsConfig, securityConfig, loggerConfig],
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>(
              'REDIS_PORT',
              REDIS_CONFIG.DEFAULT_PORT
            ),
          },
          ttl: configService.get<number>(
            'CACHE_TTL',
            REDIS_CONFIG.DEFAULT_TTL_SECONDS
          ),
        }),
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    TerminusModule,
    ThrottlerModule.forRootAsync(throttlerConfig),
    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: 'en',
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    LoggerModule.forRootAsync(pinoConfig),
    AuthModule,
    UserModule,
    HealthModule,
    DatabaseModule,
    MessagingModule,
    SharedModule,
    ValidationModule,
    DLQModule,
    JwksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AdaptiveRateLimitGuard,
    },
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
export class AppModule {}
