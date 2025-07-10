import { registerAs } from '@nestjs/config';
import { z } from 'zod';

/**
 * Database Configuration Schema for Meqenet.et Authentication Service
 *
 * Validates database connection parameters for:
 * - NBE compliant PostgreSQL connections
 * - SSL/TLS security requirements
 * - Ethiopian infrastructure optimization
 * - Connection pooling settings
 *
 * @author Financial Software Architect
 * @author Data Security Specialist
 */

// Database configuration constants
const DB_LIMITS = {
  POOL_MIN_LOWER: 1,
  POOL_MIN_UPPER: 5,
  POOL_MAX_LOWER: 5,
  POOL_MAX_UPPER: 50,
  CONNECTION_TIMEOUT_MIN: 10000, // 10 seconds
  CONNECTION_TIMEOUT_MAX: 60000, // 60 seconds
  IDLE_TIMEOUT_MIN: 300000, // 5 minutes
  IDLE_TIMEOUT_MAX: 1800000, // 30 minutes
  MAX_LIFETIME_MIN: 900000, // 15 minutes
  MAX_LIFETIME_MAX: 3600000, // 60 minutes
  SLOW_QUERY_MIN: 500, // 500ms
  SLOW_QUERY_MAX: 5000, // 5 seconds
  RETRY_COUNT_MIN: 3,
  RETRY_COUNT_MAX: 10,
  RETRY_DELAY_MIN: 500, // 500ms
  RETRY_DELAY_MAX: 5000, // 5 seconds
  HEALTH_INTERVAL_MIN: 30000, // 30 seconds
  HEALTH_INTERVAL_MAX: 300000, // 5 minutes
  HEALTH_TIMEOUT_MIN: 1000, // 1 second
  HEALTH_TIMEOUT_MAX: 15000, // 15 seconds
} as const;

// Default values for Ethiopian infrastructure
const DB_DEFAULTS = {
  POOL_MIN: '2',
  POOL_MAX: '10',
  CONNECTION_TIMEOUT: '30000',
  IDLE_TIMEOUT: '600000',
  MAX_LIFETIME: '1800000',
  SLOW_QUERY_THRESHOLD: '1000',
  CONNECTION_RETRIES: '5',
  RETRY_DELAY: '1000',
  HEALTH_INTERVAL: '60000',
  HEALTH_TIMEOUT: '5000',
} as const;

