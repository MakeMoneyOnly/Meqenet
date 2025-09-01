import { ThrottlerModuleAsyncOptions } from '@nestjs/throttler';

/**
 * Throttler Configuration Factory
 * Enterprise FinTech compliant rate limiting configuration
 * Protects against DDoS attacks and API abuse
 */
export const throttlerConfig: ThrottlerModuleAsyncOptions = {
  useFactory: () => {
    const ttl = parseInt(process.env.THROTTLE_TTL || '60', 10); // 60 seconds
    const limit = parseInt(process.env.THROTTLE_LIMIT || '100', 10); // 100 requests per ttl

    // FinTech specific throttling rules
    const paymentTtl = parseInt(process.env.PAYMENT_THROTTLE_TTL || '300', 10); // 5 minutes for payments
    const paymentLimit = parseInt(
      process.env.PAYMENT_THROTTLE_LIMIT || '10',
      10
    ); // 10 payment requests per 5 minutes

    return {
      ttl: ttl * 1000, // Convert to milliseconds
      limit,
      ignoreUserAgents: [
        // Allow monitoring tools to bypass throttling
        /GoogleHC/i,
        /kube-probe/i,
        /Prometheus/i,
        /DataDog/i,
      ],
      skipIf: context => {
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
  ttl: parseInt(process.env.PAYMENT_THROTTLE_TTL || '300', 10) * 1000, // 5 minutes
  limit: parseInt(process.env.PAYMENT_THROTTLE_LIMIT || '10', 10), // 10 payments per 5 minutes
};

/**
 * Admin operations throttling
 * Even stricter limits for administrative functions
 */
export const adminThrottlerConfig = {
  ttl: parseInt(process.env.ADMIN_THROTTLE_TTL || '60', 10) * 1000, // 1 minute
  limit: parseInt(process.env.ADMIN_THROTTLE_LIMIT || '5', 10), // 5 admin operations per minute
};
