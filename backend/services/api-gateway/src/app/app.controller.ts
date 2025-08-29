import {
  Controller,
  Get,
  Post,
  Options,
  HttpCode,
  VERSION_NEUTRAL,
  Headers,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Registry, collectDefaultMetrics, Counter } from 'prom-client';

const HTTP_OK = 200;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HTTP_NO_CONTENT = 204;
const UUID_RANDOM_MASK = 0x3;
const UUID_VERSION_MASK = 0x8;
const HEX_RADIX = 16;

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
   * Provides basic API information with security headers
   */
  @Get('/')
  getRoot(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('origin') origin?: string
  ): void {
    this.httpCounter.labels({ method: 'GET', path: '/', status: '200' }).inc();

    // Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
    res.setHeader('X-Requested-With', 'XMLHttpRequest');

    // Request ID
    const requestId =
      (req.headers['x-request-id'] as string) || this.generateRequestId();
    res.setHeader('X-Request-ID', requestId);

    // CORS Headers - Always set default CORS headers for GET requests
    const allowedOrigins = [
      'https://meqenet.et',
      'https://app.meqenet.et',
      'https://nbe.gov.et',
      'http://localhost:3000',
      'http://localhost:4200',
    ];

    // Check if origin is provided and unauthorized
    if (origin && !allowedOrigins.includes(origin)) {
      this.httpCounter
        .labels({ method: 'GET', path: '/', status: '500' })
        .inc();
      res
        .status(HTTP_INTERNAL_SERVER_ERROR)
        .json({ error: 'CORS Error', message: 'Unauthorized origin' });
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]); // Default to first allowed origin
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-ID'
    );

    // Override with specific origin if provided and allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Rate Limiting Headers (mock)
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', '99');
    res.setHeader(
      'X-RateLimit-Reset',
      Math.floor(Date.now() / MILLISECONDS_PER_SECOND) +
        SECONDS_PER_MINUTE * MINUTES_PER_HOUR
    );

    res.json({ message: 'Meqenet API Gateway', version: '1.0.0' });
  }

  /**
   * API Gateway /api endpoint
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

  /**
   * CORS preflight handler
   */
  @Options('/')
  handleOptions(
    @Res() res: Response,
    @Headers('origin') origin?: string
  ): void {
    const allowedOrigins = [
      'https://meqenet.et',
      'https://app.meqenet.et',
      'https://nbe.gov.et',
      'http://localhost:3000',
      'http://localhost:4200',
    ];

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Request-ID'
      );
    }

    res.status(HTTP_NO_CONTENT).end();
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * HEX_RADIX) | 0;
      const v = c === 'x' ? r : (r & UUID_RANDOM_MASK) | UUID_VERSION_MASK;
      return v.toString(HEX_RADIX);
    });
  }
}
