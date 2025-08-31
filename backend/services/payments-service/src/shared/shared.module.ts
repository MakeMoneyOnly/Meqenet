import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Shared Module - Enterprise FinTech compliant shared services and utilities
 * Provides common functionality across the payments service
 */
@Module({
  imports: [ConfigModule],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class SharedModule {
  constructor(private readonly configService: ConfigService) {
    // Validate required configuration on module initialization
    this.validateConfiguration();
  }

  /**
   * Validate critical configuration values
   * Enterprise FinTech requirement: Fail fast on configuration errors
   */
  private validateConfiguration(): void {
    const requiredConfig = [
      'DATABASE_URL',
      'JWT_SECRET',
      'PAYMENT_PROVIDER_API_KEY',
      'REDIS_URL',
    ];

    const missingConfig = requiredConfig.filter(
      (key) => !this.configService.get(key)
    );

    if (missingConfig.length > 0) {
      throw new Error(
        `Missing required configuration: ${missingConfig.join(', ')}`
      );
    }
  }
}
