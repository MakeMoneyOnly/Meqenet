import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from './app.config';

const DEFAULT_REDIS_PORT = 6379;

@Injectable()
export class RedisConfigService {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  get host(): string {
    return this.configService.get('redisHost', { infer: true }) ?? 'localhost';
  }

  get port(): number {
    const port = this.configService.get('redisPort', { infer: true });
    return port ? parseInt(port, 10) : DEFAULT_REDIS_PORT;
  }

  get connection(): { host: string; port: number } {
    return {
      host: this.host,
      port: this.port,
    };
  }
}
