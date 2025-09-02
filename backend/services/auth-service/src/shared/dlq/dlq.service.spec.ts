import { Test, TestingModule } from '@nestjs/testing';
import { DLQService, DLQAction } from './dlq.service';
import { PrismaService } from '../prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DLQService', () => {
  let service: DLQService;
  let _prismaService: import('vitest').MockedObject<PrismaService>;
  let mockPrismaService: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create fresh mock for each test that mimics PrismaService structure
    const mockPrismaInstance = {
      outboxMessage: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        groupBy: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DLQService,
        {
          provide: PrismaService,
          useValue: mockPrismaInstance,
        },
      ],
    }).compile();

    service = module.get<DLQService>(DLQService);
    _prismaService = module.get(PrismaService);

    // Manually assign the mock to the service instance
    (service as any).prisma = mockPrismaInstance;

    // Store reference to mock for test access
    mockPrismaService = mockPrismaInstance;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDLQMessages', () => {
    it('should return paginated DLQ messages', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          messageId: 'msg-1',
          aggregateType: 'User',
          aggregateId: 'user-1',
          eventType: 'USER_REGISTERED',
          payload: { email: 'test@example.com' },
          errorMessage: 'Processing failed',
          dlqReason: 'Max retries exceeded',
          retryCount: 3,
          createdAt: new Date(),
          dlqAt: new Date(),
        },
      ];

      mockPrismaService.outboxMessage.findMany.mockResolvedValue(
        mockMessages as any
      );
      mockPrismaService.outboxMessage.count.mockResolvedValue(1);

      const result = await service.getDLQMessages(1, 10);

      expect(result).toEqual({
        messages: [
          {
            id: 'msg-1',
            messageId: 'msg-1',
            aggregateType: 'User',
            aggregateId: 'user-1',
            eventType: 'USER_REGISTERED',
            payload: { email: 'test@example.com' },
            errorMessage: 'Processing failed',
            dlqReason: 'Max retries exceeded',
            retryCount: 3,
            createdAt: expect.any(Date),
            dlqAt: expect.any(Date),
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      expect(mockPrismaService.outboxMessage.findMany).toHaveBeenCalledWith({
        where: {
          status: 'DLQ',
        },
        orderBy: { dlqAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by eventType and aggregateType', async () => {
      mockPrismaService.outboxMessage.findMany.mockResolvedValue([]);
      mockPrismaService.outboxMessage.count.mockResolvedValue(0);

      await service.getDLQMessages(1, 10, 'USER_REGISTERED', 'User');

      expect(mockPrismaService.outboxMessage.findMany).toHaveBeenCalledWith({
        where: {
          status: 'DLQ',
          eventType: 'USER_REGISTERED',
          aggregateType: 'User',
        },
        orderBy: { dlqAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.outboxMessage.findMany.mockResolvedValue([]);
      mockPrismaService.outboxMessage.count.mockResolvedValue(25);

      await service.getDLQMessages(2, 10);

      expect(mockPrismaService.outboxMessage.findMany).toHaveBeenCalledWith({
        where: {
          status: 'DLQ',
        },
        orderBy: { dlqAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('getDLQMessageById', () => {
    it('should return DLQ message by ID', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: new Date(),
        dlqAt: new Date(),
      };

      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(
        mockMessage as any
      );

      const result = await service.getDLQMessageById('msg-1');

      expect(result).toEqual({
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: expect.any(Date),
        dlqAt: expect.any(Date),
      });
    });

    it('should return null if message not found', async () => {
      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(null);

      const result = await service.getDLQMessageById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('processDLQMessage', () => {
    it('should retry DLQ message', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: new Date(),
        dlqAt: new Date(),
      };

      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(
        mockMessage as any
      );

      await service.processDLQMessage('msg-1', DLQAction.RETRY, 'Manual retry');

      expect(mockPrismaService.outboxMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: {
          status: 'PENDING',
          retryCount: 0,
          nextRetryAt: null,
          errorMessage: 'Manual retry',
        },
      });
    });

    it('should skip DLQ message', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: new Date(),
        dlqAt: new Date(),
      };

      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(
        mockMessage as any
      );

      await service.processDLQMessage(
        'msg-1',
        DLQAction.SKIP,
        'Skip this message'
      );

      expect(mockPrismaService.outboxMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: {
          status: 'PROCESSED',
          processedAt: expect.any(Date),
          errorMessage: 'Skip this message',
        },
      });
    });

    it('should archive DLQ message', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: new Date(),
        dlqAt: new Date(),
      };

      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(
        mockMessage as any
      );

      await service.processDLQMessage(
        'msg-1',
        DLQAction.ARCHIVE,
        'Archive old message'
      );

      expect(mockPrismaService.outboxMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: {
          payload: {},
          errorMessage: 'Archive old message',
        },
      });
    });

    it('should delete DLQ message', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: new Date(),
        dlqAt: new Date(),
      };

      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(
        mockMessage as any
      );

      await service.processDLQMessage(
        'msg-1',
        DLQAction.DELETE,
        'Delete invalid message'
      );

      expect(mockPrismaService.outboxMessage.delete).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
      });
    });

    it('should throw error for non-existent message', async () => {
      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(null);

      await expect(
        service.processDLQMessage('non-existent', DLQAction.RETRY)
      ).rejects.toThrow('DLQ message with ID non-existent not found');
    });

    it('should throw error for unknown action', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: new Date(),
        dlqAt: new Date(),
      };

      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(
        mockMessage as any
      );

      await expect(
        service.processDLQMessage('msg-1', 'UNKNOWN' as DLQAction)
      ).rejects.toThrow('Unknown DLQ action: UNKNOWN');
    });
  });

  describe('bulkProcessDLQMessages', () => {
    it('should process multiple messages successfully', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: new Date(),
        dlqAt: new Date(),
      };

      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(
        mockMessage as any
      );

      const result = await service.bulkProcessDLQMessages(
        ['msg-1', 'msg-2'],
        DLQAction.RETRY
      );

      expect(result).toEqual({ processed: 2, failed: 0 });
      expect(mockPrismaService.outboxMessage.update).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
        errorMessage: 'Processing failed',
        dlqReason: 'Max retries exceeded',
        retryCount: 3,
        createdAt: new Date(),
        dlqAt: new Date(),
      };

      mockPrismaService.outboxMessage.findFirst
        .mockResolvedValueOnce(mockMessage as any)
        .mockResolvedValueOnce(null); // Second message not found

      const result = await service.bulkProcessDLQMessages(
        ['msg-1', 'msg-2'],
        DLQAction.RETRY
      );

      expect(result).toEqual({ processed: 1, failed: 1 });
    });
  });

  describe('getDLQStatistics', () => {
    it('should return comprehensive DLQ statistics', async () => {
      const mockStats = {
        total: 10,
        byEventType: [
          { eventType: 'USER_REGISTERED', _count: { id: 5 } },
          { eventType: 'PAYMENT_PROCESSED', _count: { id: 3 } },
        ],
        byAggregateType: [
          { aggregateType: 'User', _count: { id: 5 } },
          { aggregateType: 'Payment', _count: { id: 3 } },
        ],
        recentFailures: 2,
        oldestMessage: { dlqAt: new Date('2023-01-01') },
      };

      mockPrismaService.outboxMessage.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(2); // recentFailures

      mockPrismaService.outboxMessage.groupBy
        .mockResolvedValueOnce(mockStats.byEventType as any)
        .mockResolvedValueOnce(mockStats.byAggregateType as any);

      mockPrismaService.outboxMessage.findFirst.mockResolvedValue(
        mockStats.oldestMessage as any
      );

      const result = await service.getDLQStatistics();

      expect(result).toEqual({
        total: 10,
        byEventType: {
          USER_REGISTERED: 5,
          PAYMENT_PROCESSED: 3,
        },
        byAggregateType: {
          User: 5,
          Payment: 3,
        },
        recentFailures: 2,
        oldestMessage: new Date('2023-01-01'),
      });
    });
  });

  describe('searchDLQMessages', () => {
    it('should search DLQ messages by term', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          messageId: 'msg-1',
          aggregateType: 'User',
          aggregateId: 'user-1',
          eventType: 'USER_REGISTERED',
          payload: { email: 'test@example.com' },
          errorMessage: 'Processing failed',
          dlqReason: 'Max retries exceeded',
          retryCount: 3,
          createdAt: new Date(),
          dlqAt: new Date(),
        },
      ];

      mockPrismaService.outboxMessage.findMany.mockResolvedValue(
        mockMessages as any
      );
      mockPrismaService.outboxMessage.count.mockResolvedValue(1);

      const _result = await service.searchDLQMessages(
        'test@example.com',
        1,
        10
      );

      expect(mockPrismaService.outboxMessage.findMany).toHaveBeenCalledWith({
        where: {
          status: 'DLQ',
          OR: [
            {
              messageId: { contains: 'test@example.com', mode: 'insensitive' },
            },
            {
              aggregateId: {
                contains: 'test@example.com',
                mode: 'insensitive',
              },
            },
            {
              eventType: { contains: 'test@example.com', mode: 'insensitive' },
            },
            {
              aggregateType: {
                contains: 'test@example.com',
                mode: 'insensitive',
              },
            },
            {
              errorMessage: {
                contains: 'test@example.com',
                mode: 'insensitive',
              },
            },
            {
              dlqReason: { contains: 'test@example.com', mode: 'insensitive' },
            },
          ],
        },
        orderBy: { dlqAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('archiveOldDLQMessages', () => {
    it('should archive messages older than retention period', async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      mockPrismaService.outboxMessage.updateMany.mockResolvedValue({
        count: 5,
      });

      await service.archiveOldDLQMessages();

      expect(mockPrismaService.outboxMessage.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'DLQ',
          dlqAt: { lt: expect.any(Date) },
        },
        data: {
          payload: {},
          errorMessage: 'Archived due to age',
        },
      });
    });
  });
});
