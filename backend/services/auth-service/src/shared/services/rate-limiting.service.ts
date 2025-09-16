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
   * Check rate limit for authenticated endpoints with enhanced granularity
   * This provides more sophisticated rate limiting for sensitive operations
   */
  async checkAuthenticatedEndpointRateLimit(
    endpoint: string,
    userId: string,
    userRole: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<RateLimitResult> {
    // Create multi-dimensional rate limiting key for enhanced security
    const baseKey = `auth:${endpoint}:${userId}:${ipAddress}`;

    // Apply different rate limits based on user role
    const roleBasedConfig = this.getRoleBasedRateLimitConfig(userRole);

    // Check primary rate limit (user + IP combination)
    const primaryKey = `${baseKey}:primary`;
    const primaryResult = await this.checkRateLimit(
      primaryKey,
      roleBasedConfig.primary
    );

    if (!primaryResult.allowed) {
      return primaryResult;
    }

    // Check secondary rate limit (user + user agent for device fingerprinting)
    if (userAgent) {
      const secondaryKey = `${baseKey}:ua:${this.hashUserAgent(userAgent)}`;
      const secondaryResult = await this.checkRateLimit(
        secondaryKey,
        roleBasedConfig.secondary
      );

      if (!secondaryResult.allowed) {
        return secondaryResult;
      }
    }

    // Check global user rate limit across all endpoints
    const globalKey = `auth:global:${userId}`;
    const globalResult = await this.checkRateLimit(
      globalKey,
      roleBasedConfig.global
    );

    return globalResult;
  }

  /**
   * Check rate limit for sensitive financial operations
   */
  async checkFinancialOperationRateLimit(
    operation: string,
    userId: string,
    userRole: string,
    ipAddress: string,
    amount?: number
  ): Promise<RateLimitResult> {
    const baseKey = `financial:${operation}:${userId}:${ipAddress}`;

    // Stricter limits for financial operations
    const financialConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: this.getFinancialOperationLimit(userRole, amount),
      blockDurationMs: 60 * 60 * 1000, // 1 hour block
    };

    const primaryKey = `${baseKey}:primary`;
    const result = await this.checkRateLimit(primaryKey, financialConfig);

    if (!result.allowed) {
      // Log financial operation rate limit violation for compliance
      this.logger.warn(
        `Financial operation rate limit exceeded: ${operation}, user: ${userId}, role: ${userRole}, IP: ${ipAddress}`
      );
    }

    return result;
  }

  /**
   * Check rate limit for admin operations with enhanced monitoring
   */
  async checkAdminOperationRateLimit(
    operation: string,
    adminId: string,
    adminRole: string,
    ipAddress: string
  ): Promise<RateLimitResult> {
    const baseKey = `admin:${operation}:${adminId}:${ipAddress}`;

    // Very strict limits for admin operations
    const adminConfig = {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: this.getAdminOperationLimit(adminRole),
      blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    };

    const primaryKey = `${baseKey}:primary`;
    const result = await this.checkRateLimit(primaryKey, adminConfig);

    if (!result.allowed) {
      // Log admin operation rate limit violation for security monitoring
      this.logger.error(
        `Admin operation rate limit exceeded: ${operation}, admin: ${adminId}, role: ${adminRole}, IP: ${ipAddress}`
      );
    }

    return result;
  }

  /**
   * Get role-based rate limit configuration
   */
  private getRoleBasedRateLimitConfig(userRole: string) {
    // Define different rate limits based on user role for security hierarchy
    const configs = {
      ADMIN: {
        primary: {
          windowMs: 60 * 1000,
          maxRequests: 60,
          blockDurationMs: 5 * 60 * 1000,
        }, // 60 req/min
        secondary: {
          windowMs: 5 * 60 * 1000,
          maxRequests: 200,
          blockDurationMs: 15 * 60 * 1000,
        }, // 200 req/5min
        global: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 1000,
          blockDurationMs: 60 * 60 * 1000,
        }, // 1000 req/15min
      },
      SUPPORT: {
        primary: {
          windowMs: 60 * 1000,
          maxRequests: 30,
          blockDurationMs: 10 * 60 * 1000,
        }, // 30 req/min
        secondary: {
          windowMs: 5 * 60 * 1000,
          maxRequests: 100,
          blockDurationMs: 30 * 60 * 1000,
        }, // 100 req/5min
        global: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 500,
          blockDurationMs: 2 * 60 * 60 * 1000,
        }, // 500 req/15min
      },
      MERCHANT: {
        primary: {
          windowMs: 60 * 1000,
          maxRequests: 20,
          blockDurationMs: 15 * 60 * 1000,
        }, // 20 req/min
        secondary: {
          windowMs: 5 * 60 * 1000,
          maxRequests: 60,
          blockDurationMs: 60 * 60 * 1000,
        }, // 60 req/5min
        global: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 300,
          blockDurationMs: 4 * 60 * 60 * 1000,
        }, // 300 req/15min
      },
      CUSTOMER: {
        primary: {
          windowMs: 60 * 1000,
          maxRequests: 10,
          blockDurationMs: 30 * 60 * 1000,
        }, // 10 req/min
        secondary: {
          windowMs: 5 * 60 * 1000,
          maxRequests: 30,
          blockDurationMs: 2 * 60 * 60 * 1000,
        }, // 30 req/5min
        global: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 100,
          blockDurationMs: 6 * 60 * 60 * 1000,
        }, // 100 req/15min
      },
    };

    return configs[userRole as keyof typeof configs] || configs.CUSTOMER;
  }

  /**
   * Get financial operation rate limit based on role and amount
   */
  private getFinancialOperationLimit(
    userRole: string,
    amount?: number
  ): number {
    const baseLimits = {
      ADMIN: 50,
      SUPPORT: 20,
      MERCHANT: 15,
      CUSTOMER: 5,
    };

    const baseLimit =
      baseLimits[userRole as keyof typeof baseLimits] || baseLimits.CUSTOMER;

    // Reduce limit for high-value transactions
    if (amount && amount > 10000) {
      return Math.floor(baseLimit * 0.5); // 50% reduction for high-value tx
    } else if (amount && amount > 1000) {
      return Math.floor(baseLimit * 0.7); // 30% reduction for medium-value tx
    }

    return baseLimit;
  }

  /**
   * Get admin operation rate limit based on role
   */
  private getAdminOperationLimit(adminRole: string): number {
    const limits = {
      ADMIN: 20,
      SUPPORT: 10,
      MERCHANT: 5,
    };

    return limits[adminRole as keyof typeof limits] || 5;
  }

  /**
   * Hash user agent for device fingerprinting (privacy-preserving)
   */
  private hashUserAgent(userAgent: string): string {
    // Simple hash function for user agent - in production, use a proper crypto hash
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if an IP address is in a suspicious range (basic implementation)
   */
  async isSuspiciousIP(ipAddress: string): Promise<boolean> {
    // This is a basic implementation - in production, integrate with threat intelligence services
    const suspiciousRanges = [
      '10.0.0.0/8', // Private networks
      '172.16.0.0/12', // Private networks
      '192.168.0.0/16', // Private networks
      '127.0.0.0/8', // Loopback
    ];

    // Simple check - in production, use proper IP range checking
    return suspiciousRanges.some(range =>
      ipAddress.startsWith(range.split('/')[0])
    );
  }

  /**
   * Get rate limit analytics for monitoring and alerting
   */
  async getRateLimitAnalytics(_timeWindowMs: number = 60 * 60 * 1000): Promise<{
    totalRequests: number;
    blockedRequests: number;
    topBlockedIPs: Array<{ ip: string; count: number }>;
    topBlockedUsers: Array<{ userId: string; count: number }>;
  }> {
    try {
      // This would require Redis SCAN operations in production
      // For now, return mock data structure
      return {
        totalRequests: 0,
        blockedRequests: 0,
        topBlockedIPs: [],
        topBlockedUsers: [],
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit analytics:', error);
      return {
        totalRequests: 0,
        blockedRequests: 0,
        topBlockedIPs: [],
        topBlockedUsers: [],
      };
    }
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
