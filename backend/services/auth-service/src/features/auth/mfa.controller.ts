import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AdaptiveRateLimitGuard } from '../../shared/guards/adaptive-rate-limit.guard';
import { MfaService } from './mfa.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('MFA')
@ApiBearerAuth()
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdaptiveRateLimitGuard)
  async requestOtp(@Req() req: Request, @Body() dto: RequestOtpDto): Promise<{ message: string }> {
    const principal = req.user as { id: string } | undefined;
    if (!principal?.id) return { message: 'Unauthorized' };
    return this.mfaService.requestOtp(principal.id, dto.channel);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdaptiveRateLimitGuard)
  async verifyOtp(@Req() req: Request, @Body() dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    const principal = req.user as { id: string } | undefined;
    if (!principal?.id) return { verified: false };
    return this.mfaService.verifyOtp(principal.id, dto.channel, dto.code);
  }
}

