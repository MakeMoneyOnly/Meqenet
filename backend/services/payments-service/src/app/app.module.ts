import * as path from 'path';

import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';

import { IdempotencyMiddleware } from '../../../shared/middleware/idempotency.middleware';
import { AuthModule } from '../features/auth/auth.module';
import { throttlerConfig } from '../shared/config/throttler.config';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { MessagingModule } from '../infrastructure/messaging/messaging.module';
import { PaymentsController } from '../payments.controller';
import { PaymentsService } from '../payments.service';
import { winstonConfig } from '../shared/config/winston.config';
import { GlobalExceptionFilter } from '../shared/filters/global-exception.filter';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { LoggingInterceptor } from '../shared/interceptors/logging.interceptor';
import { SharedModule } from '../shared/shared.module';

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
    // gRPC client configuration
    ClientsModule.registerAsync([
      {
        name: 'GRPC_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'payments-service',
            protoPath: path.join(__dirname, '../../proto/service.proto'),
            url: configService.get<string>('GRPC_URL', 'localhost:5000'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    // Application modules
    SharedModule,
    AuthModule,
    DatabaseModule,
    MessagingModule,
  ],
  controllers: [AppController, PaymentsController],
  providers: [
    AppService,
    PaymentsService,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IdempotencyMiddleware)
      .forRoutes({ path: 'payments', method: RequestMethod.POST });
  }
}
