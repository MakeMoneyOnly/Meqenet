import { Controller, Post, Body, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser } from '../decorators/get-user.decorator';
import { VerificationService } from '../services/verification.service';
import { VerificationCodeType } from '../enums/verification-code-type.enum';
import { UsersService } from '../../users/services/users.service';

/**
 * Controller for handling email and phone verification
 */
@ApiTags('verification')
@Controller('auth/verification')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(
    private readonly verificationService: VerificationService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Send email verification code
   * @param userId User ID
   * @returns Success status
   */
  @Post('email/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  async sendEmailVerification(@GetUser('id') userId: string) {
    this.logger.log(`Sending email verification code for user ${userId}`);

    // Get user email
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      return {
        success: true,
        message: 'Email already verified',
        isVerified: true,
      };
    }

    // Send verification code
    const result = await this.verificationService.sendEmailVerificationCode(
      userId,
      user.email || '',
      VerificationCodeType.EMAIL,
    );

    return {
      ...result,
      isVerified: false,
    };
  }

  /**
   * Verify email with code
   * @param userId User ID
   * @param code Verification code
   * @returns Verification result
   */
  @Post('email/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify email with code' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(
    @GetUser('id') userId: string,
    @Body('code') code: string,
  ) {
    this.logger.log(`Verifying email for user ${userId}`);

    if (!code) {
      throw new BadRequestException('Verification code is required');
    }

    // Verify code
    const result = await this.verificationService.verifyCode(
      userId,
      code,
      VerificationCodeType.EMAIL,
    );

    return result;
  }

  /**
   * Send phone verification code
   * @param userId User ID
   * @returns Success status
   */
  @Post('phone/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send phone verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  async sendPhoneVerification(@GetUser('id') userId: string) {
    this.logger.log(`Sending phone verification code for user ${userId}`);

    // Get user phone number
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.phoneVerified) {
      return {
        success: true,
        message: 'Phone already verified',
        isVerified: true,
      };
    }

    // Send verification code
    const result = await this.verificationService.sendPhoneVerificationCode(
      userId,
      user.phoneNumber,
      VerificationCodeType.PHONE,
    );

    return {
      ...result,
      isVerified: false,
    };
  }

  /**
   * Verify phone with code
   * @param userId User ID
   * @param code Verification code
   * @returns Verification result
   */
  @Post('phone/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify phone with code' })
  @ApiResponse({ status: 200, description: 'Phone verified' })
  async verifyPhone(
    @GetUser('id') userId: string,
    @Body('code') code: string,
  ) {
    this.logger.log(`Verifying phone for user ${userId}`);

    if (!code) {
      throw new BadRequestException('Verification code is required');
    }

    // Verify code
    const result = await this.verificationService.verifyCode(
      userId,
      code,
      VerificationCodeType.PHONE,
    );

    return result;
  }

  /**
   * Send password reset code
   * @param email Email address
   * @returns Success status
   */
  @Post('password-reset/send')
  @ApiOperation({ summary: 'Send password reset code' })
  @ApiResponse({ status: 200, description: 'Password reset code sent' })
  async sendPasswordResetCode(@Body('email') email: string) {
    this.logger.log(`Sending password reset code for email ${email}`);

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    // Find user by email
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return {
        success: true,
        message: 'If the email exists, a password reset code has been sent',
      };
    }

    // Send verification code
    await this.verificationService.sendEmailVerificationCode(
      user.id,
      email,
      VerificationCodeType.PASSWORD_RESET,
    );

    return {
      success: true,
      message: 'If the email exists, a password reset code has been sent',
    };
  }

  /**
   * Verify password reset code
   * @param email Email address
   * @param code Verification code
   * @returns Verification result with reset token
   */
  @Post('password-reset/verify')
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, description: 'Password reset code verified' })
  async verifyPasswordResetCode(
    @Body('email') email: string,
    @Body('code') code: string,
  ) {
    this.logger.log(`Verifying password reset code for email ${email}`);

    if (!email || !code) {
      throw new BadRequestException('Email and verification code are required');
    }

    // Find user by email
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Invalid email or verification code');
    }

    // Verify code
    const result = await this.verificationService.verifyCode(
      user.id,
      code,
      VerificationCodeType.PASSWORD_RESET,
    );

    if (result.success) {
      // Generate a password reset token
      // For now, we'll just create a simple token since the method doesn't exist
      const resetToken = Math.random().toString(36).substring(2, 15) +
                        Math.random().toString(36).substring(2, 15);

      return {
        ...result,
        resetToken,
      };
    }

    return result;
  }
}
