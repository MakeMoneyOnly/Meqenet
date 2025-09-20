import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface PasswordResetTokenData {
  userId: string;
  token: string;
  hashedToken: string;
  expiresAt: Date;
}

@Injectable()
export class PasswordResetTokenService {
  private readonly logger = new Logger(PasswordResetTokenService.name);
  // eslint-disable-next-line no-magic-numbers
  private readonly TOKEN_EXPIRY_MINUTES = 15; // Tokens expire after 15 minutes
  // eslint-disable-next-line no-magic-numbers
  private readonly TOKEN_LENGTH = 256 / 8; // 256 bits = 32 bytes = 64 hex characters for secure token

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a cryptographically secure password reset token
   * @param userId - The user ID for whom the token is generated
   * @param ipAddress - IP address from the request for security tracking
   * @param userAgent - User agent string for security tracking
   * @returns Promise<PasswordResetTokenData>
   */
  async generateToken(
    userId: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<PasswordResetTokenData> {
    // Generate cryptographically secure random token
    const token = randomBytes(this.TOKEN_LENGTH).toString('hex');

    // Hash the token for storage (we never store the plain token)
    const hashedToken = this.hashToken(token);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.TOKEN_EXPIRY_MINUTES);

    try {
      // Store the hashed token in database
      await this.prisma.passwordReset.create({
        data: {
          userId,
          token: hashedToken, // Store hashed token (secure - never store plain token)
          hashedToken, // Keep for backward compatibility but will be removed in future
          ipAddress,
          userAgent: userAgent || null,
          expiresAt,
        },
      });

      this.logger.log(`Password reset token generated for user ${userId}`);

      return {
        userId,
        token, // Return plain token to user
        hashedToken,
        expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate password reset token for user ${userId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Validates a password reset token and returns user data if valid
   * @param token - The plain token to validate
   * @returns Promise<{userId: string, isValid: boolean}>
   */
  async validateToken(
    token: string
  ): Promise<{ userId: string; isValid: boolean }> {
    const hashedToken = this.hashToken(token);

    try {
      const resetRecord = await this.prisma.passwordReset.findFirst({
        where: {
          hashedToken,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!resetRecord) {
        this.logger.warn('Invalid or expired password reset token attempted');
        return { userId: '', isValid: false };
      }

      this.logger.log(
        `Password reset token validated for user ${resetRecord.userId}`
      );
      return { userId: resetRecord.userId, isValid: true };
    } catch (error) {
      this.logger.error('Failed to validate password reset token', error);
      return { userId: '', isValid: false };
    }
  }

  /**
   * Consumes (marks as used) a password reset token
   * @param token - The plain token to consume
   * @returns Promise<boolean>
   */
  async consumeToken(token: string): Promise<boolean> {
    const hashedToken = this.hashToken(token);

    try {
      const result = await this.prisma.passwordReset.updateMany({
        where: {
          hashedToken,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      if (result.count === 0) {
        this.logger.warn(
          'Attempted to consume invalid or expired password reset token'
        );
        return false;
      }

      this.logger.log('Password reset token consumed successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to consume password reset token', error);
      return false;
    }
  }

  /**
   * Cleans up expired password reset tokens
   * Should be run periodically via a scheduled job
   * @returns Promise<number> - Number of tokens cleaned up
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.passwordReset.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }],
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `Cleaned up ${result.count} expired password reset tokens`
        );
      }

      return result.count;
    } catch (error) {
      this.logger.error(
        'Failed to cleanup expired password reset tokens',
        error
      );
      return 0;
    }
  }

  /**
   * Hashes a token using SHA-256 for secure storage
   * @param token - The plain token to hash
   * @returns string - The hashed token
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Checks if a user has an active (unused, non-expired) password reset token
   * This helps prevent token spam/flooding
   * @param userId - The user ID to check
   * @returns Promise<boolean>
   */
  async hasActiveToken(userId: string): Promise<boolean> {
    try {
      const activeToken = await this.prisma.passwordReset.findFirst({
        where: {
          userId,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return Boolean(activeToken);
    } catch (error) {
      this.logger.error(
        `Failed to check active tokens for user ${userId}`,
        error
      );
      return false;
    }
  }
}
