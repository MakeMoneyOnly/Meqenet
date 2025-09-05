import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

// Time conversion constants
const NANOSECONDS_PER_MILLISECOND = 1_000_000;

function redactQuery(url: string): string {
  const qIndex = url.indexOf('?');
  return qIndex === -1 ? url : url.slice(0, qIndex) + '?[REDACTED]';
}

function parseRouteSampling(input?: string): Record<string, number> {
  const map: Record<string, number> = {};
  if (!input) return map;
  for (const part of input.split(',')) {
    const [route, rateStr] = part.split(':').map(s => s.trim());
    if (!route || !rateStr) continue;
    const rate = parseFloat(rateStr);
    if (!Number.isNaN(rate) && rate >= 0 && rate <= 1) map[route] = rate;
  }
  return map;
}

@Injectable()
export class AccessLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AccessLog');
  private readonly samplingRate: number;
  private readonly routeSampling: Record<string, number>;

  constructor(configService: ConfigService) {
    this.samplingRate = configService.get<number>('logger.samplingRate', 1.0);
    const routeSamplingEnv = configService.get<string>('LOG_ROUTE_SAMPLING');
    const defaults: Record<string, number> = {
      '/health': 0.1,
      '/metrics': 0.2,
    };
    this.routeSampling = {
      ...defaults,
      ...parseRouteSampling(routeSamplingEnv),
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
      const durationMs =
        Number(process.hrtime.bigint() - start) / NANOSECONDS_PER_MILLISECOND;
      const statusCode = res.statusCode;
      this.logger.log(
        `${method} ${safeUrl} ${statusCode} ${durationMs.toFixed(1)}ms [reqId=${requestId}]`
      );
    });

    next();
  }
}
