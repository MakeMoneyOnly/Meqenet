import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SecurityMonitoringService } from './security-monitoring.service';

// Constants for magic numbers
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

const NORMAL_WINDOW_MINUTES = 15;
const NORMAL_MAX_REQUESTS = 100;
const SUSPICIOUS_MAX_REQUESTS = 25;
const BLOCKED_WINDOW_HOURS = 1;
const BLOCKED_MAX_REQUESTS = 5;

const _HIGH_VELOCITY_MULTIPLIER = 5.0;
const _UNUSUAL_LOCATION_THRESHOLD = 0.8;
const _RESET_WINDOW_MULTIPLIER = 3.0;
const _SUSPICIOUS_TIME_WINDOW_HOURS = 2;

const _CLEANUP_WINDOW_DAYS = 24;
const _CLEANUP_REQUEST_THRESHOLD = 0;

const _RATE_LIMIT_MULTIPLIER_LOW = 0.5;
const _RATE_LIMIT_MULTIPLIER_HIGH = 0.25;
const _BLOCK_DURATION_MINUTES = 15;

const _MAX_REQUESTS_BASE = 10;
const _REQUEST_VELOCITY_RATIO_THRESHOLD = 5.0;

const _THREAT_LEVEL_ESCALATION_THRESHOLD = 10;
const _RAPID_SUCCESSION_MINUTES = 5;
const _RAPID_SUCCESSION_TIME_SECONDS =
  _RAPID_SUCCESSION_MINUTES * SECONDS_PER_MINUTE;

const RECENT_ACTIVITY_WINDOW_MINUTES = 30;
const FAILURE_COUNT_THRESHOLD = 5;
const RATE_LIMIT_VIOLATION_THRESHOLD = 3;
const MEDIUM_THREAT_FAILURE_THRESHOLD = 2;
const MEDIUM_THREAT_RATE_LIMIT_THRESHOLD = 1;
const DEFAULT_ADAPTIVE_MULTIPLIER = 1.0;
const HIGH_SUCCESS_RATE_THRESHOLD = 0.9;

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface UserRateLimitStatus {
  userId: string;
  currentRequests: number;
  windowStart: Date;
  config: RateLimitConfig;
  isBlocked: boolean;
  blockExpiry?: Date;
  threatLevel: 'low' | 'medium' | 'high';
  adaptiveMultiplier: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  retryAfter?: number;
  reason?: string;
}

@Injectable()
export class AdaptiveRateLimitingService {
  private readonly logger = new Logger(AdaptiveRateLimitingService.name);

  // In-memory storage for rate limit tracking
  private userLimits: Map<string, UserRateLimitStatus> = new Map();
  private ipLimits: Map<string, UserRateLimitStatus> = new Map();

  // Default rate limit configurations
  private readonly defaultConfigs = {
    low: {
      windowMs:
        NORMAL_WINDOW_MINUTES * MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND,
      maxRequests: NORMAL_MAX_REQUESTS,
    },
    normal: {
      windowMs:
        NORMAL_WINDOW_MINUTES * MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND,
      maxRequests: NORMAL_MAX_REQUESTS,
    },
    medium: {
      windowMs:
        NORMAL_WINDOW_MINUTES * MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND,
      maxRequests: SUSPICIOUS_MAX_REQUESTS,
    },
    suspicious: {
      windowMs:
        NORMAL_WINDOW_MINUTES * MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND,
      maxRequests: SUSPICIOUS_MAX_REQUESTS,
    },
    high: {
      windowMs:
        BLOCKED_WINDOW_HOURS * MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND,
      maxRequests: BLOCKED_MAX_REQUESTS,
    },
    blocked: {
      windowMs:
        BLOCKED_WINDOW_HOURS * MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND,
      maxRequests: BLOCKED_MAX_REQUESTS,
    },
  };

  constructor(
    private configService: ConfigService,
    private securityMonitoringService: SecurityMonitoringService
  ) {}

