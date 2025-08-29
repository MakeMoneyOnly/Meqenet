import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SecurityMonitoringService } from './security-monitoring.service';

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests allowed in window
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
    normal: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    suspicious: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 25, // Reduced for suspicious activity
    },
    blocked: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,  // Very restrictive
    },
  };

  constructor(
    private configService: ConfigService,
    private securityMonitoringService: SecurityMonitoringService,
  ) {}

  /**
   * Check if a request should be allowed based on adaptive rate limiting
   */
  async checkRateLimit(
    userId: string | undefined,
    ipAddress: string,
    endpoint: string,
    method: string
  ): Promise<RateLimitDecision> {
    const identifier = userId || ipAddress;
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
    if (status.isBlocked && status.blockExpiry && status.blockExpiry > new Date()) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: status.blockExpiry,
        retryAfter: Math.ceil((status.blockExpiry.getTime() - Date.now()) / 1000),
        reason: 'User temporarily blocked due to suspicious activity',
      };
    }

    // Reset counter if window has expired
    if (this.hasWindowExpired(status)) {
      this.resetWindow(status);
    }

    // Calculate effective limit with adaptive multiplier
    const effectiveLimit = Math.floor(status.config.maxRequests * status.adaptiveMultiplier);

    // Check if request would exceed limit
    if (status.currentRequests >= effectiveLimit) {
      // Record rate limit hit
      await this.securityMonitoringService.recordRateLimitHit(endpoint, ipAddress, userId);

      // Potentially escalate threat level
      if (status.threatLevel === 'low') {
        status.threatLevel = 'medium';
        status.adaptiveMultiplier = 0.5; // Reduce limit to 50%
      }

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: new Date(status.windowStart.getTime() + status.config.windowMs),
        retryAfter: Math.ceil((status.windowStart.getTime() + status.config.windowMs - Date.now()) / 1000),
        reason: 'Rate limit exceeded',
      };
    }

    // Allow request and increment counter
    status.currentRequests++;

    return {
      allowed: true,
      remainingRequests: effectiveLimit - status.currentRequests,
      resetTime: new Date(status.windowStart.getTime() + status.config.windowMs),
    };
  }

  /**
   * Record successful request (potentially reduce threat level)
   */
  async recordSuccessfulRequest(userId: string | undefined, ipAddress: string): Promise<void> {
    const identifier = userId || ipAddress;
    const limitMap = userId ? this.userLimits : this.ipLimits;

    const status = limitMap.get(identifier);
    if (status && status.threatLevel === 'medium') {
      // Gradually reduce threat level for successful requests
      const successRate = this.calculateSuccessRate(status);
      if (successRate > 0.8) { // 80% success rate
        status.threatLevel = 'low';
        status.adaptiveMultiplier = 1.0;
        this.logger.log(`🔄 Reduced threat level for ${identifier} (success rate: ${(successRate * 100).toFixed(1)}%)`);
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
    const identifier = userId || ipAddress;
    const limitMap = userId ? this.userLimits : this.ipLimits;

    const status = limitMap.get(identifier);
    if (status) {
      // Escalate threat level for repeated failures
      if (status.threatLevel === 'low' && status.currentRequests > 10) {
        status.threatLevel = 'medium';
        status.adaptiveMultiplier = 0.5;
        this.logger.warn(`⚠️ Elevated threat level for ${identifier} due to failed requests`);
      } else if (status.threatLevel === 'medium' && status.currentRequests > 25) {
        status.threatLevel = 'high';
        status.adaptiveMultiplier = 0.25;
        status.isBlocked = true;
        status.blockExpiry = new Date(Date.now() + 15 * 60 * 1000); // Block for 15 minutes
        this.logger.error(`🚫 High threat level - blocking ${identifier} for 15 minutes`);
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
    userId: string | undefined,
    ipAddress: string
  ): UserRateLimitStatus {
    return {
      userId: identifier,
      currentRequests: 0,
      windowStart: new Date(),
      config: this.defaultConfigs.normal,
      isBlocked: false,
      threatLevel: 'low',
      adaptiveMultiplier: 1.0,
    };
  }

  /**
   * Update threat level based on recent security events
   */
  private async updateThreatLevel(
    status: UserRateLimitStatus,
    userId: string | undefined,
    ipAddress: string
  ): Promise<void> {
    try {
      // Get recent security events for this user/IP
      const securityMetrics = this.securityMonitoringService.getSecurityMetrics();

      // Count recent failed authentications
      const recentFailures = securityMetrics.recentEvents.filter(
        event =>
          event.type === 'authentication' &&
          (event.userId === userId || event.ipAddress === ipAddress) &&
          event.timestamp > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
      );

      // Count rate limit violations
      const rateLimitHits = securityMetrics.recentEvents.filter(
        event =>
          event.type === 'rate_limit' &&
          (event.userId === userId || event.ipAddress === ipAddress) &&
          event.timestamp > new Date(Date.now() - 30 * 60 * 1000)
      );

      // Adjust threat level based on activity
      if (recentFailures.length > 5 || rateLimitHits.length > 3) {
        status.threatLevel = 'high';
        status.adaptiveMultiplier = 0.25;
      } else if (recentFailures.length > 2 || rateLimitHits.length > 1) {
        status.threatLevel = 'medium';
        status.adaptiveMultiplier = 0.5;
      } else {
        status.threatLevel = 'low';
        status.adaptiveMultiplier = 1.0;
      }

      // Update rate limit config based on threat level
      status.config = this.defaultConfigs[status.threatLevel] || this.defaultConfigs.normal;
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
    const estimatedSuccessRate = status.currentRequests > 0 ? 0.9 : 1.0;
    return estimatedSuccessRate;
  }

  /**
   * Get current rate limit status for a user/IP
   */
  getRateLimitStatus(identifier: string, isUserId: boolean = false): UserRateLimitStatus | null {
    const limitMap = isUserId ? this.userLimits : this.ipLimits;
    return limitMap.get(identifier) || null;
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
      status.adaptiveMultiplier = 1.0;
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
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    // Clean user limits
    for (const [key, status] of this.userLimits) {
      if (status.windowStart.getTime() < cutoffTime && status.currentRequests === 0) {
        this.userLimits.delete(key);
      }
    }

    // Clean IP limits
    for (const [key, status] of this.ipLimits) {
      if (status.windowStart.getTime() < cutoffTime && status.currentRequests === 0) {
        this.ipLimits.delete(key);
      }
    }

    this.logger.log(`🧹 Cleaned up rate limit entries. Active: ${this.userLimits.size} users, ${this.ipLimits.size} IPs`);
  }
}
