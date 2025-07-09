import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';

/**
 * Authentication Module
 *
 * Handles user authentication, authorization, and session management
 * including Ethiopian Fayda ID verification and NBE compliance.
 */
@Module({
  imports: [SharedModule],
  // TODO: Add auth controllers when implementing authentication features
  controllers: [],
  // TODO: Add auth services for user authentication and Fayda ID verification
  providers: [],
  // TODO: Export auth services for other modules to use
  exports: [],
})
export class AuthModule {}
