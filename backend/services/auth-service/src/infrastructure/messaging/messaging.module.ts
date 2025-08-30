import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { RedisConfigService } from '../../shared/config/redis.config';

import { USER_QUEUE } from './messaging.constants';
import { MessagingConsumer } from './messaging.consumer';
import { MessagingProducerService } from './messaging.producer.service';

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
  providers: [MessagingProducerService, MessagingConsumer],
  exports: [MessagingProducerService],
})
export class MessagingModule {}
