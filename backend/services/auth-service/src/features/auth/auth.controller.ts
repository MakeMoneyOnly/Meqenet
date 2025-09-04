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
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { GlobalExceptionFilter } from '../../shared/filters/global-exception.filter';

class PasswordResetRequestDtoInline {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  clientId!: string;
}

class PasswordResetConfirmDtoInline {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(12)
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}

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
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordResetRequest(
    @Body() dto: PasswordResetRequestDtoInline,
    @Req() req: Request
  ): Promise<void> {
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers['user-agent'];

    await this.authService.requestPasswordReset(dto, {
      ipAddress: req.ip || 'unknown',
      userAgent: userAgent || undefined,
    });
  }

  @Post('password-reset-confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordResetConfirm(
    @Body() dto: PasswordResetConfirmDtoInline
  ): Promise<void> {
    await this.authService.confirmPasswordReset(dto);
  }
}
