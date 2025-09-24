import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  private readonly logger = new Logger(MonitoringController.name);

  constructor(
    private readonly performanceMonitoringService: PerformanceMonitoringService,
  ) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async getHealth() {
    this.logger.log('Getting system health status');
    return this.performanceMonitoringService.getSystemHealth();
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics' })
  @ApiQuery({ name: 'timeRange', required: false, type: Number, description: 'Time range in hours' })
  async getMetrics(@Query('timeRange') timeRange?: number): Promise<any> {
    this.logger.log(`Getting performance metrics for the last ${timeRange || 24} hours`);
    return this.performanceMonitoringService.getPerformanceMetrics(
      timeRange ? parseInt(timeRange.toString()) : 24,
    );
  }
}
