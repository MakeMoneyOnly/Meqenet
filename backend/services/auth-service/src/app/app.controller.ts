import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getServiceName(): { name: string } {
    return { name: 'auth-service' };
  }

  @Get('/healthz')
  getHealthCheck(): { status: string; timestamp: string } {
    return this.appService.getHealthCheck();
  }
}
