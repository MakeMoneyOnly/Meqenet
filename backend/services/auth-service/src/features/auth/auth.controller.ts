import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  Headers,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { GlobalExceptionFilter } from '../../shared/filters/global-exception.filter';
import { Public } from '../../shared/decorators/public.decorator';
import { AdaptiveRateLimitGuard } from '../../shared/guards/adaptive-rate-limit.guard';

@Controller('auth')
@UseFilters(GlobalExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @UseGuards(AdaptiveRateLimitGuard)
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
  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(AdaptiveRateLimitGuard)
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
