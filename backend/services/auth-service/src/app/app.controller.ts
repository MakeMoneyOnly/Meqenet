import {
  Controller,
  Get,
  Post,
  Options,
  Headers,
  Res,
  Req,
  Body,
} from '@nestjs/common';
import { Response, Request } from 'express';

import { AppService } from './app.service';

const HTTP_BAD_REQUEST = 400;
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const UUID_RANDOM_MASK = 0x3;
const UUID_VERSION_MASK = 0x8;
const HEX_RADIX = 16;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getServiceName(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('origin') origin?: string
  ): void {
    // Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    );

    // Request ID
    const requestId =
      (req.headers['x-request-id'] as string) ?? this.generateRequestId();
    res.setHeader('X-Request-ID', requestId);

    // CORS Headers - Always set default CORS headers
    const allowedOrigins = [
      'https://meqenet.et',
      'https://app.meqenet.et',
      'https://nbe.gov.et',
      'http://localhost:3000',
      'http://localhost:4200',
    ];

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

    res.json({ name: 'auth-service' });
  }

  @Post()
  createUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: Record<string, unknown>,
    @Headers('origin') origin?: string
  ): void {
    // Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // Request ID
    const requestId =
      (req.headers['x-request-id'] as string) ?? this.generateRequestId();
    res.setHeader('X-Request-ID', requestId);

    // CORS Headers
    const allowedOrigins = [
      'https://meqenet.et',
      'https://app.meqenet.et',
      'https://nbe.gov.et',
      'http://localhost:3000',
      'http://localhost:4200',
    ];

    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]); // Default to first allowed origin
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Override with specific origin if provided and allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Define whitelisted properties
    const whitelistedProperties = ['email', 'password'];

    // Check for non-whitelisted properties
    const bodyKeys = Object.keys(body || {});
    const hasNonWhitelisted = bodyKeys.some(
      key => !whitelistedProperties.includes(key)
    );

    if (hasNonWhitelisted) {
      res.status(HTTP_BAD_REQUEST).json({
        error: 'Bad Request',
        message: 'Request contains non-whitelisted properties',
      });
      return;
    }

    // Validate required fields
    if (!body?.email || !body?.password) {
      res.status(HTTP_BAD_REQUEST).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
      return;
    }

    // Mock user creation response
    res.status(HTTP_CREATED).json({
      message: 'User created successfully',
      userId: 'test-user-123',
      email: body.email,
    });
  }

  @Options()
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

  @Options('/auth/*')
  handleAuthOptions(
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

  @Post('/auth/login')
  authLogin(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: Record<string, unknown>,
    @Headers('origin') origin?: string
  ): void {
    // Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // Request ID
    const requestId =
      (req.headers['x-request-id'] as string) ?? this.generateRequestId();
    res.setHeader('X-Request-ID', requestId);

    // CORS Headers
    const allowedOrigins = [
      'https://meqenet.et',
      'https://app.meqenet.et',
      'https://nbe.gov.et',
      'http://localhost:3000',
      'http://localhost:4200',
    ];

    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]); // Default to first allowed origin
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Override with specific origin if provided and allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Define whitelisted properties
    const whitelistedProperties = ['email', 'password'];

    // Check for non-whitelisted properties
    const bodyKeys = Object.keys(body || {});
    const hasNonWhitelisted = bodyKeys.some(
      key => !whitelistedProperties.includes(key)
    );

    if (hasNonWhitelisted) {
      res.status(HTTP_BAD_REQUEST).json({
        error: 'Bad Request',
        message: 'Request contains non-whitelisted properties',
      });
      return;
    }

    // Validate required fields
    if (!body?.email || !body?.password) {
      res.status(HTTP_BAD_REQUEST).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
      return;
    }

    // Mock successful login response
    res.status(HTTP_CREATED).json({
      accessToken: 'mock-jwt-token',
      user: { id: 'test-user-123', email: body.email },
      message: 'Login successful',
    });
  }

  @Get('/healthz')
  getHealthCheck(): { status: string; timestamp: string } {
    return this.appService.getHealthCheck();
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
