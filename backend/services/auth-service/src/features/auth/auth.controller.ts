import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  Headers,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { GlobalExceptionFilter } from '../../shared/filters/global-exception.filter';
import { Public } from '../../shared/decorators/public.decorator';

@Controller('auth')
@UseFilters(GlobalExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<{ accessToken: string }> {
    // Language preference for error messages
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';

    // Pass language context to service if needed
    return this.authService.register(registerUserDto, { language });
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Headers('accept-language') acceptLanguage?: string
  ): Promise<{ accessToken: string }> {
    // Language preference for error messages
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';

    // Pass language context to service if needed
    return this.authService.login(loginUserDto, { language });
  }
}
