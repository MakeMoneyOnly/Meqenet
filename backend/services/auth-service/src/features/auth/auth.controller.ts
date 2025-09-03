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

class PasswordResetRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

class PasswordResetConfirmDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(12)
  newPassword!: string;
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
    @Body() dto: PasswordResetRequestDto,
    @Req() req: Request
  ): Promise<void> {
    await this.authService.requestPasswordReset(
      dto.email,
      req.ip || 'unknown',
      (req.headers['user-agent'] as string) || undefined
    );
  }

  @Post('password-reset-confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordResetConfirm(@Body() dto: PasswordResetConfirmDto): Promise<void> {
    await this.authService.confirmPasswordReset(dto.token, dto.newPassword);
  }
}
