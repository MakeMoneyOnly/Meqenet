import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SecurityConfigService } from './config/security.config';
import { FaydaEncryptionUtil } from './utils/fayda-encryption.util';

/**
 * Shared Module
 *
 * Contains common utilities, configurations, and services
 * that are shared across the authentication service.
 */
@Module({
  imports: [ConfigModule],
  providers: [SecurityConfigService, FaydaEncryptionUtil],
  exports: [SecurityConfigService, FaydaEncryptionUtil],
})
export class SharedModule {}
