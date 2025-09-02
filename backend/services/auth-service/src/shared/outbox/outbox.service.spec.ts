import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService, OutboxMessage, OutboxStatus } from './outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingProducerService } from '../../infrastructure/messaging/messaging.producer.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('OutboxService', () => {
  let service: OutboxService;
  let _prismaService: import('vitest').MockedObject<PrismaService>;
  let _messagingProducer: import('vitest').MockedObject<MessagingProducerService>;
  let mockPrismaService: any;
  let mockMessagingProducer: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock Date.now for consistent testing
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000);

    // Create fresh mocks for each test that mimic service structure
    const mockPrismaInstance = {
      outboxMessage: {
        create: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
        groupBy: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const mockMessagingProducerInstance = {
      addUserRegisteredJob: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Logger to prevent actual logging during tests
    const mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        {
          provide: PrismaService,
          useValue: mockPrismaInstance,
        },
        {
          provide: MessagingProducerService,
          useValue: mockMessagingProducerInstance,
        },
      ],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
    _prismaService = module.get(PrismaService);
    _messagingProducer = module.get(MessagingProducerService);

    // Manually assign the mocks to the service instance
    (service as any).prisma = mockPrismaInstance;
    (service as any).messagingProducer = mockMessagingProducerInstance;
    (service as any).logger = mockLogger;

    // Store references to mocks for test access
    mockPrismaService = mockPrismaInstance;
    mockMessagingProducer = mockMessagingProducerInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log initialization message', async () => {
      const loggerSpy = vi.spyOn((service as any).logger, 'log');

      await service.onModuleInit();

      expect(loggerSpy).toHaveBeenCalledWith('OutboxService initialized');
    });
  });

  describe('store', () => {
    it('should store message in outbox successfully', async () => {
      const message: OutboxMessage = {
        messageId: 'msg-123',
        aggregateType: 'User',
        aggregateId: 'user-456',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com', name: 'John Doe' },
        metadata: { source: 'auth-service' },
      };

      const mockCreatedMessage = {
        id: 'db-id-123',
        ...message,
        status: OutboxStatus.PENDING,
        maxRetries: 3,
        retryCount: 0,
        createdAt: new Date(),
      };

      mockPrismaService.outboxMessage.create.mockResolvedValue(
        mockCreatedMessage as any
      );

      await service.store(message);

      expect(mockPrismaService.outboxMessage.create).toHaveBeenCalledWith({
        data: {
          messageId: 'msg-123',
          aggregateType: 'User',
          aggregateId: 'user-456',
          eventType: 'USER_REGISTERED',
          payload: { email: 'test@example.com', name: 'John Doe' },
          metadata: { source: 'auth-service' },
          status: OutboxStatus.PENDING,
          maxRetries: 3,
        },
      });
    });

    it('should handle errors when storing message', async () => {
      const message: OutboxMessage = {
        messageId: 'msg-123',
        aggregateType: 'User',
        aggregateId: 'user-456',
        eventType: 'USER_REGISTERED',
        payload: { email: 'test@example.com' },
      };

      const error = new Error('Database connection failed');
      mockPrismaService.outboxMessage.create.mockRejectedValue(error);

      await expect(service.store(message)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should use default empty objects for payload and metadata', async () => {
      const message: OutboxMessage = {
        messageId: 'msg-123',
        aggregateType: 'User',
        aggregateId: 'user-456',
        eventType: 'USER_REGISTERED',
      };

      mockPrismaService.outboxMessage.create.mockResolvedValue({} as any);

      await service.store(message);

      expect(mockPrismaService.outboxMessage.create).toHaveBeenCalledWith({
        data: {
          messageId: 'msg-123',
          aggregateType: 'User',
          aggregateId: 'user-456',
          eventType: 'USER_REGISTERED',
          payload: {},
          metadata: {},
          status: OutboxStatus.PENDING,
          maxRetries: 3,
        },
      });
    });
  });

  describe('processPendingMessages', () => {
    it('should process pending messages successfully', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          messageId: 'msg-1',
          aggregateType: 'User',
          aggregateId: 'user-1',
          eventType: 'USER_REGISTERED',
          payload: { email: 'user1@example.com' },
          status: OutboxStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
        },
        {
          id: 'msg-2',
          messageId: 'msg-2',
          aggregateType: 'User',
          aggregateId: 'user-2',
          eventType: 'USER_REGISTERED',
          payload: { email: 'user2@example.com' },
          status: OutboxStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.outboxMessage.findMany.mockResolvedValue(
        mockMessages as any
      );
      mockMessagingProducer.addUserRegisteredJob.mockResolvedValue();

      await service.processPendingMessages();

      expect(mockPrismaService.outboxMessage.update).toHaveBeenCalledTimes(4); // 2 processing + 2 processed
      expect(mockMessagingProducer.addUserRegisteredJob).toHaveBeenCalledTimes(
        2
      );
    });

    it('should handle empty pending messages', async () => {
      mockPrismaService.outboxMessage.findMany.mockResolvedValue([]);

      await service.processPendingMessages();

      expect(mockPrismaService.outboxMessage.findMany).toHaveBeenCalledWith({
        where: {
          status: OutboxStatus.PENDING,
          OR: [
            { nextRetryAt: null },
            { nextRetryAt: { lte: expect.any(Date) } },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      expect(mockMessagingProducer.addUserRegisteredJob).not.toHaveBeenCalled();
    });

    it('should handle processing errors and move to DLQ', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'user1@example.com' },
        status: OutboxStatus.PENDING,
        retryCount: 2, // Near max retries
        maxRetries: 3,
        createdAt: new Date(),
      };

      mockPrismaService.outboxMessage.findMany.mockResolvedValue([
        mockMessage,
      ] as any);
      mockMessagingProducer.addUserRegisteredJob.mockRejectedValue(
        new Error('Queue unavailable')
      );

      await service.processPendingMessages();

      // Should move to DLQ after max retries
      expect(mockPrismaService.outboxMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: {
          status: OutboxStatus.DLQ,
          errorMessage: 'Queue unavailable',
          dlqReason: 'Max retries exceeded',
          dlqAt: expect.any(Date),
        },
      });
    });

    it('should schedule retry with exponential backoff', async () => {
      const mockMessage = {
        id: 'msg-1',
        messageId: 'msg-1',
        aggregateType: 'User',
        aggregateId: 'user-1',
        eventType: 'USER_REGISTERED',
        payload: { email: 'user1@example.com' },
        status: OutboxStatus.PENDING,
        retryCount: 0, // First retry
        maxRetries: 3,
        createdAt: new Date(),
      };

      mockPrismaService.outboxMessage.findMany.mockResolvedValue([
        mockMessage,
      ] as any);
      mockMessagingProducer.addUserRegisteredJob.mockRejectedValue(
        new Error('Temporary failure')
      );

      await service.processPendingMessages();

      // Should schedule retry with exponential backoff (1 minute * 2^0 = 1 minute)
      expect(mockPrismaService.outboxMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: {
          status: OutboxStatus.PENDING,
          errorMessage: 'Temporary failure',
          nextRetryAt: expect.any(Date),
        },
      });
    });
  });

  describe('publishMessage', () => {
    it('should handle USER_REGISTERED events', async () => {
      const message = {
        eventType: 'USER_REGISTERED',
        aggregateId: 'user-123',
        payload: { email: 'test@example.com' },
      };

      await (service as any).publishMessage(message);

      expect(mockMessagingProducer.addUserRegisteredJob).toHaveBeenCalledWith(
        'user-123',
        'test@example.com'
      );
    });

    it('should handle USER_LOGIN events', async () => {
      const message = {
        eventType: 'USER_LOGIN',
        aggregateId: 'user-123',
        payload: {},
      };

      await (service as any).publishMessage(message);

      // USER_LOGIN doesn't have specific handling, just logs
      expect(mockMessagingProducer.addUserRegisteredJob).not.toHaveBeenCalled();
    });

    it('should handle PASSWORD_CHANGED events', async () => {
      const message = {
        eventType: 'PASSWORD_CHANGED',
        aggregateId: 'user-123',
        payload: {},
      };

      await (service as any).publishMessage(message);

      // PASSWORD_CHANGED doesn't have specific handling, just logs
      expect(mockMessagingProducer.addUserRegisteredJob).not.toHaveBeenCalled();
    });

    it('should throw error for unknown event types', async () => {
      const message = {
        eventType: 'UNKNOWN_EVENT',
        aggregateId: 'user-123',
        payload: {},
      };

      await expect((service as any).publishMessage(message)).rejects.toThrow(
        'Unsupported event type: UNKNOWN_EVENT'
      );
    });

    it('should handle invalid USER_REGISTERED payload', async () => {
      const message = {
        eventType: 'USER_REGISTERED',
        aggregateId: 'user-123',
        payload: {}, // Missing email
      };

      const loggerSpy = vi.spyOn((service as any).logger, 'error');

      await (service as any).publishMessage(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Invalid payload for USER_REGISTERED event: user-123'
      );

      expect(mockMessagingProducer.addUserRegisteredJob).not.toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return comprehensive statistics', async () => {
      const mockStats = [
        { status: OutboxStatus.PENDING, _count: { id: 5 } },
        { status: OutboxStatus.PROCESSING, _count: { id: 2 } },
        { status: OutboxStatus.PROCESSED, _count: { id: 100 } },
        { status: OutboxStatus.FAILED, _count: { id: 3 } },
        { status: OutboxStatus.DLQ, _count: { id: 1 } },
      ];

      mockPrismaService.outboxMessage.groupBy.mockResolvedValue(
        mockStats as any
      );

      const result = await service.getStatistics();

      expect(result).toEqual({
        pending: 5,
        processing: 2,
        processed: 100,
        failed: 3,
        dlq: 1,
      });
    });

    it('should handle missing status counts', async () => {
      const mockStats = [
        { status: OutboxStatus.PENDING, _count: { id: 5 } },
        // Missing other statuses
      ];

      mockPrismaService.outboxMessage.groupBy.mockResolvedValue(
        mockStats as any
      );

      const result = await service.getStatistics();

      expect(result).toEqual({
        pending: 5,
        processing: 0,
        processed: 0,
        failed: 0,
        dlq: 0,
      });
    });
  });

  describe('retryFailedMessages', () => {
    it('should retry messages that have not exceeded max retries', async () => {
      mockPrismaService.outboxMessage.updateMany.mockResolvedValue({
        count: 3,
      });

      const result = await service.retryFailedMessages();

      expect(result).toBe(3);
      expect(mockPrismaService.outboxMessage.updateMany).toHaveBeenCalledWith({
        where: {
          status: OutboxStatus.FAILED,
          retryCount: { lt: 3 }, // maxRetries
        },
        data: {
          status: OutboxStatus.PENDING,
          nextRetryAt: null,
        },
      });
    });

    it('should return 0 when no messages to retry', async () => {
      mockPrismaService.outboxMessage.updateMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.retryFailedMessages();

      expect(result).toBe(0);
    });
  });

  describe('cleanupProcessedMessages', () => {
    it('should delete old processed messages', async () => {
      mockPrismaService.outboxMessage.deleteMany.mockResolvedValue({
        count: 25,
      });

      await service.cleanupProcessedMessages();

      expect(mockPrismaService.outboxMessage.deleteMany).toHaveBeenCalledWith({
        where: {
          status: OutboxStatus.PROCESSED,
          processedAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      const error = new Error('Database cleanup failed');
      mockPrismaService.outboxMessage.deleteMany.mockRejectedValue(error);

      const loggerSpy = vi.spyOn((service as any).logger, 'error');

      await service.cleanupProcessedMessages();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error cleaning up processed messages',
        error
      );
    });
  });
});
