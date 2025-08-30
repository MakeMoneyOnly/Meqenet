import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { USER_REGISTERED_JOB, USER_QUEUE } from './queue.constants';
import { QueueProducerService } from './queue.producer.service';

describe('QueueProducerService', () => {
  let service: QueueProducerService;
  let mockQueue: Queue;

  beforeEach(async () => {
    const mockQueueValue = {
      add: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueProducerService,
        {
          provide: getQueueToken(USER_QUEUE),
          useValue: mockQueueValue,
        },
      ],
    }).compile();

    service = module.get<QueueProducerService>(QueueProducerService);
    mockQueue = module.get(getQueueToken(USER_QUEUE));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addUserRegisteredJob', () => {
    it('should add job to queue with correct data', async () => {
      const userId = 'user123';
      const email = 'test@example.com';

      await service.addUserRegisteredJob(userId, email);

      expect(mockQueue.add).toHaveBeenCalledWith(USER_REGISTERED_JOB, {
        userId,
        email,
      });
    });
  });
});
