import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { AppConfig } from '../config/app.config';

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
  ): Promise<'OK' | null> {
    // Handle TTL with setex for simplicity
    if (ttlSeconds) {
      await this.redisClient.setex(key, ttlSeconds, value);
      return 'OK';
    }

    // Handle mode with conditional set
    if (mode === 'NX') {
      const exists = await this.redisClient.exists(key);
      if (exists) return null;
    } else if (mode === 'XX') {
      const exists = await this.redisClient.exists(key);
      if (!exists) return null;
    }

    return this.redisClient.set(key, value);
  }
}
