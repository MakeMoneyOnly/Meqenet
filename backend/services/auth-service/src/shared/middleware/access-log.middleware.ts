import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

function redactQuery(url: string): string {
  const qIndex = url.indexOf('?');
  return qIndex === -1 ? url : url.slice(0, qIndex) + '?[REDACTED]';
}

@Injectable()
export class AccessLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AccessLog');
  private readonly samplingRate: number;
  private readonly routeSampling: Record<string, number>;

  constructor(configService: ConfigService) {
    this.samplingRate = configService.get<number>('logger.samplingRate', 1.0);
    this.routeSampling = {
      '/health': 0.1,
      '/metrics': 0.2,
    };
  }

  private shouldLog(path: string): boolean {
    const rate = this.routeSampling[path] ?? this.samplingRate;
    return Math.random() < rate;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const path = req.path || req.url;
    if (!this.shouldLog(path)) return next();

    const start = process.hrtime.bigint();
    const method = req.method;
    const safeUrl = redactQuery(req.originalUrl || req.url);
    const requestId = (req.headers['x-request-id'] as string) || 'unknown';

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const statusCode = res.statusCode;
      this.logger.log(
        `${method} ${safeUrl} ${statusCode} ${durationMs.toFixed(1)}ms [reqId=${requestId}]`
      );
    });

    next();
  }
}