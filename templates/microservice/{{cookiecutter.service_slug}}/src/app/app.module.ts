import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
{% if cookiecutter.is_event_driven == "y" %}import { EventEmitterModule } from '@nestjs/event-emitter';{% endif %}
{% if cookiecutter.is_grpc_service == "y" %}import { ClientsModule, Transport } from '@nestjs/microservices';{% endif %}
import { WinstonModule } from 'nest-winston';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../features/auth/auth.module';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from '../shared/filters/global-exception.filter';
import { LoggingInterceptor } from '../shared/interceptors/logging.interceptor';
import { winstonConfig } from '../shared/config/winston.config';
import { throttlerConfig } from '../shared/config/throttler.config';
{% if cookiecutter.needs_database == "y" -%}
import { DatabaseModule } from '../infrastructure/database/database.module';
{% endif -%}
{% if cookiecutter.is_event_driven == "y" -%}
import { MessagingModule } from '../infrastructure/messaging/messaging.module';
{% endif -%}

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
    WinstonModule.forRootAsync(winstonConfig),

    // Health checks
    TerminusModule,

    // Internationalization
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../../i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),

    {% if cookiecutter.is_event_driven == "y" -%}
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
    {% endif -%}

    {% if cookiecutter.is_grpc_service == "y" -%}
    // gRPC client configuration
    ClientsModule.register([
      {
        name: 'GRPC_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: '{{cookiecutter.service_slug}}',
          protoPath: path.join(__dirname, '../../proto/service.proto'),
          url: process.env.GRPC_URL || 'localhost:5000',
        },
      },
    ]),
    {% endif -%}

    // Application modules
    SharedModule,
    AuthModule,
    {% if cookiecutter.needs_database == "y" -%}
    DatabaseModule,
    {% endif -%}
    {% if cookiecutter.is_event_driven == "y" -%}
    MessagingModule,
    {% endif -%}
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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