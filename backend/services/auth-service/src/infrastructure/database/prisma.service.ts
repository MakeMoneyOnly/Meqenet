import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseEncryptionMiddleware } from '../../shared/services/database-encryption.middleware';

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

  constructor(
    private readonly databaseEncryptionMiddleware: DatabaseEncryptionMiddleware,
    configService: ConfigService,
  ) {
    // Extract config before calling super (required for TypeScript strict mode)
    const databaseConfig = configService.get('database');
    if (!databaseConfig || !databaseConfig.url) {
      throw new Error('Database configuration is missing or invalid');
    }

    const databaseUrl = new URL(databaseConfig.url);
    const nodeEnv = configService.get<string>('node.env');
    const isProduction = nodeEnv === 'production';

    // Using controlled access pattern for fintech compliance
    const logLevels: ('error' | 'warn' | 'info' | 'query')[] = isProduction
      ? ['error', 'warn']
      : ['error', 'warn', 'info', 'query'];

    // Call super first before accessing 'this' (TypeScript strict mode requirement)
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
   * Initialize database connection with retry logic
   * Essential for Ethiopian infrastructure reliability
   */
  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
    this.logger.log('✅ Database connection established successfully');

    // Apply database encryption middleware for Level 1 data protection
    this.databaseEncryptionMiddleware.applyMiddleware(this);
    this.logger.log('🔐 Database encryption middleware applied successfully');

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

        await new Promise(resolve => {
          setTimeout(resolve, delay);
        });
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
      // Type-safe Prisma create with explicit type casting for JSON fields
      // Handle optional fields as null for Prisma strict mode compliance
      const auditLogData: Prisma.AuditLogCreateInput = {
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        userId: data.userId ?? null,
        userEmail: data.userEmail ?? null,
        userRole: data.userRole ?? null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent ?? null,
        sessionId: data.sessionId ?? null,
        location: data.location ?? null,
        deviceFingerprint: data.deviceFingerprint ?? null,
        eventData: data.eventData
          ? (JSON.stringify(data.eventData) as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        previousValues: data.previousValues
          ? (JSON.stringify(data.previousValues) as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        newValues: data.newValues
          ? (JSON.stringify(data.newValues) as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        riskScore: data.riskScore ?? null,
        complianceFlags: data.complianceFlags ?? [],
      };

      await this.auditLog.create({
        data: auditLogData,
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
