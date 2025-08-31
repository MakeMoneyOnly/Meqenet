import { Controller, Get } from '@nestjs/common';

import { JwksService } from './jwks.service';

@Controller('.well-known')
export class JwksController {
  constructor(private readonly jwksService: JwksService) {}

  @Get('jwks.json')
  getJwks(): { keys: Record<string, unknown>[] } {
    return this.jwksService.getJwks();
  }
}
