import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/api')
  getMessage(): { message: string } {
    return { message: 'Hello API' };
  }

  @Get('/healthz')
  getHealth(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
