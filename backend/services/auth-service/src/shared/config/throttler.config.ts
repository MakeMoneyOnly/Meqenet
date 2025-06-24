import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

const MS_IN_SECOND = 1000;

/**
 * Throttler Configuration Factory
 *
 * Configures rate limiting for the authentication service
 * to prevent brute force attacks and ensure service stability.
 */
export const throttlerConfig = {
  useFactory: (configService: ConfigService): ThrottlerModuleOptions => [
    {
      ttl:
        parseInt(configService.get<string>('THROTTLE_TTL') ?? '60', 10) *
        MS_IN_SECOND,
      limit: parseInt(configService.get<string>('THROTTLE_LIMIT') ?? '100', 10),
    },
  ],
  inject: [ConfigService],
};