// Environment validation schema
const DatabaseConfigSchema = z.object({
  // Main database connection URL - REQUIRED for all environments
  url: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .refine(
      url => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    )
    .refine(url => {
      // Ensure SSL is configured for Ethiopian financial compliance
      const urlObj = new URL(url);
      return (
        urlObj.searchParams.get('sslmode') === 'require' ||
        urlObj.searchParams.has('ssl') ||
        url.includes('sslmode=require')
      );
    }, 'DATABASE_URL must include SSL configuration (sslmode=require) for Ethiopian financial compliance'),

  // Connection pool settings optimized for Ethiopian infrastructure
  pool: z.object({
    min: z
      .string()
      .optional()
      .default(DB_DEFAULTS.POOL_MIN)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.POOL_MIN_LOWER && val <= DB_LIMITS.POOL_MIN_UPPER,
        'Pool min must be between 1 and 5'
      ),

    max: z
      .string()
      .optional()
      .default(DB_DEFAULTS.POOL_MAX)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.POOL_MAX_LOWER && val <= DB_LIMITS.POOL_MAX_UPPER,
        'Pool max must be between 5 and 50'
      ),

    connectionTimeout: z
      .string()
      .optional()
      .default(DB_DEFAULTS.CONNECTION_TIMEOUT)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.CONNECTION_TIMEOUT_MIN &&
          val <= DB_LIMITS.CONNECTION_TIMEOUT_MAX,
        'Connection timeout must be between 10-60 seconds for Ethiopian networks'
      ),

    idleTimeout: z
      .string()
      .optional()
      .default(DB_DEFAULTS.IDLE_TIMEOUT)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.IDLE_TIMEOUT_MIN &&
          val <= DB_LIMITS.IDLE_TIMEOUT_MAX,
        'Idle timeout must be between 5-30 minutes'
      ),

    maxLifetime: z
      .string()
      .optional()
      .default(DB_DEFAULTS.MAX_LIFETIME)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.MAX_LIFETIME_MIN &&
          val <= DB_LIMITS.MAX_LIFETIME_MAX,
        'Max lifetime must be between 15-60 minutes'
      ),
  }),

  // Logging configuration for NBE audit compliance
  logging: z.object({
    enabled: z
      .string()
      .optional()
      .default('true')
      .transform(val => val.toLowerCase() === 'true'),

    level: z
      .enum(['error', 'warn', 'info', 'query'])
      .optional()
      .default('info'),

    slowQueryThreshold: z
      .string()
      .optional()
      .default(DB_DEFAULTS.SLOW_QUERY_THRESHOLD)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.SLOW_QUERY_MIN && val <= DB_LIMITS.SLOW_QUERY_MAX,
        'Slow query threshold must be between 500-5000ms'
      ),
  }),

  // Security settings for Ethiopian financial compliance
  security: z.object({
    encryptionAtRest: z
      .string()
      .optional()
      .default('true')
      .transform(val => val.toLowerCase() === 'true'),

    auditLogging: z
      .string()
      .optional()
      .default('true')
      .transform(val => val.toLowerCase() === 'true'),

    connectionRetries: z
      .string()
      .optional()
      .default(DB_DEFAULTS.CONNECTION_RETRIES)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.RETRY_COUNT_MIN && val <= DB_LIMITS.RETRY_COUNT_MAX,
        'Connection retries must be between 3-10'
      ),

    retryDelay: z
      .string()
      .optional()
      .default(DB_DEFAULTS.RETRY_DELAY)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.RETRY_DELAY_MIN && val <= DB_LIMITS.RETRY_DELAY_MAX,
        'Retry delay must be between 500-5000ms'
      ),
  }),

  // Health check configuration
  healthCheck: z.object({
    enabled: z
      .string()
      .optional()
      .default('true')
      .transform(val => val.toLowerCase() === 'true'),

    interval: z
      .string()
      .optional()
      .default(DB_DEFAULTS.HEALTH_INTERVAL)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.HEALTH_INTERVAL_MIN &&
          val <= DB_LIMITS.HEALTH_INTERVAL_MAX,
        'Health check interval must be between 30 seconds and 5 minutes'
      ),

    timeout: z
      .string()
      .optional()
      .default(DB_DEFAULTS.HEALTH_TIMEOUT)
      .transform(val => parseInt(val, 10))
      .refine(
        val =>
          val >= DB_LIMITS.HEALTH_TIMEOUT_MIN &&
          val <= DB_LIMITS.HEALTH_TIMEOUT_MAX,
        'Health check timeout must be between 1-15 seconds'
      ),
  }),
});

// Type inference from schema
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

/**
 * Database configuration factory with validation
 * Ensures all database settings meet Ethiopian financial service requirements
 */
