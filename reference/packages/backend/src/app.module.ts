import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PaymentPlansModule } from './payment-plans/payment-plans.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CreditModule } from './credit/credit.module';
import { MerchantsModule } from './merchants/merchants.module';
import { SettlementsModule } from './settlements/settlements.module';
import { KycModule } from './kyc/kyc.module';
import { PaymentGatewaysModule } from './payment-gateways/payment-gateways.module';
import { FraudDetectionModule } from './fraud-detection/fraud-detection.module';
import { CacheModule } from './cache/cache.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { LoggingModule } from './logging/logging.module';
import { VirtualCardsModule } from './virtual-cards/virtual-cards.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        API_PREFIX: Joi.string().default('api/v1'),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.number().default(3600),
        JWT_REFRESH_EXPIRATION: Joi.number().default(604800), // 7 days
        JWT_MERCHANT_EXPIRATION: Joi.number().default(86400), // 24 hours
        DATABASE_URL: Joi.string().required(),
        BCRYPT_SALT_ROUNDS: Joi.number().default(12),
        // Email configuration
        EMAIL_HOST: Joi.string().optional(),
        EMAIL_PORT: Joi.number().default(587),
        EMAIL_USER: Joi.string().optional(),
        EMAIL_PASS: Joi.string().optional(),
        EMAIL_FROM: Joi.string().default('noreply@meqenet.et'),
        // SMS configuration
        SMS_API_URL: Joi.string().optional(),
        SMS_API_KEY: Joi.string().optional(),
        SMS_SENDER: Joi.string().default('Meqenet'),
        // Credit configuration
        CREDIT_MIN_LIMIT: Joi.number().default(1000),
        CREDIT_MAX_LIMIT: Joi.number().default(50000),
        CREDIT_BASE_MULTIPLIER: Joi.number().default(2),
        // Transaction fee configuration
        TRANSACTION_FEE_ENABLED: Joi.boolean().default(true),
        TRANSACTION_FEE_CONFIG: Joi.string().optional(),
        // Fraud detection configuration
        FRAUD_HIGH_RISK_THRESHOLD: Joi.number().default(80),
        FRAUD_MEDIUM_RISK_THRESHOLD: Joi.number().default(50),
        // Late payment configuration
        PAYMENT_GRACE_PERIOD_DAYS: Joi.number().default(3),
        PAYMENT_DEFAULT_PERIOD_DAYS: Joi.number().default(30),
        LATE_FEE_PERCENTAGE: Joi.number().default(5),
        MAX_RESCHEDULES_ALLOWED: Joi.number().default(3),
        RESCHEDULE_FEE_PERCENTAGE: Joi.number().default(2),
        // Cache configuration
        ENABLE_CACHE: Joi.boolean().default(true),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional(),
        REDIS_DB: Joi.number().default(0),
        CACHE_TTL: Joi.number().default(3600),
        CACHE_MAX_ITEMS: Joi.number().default(100),
        USE_MEMORY_CACHE: Joi.boolean().default(false),
        // Monitoring configuration
        ENABLE_PERFORMANCE_MONITORING: Joi.boolean().default(true),
        METRICS_RETENTION_DAYS: Joi.number().default(7),
        // Database optimization
        ENABLE_DB_OPTIMIZATION: Joi.boolean().default(false),
        LOG_RETENTION_DAYS: Joi.number().default(90),
        // Logging configuration
        LOG_LEVELS: Joi.string().default('error,warn,log'),
        LOG_LEVEL: Joi.string().default('info'),
        LOG_DIR: Joi.string().default('logs'),
        LOG_MAX_FILES: Joi.string().default('30d'),
        ENABLE_DB_LOGGING: Joi.boolean().default(false),
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    PaymentPlansModule,
    PaymentMethodsModule,
    NotificationsModule,
    CreditModule,
    MerchantsModule,
    SettlementsModule,
    KycModule,
    PaymentGatewaysModule,
    FraudDetectionModule,
    CacheModule,
    MonitoringModule,
    LoggingModule,
    VirtualCardsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}







