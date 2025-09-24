import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  constructor(private readonly performanceMonitoringService: PerformanceMonitoringService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Record start time
    const startTime = process.hrtime();
    
    // Add response listener to track when the request completes
    res.on('finish', () => {
      // Calculate response time
      const hrTime = process.hrtime(startTime);
      const responseTimeMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
      
      // Determine if request was successful
      const success = res.statusCode < 400;
      
      // Track request in performance monitoring service
      this.performanceMonitoringService.trackRequest(responseTimeMs, success);
      
      // Log request details
      this.logger.debug(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${responseTimeMs.toFixed(2)}ms`,
      );
    });
    
    next();
  }
}
