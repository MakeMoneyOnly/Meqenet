import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
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
    return { message: 'Hello API' };
  }
}
