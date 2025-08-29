import { Controller, Get, Header, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { SecurityMonitoringService } from '../services/security-monitoring.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(
    private readonly securityMonitoringService: SecurityMonitoringService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description: 'Returns all Prometheus metrics for monitoring and alerting',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    content: {
      'text/plain': {
        example: '# HELP meqenet_security_events_total Total number of security events\n# TYPE meqenet_security_events_total counter\nmeqenet_security_events_total{type="authentication",severity="medium",service="auth-service"} 5\n',
      },
    },
  })
  async getMetrics(): Promise<string> {
    try {
      this.logger.log('📊 Metrics endpoint accessed');
      const metrics = await this.securityMonitoringService.getMetrics();
      return metrics;
    } catch (error) {
      this.logger.error('❌ Failed to retrieve metrics:', error);
      throw error;
    }
  }

  @Get('security')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Get security monitoring dashboard data',
    description: 'Returns security metrics and events for dashboard visualization',
  })
  @ApiResponse({
    status: 200,
    description: 'Security metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        eventsByType: {
          type: 'object',
          additionalProperties: { type: 'number' },
          description: 'Security events grouped by type',
        },
        eventsBySeverity: {
          type: 'object',
          additionalProperties: { type: 'number' },
          description: 'Security events grouped by severity',
        },
        activeThreats: {
          type: 'number',
          description: 'Number of active threat indicators',
        },
        recentEvents: {
          type: 'array',
          description: 'Recent security events',
        },
        threatIndicators: {
          type: 'object',
          description: 'Current threat indicators by user',
        },
      },
    },
  })
  async getSecurityDashboard(): Promise<ReturnType<SecurityMonitoringService['getSecurityMetrics']>> {
    try {
      this.logger.log('📈 Security dashboard data requested');
      const metrics = this.securityMonitoringService.getSecurityMetrics();
      return metrics;
    } catch (error) {
      this.logger.error('❌ Failed to retrieve security metrics:', error);
      throw error;
    }
  }
}
