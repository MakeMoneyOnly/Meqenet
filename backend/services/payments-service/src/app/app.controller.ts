import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * App Controller - Health check and basic endpoints
 * Enterprise FinTech compliant with proper error handling and logging
 */
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Health check endpoint for load balancers and monitoring
   * @returns Health status with service information
   */
  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      service: 'payments-service',
      version: this.configService.get<string>('npm_package_version', '1.0.0'),
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }

  /**
   * Readiness probe endpoint
   * @returns Readiness status for Kubernetes readiness probes
   */
  @Get('ready')
  getReadiness(): object {
    return {
      status: 'ready',
      service: 'payments-service',
      timestamp: new Date().toISOString(),
    };
  }
}
