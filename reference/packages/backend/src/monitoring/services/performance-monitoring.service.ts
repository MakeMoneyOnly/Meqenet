import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as os from 'os';
import * as process from 'process';

interface PerformanceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAvg: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  };
  process: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
  };
  requests: {
    total: number;
    success: number;
    error: number;
    avgResponseTime: number;
  };
}

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private readonly enableMonitoring: boolean;
  private readonly metricsRetentionDays: number;
  
  // Request metrics
  private requestCount = 0;
  private successCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;
  
  // Store metrics in memory (in production, you would use a time-series database)
  private metrics: PerformanceMetrics[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.enableMonitoring = this.configService.get<boolean>('ENABLE_PERFORMANCE_MONITORING', true);
    this.metricsRetentionDays = this.configService.get<number>('METRICS_RETENTION_DAYS', 7);
  }

  /**
   * Collect performance metrics
   * This is run as a scheduled job
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics(): Promise<void> {
    if (!this.enableMonitoring) {
      return;
    }

    try {
      const metrics = await this.gatherMetrics();
      this.metrics.push(metrics);
      
      // Prune old metrics
      this.pruneOldMetrics();
      
      this.logger.debug('Performance metrics collected');
    } catch (error) {
      this.logger.error(`Error collecting performance metrics: ${error.message}`, error.stack);
    }
  }

  /**
   * Gather current performance metrics
   * @returns Performance metrics
   */
  private async gatherMetrics(): Promise<PerformanceMetrics> {
    // Get CPU usage
    const cpus = os.cpus();
    const cpuUsage = this.calculateCpuUsage(cpus);
    
    // Get memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedMemPercent = (usedMem / totalMem) * 100;
    
    // Get process metrics
    const processMemoryUsage = process.memoryUsage();
    const processCpuUsage = process.cpuUsage();
    
    // Calculate request metrics
    const avgResponseTime = this.requestCount > 0 
      ? this.totalResponseTime / this.requestCount 
      : 0;
    
    return {
      timestamp: new Date(),
      cpu: {
        usage: cpuUsage,
        loadAvg: os.loadavg(),
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usedPercent: usedMemPercent,
      },
      process: {
        uptime: process.uptime(),
        memoryUsage: {
          rss: processMemoryUsage.rss,
          heapTotal: processMemoryUsage.heapTotal,
          heapUsed: processMemoryUsage.heapUsed,
          external: processMemoryUsage.external,
        },
        cpuUsage: {
          user: processCpuUsage.user,
          system: processCpuUsage.system,
        },
      },
      requests: {
        total: this.requestCount,
        success: this.successCount,
        error: this.errorCount,
        avgResponseTime,
      },
    };
  }

  /**
   * Calculate CPU usage percentage
   * @param cpus CPU information
   * @returns CPU usage percentage
   */
  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let idle = 0;
    let total = 0;
    
    for (const cpu of cpus) {
      idle += cpu.times.idle;
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    }
    
    return 100 - ((idle / total) * 100);
  }

  /**
   * Prune old metrics
   */
  private pruneOldMetrics(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.metricsRetentionDays);
    
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoffDate);
  }

  /**
   * Track a request
   * @param responseTime Response time in milliseconds
   * @param success Whether the request was successful
   */
  trackRequest(responseTime: number, success: boolean): void {
    if (!this.enableMonitoring) {
      return;
    }
    
    this.requestCount++;
    this.totalResponseTime += responseTime;
    
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
  }

  /**
   * Reset request metrics
   * Called after metrics collection
   */
  resetRequestMetrics(): void {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
  }

  /**
   * Get performance metrics
   * @param timeRange Time range in hours
   * @returns Performance metrics
   */
  getPerformanceMetrics(timeRange: number = 24): PerformanceMetrics[] {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - timeRange);
    
    return this.metrics.filter(metric => metric.timestamp >= cutoffDate);
  }

  /**
   * Get current system health
   * @returns System health information
   */
  async getSystemHealth(): Promise<any> {
    try {
      const metrics = await this.gatherMetrics();
      
      // Check database connection
      let dbStatus = 'healthy';
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        dbStatus = 'unhealthy';
      }
      
      // Determine overall health
      const isHealthy = dbStatus === 'healthy' && 
        metrics.memory.usedPercent < 90 && 
        metrics.cpu.usage < 90;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        database: {
          status: dbStatus,
        },
        system: {
          cpu: metrics.cpu,
          memory: metrics.memory,
        },
        process: metrics.process,
        requests: metrics.requests,
      };
    } catch (error) {
      this.logger.error(`Error getting system health: ${error.message}`, error.stack);
      throw error;
    }
  }
}