export default registerAs('database', (): DatabaseConfig => {
  // Extract environment variables

  const config = {
    url: process.env.DATABASE_URL,
    pool: {
      min: process.env.DB_POOL_MIN,
      max: process.env.DB_POOL_MAX,
      connectionTimeout: process.env.DB_CONNECTION_TIMEOUT,
      idleTimeout: process.env.DB_IDLE_TIMEOUT,
      maxLifetime: process.env.DB_MAX_LIFETIME,
    },
    logging: {
      enabled: process.env.DB_LOGGING_ENABLED,
      level: process.env.DB_LOG_LEVEL as 'error' | 'warn' | 'info' | 'query',
      slowQueryThreshold: process.env.DB_SLOW_QUERY_THRESHOLD,
    },
    security: {
      encryptionAtRest: process.env.DB_ENCRYPTION_AT_REST,
      auditLogging: process.env.DB_AUDIT_LOGGING,
      connectionRetries: process.env.DB_CONNECTION_RETRIES,
      retryDelay: process.env.DB_RETRY_DELAY,
    },
    healthCheck: {
      enabled: process.env.DB_HEALTH_CHECK_ENABLED,
      interval: process.env.DB_HEALTH_CHECK_INTERVAL,
      timeout: process.env.DB_HEALTH_CHECK_TIMEOUT,
    },
  };

  // Validate configuration against schema
  try {
    const validatedConfig = DatabaseConfigSchema.parse(config);

    // Additional runtime validations for Ethiopian financial compliance
    validateEthiopianCompliance(validatedConfig);

    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');

      throw new Error(
        `Database configuration validation failed: ${errorMessages}. ` +
          'Please check your environment variables and ensure they meet ' +
          'Ethiopian financial service security requirements.'
      );
    }
    throw error;
  }
});

// Production limits for Ethiopian cloud infrastructure
const PRODUCTION_LIMITS = {
  MAX_POOL_SIZE: 20,
} as const;

/**
 * Additional validation for Ethiopian financial compliance
 */
function validateEthiopianCompliance(config: DatabaseConfig): void {
  // Ensure production environments have strict security settings

  if (process.env.NODE_ENV === 'production') {
    if (!config.security.encryptionAtRest) {
      throw new Error(
        'Encryption at rest must be enabled in production for Ethiopian financial compliance'
      );
    }

    if (!config.security.auditLogging) {
      throw new Error(
        'Audit logging must be enabled in production for NBE compliance'
      );
    }

    if (config.pool.max > PRODUCTION_LIMITS.MAX_POOL_SIZE) {
      throw new Error(
        `Maximum connection pool size should not exceed ${PRODUCTION_LIMITS.MAX_POOL_SIZE} in production ` +
          'to ensure optimal performance on Ethiopian cloud infrastructure'
      );
    }
  }

  // Validate connection pool ratios
  if (config.pool.min >= config.pool.max) {
    throw new Error('Database pool minimum must be less than maximum');
  }

  // Validate timeout relationships
  if (config.pool.connectionTimeout >= config.pool.idleTimeout) {
    throw new Error('Connection timeout must be less than idle timeout');
  }
}

/**
 * Helper function to get database configuration
 * with proper typing and validation
 */
export function getDatabaseConfig(): DatabaseConfig {
  return DatabaseConfigSchema.parse({
    url: process.env.DATABASE_URL,
    pool: {
      min: process.env.DB_POOL_MIN,
      max: process.env.DB_POOL_MAX,
      connectionTimeout: process.env.DB_CONNECTION_TIMEOUT,
      idleTimeout: process.env.DB_IDLE_TIMEOUT,
      maxLifetime: process.env.DB_MAX_LIFETIME,
    },
    logging: {
      enabled: process.env.DB_LOGGING_ENABLED,
      level: process.env.DB_LOG_LEVEL as 'error' | 'warn' | 'info' | 'query',
      slowQueryThreshold: process.env.DB_SLOW_QUERY_THRESHOLD,
    },
    security: {
      encryptionAtRest: process.env.DB_ENCRYPTION_AT_REST,
      auditLogging: process.env.DB_AUDIT_LOGGING,
      connectionRetries: process.env.DB_CONNECTION_RETRIES,
      retryDelay: process.env.DB_RETRY_DELAY,
    },
    healthCheck: {
      enabled: process.env.DB_HEALTH_CHECK_ENABLED,
      interval: process.env.DB_HEALTH_CHECK_INTERVAL,
      timeout: process.env.DB_HEALTH_CHECK_TIMEOUT,
    },
  });
}
