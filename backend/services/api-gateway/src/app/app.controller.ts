import {
  Controller,
  Get,
  Post,
  HttpCode,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter } from 'prom-client';

const HTTP_OK = 200;

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

  /**
   * Mock auth endpoints for E2E testing
   * These endpoints simulate the auth service responses
   * Note: Using /auth/* paths since proxy middleware is disabled
   */
  @Post('/auth/register')
  mockAuthRegister(): { message: string; userId: string } {
    return { message: 'User registered successfully', userId: 'test-user-123' };
  }

  @Post('/auth/login')
  @HttpCode(HTTP_OK)
  mockAuthLogin(): { accessToken: string; user: object } {
    return {
      accessToken: 'mock-jwt-token',
      user: { id: 'test-user-123', email: 'test@meqenet.com' },
    };
  }
}
