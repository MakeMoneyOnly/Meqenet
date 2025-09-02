import { ThrottlerModuleAsyncOptions } from '@nestjs/throttler';

// Constants for magic numbers - FinTech compliance
const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_THROTTLE_TTL_SECONDS = 60;
const DEFAULT_THROTTLE_LIMIT = 100;
const PAYMENT_THROTTLE_TTL_SECONDS = 300;
const PAYMENT_THROTTLE_LIMIT = 10;
const ADMIN_THROTTLE_TTL_SECONDS = 60;
const ADMIN_THROTTLE_LIMIT = 5;

/**
 * Throttler Configuration Factory
 * Enterprise FinTech compliant rate limiting configuration
 * Protects against DDoS attacks and API abuse
 */
export const throttlerConfig: ThrottlerModuleAsyncOptions = {
  useFactory: () => {
    const ttl = parseInt(
      process.env.THROTTLE_TTL || `${DEFAULT_THROTTLE_TTL_SECONDS}`,
      10
    );
    const limit = parseInt(
      process.env.THROTTLE_LIMIT || `${DEFAULT_THROTTLE_LIMIT}`,
      10
    );

    // FinTech specific throttling rules
    const _paymentTtl = parseInt(
      process.env.PAYMENT_THROTTLE_TTL || `${PAYMENT_THROTTLE_TTL_SECONDS}`,
      10
    );
    const _paymentLimit = parseInt(
      process.env.PAYMENT_THROTTLE_LIMIT || `${PAYMENT_THROTTLE_LIMIT}`,
      10
    );

    return {
      ttl: ttl * MILLISECONDS_PER_SECOND, // Convert to milliseconds
      limit,
      ignoreUserAgents: [
        // Allow monitoring tools to bypass throttling
        /GoogleHC/i,
        /kube-probe/i,
        /Prometheus/i,
        /DataDog/i,
      ],
      skipIf: (context: Record<string, unknown>): boolean => {
        // Skip throttling for health checks
        const request = context.switchToHttp().getRequest();
        return request.url === '/health' || request.url === '/ready';
      },
      // Custom storage configuration for distributed rate limiting
      storage: {
        type: 'redis',
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          keyPrefix: 'throttle:payments-service:',
        },
      },
    };
  },
  inject: [],
};

/**
 * Payment-specific throttling configuration
 * Stricter limits for financial transactions
 */
export const paymentThrottlerConfig = {
  ttl:
    parseInt(
      process.env.PAYMENT_THROTTLE_TTL || `${PAYMENT_THROTTLE_TTL_SECONDS}`,
      10
    ) * MILLISECONDS_PER_SECOND,
  limit: parseInt(
    process.env.PAYMENT_THROTTLE_LIMIT || `${PAYMENT_THROTTLE_LIMIT}`,
    10
  ),
};

/**
 * Admin operations throttling
 * Even stricter limits for administrative functions
 */
export const adminThrottlerConfig = {
  ttl:
    parseInt(
      process.env.ADMIN_THROTTLE_TTL || `${ADMIN_THROTTLE_TTL_SECONDS}`,
      10
    ) * MILLISECONDS_PER_SECOND,
  limit: parseInt(
    process.env.ADMIN_THROTTLE_LIMIT || `${ADMIN_THROTTLE_LIMIT}`,
    10
  ),
};
