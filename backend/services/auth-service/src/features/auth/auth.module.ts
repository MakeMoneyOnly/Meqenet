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
  controllers: [
    // TODO: Add auth controllers
  ],
  providers: [
    // TODO: Add auth services
  ],
  exports: [
    // TODO: Export auth services for other modules
  ],
})
export class AuthModule {}
