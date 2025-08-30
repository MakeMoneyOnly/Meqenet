import { Injectable, Logger } from '@nestjs/common';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;        // Initial delay in milliseconds
  maxDelay: number;           // Maximum delay in milliseconds
  backoffMultiplier: number;  // Exponential backoff multiplier
  jitter: boolean;            // Add random jitter to prevent thundering herd
  retryableErrors?: string[]; // Specific error messages/types to retry
}

export interface RetryStats {
  attempts: number;
  totalDelay: number;
  lastError: string | null;
  success: boolean;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  private readonly defaultConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,        // 1 second
    maxDelay: 30000,          // 30 seconds
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNABORTED',
      'Network Error',
      'Timeout',
      'Service Unavailable',
      'Internal Server Error',
    ],
  };

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
  ): Promise<{ result: T; stats: RetryStats }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const stats: RetryStats = {
      attempts: 0,
      totalDelay: 0,
      lastError: null,
      success: false,
    };

    let lastError: any;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      stats.attempts = attempt;

      try {
        this.logger.debug(`Retry attempt ${attempt}/${finalConfig.maxAttempts}`);

        const result = await fn();
        stats.success = true;

        return { result, stats };
      } catch (error) {
        lastError = error;
        stats.lastError = error.message || String(error);

        // Check if error is retryable
        if (!this.isRetryableError(error, finalConfig)) {
          this.logger.debug(`Non-retryable error: ${stats.lastError}`);
          break;
        }

        // Don't retry on last attempt
        if (attempt === finalConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, finalConfig);
        stats.totalDelay += delay;

        this.logger.warn(
          `Attempt ${attempt} failed: ${stats.lastError}. Retrying in ${delay}ms`
        );

        await this.sleep(delay);
      }
    }

    // All attempts failed
    throw lastError;
  }

  /**
   * Execute function with custom retry condition
   */
  async executeWithCondition<T>(
    fn: () => Promise<T>,
    retryCondition: (error: any, attempt: number) => boolean,
    config: Partial<RetryConfig> = {},
  ): Promise<{ result: T; stats: RetryStats }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const stats: RetryStats = {
      attempts: 0,
      totalDelay: 0,
      lastError: null,
      success: false,
    };

    let lastError: any;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      stats.attempts = attempt;

      try {
        const result = await fn();
        stats.success = true;

        return { result, stats };
      } catch (error) {
        lastError = error;
        stats.lastError = error.message || String(error);

        // Check custom retry condition
        if (!retryCondition(error, attempt)) {
          this.logger.debug(`Retry condition not met: ${stats.lastError}`);
          break;
        }

        // Don't retry on last attempt
        if (attempt === finalConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, finalConfig);
        stats.totalDelay += delay;

        this.logger.warn(
          `Attempt ${attempt} failed: ${stats.lastError}. Retrying in ${delay}ms`
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * HTTP-specific retry configuration
   */
  getHttpRetryConfig(): Partial<RetryConfig> {
    return {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 1.5,
      jitter: true,
      retryableErrors: [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNABORTED',
        'Network Error',
        'Request timeout',
        'Service Unavailable',
        'Internal Server Error',
        'Bad Gateway',
        'Gateway Timeout',
      ],
    };
  }

  /**
   * Database-specific retry configuration
   */
  getDatabaseRetryConfig(): Partial<RetryConfig> {
    return {
      maxAttempts: 3,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitter: false,
      retryableErrors: [
        'Connection lost',
        'Connection timeout',
        'Connection refused',
        'Too many connections',
        'Lock wait timeout',
        'Deadlock found',
      ],
    };
  }

  /**
   * Message queue-specific retry configuration
   */
  getQueueRetryConfig(): Partial<RetryConfig> {
    return {
      maxAttempts: 10,
      initialDelay: 2000,
      maxDelay: 60000, // 1 minute
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: [
        'Connection refused',
        'Connection timeout',
        'Channel closed',
        'Queue not found',
        'Exchange not found',
        'Temporary failure',
      ],
    };
  }

  /**
   * External API-specific retry configuration
   */
  getExternalApiRetryConfig(): Partial<RetryConfig> {
    return {
      maxAttempts: 3,
      initialDelay: 2000,
      maxDelay: 15000,
      backoffMultiplier: 2.5,
      jitter: true,
      retryableErrors: [
        'Request timeout',
        'Service Unavailable',
        'Internal Server Error',
        'Bad Gateway',
        'Gateway Timeout',
        'Rate limit exceeded',
        'Temporary failure',
      ],
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any, config: RetryConfig): boolean {
    if (!config.retryableErrors || config.retryableErrors.length === 0) {
      return true; // Retry all errors if no specific list provided
    }

    const errorMessage = error.message || String(error);
    const errorCode = error.code || error.status || '';

    return config.retryableErrors.some(retryableError =>
      errorMessage.includes(retryableError) ||
      errorCode.includes(retryableError)
    );
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);

    // Cap at maximum delay
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if enabled
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(0, delay); // Ensure non-negative
    }

    return Math.round(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retry decorator for methods
   */
  createRetryDecorator(config: Partial<RetryConfig> = {}) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;
      const logger = new Logger(`${target.constructor.name}.${propertyName}`);

      descriptor.value = async function (...args: any[]) {
        const retryService = new (require('./retry.service').RetryService)();

        try {
          const { result } = await retryService.execute(
            () => method.apply(this, args),
            config,
          );
          return result;
        } catch (error) {
          logger.error(`All retry attempts failed for ${propertyName}`, error);
          throw error;
        }
      };

      return descriptor;
    };
  }
}
