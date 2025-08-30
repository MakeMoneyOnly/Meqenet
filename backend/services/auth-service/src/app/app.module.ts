import * as path from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
// import { ClientsModule, Transport, GrpcOptions } from '@nestjs/microservices';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';

import { AuthModule } from '../features/auth/auth.module';
import { HealthModule } from '../health/health.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { MessagingModule } from '../infrastructure/messaging/messaging.module';
import { pinoConfig } from '../shared/config/pino.config';
import { throttlerConfig } from '../shared/config/throttler.config';
import { GlobalExceptionFilter } from '../shared/filters/global-exception.filter';
import { AdaptiveRateLimitGuard } from '../shared/guards/adaptive-rate-limit.guard';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { LoggingInterceptor } from '../shared/interceptors/logging.interceptor';
import { SharedModule } from '../shared/shared.module';
import { ValidationModule } from '../shared/validation/validation.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),

    // Throttling/Rate limiting
    ThrottlerModule.forRootAsync(throttlerConfig),

    // Logging
    LoggerModule.forRootAsync(pinoConfig),

    // Health checks
    TerminusModule,

    // Internationalization
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),

    // Event handling
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Application modules
    SharedModule,
    ValidationModule,
    HealthModule,
    AuthModule,
    DatabaseModule,
    MessagingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: AdaptiveRateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global filters
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
