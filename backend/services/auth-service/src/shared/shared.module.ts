import { Module, Global } from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SecurityMonitoringService } from './services/security-monitoring.service';

@Global()
@Module({
  providers: [JwtAuthGuard, RolesGuard, SecurityMonitoringService],
  exports: [JwtAuthGuard, RolesGuard, SecurityMonitoringService],
})
export class SharedModule {}
