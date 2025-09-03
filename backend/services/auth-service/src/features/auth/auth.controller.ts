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
import { GlobalExceptionFilter } from '../../shared/filters/global-exception.filter';

@Controller('auth')
@UseFilters(GlobalExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Headers('accept-language') acceptLanguage?: string,
    @Req() request?: Request
  ): Promise<{ accessToken: string }> {
    // Language preference for error messages
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';

    // Pass language context to service if needed
    return this.authService.register(registerUserDto, { language });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Headers('accept-language') acceptLanguage?: string,
    @Req() request?: Request
  ): Promise<{ accessToken: string }> {
    // Language preference for error messages
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';

    // Pass language context to service if needed
    return this.authService.login(loginUserDto, { language });
  }
}
