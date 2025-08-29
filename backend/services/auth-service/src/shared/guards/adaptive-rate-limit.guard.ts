import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  CanActivate,
} from '@nestjs/common';
import { Request } from 'express';

import { AdaptiveRateLimitingService } from '../services/adaptive-rate-limiting.service';

// Constants for magic numbers
const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_RATE_LIMIT = 100;

@Injectable()
export class AdaptiveRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AdaptiveRateLimitGuard.name);

  constructor(
    private adaptiveRateLimitingService: AdaptiveRateLimitingService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract user information
    const userId = request.user?.id;
    const ipAddress = this.getClientIp(request);
    const endpoint = request.route?.path ?? request.url;
    const method = request.method;

    try {
      // Check adaptive rate limiting
      const rateLimitDecision =
        await this.adaptiveRateLimitingService.checkRateLimit(
          userId,
          ipAddress,
          endpoint,
          method
        );

      if (!rateLimitDecision.allowed) {
        // Set rate limit headers
        response.setHeader('X-RateLimit-Limit', '0');
        response.setHeader(
          'X-RateLimit-Remaining',
          rateLimitDecision.remainingRequests.toString()
        );
        response.setHeader(
          'X-RateLimit-Reset',
          Math.floor(
            rateLimitDecision.resetTime.getTime() / MILLISECONDS_PER_SECOND
          ).toString()
        );

        if (rateLimitDecision.retryAfter) {
          response.setHeader(
            'Retry-After',
            rateLimitDecision.retryAfter.toString()
          );
        }

        // Log the rate limit violation
        this.logger.warn(
          `🚫 Rate limit exceeded for ${userId ?? ipAddress} on ${method} ${endpoint}: ${rateLimitDecision.reason}`
        );

        // Throw appropriate HTTP exception
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: rateLimitDecision.reason ?? 'Too many requests',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Set rate limit headers for successful requests
      response.setHeader('X-RateLimit-Limit', DEFAULT_RATE_LIMIT.toString()); // Default limit
      response.setHeader(
        'X-RateLimit-Remaining',
        rateLimitDecision.remainingRequests.toString()
      );
      response.setHeader(
        'X-RateLimit-Reset',
        Math.floor(
          rateLimitDecision.resetTime.getTime() / MILLISECONDS_PER_SECOND
        ).toString()
      );

      // Store rate limit decision in request for use in response interceptor
      request.rateLimitDecision = rateLimitDecision;

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Log unexpected errors but allow request to proceed
      this.logger.error('❌ Adaptive rate limiting error:', error);
      return true;
    }
  }

  /**
   * Extract client IP address from request
   */
  private getClientIp(request: Request): string {
    // Check various headers for IP address
    const forwarded = request.get('X-Forwarded-For');
    if (forwarded) {
      // Take the first IP if multiple are present
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.get('X-Real-IP');
    if (realIp) {
      return realIp;
    }

    const cfConnectingIp = request.get('CF-Connecting-IP');
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    // Fall back to connection remote address
    return (
      request.ip ??
      request.connection?.remoteAddress ??
      request.socket?.remoteAddress ??
      'unknown'
    );
  }
}
