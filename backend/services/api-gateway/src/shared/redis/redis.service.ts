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
      this.configService.get<string>('USE_REDIS_MOCK') === 'true' || this.configService.get<string>('NODE_ENV') === 'test';

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
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
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
    // Build varargs for ioredis: set key value [EX seconds] [NX|XX]
    const args: Array<string | number> = [key, value];
    if (ttlSeconds && ttlSeconds > 0) {
      args.push('EX', ttlSeconds);
    }
    if (mode) {
      args.push(mode);
    }
    const res = await this.redisClient.set(...args);
    return res;
  }
}
