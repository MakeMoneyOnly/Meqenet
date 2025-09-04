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

// Constants for magic numbers
const MIN_PASSWORD_LENGTH = 12;
const HASH_SHIFT_BITS = 5;
const BASE36_RADIX = 36;
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
  @MinLength(MIN_PASSWORD_LENGTH)
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
    @Req() req: Request,
    @Body() registerUserDto: RegisterUserDto,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<{ accessToken: string }> {
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                      (req.headers['x-real-ip'] as string) ||
                      req.ip ||
                      'unknown';

    return this.authService.register(registerUserDto, {
      language,
      ipAddress,
      userAgent: userAgent || 'Unknown',
      location: this.extractLocationFromHeaders(req.headers) || 'Unknown',
      deviceFingerprint: this.extractDeviceFingerprint(req.headers) || 'Unknown',
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @Body() loginUserDto: LoginUserDto,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<{ accessToken: string }> {
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                      (req.headers['x-real-ip'] as string) ||
                      req.ip ||
                      'unknown';

    return this.authService.login(loginUserDto, {
      language,
      ipAddress,
      userAgent: userAgent || 'Unknown',
      location: this.extractLocationFromHeaders(req.headers) || 'Unknown',
      deviceFingerprint: this.extractDeviceFingerprint(req.headers) || 'Unknown',
    });
  }

  @Post('password-reset-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordResetRequest(
    @Req() req: Request,
    @Body() dto: PasswordResetRequestDtoInline,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<void> {
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                      (req.headers['x-real-ip'] as string) ||
                      req.ip ||
                      'unknown';

    await this.authService.requestPasswordReset(dto, {
      ipAddress,
      userAgent: userAgent || 'Unknown',
      language,
      location: this.extractLocationFromHeaders(req.headers) || 'Unknown',
      deviceFingerprint: this.extractDeviceFingerprint(req.headers) || 'Unknown',
    });
  }

  @Post('password-reset-confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordResetConfirm(
    @Req() req: Request,
    @Body() dto: PasswordResetConfirmDtoInline,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<void> {
    const language = acceptLanguage?.includes('am') ? 'am' : 'en';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                      (req.headers['x-real-ip'] as string) ||
                      req.ip ||
                      'unknown';

    await this.authService.confirmPasswordReset(dto, {
      language,
      ipAddress,
      userAgent: userAgent || 'Unknown',
      location: this.extractLocationFromHeaders(req.headers) || 'Unknown',
      deviceFingerprint: this.extractDeviceFingerprint(req.headers) || 'Unknown',
    });
  }

  /**
   * Extract location information from request headers
   * Used for security monitoring and audit logging
   */
  private extractLocationFromHeaders(headers: Record<string, string | string[]>): string | undefined {
    // Check for Cloudflare headers
    if (headers['cf-ipcountry']) {
      return headers['cf-ipcountry'];
    }

    // Check for custom location headers
    if (headers['x-client-location']) {
      return headers['x-client-location'];
    }

    // Check for geo-location headers
    if (headers['x-geo-country']) {
      const country = headers['x-geo-country'];
      const city = headers['x-geo-city'];
      return city ? `${city}, ${country}` : country;
    }

    return undefined;
  }

  /**
   * Extract device fingerprint from request headers
   * Creates a unique identifier for device tracking and security
   */
  private extractDeviceFingerprint(headers: Record<string, string | string[]>): string | undefined {
    const components: string[] = [];

    // User agent for browser/OS fingerprinting
    if (headers['user-agent']) {
      components.push(headers['user-agent']);
    }

    // Accept language for locale fingerprinting
    if (headers['accept-language']) {
      components.push(headers['accept-language']);
    }

    // Screen resolution if available
    if (headers['x-screen-resolution']) {
      components.push(headers['x-screen-resolution']);
    }

    // Timezone if available
    if (headers['x-timezone']) {
      components.push(headers['x-timezone']);
    }

    // Platform if available
    if (headers['sec-ch-ua-platform']) {
      components.push(headers['sec-ch-ua-platform']);
    }

    if (components.length === 0) {
      return undefined;
    }

    // Create a simple hash of the components for fingerprinting
    const combined = components.join('|');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << HASH_SHIFT_BITS) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(BASE36_RADIX);
  }
}
