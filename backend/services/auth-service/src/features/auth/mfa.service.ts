import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomInt } from 'crypto';

import { AdaptiveRateLimitingService } from '../../shared/services/adaptive-rate-limiting.service';

function generateOtp(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
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

    const code = generateOtp(6);
    const key = `otp:${channel}:${userId}`;
    await this.cache.set(key, JSON.stringify({ code }), 300); // 5 minutes TTL

    // Real implementation would enqueue SMS/Email using provider integration
    return { message: 'OTP sent' };
  }

  async verifyOtp(
    userId: string,
    channel: 'sms' | 'email',
    code: string
  ): Promise<{ verified: boolean }> {
    const key = `otp:${channel}:${userId}`;
    const data = await this.cache.get<string | undefined>(key);
    const payload = data ? (JSON.parse(data) as { code: string }) : undefined;
    if (!payload) throw new UnauthorizedException('OTP expired or not found');
    if (payload.code !== code) throw new UnauthorizedException('Invalid OTP');
    await this.cache.del(key);
    return { verified: true };
  }
}
