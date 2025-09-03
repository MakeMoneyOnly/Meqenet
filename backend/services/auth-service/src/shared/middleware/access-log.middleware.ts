import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccessLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AccessLog');
  private readonly samplingRate: number;

  constructor(configService: ConfigService) {
    this.samplingRate = configService.get<number>('logger.samplingRate', 1.0);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const shouldLog = Math.random() < this.samplingRate;
    if (!shouldLog) return next();

    const start = process.hrtime.bigint();
    const { method, url } = req;
    const requestId = (req.headers['x-request-id'] as string) || 'unknown';

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const statusCode = res.statusCode;
      this.logger.log(
        `${method} ${url} ${statusCode} ${durationMs.toFixed(1)}ms [reqId=${requestId}]`
      );
    });

    next();
  }
}