import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface DLQMessage {
  id: string;
  messageId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  errorMessage: string | null;
  dlqReason: string | null;
  retryCount: number;
  createdAt: Date;
  dlqAt: Date | null;
}

interface PrismaOutboxMessage {
  id: string;
  messageId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Prisma.JsonValue; // JsonValue from Prisma - can be null or any JSON value
  metadata: Prisma.JsonValue; // JsonValue from Prisma - can be null or any JSON value
  errorMessage: string | null;
  dlqReason: string | null;
  retryCount: number;
  createdAt: Date;
  dlqAt: Date | null;
  status: string;
  maxRetries: number;
}

export enum DLQAction {
  RETRY = 'RETRY',
  SKIP = 'SKIP',
  ARCHIVE = 'ARCHIVE',
  DELETE = 'DELETE',
}

// DLQ Configuration Constants (no-magic-numbers compliance)
const DLQ_CONFIG = {
  ARCHIVE_DAYS: 90,
  DEFAULT_PAGE_SIZE: 50,
  HOURS_IN_DAY: 24,
  SECONDS_IN_HOUR: 60,
  MS_IN_SECOND: 1000,
} as const;

@Injectable()
export class DLQService {
  private readonly logger = new Logger(DLQService.name);
  // Magic numbers for DLQ operations - documented inline for linting compliance
  private readonly ARCHIVE_DAYS = DLQ_CONFIG.ARCHIVE_DAYS;
  private readonly DEFAULT_PAGE_SIZE = DLQ_CONFIG.DEFAULT_PAGE_SIZE;
  private readonly HOURS_IN_DAY = DLQ_CONFIG.HOURS_IN_DAY;
  private readonly SECONDS_IN_HOUR = DLQ_CONFIG.SECONDS_IN_HOUR;
  private readonly MS_IN_SECOND = DLQ_CONFIG.MS_IN_SECOND;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all messages in DLQ with pagination
   */
  async getDLQMessages(
    page: number = 1,
    limit: number = this.DEFAULT_PAGE_SIZE,
    eventType?: string,
    aggregateType?: string
  ): Promise<{
    messages: DLQMessage[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: { eventType?: string; aggregateType?: string } = {};
    if (eventType) where.eventType = eventType;
    if (aggregateType) where.aggregateType = aggregateType;

    const [messages, total] = await Promise.all([
      this.prisma.outboxMessage.findMany({
        where: {
          status: 'DLQ',
          ...where,
        },
        orderBy: { dlqAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.outboxMessage.count({
        where: {
          status: 'DLQ',
          ...where,
        },
      }),
    ]);

    return {
      messages: messages.map(msg => this.mapToDLQMessage(msg)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get DLQ message by ID
   */
  async getDLQMessageById(id: string): Promise<DLQMessage | null> {
    const message = await this.prisma.outboxMessage.findFirst({
      where: {
        id,
        status: 'DLQ',
      },
    });

    if (!message) return null;

    return this.mapToDLQMessage(message);
  }

  /**
   * Process DLQ message with specified action
   */
  async processDLQMessage(
    id: string,
    action: DLQAction,
    notes?: string
  ): Promise<void> {
    const message = await this.prisma.outboxMessage.findFirst({
      where: {
        id,
        status: 'DLQ',
      },
    });

    if (!message) {
      throw new Error(`DLQ message with ID ${id} not found`);
    }

    switch (action) {
      case DLQAction.RETRY:
        await this.retryDLQMessage(message, notes);
        break;
      case DLQAction.SKIP:
        await this.skipDLQMessage(message, notes);
        break;
      case DLQAction.ARCHIVE:
        await this.archiveDLQMessage(message, notes);
        break;
      case DLQAction.DELETE:
        await this.deleteDLQMessage(message, notes);
        break;
      default:
        throw new Error(`Unknown DLQ action: ${action}`);
    }

    this.logger.log(`DLQ message ${id} processed with action: ${action}`);
  }

  /**
   * Bulk process DLQ messages
   */
  async bulkProcessDLQMessages(
    messageIds: string[],
    action: DLQAction,
    notes?: string
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const id of messageIds) {
      try {
        await this.processDLQMessage(id, action, notes);
        processed++;
      } catch (error) {
        this.logger.error(`Failed to process DLQ message ${id}`, error);
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Get DLQ statistics
   */
  async getDLQStatistics(): Promise<{
    total: number;
    byEventType: Record<string, number>;
    byAggregateType: Record<string, number>;
    recentFailures: number; // Last HOURS_IN_DAY hours
    oldestMessage: Date | null;
  }> {
    const twentyFourHoursAgo = new Date(
      Date.now() - this.HOURS_IN_DAY * this.SECONDS_IN_HOUR * this.MS_IN_SECOND
    );

    const [total, byEventType, byAggregateType, recentFailures, oldestMessage] =
      await Promise.all([
        this.prisma.outboxMessage.count({ where: { status: 'DLQ' } }),
        this.prisma.outboxMessage.groupBy({
          by: ['eventType'],
          where: { status: 'DLQ' },
          _count: { id: true },
        }),
        this.prisma.outboxMessage.groupBy({
          by: ['aggregateType'],
          where: { status: 'DLQ' },
          _count: { id: true },
        }),
        this.prisma.outboxMessage.count({
          where: {
            status: 'DLQ',
            dlqAt: { gte: twentyFourHoursAgo },
          },
        }),
        this.prisma.outboxMessage.findFirst({
          where: { status: 'DLQ' },
          orderBy: { dlqAt: 'asc' },
          select: { dlqAt: true },
        }),
      ]);

    return {
      total,
      byEventType: byEventType.reduce(
        (acc: Record<string, number>, item) => {
          acc[item.eventType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      byAggregateType: byAggregateType.reduce(
        (acc: Record<string, number>, item) => {
          acc[item.aggregateType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentFailures,
      oldestMessage: oldestMessage?.dlqAt ?? null,
    };
  }

  /**
   * Search DLQ messages
   */
  async searchDLQMessages(
    searchTerm: string,
    page: number = 1,
    limit: number = this.DEFAULT_PAGE_SIZE
  ): Promise<{
    messages: DLQMessage[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.outboxMessage.findMany({
        where: {
          status: 'DLQ',
          OR: [
            { messageId: { contains: searchTerm, mode: 'insensitive' } },
            { aggregateId: { contains: searchTerm, mode: 'insensitive' } },
            { eventType: { contains: searchTerm, mode: 'insensitive' } },
            { aggregateType: { contains: searchTerm, mode: 'insensitive' } },
            { errorMessage: { contains: searchTerm, mode: 'insensitive' } },
            { dlqReason: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: { dlqAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.outboxMessage.count({
        where: {
          status: 'DLQ',
          OR: [
            { messageId: { contains: searchTerm, mode: 'insensitive' } },
            { aggregateId: { contains: searchTerm, mode: 'insensitive' } },
            { eventType: { contains: searchTerm, mode: 'insensitive' } },
            { aggregateType: { contains: searchTerm, mode: 'insensitive' } },
            { errorMessage: { contains: searchTerm, mode: 'insensitive' } },
            { dlqReason: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      messages: messages.map(msg => this.mapToDLQMessage(msg)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Archive old DLQ messages (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async archiveOldDLQMessages(): Promise<void> {
    try {
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - this.ARCHIVE_DAYS);

      const result = await this.prisma.outboxMessage.updateMany({
        where: {
          status: 'DLQ',
          dlqAt: { lt: archiveDate },
        },
        data: {
          payload: {}, // Clear payload for archiving
          errorMessage: 'Archived due to age',
        },
      });

      this.logger.log(`Archived ${result.count} old DLQ messages`);
    } catch (error) {
      this.logger.error('Error archiving old DLQ messages', error);
    }
  }

  // Private helper methods

  private mapToDLQMessage(message: PrismaOutboxMessage): DLQMessage {
    // Safely convert JsonValue to Record<string, unknown>
    let payload: Record<string, unknown> = {};
    if (
      message.payload &&
      typeof message.payload === 'object' &&
      !Array.isArray(message.payload)
    ) {
      payload = message.payload as Record<string, unknown>;
    }

    return {
      id: message.id,
      messageId: message.messageId,
      aggregateType: message.aggregateType,
      aggregateId: message.aggregateId,
      eventType: message.eventType,
      payload,
      errorMessage: message.errorMessage,
      dlqReason: message.dlqReason ?? 'Unknown reason',
      retryCount: message.retryCount,
      createdAt: message.createdAt,
      dlqAt: message.dlqAt ?? new Date(),
    };
  }

  private async retryDLQMessage(
    message: PrismaOutboxMessage,
    notes?: string
  ): Promise<void> {
    await this.prisma.outboxMessage.update({
      where: { id: message.id },
      data: {
        status: 'PENDING',
        retryCount: 0,
        nextRetryAt: null,
        errorMessage: notes ?? 'Manually retried from DLQ',
      },
    });
  }

  private async skipDLQMessage(
    message: PrismaOutboxMessage,
    notes?: string
  ): Promise<void> {
    await this.prisma.outboxMessage.update({
      where: { id: message.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
        errorMessage: notes ?? 'Skipped from DLQ',
      },
    });
  }

  private async archiveDLQMessage(
    message: PrismaOutboxMessage,
    notes?: string
  ): Promise<void> {
    await this.prisma.outboxMessage.update({
      where: { id: message.id },
      data: {
        payload: {},
        errorMessage: notes ?? 'Archived from DLQ',
      },
    });
  }

  private async deleteDLQMessage(
    message: PrismaOutboxMessage,
    notes?: string
  ): Promise<void> {
    this.logger.log(
      `Deleting DLQ message ${message.id}: ${notes ?? 'No notes provided'}`
    );
    await this.prisma.outboxMessage.delete({
      where: { id: message.id },
    });
  }
}
