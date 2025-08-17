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
 * Secure environment variable access for fintech compliance
 * Centralizes all process.env access with audit logging
 */
function getSecureEnvVars(): {
  readonly DATABASE_URL: string | undefined;
  readonly DB_POOL_MIN: string | undefined;
  readonly DB_POOL_MAX: string | undefined;
  readonly DB_CONNECTION_TIMEOUT: string | undefined;
  readonly DB_IDLE_TIMEOUT: string | undefined;
  readonly DB_MAX_LIFETIME: string | undefined;
  readonly DB_LOGGING_ENABLED: string | undefined;
  readonly DB_LOG_LEVEL: string | undefined;
  readonly DB_SLOW_QUERY_THRESHOLD: string | undefined;
  readonly DB_ENCRYPTION_AT_REST: string | undefined;
  readonly DB_AUDIT_LOGGING: string | undefined;
  readonly DB_CONNECTION_RETRIES: string | undefined;
  readonly DB_RETRY_DELAY: string | undefined;
  readonly DB_HEALTH_CHECK_ENABLED: string | undefined;
  readonly DB_HEALTH_CHECK_INTERVAL: string | undefined;
  readonly DB_HEALTH_CHECK_TIMEOUT: string | undefined;
  readonly NODE_ENV: string | undefined;
} {
  // Security: Single point of environment variable access for audit compliance
  // This is the ONLY place in the configuration where process.env is accessed
  // ESLint disabled for centralized environment access - fintech security pattern
  // This is the ONLY authorized location for process.env access in the auth-service
  // All environment variable access must go through this centralized, validated function

   
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_POOL_MIN: process.env.DB_POOL_MIN,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    DB_CONNECTION_TIMEOUT: process.env.DB_CONNECTION_TIMEOUT,
    DB_IDLE_TIMEOUT: process.env.DB_IDLE_TIMEOUT,
    DB_MAX_LIFETIME: process.env.DB_MAX_LIFETIME,
    DB_LOGGING_ENABLED: process.env.DB_LOGGING_ENABLED,
    DB_LOG_LEVEL: process.env.DB_LOG_LEVEL,
    DB_SLOW_QUERY_THRESHOLD: process.env.DB_SLOW_QUERY_THRESHOLD,
    DB_ENCRYPTION_AT_REST: process.env.DB_ENCRYPTION_AT_REST,
    DB_AUDIT_LOGGING: process.env.DB_AUDIT_LOGGING,
    DB_CONNECTION_RETRIES: process.env.DB_CONNECTION_RETRIES,
    DB_RETRY_DELAY: process.env.DB_RETRY_DELAY,
    DB_HEALTH_CHECK_ENABLED: process.env.DB_HEALTH_CHECK_ENABLED,
    DB_HEALTH_CHECK_INTERVAL: process.env.DB_HEALTH_CHECK_INTERVAL,
    DB_HEALTH_CHECK_TIMEOUT: process.env.DB_HEALTH_CHECK_TIMEOUT,
    NODE_ENV: process.env.NODE_ENV,
  } as const;
   
}

/**
 * Database configuration factory with validation
 * Ensures all database settings meet Ethiopian financial service requirements
 * Uses secure configuration pattern with centralized environment access
 */
export default registerAs('database', (): DatabaseConfig => {
  // Security: Get all environment variables in one secure call
  const env = getSecureEnvVars();

  const config = {
    url: env.DATABASE_URL,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
      connectionTimeout: env.DB_CONNECTION_TIMEOUT,
      idleTimeout: env.DB_IDLE_TIMEOUT,
      maxLifetime: env.DB_MAX_LIFETIME,
    },
    logging: {
      enabled: env.DB_LOGGING_ENABLED,
      level: env.DB_LOG_LEVEL as 'error' | 'warn' | 'info' | 'query',
      slowQueryThreshold: env.DB_SLOW_QUERY_THRESHOLD,
    },
    security: {
      encryptionAtRest: env.DB_ENCRYPTION_AT_REST,
      auditLogging: env.DB_AUDIT_LOGGING,
      connectionRetries: env.DB_CONNECTION_RETRIES,
      retryDelay: env.DB_RETRY_DELAY,
    },
    healthCheck: {
      enabled: env.DB_HEALTH_CHECK_ENABLED,
      interval: env.DB_HEALTH_CHECK_INTERVAL,
      timeout: env.DB_HEALTH_CHECK_TIMEOUT,
    },
  };

  // Validate configuration against schema
  try {
    const validatedConfig = DatabaseConfigSchema.parse(config);

    // Additional runtime validations for Ethiopian financial compliance
    validateEthiopianCompliance(validatedConfig, env.NODE_ENV);

    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
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
function validateEthiopianCompliance(
  config: DatabaseConfig,
  nodeEnv?: string
): void {
  // Ensure production environments have strict security settings
  if (nodeEnv === 'production') {
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

// Note: getDatabaseConfig() function removed for fintech security compliance
// All configuration should use NestJS ConfigService injection pattern
// Direct process.env access is prohibited in enterprise financial systems
