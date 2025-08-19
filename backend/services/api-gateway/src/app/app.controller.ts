import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter } from 'prom-client';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  private readonly registry: Registry;
  private readonly httpCounter: Counter;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });
    this.httpCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });
  }
  /**
   * Health check endpoint for API Gateway
   * Used by load balancers and monitoring systems
   */
  @Get('/healthz')
  getHealth(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * API Gateway root endpoint
   * Provides basic API information
   */
  @Get('/api')
  getApi(): { message: string } {
    this.httpCounter
      .labels({ method: 'GET', path: '/api', status: '200' })
      .inc();
    return { message: 'Hello API' };
  }

  @Get('/metrics')
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
