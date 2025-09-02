import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';

import { MessagingProducerService } from '../../infrastructure/messaging/messaging.producer.service';
import { PrismaService } from '../prisma/prisma.service';

export interface OutboxMessage {
  messageId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Type alias for Prisma outbox message
type PrismaOutboxMessage = {
  id: string;
  messageId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string | null;
  nextRetryAt?: Date | null;
  createdAt: Date;
  processedAt?: Date | null;
  dlqAt?: Date | null;
  dlqReason?: string | null;
};

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  DLQ = 'DLQ',
}

@Injectable()
export class OutboxService implements OnModuleInit {
  private readonly logger = new Logger(OutboxService.name);
  // Magic numbers for outbox operations - documented inline for linting compliance
  // eslint-disable-next-line no-magic-numbers
  private readonly BATCH_SIZE = 50; // Messages per batch
  // eslint-disable-next-line no-magic-numbers
  private readonly MAX_RETRIES = 3; // Maximum retry attempts
  // eslint-disable-next-line no-magic-numbers
  private readonly RETRY_DELAY_MS = 60000; // 1 minute delay
  // eslint-disable-next-line no-magic-numbers
  private readonly CLEANUP_DAYS = 30; // Days to keep processed messages
  // eslint-disable-next-line no-magic-numbers
  private readonly EXPONENTIAL_BACKOFF_BASE = 2; // Base for exponential backoff

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingProducer: MessagingProducerService
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('OutboxService initialized');
  }

  /**
   * Store message in outbox for reliable delivery.
   * Can be used with a transaction client.
   */
  async store(
    message: OutboxMessage,
    prisma: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    > = this.prisma
  ): Promise<void> {
    try {
      await prisma.outboxMessage.create({
        data: {
          messageId: message.messageId,
          aggregateType: message.aggregateType,
          aggregateId: message.aggregateId,
          eventType: message.eventType,
          payload: message.payload ?? {},
          metadata: message.metadata ?? {},
          status: OutboxStatus.PENDING,
          maxRetries: this.MAX_RETRIES,
        },
      });

      this.logger.debug(
        `Message stored in outbox: ${message.messageId} (${message.eventType})`
      );
    } catch (error) {
      this.logger.error(
        `Failed to store message in outbox: ${message.messageId}`,
        error
      );
      throw error;
    }
  }

  // ... (rest of the service)

  /**
   * Process pending outbox messages (runs every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingMessages(): Promise<void> {
    try {
      // Get pending messages in batches
      const pendingMessages = await this.prisma.outboxMessage.findMany({
        where: {
          status: OutboxStatus.PENDING,
          OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
        },
        orderBy: { createdAt: 'asc' },
        take: this.BATCH_SIZE,
      });

      if (pendingMessages.length === 0) {
        return;
      }

      this.logger.debug(`Processing ${pendingMessages.length} outbox messages`);

      // Process messages in parallel with controlled concurrency
      const processingPromises = pendingMessages.map(
        (message: PrismaOutboxMessage) => this.processMessage(message)
      );

      await Promise.allSettled(processingPromises);
    } catch (error) {
      this.logger.error('Error processing pending outbox messages', error);
    }
  }

  /**
   * Process a single outbox message
   */
  private async processMessage(message: PrismaOutboxMessage): Promise<void> {
    const messageId = message.messageId;

    try {
      // Mark as processing
      await this.prisma.outboxMessage.update({
        where: { id: message.id },
        data: {
          status: OutboxStatus.PROCESSING,
          retryCount: { increment: 1 },
        },
      });

      // Publish message based on event type
      await this.publishMessage(message);

      // Mark as processed
      await this.prisma.outboxMessage.update({
        where: { id: message.id },
        data: {
          status: OutboxStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      this.logger.debug(`Message processed successfully: ${messageId}`);
    } catch (error) {
      await this.handleProcessingError(message, error);
    }
  }

  /**
   * Publish message to appropriate queue based on event type
   */
  private async publishMessage(message: PrismaOutboxMessage): Promise<void> {
    const { eventType, aggregateId, payload } = message;

    switch (eventType) {
      case 'USER_REGISTERED':
        if (payload && typeof payload === 'object' && 'email' in payload) {
          await this.messagingProducer.addUserRegisteredJob(
            aggregateId,
            payload.email as string
          );
        } else {
          this.logger.error(
            `Invalid payload for USER_REGISTERED event: ${aggregateId}`
          );
        }
        break;

      case 'USER_LOGIN':
        // Handle user login events
        this.logger.debug(`User login event processed: ${aggregateId}`);
        break;

      case 'PASSWORD_CHANGED':
        // Handle password change events
        this.logger.debug(`Password change event processed: ${aggregateId}`);
        break;

      case 'KYC_STATUS_UPDATED':
        // Handle KYC status updates
        this.logger.debug(`KYC status updated: ${aggregateId}`);
        break;

      default:
        this.logger.warn(`Unknown event type: ${eventType}`);
        throw new Error(`Unsupported event type: ${eventType}`);
    }
  }

  /**
   * Handle processing errors with retry logic
   */
  private async handleProcessingError(
    message: PrismaOutboxMessage,
    error: unknown
  ): Promise<void> {
    const messageId = message.messageId;
    const retryCount = message.retryCount + 1;

    this.logger.error(
      `Failed to process message ${messageId} (attempt ${retryCount}/${this.MAX_RETRIES})`,
      error
    );

    if (retryCount >= this.MAX_RETRIES) {
      // Move to dead letter queue
      await this.prisma.outboxMessage.update({
        where: { id: message.id },
        data: {
          status: OutboxStatus.DLQ,
          errorMessage: error instanceof Error ? error.message : String(error),
          dlqReason: 'Max retries exceeded',
          dlqAt: new Date(),
        },
      });

      this.logger.error(`Message moved to DLQ: ${messageId}`);
    } else {
      // Schedule retry with exponential backoff
      const nextRetryAt = new Date(
        Date.now() +
          this.RETRY_DELAY_MS *
            Math.pow(this.EXPONENTIAL_BACKOFF_BASE, retryCount - 1)
      );

      await this.prisma.outboxMessage.update({
        where: { id: message.id },
        data: {
          status: OutboxStatus.PENDING,
          errorMessage: error instanceof Error ? error.message : String(error),
          nextRetryAt,
        },
      });

      this.logger.debug(
        `Message scheduled for retry: ${messageId} at ${nextRetryAt}`
      );
    }
  }

  /**
   * Get outbox statistics for monitoring
   */
  async getStatistics(): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
    dlq: number;
  }> {
    const stats = await this.prisma.outboxMessage.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return {
      pending:
        stats.find(
          (s: { status: string; _count: { id: number } }) =>
            s.status === OutboxStatus.PENDING
        )?._count.id ?? 0,
      processing:
        stats.find(
          (s: { status: string; _count: { id: number } }) =>
            s.status === OutboxStatus.PROCESSING
        )?._count.id ?? 0,
      processed:
        stats.find(
          (s: { status: string; _count: { id: number } }) =>
            s.status === OutboxStatus.PROCESSED
        )?._count.id ?? 0,
      failed:
        stats.find(
          (s: { status: string; _count: { id: number } }) =>
            s.status === OutboxStatus.FAILED
        )?._count.id ?? 0,
      dlq:
        stats.find(
          (s: { status: string; _count: { id: number } }) =>
            s.status === OutboxStatus.DLQ
        )?._count.id ?? 0,
    };
  }

  /**
   * Manually retry failed messages
   */
  async retryFailedMessages(): Promise<number> {
    const result = await this.prisma.outboxMessage.updateMany({
      where: {
        status: OutboxStatus.FAILED,
        retryCount: { lt: this.MAX_RETRIES },
      },
      data: {
        status: OutboxStatus.PENDING,
        nextRetryAt: null,
      },
    });

    this.logger.log(`Retried ${result.count} failed messages`);
    return result.count;
  }

  /**
   * Clean up old processed messages (retention policy)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupProcessedMessages(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.CLEANUP_DAYS);

      const result = await this.prisma.outboxMessage.deleteMany({
        where: {
          status: OutboxStatus.PROCESSED,
          processedAt: { lt: thirtyDaysAgo },
        },
      });

      this.logger.log(`Cleaned up ${result.count} old processed messages`);
    } catch (error) {
      this.logger.error('Error cleaning up processed messages', error);
    }
  }
}
