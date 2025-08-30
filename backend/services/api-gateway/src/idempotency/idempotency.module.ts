import { Module } from '@nestjs/common';

import { RedisModule } from '../shared/redis/redis.module';

import { IdempotencyMiddleware } from './idempotency.middleware';

@Module({
  imports: [RedisModule],
  providers: [IdempotencyMiddleware],
  exports: [IdempotencyMiddleware],
})
export class IdempotencyModule {}
