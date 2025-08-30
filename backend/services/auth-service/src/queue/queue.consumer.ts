import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { USER_QUEUE, USER_REGISTERED_JOB } from './queue.constants';

@Processor(USER_QUEUE)
export class QueueConsumer extends WorkerHost {
  private readonly logger = new Logger(QueueConsumer.name);

  async process(
    job: Job<{ email: string }, unknown, string>
  ): Promise<unknown> {
    switch (job.name) {
      case USER_REGISTERED_JOB:
        const data = job.data as { email: string };
        this.logger.log(
          `Simulating sending welcome email to user: ${data.email}`
        );
        // In a real application, you would call an email service here.
        return Promise.resolve();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return Promise.reject(new Error('Unknown job name'));
    }
  }
}
