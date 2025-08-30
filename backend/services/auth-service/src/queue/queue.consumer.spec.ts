import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { USER_REGISTERED_JOB } from './queue.constants';
import { QueueConsumer } from './queue.consumer';

describe('QueueConsumer', () => {
  let consumer: QueueConsumer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueConsumer],
    }).compile();

    consumer = module.get<QueueConsumer>(QueueConsumer);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('process', () => {
    it('should process USER_REGISTERED_JOB successfully', async () => {
      const mockJob = {
        name: USER_REGISTERED_JOB,
        data: { email: 'test@example.com', userId: '123' },
      } as Job;

      const loggerSpy = vi
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => {});

      await expect(consumer.process(mockJob)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Simulating sending welcome email to user: test@example.com'
      );

      loggerSpy.mockRestore();
    });

    it('should handle unknown job names', async () => {
      const mockJob = {
        name: 'UNKNOWN_JOB',
        data: {},
      } as Job;

      const loggerSpy = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => {});

      await expect(consumer.process(mockJob)).rejects.toThrow(
        'Unknown job name'
      );
      expect(loggerSpy).toHaveBeenCalledWith('Unknown job name: UNKNOWN_JOB');

      loggerSpy.mockRestore();
    });
  });
});
