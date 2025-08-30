import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { register, collectDefaultMetrics } from 'prom-client';

// Collect default metrics
collectDefaultMetrics();

const HTTP_OK_STATUS = 200;

@Controller()
export class HealthController {
  @Get('/healthz')
  healthz(@Res() res: Response): void {
    res.status(HTTP_OK_STATUS).send('OK');
  }

  @Get('/readyz')
  readyz(@Res() res: Response): void {
    // In a real app, you'd check DB connections, etc.
    res.status(HTTP_OK_STATUS).send('OK');
  }

  @Get('/metrics')
  async metrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
