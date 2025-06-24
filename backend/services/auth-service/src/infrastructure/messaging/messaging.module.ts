import { Module } from '@nestjs/common';

/**
 * Messaging Module
 *
 * Handles event-driven messaging and inter-service communication
 * including NBE compliance reporting and audit trails.
 */
@Module({
  imports: [
    // TODO: Add messaging providers (RabbitMQ, SQS, etc.)
  ],
  providers: [
    // TODO: Add messaging services
  ],
  exports: [
    // TODO: Export messaging services
  ],
})
export class MessagingModule {}
