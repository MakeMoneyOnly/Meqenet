import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { RedisConfigService } from '../shared/config/redis.config';

import { USER_QUEUE } from './queue.constants';
import { QueueConsumer } from './queue.consumer';
import { QueueProducerService } from './queue.producer.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: async (redisConfig: RedisConfigService) => ({
        connection: redisConfig.connection,
      }),
      inject: [RedisConfigService],
    }),
    BullModule.registerQueue({
      name: USER_QUEUE,
    }),
  ],
  providers: [QueueProducerService, QueueConsumer],
  exports: [QueueProducerService],
})
export class QueueModule {}
