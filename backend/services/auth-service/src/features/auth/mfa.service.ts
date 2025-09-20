import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomInt } from 'crypto';

import { AdaptiveRateLimitingService } from '../../shared/services/adaptive-rate-limiting.service';

// MFA constants
const DEFAULT_OTP_LENGTH = 6;
const BASE_TEN = 10;
const OTP_CACHE_TTL_SECONDS = 300; // 5 minutes

function generateOtp(length = DEFAULT_OTP_LENGTH): string {
  const min = BASE_TEN ** (length - 1);
  const max = BASE_TEN ** length - 1;
  return String(randomInt(min, max));
}

@Injectable()
export class MfaService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly rateLimiter: AdaptiveRateLimitingService
  ) {}

  async requestOtp(
    userId: string,
    channel: 'sms' | 'email'
  ): Promise<{ message: string }> {
    // Rate limit OTP requests per user/channel
    await this.rateLimiter.checkRateLimit(
      userId,
      'unknown',
      `mfa:${channel}`,
      'REQUEST'
    );

    const code = generateOtp(DEFAULT_OTP_LENGTH);
    const key = `otp:${channel}:${userId}`;
    await this.cache.set(key, JSON.stringify({ code }), OTP_CACHE_TTL_SECONDS); // 5 minutes TTL

    // Real implementation would enqueue SMS/Email using provider integration
    return { message: 'OTP sent' };
  }

  async verifyOtp(
    userId: string,
    channel: 'sms' | 'email',
    code: string
  ): Promise<{ verified: boolean }> {
    const key = `otp:${channel}:${userId}`;

    // Rate limit OTP verification attempts
    await this.rateLimiter.checkRateLimit(
      userId,
      'unknown',
      `mfa:${channel}`,
      'VERIFY'
    );

    const data = await this.cache.get<string | undefined>(key);
    const payload = data ? (JSON.parse(data) as { code: string }) : undefined;

    if (!payload) {
      await this.rateLimiter.recordFailedRequest(
        userId,
        'unknown',
        'OTP_EXPIRED'
      );
      throw new UnauthorizedException('OTP expired or not found');
    }

    if (payload.code !== code) {
      await this.rateLimiter.recordFailedRequest(
        userId,
        'unknown',
        'INVALID_OTP'
      );
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.cache.del(key);
    await this.rateLimiter.recordSuccessfulRequest(userId, 'unknown');
    return { verified: true };
  }
}
