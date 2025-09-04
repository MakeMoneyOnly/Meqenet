import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import appConfig from './config/app.config';
import { RedisConfigService } from './config/redis.config';

import { AIFraudDetectionController } from './controllers/ai-fraud-detection.controller';
import { CredentialManagementController } from './controllers/credential-management.controller';
import { JWKSController } from './controllers/jwks.controller';
import { MetricsController } from './controllers/metrics.controller';
import { DiagnosticsController } from './controllers/diagnostics.controller';
import { AdaptiveRateLimitingService } from './services/adaptive-rate-limiting.service';
import { AIFraudDetectionService } from './services/ai-fraud-detection.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { CredentialRotationService } from './services/credential-rotation.service';
import { FieldEncryptionService } from './services/field-encryption.service';
import { SecretManagerService } from './services/secret-manager.service';
import { SecurityMonitoringService } from './services/security-monitoring.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { EmailService } from './services/email.service';
import { SecurityConfigService } from './services/security-config.service';
import { AuditLoggingService } from './services/audit-logging.service';
import { FaydaEncryptionUtil } from './utils/fayda-encryption.util';

/**
 * Shared Module
 *
 * Contains common utilities, configurations, and services
 * that are shared across the authentication service.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ScheduleModule.forRoot(), // For scheduled credential rotation
  ],
  controllers: [
    AIFraudDetectionController,
    JWKSController,
    CredentialManagementController,
    MetricsController,
    DiagnosticsController,
  ],
  providers: [
    RedisConfigService,
    FaydaEncryptionUtil,
    SecretManagerService,
    CredentialRotationService,
    SecurityMonitoringService,
    SecurityConfigService,
    AdaptiveRateLimitingService,
    AnomalyDetectionService,
    FieldEncryptionService,
    AIFraudDetectionService,
    PasswordResetTokenService,
    EmailService,
    AuditLoggingService,
  ],
  exports: [
    SecurityConfigService,
    RedisConfigService,
    FaydaEncryptionUtil,
    SecretManagerService,
    CredentialRotationService,
    SecurityMonitoringService,
    AdaptiveRateLimitingService,
    AnomalyDetectionService,
    FieldEncryptionService,
    AIFraudDetectionService,
    PasswordResetTokenService,
    EmailService,
    AuditLoggingService,
  ],
})
export class SharedModule {}
