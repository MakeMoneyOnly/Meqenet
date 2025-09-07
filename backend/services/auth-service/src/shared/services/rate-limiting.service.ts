import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

// Time conversion constants
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

// Rate limiting constants
const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_MAX_REQUESTS = 5;
const LOGIN_BLOCK_MINUTES = 15;

const PASSWORD_RESET_WINDOW_HOURS = 1;
const PASSWORD_RESET_MAX_REQUESTS = 3;
const PASSWORD_RESET_BLOCK_HOURS = 1;

const GENERAL_WINDOW_MINUTES = 1;
const GENERAL_MAX_REQUESTS = 10;
const GENERAL_BLOCK_MINUTES = 5;

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs: number; // How long to block after exceeding limit
}

interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  blockedUntil?: Date;
}

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);

  // Default rate limit configurations for different endpoints
  private readonly configs = {
    login: {
      windowMs:
        LOGIN_WINDOW_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
      maxRequests: LOGIN_MAX_REQUESTS,
      blockDurationMs:
        LOGIN_BLOCK_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
    },
    passwordReset: {
      windowMs:
        PASSWORD_RESET_WINDOW_HOURS *
        SECONDS_PER_MINUTE *
        SECONDS_PER_MINUTE *
        MILLISECONDS_PER_SECOND,
      maxRequests: PASSWORD_RESET_MAX_REQUESTS,
      blockDurationMs:
        PASSWORD_RESET_BLOCK_HOURS *
        SECONDS_PER_MINUTE *
        SECONDS_PER_MINUTE *
        MILLISECONDS_PER_SECOND,
    },
    general: {
      windowMs:
        GENERAL_WINDOW_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
      maxRequests: GENERAL_MAX_REQUESTS,
      blockDurationMs:
        GENERAL_BLOCK_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
    },
  };

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Check if a request should be rate limited
   */
  async checkRateLimit(
    key: string,
    config: RateLimitConfig = this.configs.general
  ): Promise<RateLimitResult> {
    const { windowMs, maxRequests, blockDurationMs } = config;

    try {
      // Check if key is currently blocked
      const blockKey = `block:${key}`;
      const blockedUntil = await this.redis.get(blockKey);

      if (blockedUntil) {
        const blockedUntilTime = new Date(parseInt(blockedUntil));
        if (blockedUntilTime > new Date()) {
          return {
            allowed: false,
            remainingRequests: 0,
            resetTime: blockedUntilTime,
            blockedUntil: blockedUntilTime,
          };
        } else {
          // Block expired, remove it
          await this.redis.del(blockKey);
        }
      }

      // Get current request count
      const windowKey = `rate:${key}`;
      const currentCount = await this.redis.incr(windowKey);

      // Set expiry on first request in window
      if (currentCount === 1) {
        await this.redis.pexpire(windowKey, windowMs);
      }

      const remainingRequests = Math.max(0, maxRequests - currentCount);
      const resetTime = new Date(Date.now() + windowMs);

      // Check if limit exceeded
      if (currentCount > maxRequests) {
        // Block the key
        const blockedUntilTime = new Date(Date.now() + blockDurationMs);
        await this.redis.set(
          blockKey,
          blockedUntilTime.getTime().toString(),
          'PX',
          blockDurationMs
        );

        this.logger.warn(
          `Rate limit exceeded for key: ${key}, blocked until ${blockedUntilTime.toISOString()}`
        );

        return {
          allowed: false,
          remainingRequests: 0,
          resetTime: blockedUntilTime,
          blockedUntil: blockedUntilTime,
        };
      }

      return {
        allowed: true,
        remainingRequests,
        resetTime,
      };
    } catch (error) {
      this.logger.error(`Rate limiting error for key ${key}:`, error);
      // On Redis error, allow request to prevent blocking legitimate users
      return {
        allowed: true,
        remainingRequests: 999,
        resetTime: new Date(Date.now() + windowMs),
      };
    }
  }

  /**
   * Check rate limit for login attempts
   */
  async checkLoginRateLimit(
    identifier: string,
    ipAddress: string
  ): Promise<RateLimitResult> {
    // Use both user identifier and IP for more granular control
    const key = `login:${identifier}:${ipAddress}`;
    return this.checkRateLimit(key, this.configs.login);
  }

  /**
   * Check rate limit for password reset requests
   */
  async checkPasswordResetRateLimit(
    identifier: string,
    ipAddress: string
  ): Promise<RateLimitResult> {
    const key = `password_reset:${identifier}:${ipAddress}`;
    return this.checkRateLimit(key, this.configs.passwordReset);
  }

  /**
   * Check rate limit for general API endpoints
   */
  async checkGeneralRateLimit(
    endpoint: string,
    identifier: string
  ): Promise<RateLimitResult> {
    const key = `general:${endpoint}:${identifier}`;
    return this.checkRateLimit(key, this.configs.general);
  }

  /**
   * Reset rate limit for a specific key (admin function)
   */
  async resetRateLimit(key: string): Promise<void> {
    try {
      const windowKey = `rate:${key}`;
      const blockKey = `block:${key}`;

      await Promise.all([this.redis.del(windowKey), this.redis.del(blockKey)]);

      this.logger.log(`Rate limit reset for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to reset rate limit for key ${key}:`, error);
    }
  }

  /**
   * Get rate limit status for monitoring
   */
  async getRateLimitStatus(key: string): Promise<{
    currentCount: number;
    isBlocked: boolean;
    blockedUntil?: Date;
    resetTime?: Date;
  }> {
    try {
      const windowKey = `rate:${key}`;
      const blockKey = `block:${key}`;

      const [currentCount, blockedUntil] = await Promise.all([
        this.redis.get(windowKey),
        this.redis.get(blockKey),
      ]);

      const isBlocked = Boolean(
        blockedUntil && parseInt(blockedUntil) > Date.now()
      );

      const result: {
        currentCount: number;
        isBlocked: boolean;
        blockedUntil?: Date;
        resetTime?: Date;
      } = {
        currentCount: parseInt(currentCount || '0'),
        isBlocked,
      };

      if (isBlocked && blockedUntil) {
        result.blockedUntil = new Date(parseInt(blockedUntil));
      }

      if (currentCount) {
        const ttl = await this.redis.pttl(windowKey);
        if (ttl > 0) {
          result.resetTime = new Date(Date.now() + ttl);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get rate limit status for key ${key}:`,
        error
      );
      return {
        currentCount: 0,
        isBlocked: false,
      };
    }
  }

  /**
   * Clean up expired rate limit data (should be called periodically)
   */
  async cleanup(): Promise<void> {
    try {
      // This is mainly handled by Redis TTL, but we can add custom cleanup logic if needed
      this.logger.debug('Rate limiting cleanup completed');
    } catch (error) {
      this.logger.error('Rate limiting cleanup failed:', error);
    }
  }
}
