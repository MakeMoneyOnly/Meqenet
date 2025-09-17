import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  Headers,
  Req,
  Put,
  Param,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { GlobalExceptionFilter } from '../../shared/filters/global-exception.filter';

@Controller('auth')
@UseFilters(GlobalExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<{ accessToken: string }> {
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';
    return this.authService.register(registerUserDto, { language });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<{ accessToken: string }> {
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';
    return this.authService.login(loginUserDto, { language });
  }

  @Post('password-reset-request')
  @HttpCode(HttpStatus.OK)
  async passwordResetRequest(
    @Body() dto: PasswordResetRequestDto,
    @Req() req: Request
  ): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto, {
      ipAddress: req.ip || 'unknown',
      userAgent: (req.headers['user-agent'] as string) || 'Unknown',
    });
  }

  @Post('password-reset-confirm')
  @HttpCode(HttpStatus.OK)
  async passwordResetConfirm(
    @Body() dto: PasswordResetConfirmDto
  ): Promise<{ message: string }> {
    return this.authService.confirmPasswordReset(dto);
  }

  @Put('user/:userId/phone')
  @HttpCode(HttpStatus.OK)
  async updateUserPhone(
    @Param('userId') userId: string,
    @Body() body: { phoneNumber: string },
    @Req() req: Request
  ): Promise<{ message: string; requiresVerification?: boolean }> {
    return this.authService.updateUserPhone(userId, body.phoneNumber, {
      ipAddress: req.ip || 'unknown',
      userAgent: (req.headers['user-agent'] as string) || 'Unknown',
      location: (req.headers['x-forwarded-for'] as string) || 'Unknown',
      deviceFingerprint:
        (req.headers['x-device-fingerprint'] as string) || 'Unknown',
    });
  }

  @Post('user/:userId/validate-high-risk-operation')
  @HttpCode(HttpStatus.OK)
  async validateHighRiskOperation(
    @Param('userId') userId: string,
    @Body() body: { operation: string },
    @Req() req: Request
  ): Promise<{
    canProceed: boolean;
    reason?: string;
    coolingPeriodEnd?: Date;
    requiresAdditionalVerification?: boolean;
  }> {
    return this.authService.validateHighRiskOperation(userId, body.operation, {
      ipAddress: req.ip || 'unknown',
      userAgent: (req.headers['user-agent'] as string) || 'Unknown',
      location: (req.headers['x-forwarded-for'] as string) || 'Unknown',
      deviceFingerprint:
        (req.headers['x-device-fingerprint'] as string) || 'Unknown',
    });
  }
}