  /**
   * Check if a request should be allowed based on adaptive rate limiting
   */
  async checkRateLimit(
    userId: string | undefined,
    ipAddress: string,
    endpoint: string,
    _method: string
  ): Promise<RateLimitDecision> {
    const identifier = userId ?? ipAddress;
    const limitMap = userId ? this.userLimits : this.ipLimits;

    // Get or create rate limit status
    let status = limitMap.get(identifier);
    if (!status) {
      status = this.createInitialStatus(identifier, userId, ipAddress);
      limitMap.set(identifier, status);
    }

    // Update threat level based on recent activity
    await this.updateThreatLevel(status, userId, ipAddress);

    // Check if user is currently blocked
    if (
      status.isBlocked &&
      status.blockExpiry &&
      status.blockExpiry > new Date()
    ) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: status.blockExpiry,
        retryAfter: Math.ceil(
          (status.blockExpiry.getTime() - Date.now()) / MILLISECONDS_PER_SECOND
        ),
        reason: 'User temporarily blocked due to suspicious activity',
      };
    }

    // Reset counter if window has expired
    if (this.hasWindowExpired(status)) {
      this.resetWindow(status);
    }

    // Calculate effective limit with adaptive multiplier
    const effectiveLimit = Math.floor(
      status.config.maxRequests * status.adaptiveMultiplier
    );

    // Check if request would exceed limit
    if (status.currentRequests >= effectiveLimit) {
      // Record rate limit hit
      await this.securityMonitoringService.recordRateLimitHit(
        endpoint,
        ipAddress,
        userId
      );

      // Potentially escalate threat level
      if (status.threatLevel === 'low') {
        status.threatLevel = 'medium';
        status.adaptiveMultiplier = _RATE_LIMIT_MULTIPLIER_LOW; // Reduce limit to 50%
      }

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: new Date(
          status.windowStart.getTime() + status.config.windowMs
        ),
        retryAfter: Math.ceil(
          (status.windowStart.getTime() + status.config.windowMs - Date.now()) /
            MILLISECONDS_PER_SECOND
        ),
        reason: 'Rate limit exceeded',
      };
    }

    // Allow request and increment counter
    status.currentRequests++;

    return {
      allowed: true,
      remainingRequests: effectiveLimit - status.currentRequests,
      resetTime: new Date(
        status.windowStart.getTime() + status.config.windowMs
      ),
    };
  }

  /**
   * Record successful request (potentially reduce threat level)
   */
  async recordSuccessfulRequest(
    userId: string | undefined,
    ipAddress: string
  ): Promise<void> {
    const identifier = userId ?? ipAddress;
    const limitMap = userId ? this.userLimits : this.ipLimits;

    const status = limitMap.get(identifier);
    if (status && status.threatLevel === 'medium') {
      // Gradually reduce threat level for successful requests
      const successRate = this.calculateSuccessRate(status);
      if (successRate > _UNUSUAL_LOCATION_THRESHOLD) {
        // 80% success rate
        status.threatLevel = 'low';
        status.adaptiveMultiplier = DEFAULT_ADAPTIVE_MULTIPLIER;
        this.logger.log(
          `🔄 Reduced threat level for ${identifier} (success rate: ${(successRate * 100).toFixed(1)}%)`
        );
      }
    }
  }

  /**
   * Record failed request (potentially increase threat level)
   */
  async recordFailedRequest(
    userId: string | undefined,
    ipAddress: string,
    reason: string
  ): Promise<void> {
    const identifier = userId ?? ipAddress;
    const limitMap = userId ? this.userLimits : this.ipLimits;

    const status = limitMap.get(identifier);
    if (status) {
      // Escalate threat level for repeated failures
      if (
        status.threatLevel === 'low' &&
        status.currentRequests > _THREAT_LEVEL_ESCALATION_THRESHOLD
      ) {
        status.threatLevel = 'medium';
        status.adaptiveMultiplier = _RATE_LIMIT_MULTIPLIER_LOW;
        this.logger.warn(
          `⚠️ Elevated threat level for ${identifier} due to failed requests`
        );
      } else if (
        status.threatLevel === 'medium' &&
        status.currentRequests > SUSPICIOUS_MAX_REQUESTS
      ) {
        status.threatLevel = 'high';
        status.adaptiveMultiplier = _RATE_LIMIT_MULTIPLIER_HIGH;
        status.isBlocked = true;
        status.blockExpiry = new Date(
          Date.now() +
            _BLOCK_DURATION_MINUTES *
              SECONDS_PER_MINUTE *
              MILLISECONDS_PER_SECOND
        );
        this.logger.error(
          `🚫 High threat level - blocking ${identifier} for ${_BLOCK_DURATION_MINUTES} minutes`
        );
      }
    }

    // Record failed authentication
    await this.securityMonitoringService.recordFailedAuthentication(
      reason,
      ipAddress,
      '', // userAgent not available here
      userId
    );
  }

  /**
   * Create initial rate limit status for new users/IPs
   */
  private createInitialStatus(
    identifier: string,
    _userId: string | undefined,
    _ipAddress: string
  ): UserRateLimitStatus {
    return {
      userId: identifier,
      currentRequests: 0,
      windowStart: new Date(),
      config: this.defaultConfigs.normal,
      isBlocked: false,
      threatLevel: 'low',
      adaptiveMultiplier: DEFAULT_ADAPTIVE_MULTIPLIER, // Default multiplier
    };
  }

  /**
   * Update threat level based on recent security events
   */
  private async updateThreatLevel(
    status: UserRateLimitStatus,
    _userId: string | undefined,
    _ipAddress: string
  ): Promise<void> {
    try {
      // Get recent security events for this user/IP
      const securityMetrics =
        this.securityMonitoringService.getSecurityMetrics();

      // Count recent failed authentications
      const recentFailures = securityMetrics.recentEvents.filter(
        event =>
          event.type === 'authentication' &&
          (event.userId === _userId || event.ipAddress === _ipAddress) &&
          event.timestamp >
            new Date(
              Date.now() -
                RECENT_ACTIVITY_WINDOW_MINUTES *
                  SECONDS_PER_MINUTE *
                  MILLISECONDS_PER_SECOND
            )
      );

      // Count rate limit violations
      const rateLimitHits = securityMetrics.recentEvents.filter(
        event =>
          event.type === 'rate_limit' &&
          (event.userId === _userId || event.ipAddress === _ipAddress) &&
          event.timestamp >
            new Date(
              Date.now() -
                RECENT_ACTIVITY_WINDOW_MINUTES *
                  SECONDS_PER_MINUTE *
                  MILLISECONDS_PER_SECOND
            )
      );

      // Adjust threat level based on activity
      if (
        recentFailures.length > FAILURE_COUNT_THRESHOLD ||
        rateLimitHits.length > RATE_LIMIT_VIOLATION_THRESHOLD
      ) {
        status.threatLevel = 'high';
        status.adaptiveMultiplier = _RATE_LIMIT_MULTIPLIER_HIGH;
      } else if (
        recentFailures.length > MEDIUM_THREAT_FAILURE_THRESHOLD ||
        rateLimitHits.length > MEDIUM_THREAT_RATE_LIMIT_THRESHOLD
      ) {
        status.threatLevel = 'medium';
        status.adaptiveMultiplier = _RATE_LIMIT_MULTIPLIER_LOW;
      } else {
        status.threatLevel = 'low';
        status.adaptiveMultiplier = DEFAULT_ADAPTIVE_MULTIPLIER;
      }

      // Update rate limit config based on threat level
      status.config =
        this.defaultConfigs[status.threatLevel] ?? this.defaultConfigs.normal;
    } catch (error) {
      this.logger.error('❌ Failed to update threat level:', error);
    }
  }

  /**
   * Check if rate limit window has expired
   */
  private hasWindowExpired(status: UserRateLimitStatus): boolean {
    return Date.now() > status.windowStart.getTime() + status.config.windowMs;
  }

  /**
   * Reset rate limit window
   */
  private resetWindow(status: UserRateLimitStatus): void {
    status.windowStart = new Date();
    status.currentRequests = 0;
  }

  /**
   * Calculate success rate for adaptive adjustments
   */
  private calculateSuccessRate(status: UserRateLimitStatus): number {
    // This is a simplified calculation
    // In production, you'd track successful vs failed requests
    const estimatedSuccessRate =
      status.currentRequests > _CLEANUP_REQUEST_THRESHOLD
        ? HIGH_SUCCESS_RATE_THRESHOLD
        : DEFAULT_ADAPTIVE_MULTIPLIER;
    return estimatedSuccessRate;
  }

  /**
   * Get current rate limit status for a user/IP
   */
  getRateLimitStatus(
    identifier: string,
    isUserId: boolean = false
  ): UserRateLimitStatus | null {
    const limitMap = isUserId ? this.userLimits : this.ipLimits;
    return limitMap.get(identifier) ?? null;
  }

  /**
   * Get all current rate limit statuses (for monitoring)
   */
  getAllRateLimitStatuses(): {
    users: UserRateLimitStatus[];
    ips: UserRateLimitStatus[];
  } {
    return {
      users: Array.from(this.userLimits.values()),
      ips: Array.from(this.ipLimits.values()),
    };
  }

  /**
   * Manually unblock a user/IP
   */
  unblock(identifier: string, isUserId: boolean = false): boolean {
    const limitMap = isUserId ? this.userLimits : this.ipLimits;
    const status = limitMap.get(identifier);

    if (status?.isBlocked) {
      status.isBlocked = false;
      status.blockExpiry = undefined;
      status.threatLevel = 'low';
      status.adaptiveMultiplier = DEFAULT_ADAPTIVE_MULTIPLIER;
      this.logger.log(`✅ Unblocked ${identifier}`);
      return true;
    }

    return false;
  }

  /**
   * Scheduled cleanup of old rate limit entries
   */
  @Cron(CronExpression.EVERY_HOUR)
  cleanupOldEntries(): void {
    const cutoffTime =
      Date.now() -
      _CLEANUP_WINDOW_DAYS *
        HOURS_PER_DAY *
        MINUTES_PER_HOUR *
        SECONDS_PER_MINUTE *
        MILLISECONDS_PER_SECOND;

    // Clean user limits
    for (const [key, status] of this.userLimits) {
      if (
        status.windowStart.getTime() < cutoffTime &&
        status.currentRequests === _CLEANUP_REQUEST_THRESHOLD
      ) {
        this.userLimits.delete(key);
      }
    }

    // Clean IP limits
    for (const [key, status] of this.ipLimits) {
      if (
        status.windowStart.getTime() < cutoffTime &&
        status.currentRequests === _CLEANUP_REQUEST_THRESHOLD
      ) {
        this.ipLimits.delete(key);
      }
    }

    this.logger.log(
      `🧹 Cleaned up rate limit entries. Active: ${this.userLimits.size} users, ${this.ipLimits.size} IPs`
    );
  }
}
