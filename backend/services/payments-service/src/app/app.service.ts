import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * App Service - Core application service
 * Enterprise FinTech compliant with proper logging and configuration management
 */
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get application information
   * @returns Application metadata for diagnostics
   */
  getAppInfo(): object {
    const appName = this.configService.get<string>(
      'npm_package_name',
      'payments-service'
    );
    const version = this.configService.get<string>(
      'npm_package_version',
      '1.0.0'
    );
    const environment = this.configService.get<string>(
      'NODE_ENV',
      'development'
    );

    this.logger.debug(
      `Application info requested: ${appName} v${version} (${environment})`
    );

    return {
      name: appName,
      version: version,
      environment: environment,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get service status
   * @returns Service operational status
   */
  getServiceStatus(): object {
    return {
      status: 'operational',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}
