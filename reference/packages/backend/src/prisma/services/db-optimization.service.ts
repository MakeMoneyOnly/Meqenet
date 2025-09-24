import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DbOptimizationService {
  private readonly logger = new Logger(DbOptimizationService.name);
  private readonly enableOptimization: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.enableOptimization = this.configService.get<boolean>('ENABLE_DB_OPTIMIZATION', false);
  }

  /**
   * Run database optimization tasks
   * This is run as a scheduled job
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async optimizeDatabase(): Promise<void> {
    if (!this.enableOptimization) {
      this.logger.log('Database optimization is disabled');
      return;
    }

    try {
      this.logger.log('Running database optimization tasks');

      // Run VACUUM ANALYZE to optimize the database
      await this.runVacuumAnalyze();

      // Clean up old logs
      await this.cleanupOldLogs();

      this.logger.log('Database optimization completed');
    } catch (error) {
      this.logger.error(`Error optimizing database: ${error.message}`, error.stack);
    }
  }

  /**
   * Run VACUUM ANALYZE on the database
   * This reclaims storage and updates statistics
   */
  private async runVacuumAnalyze(): Promise<void> {
    try {
      this.logger.log('Running VACUUM ANALYZE');

      // Execute raw SQL query
      await this.prisma.$executeRaw`VACUUM ANALYZE;`;

      this.logger.log('VACUUM ANALYZE completed');
    } catch (error) {
      this.logger.error(`Error running VACUUM ANALYZE: ${error.message}`, error.stack);
    }
  }

  /**
   * Clean up old logs from the database
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const retentionDays = this.configService.get<number>('LOG_RETENTION_DAYS', 90);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      this.logger.log(`Cleaning up logs older than ${retentionDays} days`);

      // Delete old notifications
      const deletedNotifications = await this.prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          isRead: true,
        },
      });

      this.logger.log(`Deleted ${deletedNotifications.count} old notifications`);
    } catch (error) {
      this.logger.error(`Error cleaning up old logs: ${error.message}`, error.stack);
    }
  }

  /**
   * Analyze database query performance
   * @returns Query performance statistics
   */
  async analyzeQueryPerformance(): Promise<any> {
    try {
      this.logger.log('Analyzing query performance');

      // Execute raw SQL query to get slow queries
      const slowQueries = await this.prisma.$queryRaw`
        SELECT
          query,
          calls,
          total_time,
          mean_time,
          max_time
        FROM
          pg_stat_statements
        ORDER BY
          mean_time DESC
        LIMIT 10;
      `;

      // Execute raw SQL query to get table statistics
      const tableStats = await this.prisma.$queryRaw`
        SELECT
          schemaname,
          relname,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup,
          n_dead_tup
        FROM
          pg_stat_user_tables
        ORDER BY
          n_live_tup DESC;
      `;

      return {
        slowQueries,
        tableStats,
        analyzedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error analyzing query performance: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get database size statistics
   * @returns Database size statistics
   */
  async getDatabaseSize(): Promise<any> {
    try {
      this.logger.log('Getting database size statistics');

      // Execute raw SQL query to get database size
      const dbSize = await this.prisma.$queryRaw`
        SELECT
          pg_size_pretty(pg_database_size(current_database())) as size,
          pg_database_size(current_database()) as bytes;
      `;

      // Execute raw SQL query to get table sizes
      const tableSizes = await this.prisma.$queryRaw`
        SELECT
          table_name,
          pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
          pg_total_relation_size(quote_ident(table_name)) as bytes
        FROM
          information_schema.tables
        WHERE
          table_schema = 'public'
        ORDER BY
          pg_total_relation_size(quote_ident(table_name)) DESC;
      `;

      return {
        dbSize: dbSize && Array.isArray(dbSize) && dbSize.length > 0 ? dbSize[0] : { size: 'unknown' },
        tableSizes,
        analyzedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error getting database size: ${error.message}`, error.stack);
      throw error;
    }
  }
}
