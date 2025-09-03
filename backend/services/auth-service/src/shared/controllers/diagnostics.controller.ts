import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Diagnostics')
@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly config: ConfigService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get effective sanitized configuration' })
  @ApiResponse({ status: 200, description: 'Sanitized configuration returned' })
  getConfig(): Record<string, unknown> {
    const app = {
      port: this.config.get<number>('app.port'),
      nodeEnv: this.config.get<string>('app.nodeEnv'),
      otelServiceName: this.config.get<string>('app.otelServiceName'),
    };

    const security = {
      hstsMaxAge: this.config.get<number>('security.hstsMaxAge'),
      csp: this.config.get('security.csp'),
      permissionsPolicy: this.config.get<string>('security.permissionsPolicy'),
      rateLimit: this.config.get('security.rateLimit'),
    };

    const cors = {
      origins: (this.config.get<string[]>('cors.origins') || []).length,
      credentials: this.config.get<boolean>('cors.credentials'),
      sampleOrigin:
        (this.config.get<string[]>('cors.origins') || [])[0] || null,
    };

    const logger = {
      level: this.config.get('logger.level'),
      samplingRate: this.config.get('logger.samplingRate'),
    };

    return { app, security, cors, logger };
  }
}
