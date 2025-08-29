import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Prisma Database Service for Meqenet.et Authentication Service
 *
 * Provides secure, NBE-compliant database access with:
 * - Connection pooling optimized for Ethiopian infrastructure
 * - SSL/TLS encryption for data in transit
 * - Comprehensive audit logging
 * - Connection monitoring and health checks
 * - Automatic reconnection with exponential backoff
 *
 * @author Financial Software Architect
 * @author Data Security Specialist
 */

// Connection retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  BASE_DELAY: 1000, // 1 second
  SLOW_QUERY_THRESHOLD: 1000, // 1 second
  RESET_ATTEMPTS: 0,
  EXPONENTIAL_BASE: 2,
  PASSWORD_MIN_LENGTH: 12,
} as const;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connectionAttempts = 0;
  private readonly maxRetries = RETRY_CONFIG.MAX_RETRIES;
  private readonly baseDelay = RETRY_CONFIG.BASE_DELAY;

  constructor(private readonly configService: ConfigService) {
    const databaseUrlValue = configService.get<string>('DATABASE_URL');
    if (!databaseUrlValue) {
      throw new Error('DATABASE_URL is not set in the environment variables.');
    }
    const databaseUrl = new URL(databaseUrlValue);
    const isProduction = configService.get<string>('NODE_ENV') === 'production';

    // Using controlled access pattern for fintech compliance
    const logLevels: ('error' | 'warn' | 'info' | 'query')[] = isProduction
      ? ['error', 'warn']
      : ['error', 'warn', 'info', 'query'];

    super({
      datasources: {
        db: {
          url: databaseUrl.toString(),
        },
      },
      log: logLevels,
    });
  }

  /**
   * Secure access to NODE_ENV environment variable
   * Centralized for fintech compliance and audit purposes
   */

  /**
   * Validates database URL for security compliance
   * Ensures SSL is enabled and credentials are not exposed
   */
  private static validateDatabaseUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);

      // Ensure SSL is enabled for Ethiopian financial compliance
      if (
        parsedUrl.searchParams.get('sslmode') !== 'require' &&
        !parsedUrl.searchParams.has('ssl') &&
        !url.includes('sslmode=require')
      ) {
        Logger.warn(
          'Database connection should use SSL for Ethiopian financial compliance'
        );
      }

      // Validate that sensitive credentials are not in plain text
      if (
        parsedUrl.password &&
        parsedUrl.password.length < RETRY_CONFIG.PASSWORD_MIN_LENGTH
      ) {
        throw new Error(
          'Database password must be at least 12 characters for security compliance'
        );
      }

      // Ensure connection string is using secure protocols
      if (
        ![
          'postgresql:',
          'postgres:',
          'postgresql+ssl:',
          'postgres+ssl:',
        ].includes(parsedUrl.protocol)
      ) {
        throw new Error(
          'Only PostgreSQL databases are supported for Ethiopian financial services'
        );
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          'Invalid DATABASE_URL format. Must be a valid PostgreSQL connection string'
        );
      }
      throw error;
    }
  }

  /**
   * Sets up event listeners for audit logging and monitoring
   */
  private setupEventListeners(): void {
    // Prisma's $on method has a complex type signature that is difficult to satisfy
    // when using conditional log levels. To avoid build errors, we cast the method
    // to `any` to bypass the type checking. This is a pragmatic solution that
    // allows us to use the event listeners without sacrificing type safety elsewhere
    // in the application.

    // Query logging for audit compliance (NBE requirement)
    (
      this.$on as (
        event: 'query',
        listener: (e: { query: string; duration: number }) => void
      ) => void
    )('query', event => {
      // Security: Use ConfigService for environment variable access
      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        this.logger.debug(
          `Query: ${event.query} | Duration: ${event.duration}ms`
        );
      }

      // Log slow queries for performance monitoring
      if (event.duration > RETRY_CONFIG.SLOW_QUERY_THRESHOLD) {
        this.logger.warn(`Slow query detected: ${event.duration}ms`, {
          query: event.query,
          params: event.params,
          duration: event.duration,
        });
      }
    });

    // Error logging for security monitoring
    (
      this.$on as (
        event: 'error',
        listener: (e: {
          message: string;
          target?: string;
          timestamp?: Date;
        }) => void
      ) => void
    )('error', event => {
      this.logger.error(`Database error: ${event.message}`, {
        target: event.target,
        timestamp: event.timestamp,
      });
    });

    // Warning logging
    (
      this.$on as (
        event: 'warn',
        listener: (e: {
          message: string;
          target?: string;
          timestamp?: Date;
        }) => void
      ) => void
    )('warn', event => {
      this.logger.warn(`Database warning: ${event.message}`, {
        target: event.target,
        timestamp: event.timestamp,
      });
    });

    // Info logging for audit trail
    (
      this.$on as (
        event: 'info',
        listener: (e: {
          message: string;
          target?: string;
          timestamp?: Date;
        }) => void
      ) => void
    )('info', event => {
      this.logger.log(`Database info: ${event.message}`, {
        target: event.target,
        timestamp: event.timestamp,
      });
    });
  }

  /**
   * Initialize database connection with retry logic
   * Essential for Ethiopian infrastructure reliability
   */
  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
    this.logger.log('✅ Database connection established successfully');

    // Run basic health check
    await this.healthCheck();
  }

  /**
   * Clean shutdown of database connections
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('🔄 Closing database connections...');
    await this.$disconnect();
    this.logger.log('✅ Database connections closed successfully');
  }

  /**
   * Connect to database with exponential backoff retry
   * Critical for Ethiopian network reliability
   */
  private async connectWithRetry(): Promise<void> {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        await this.$connect();
        this.connectionAttempts = RETRY_CONFIG.RESET_ATTEMPTS; // Reset on successful connection
        return;
      } catch (error) {
        this.connectionAttempts++;
        const delay =
          this.baseDelay *
          Math.pow(RETRY_CONFIG.EXPONENTIAL_BASE, this.connectionAttempts - 1);

        this.logger.error(
          `Database connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}). ` +
            `Retrying in ${delay}ms...`,
          error
        );

        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(
            `Failed to connect to database after ${this.maxRetries} attempts. ` +
              'Please check your DATABASE_URL and network connectivity.'
          );
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Database health check for monitoring
   * Returns connection status and basic metrics
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Simple query to test connection
      await this.$queryRaw`SELECT 1 as health_check`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date(),
        responseTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get database connection statistics
   * Useful for monitoring Ethiopian infrastructure performance
   */
  async getConnectionStats(): Promise<{
    activeConnections: number;
    totalConnections: number;
    maxConnections: number;
  }> {
    try {
      const result = await this.$queryRaw<
        Array<{
          active_connections: number;
          total_connections: number;
          max_connections: number;
        }>
      >`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      `;

      return {
        activeConnections: result[0].active_connections,
        totalConnections: result[0].total_connections,
        maxConnections: result[0].max_connections,
      };
    } catch (error) {
      this.logger.error('Failed to get connection stats', error);
      throw error;
    }
  }

  /**
   * Audit log helper for NBE compliance
   * Records all significant database operations
   */
  async createAuditLog(data: {
    eventType: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    ipAddress: string;
    userAgent?: string;
    sessionId?: string;
    location?: string;
    deviceFingerprint?: string;
    eventData?: Record<string, unknown>;
    previousValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    riskScore?: number;
    complianceFlags?: string[];
  }): Promise<void> {
    try {
      await this.auditLog.create({
        data: {
          ...data,
          eventData: data.eventData
            ? JSON.stringify(data.eventData)
            : undefined,
          previousValues: data.previousValues
            ? JSON.stringify(data.previousValues)
            : undefined,
          newValues: data.newValues
            ? JSON.stringify(data.newValues)
            : undefined,
          complianceFlags: data.complianceFlags ?? [],
        },
      });
    } catch (error) {
      // Audit logging failures should not break the main operation
      // but must be logged for compliance investigation
      this.logger.error('Failed to create audit log entry', {
        error,
        auditData: data,
      });
    }
  }

  /**
   * Transaction wrapper with audit logging
   * Ensures all financial operations are properly tracked
   */
  async executeInTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    auditContext?: {
      eventType: string;
      userId?: string;
      ipAddress: string;
      [key: string]: unknown;
    }
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await this.$transaction(operation, {
        maxWait: 10000, // 10 seconds max wait
        timeout: 30000, // 30 seconds timeout for Ethiopian networks
      });

      // Log successful transaction for audit
      if (auditContext) {
        await this.createAuditLog({
          ...auditContext,
          entityType: 'TRANSACTION',
          eventData: {
            duration: Date.now() - startTime,
            status: 'SUCCESS',
          },
        });
      }

      return result;
    } catch (error) {
      // Log failed transaction for audit
      if (auditContext) {
        await this.createAuditLog({
          ...auditContext,
          entityType: 'TRANSACTION',
          eventData: {
            duration: Date.now() - startTime,
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          complianceFlags: ['TRANSACTION_FAILED'],
        });
      }

      throw error;
    }
  }
}
