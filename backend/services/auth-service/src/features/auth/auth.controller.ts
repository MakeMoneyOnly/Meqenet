import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  Headers,
  Req,
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
}
