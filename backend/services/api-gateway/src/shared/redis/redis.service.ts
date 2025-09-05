import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

import { AppConfig } from '../config/app.config';

// no-op

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const redisHost = this.configService.get('redisHost', { infer: true });
    const redisPort = this.configService.get('redisPort', { infer: true });

    const useMock =
      this.configService.get('useRedisMock', { infer: true }) || this.configService.get('nodeEnv', { infer: true }) === 'test';

    if (useMock) {
      try {
        // Use in-memory Redis mock for tests/E2E to avoid external dependency
        // Cast to align with ioredis Redis type interface usage
        this.redisClient = new (RedisMock as unknown as typeof Redis)();
      } catch (error) {
        throw error;
      }
    } else {
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        // Add any other Redis options here, like password or db
      });
    }
  }

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
    mode?: 'NX' | 'XX'
  ): Promise<string | null> {
    // Use simple, compatible Redis operations
    if (ttlSeconds && ttlSeconds > 0) {
      // For TTL - use setex which is widely supported
      return this.redisClient.setex(key, ttlSeconds, value);
    } else if (mode) {
      // For mode only - use basic set operations
      if (mode === 'NX') {
        return this.redisClient.set(key, value, 'NX');
      } else {
        return this.redisClient.set(key, value, 'XX');
      }
    } else {
      // Simple set
      return this.redisClient.set(key, value);
    }
  }
}
