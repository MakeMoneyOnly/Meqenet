import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';

/**
 * Health monitoring module
 * Provides comprehensive health checks for the authentication service
 */
@Module({
  imports: [
    TerminusModule,
    HttpModule.register({
      timeout: 10000, // 10 second timeout for health checks
      maxRedirects: 3,
    }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
