import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { USER_QUEUE, USER_REGISTERED_JOB } from './queue.constants';

@Injectable()
export class QueueProducerService {
  constructor(@InjectQueue(USER_QUEUE) private readonly userQueue: Queue) {}

  async addUserRegisteredJob(userId: string, email: string): Promise<void> {
    await this.userQueue.add(USER_REGISTERED_JOB, { userId, email });
  }
}
