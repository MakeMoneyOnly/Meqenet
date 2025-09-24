import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { VerificationCodeType } from '../enums/verification-code-type.enum';
import * as crypto from 'crypto';

/**
 * Service for handling email and phone verification
 * Implements verification code generation, validation, and sending
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly codeLength: number;
  private readonly codeExpiration: number; // in seconds
  private readonly maxAttempts: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.codeLength = this.configService.get<number>('VERIFICATION_CODE_LENGTH', 6);
    this.codeExpiration = this.configService.get<number>('VERIFICATION_CODE_EXPIRATION', 600); // 10 minutes
    this.maxAttempts = this.configService.get<number>('VERIFICATION_MAX_ATTEMPTS', 5);
  }

  /**
   * Generate and send verification code for email
   * @param userId User ID
   * @param email Email address
   * @param type Verification code type
   * @returns Success status
   */
  async sendEmailVerificationCode(
    userId: string,
    email: string,
    type: VerificationCodeType = VerificationCodeType.EMAIL,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Generating email verification code for user ${userId}`);

      // Generate verification code
      const code = this.generateVerificationCode();

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + this.codeExpiration);

      // Store verification code
      await this.prisma.verificationCode.create({
        data: {
          userId,
          code,
          type,
          expiresAt,
          attempts: 0,
          isVerified: false,
          channel: 'EMAIL',
          destination: email,
        },
      });

      // Send verification code via email
      await this.notificationsService.sendNotification({
        type: 'VERIFICATION_CODE',
        userId,
        message: `Your verification code is: ${code}`,
        data: {
          code,
          type,
          expiresInMinutes: Math.floor(this.codeExpiration / 60),
        },
      });

      return {
        success: true,
        message: `Verification code sent to ${email}`,
      };
    } catch (error) {
      this.logger.error(`Error sending email verification code: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate and send verification code for phone
   * @param userId User ID
   * @param phoneNumber Phone number
   * @param type Verification code type
   * @returns Success status
   */
  async sendPhoneVerificationCode(
    userId: string,
    phoneNumber: string,
    type: VerificationCodeType = VerificationCodeType.PHONE,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Generating phone verification code for user ${userId}`);

      // Generate verification code
      const code = this.generateVerificationCode();

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + this.codeExpiration);

      // Store verification code
      await this.prisma.verificationCode.create({
        data: {
          userId,
          code,
          type,
          expiresAt,
          attempts: 0,
          isVerified: false,
          channel: 'SMS',
          destination: phoneNumber,
        },
      });

      // Send verification code via SMS
      await this.notificationsService.sendNotification({
        type: 'VERIFICATION_CODE',
        userId,
        message: `Your Meqenet verification code is: ${code}`,
        data: {
          code,
          type,
          expiresInMinutes: Math.floor(this.codeExpiration / 60),
        },
      });

      return {
        success: true,
        message: `Verification code sent to ${phoneNumber}`,
      };
    } catch (error) {
      this.logger.error(`Error sending phone verification code: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify a verification code
   * @param userId User ID
   * @param code Verification code
   * @param type Verification code type
   * @returns Verification result
   */
  async verifyCode(
    userId: string,
    code: string,
    type: VerificationCodeType,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Verifying ${type} code for user ${userId}`);

      // Find the latest verification code
      const verificationCode = await this.prisma.verificationCode.findFirst({
        where: {
          userId,
          type,
          isVerified: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!verificationCode) {
        throw new NotFoundException('Verification code not found');
      }

      // Check if code is expired
      if (verificationCode.expiresAt < new Date()) {
        throw new BadRequestException('Verification code has expired');
      }

      // Check if max attempts reached
      if (verificationCode.attempts >= this.maxAttempts) {
        throw new BadRequestException('Maximum verification attempts reached');
      }

      // Increment attempts
      await this.prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });

      // Verify code
      if (verificationCode.code !== code) {
        return {
          success: false,
          message: 'Invalid verification code',
        };
      }

      // Mark as verified
      await this.prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { isVerified: true, verifiedAt: new Date() },
      });

      // Update user verification status based on type
      if (type === VerificationCodeType.EMAIL) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { emailVerified: true },
        });
      } else if (type === VerificationCodeType.PHONE) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { phoneVerified: true },
        });
      }

      return {
        success: true,
        message: 'Verification successful',
      };
    } catch (error) {
      this.logger.error(`Error verifying code: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a random verification code
   * @returns Verification code
   */
  private generateVerificationCode(): string {
    // Generate a random numeric code
    const min = Math.pow(10, this.codeLength - 1);
    const max = Math.pow(10, this.codeLength) - 1;

    // Use crypto for better randomness
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = parseInt(randomBytes.toString('hex'), 16);

    // Ensure it's within our range
    const code = (randomNumber % (max - min + 1)) + min;

    return code.toString().padStart(this.codeLength, '0');
  }
}
