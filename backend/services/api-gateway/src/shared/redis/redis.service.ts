import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { SetOptions } from 'ioredis';

import { AppConfig } from '../config/app.config';

interface RedisSetOptions extends SetOptions {
  EX?: number; // Expire time in seconds
  NX?: boolean; // Only set if key doesn't exist
  XX?: boolean; // Only set if key exists
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const redisHost = this.configService.get('redisHost', { infer: true });
    const redisPort = this.configService.get('redisPort', { infer: true });

    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      // Add any other Redis options here, like password or db
    });
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
    // ioredis 5.x API - use proper parameter objects
    const options: RedisSetOptions = {};

    if (ttlSeconds && ttlSeconds > 0) {
      options.EX = ttlSeconds;
    }

    if (mode) {
      if (mode === 'NX') {
        options.NX = true;
      } else if (mode === 'XX') {
        options.XX = true;
      }
    }

    return this.redisClient.set(key, value, options);
  }
}
