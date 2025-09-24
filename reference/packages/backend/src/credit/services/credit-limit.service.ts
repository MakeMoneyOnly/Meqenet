import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { CreditLimitAdjustmentDto } from '../dto/credit-assessment.dto';

@Injectable()
export class CreditLimitService {
  private readonly logger = new Logger(CreditLimitService.name);
  private readonly maxManualAdjustment: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.maxManualAdjustment = this.configService.get<number>('MAX_MANUAL_CREDIT_ADJUSTMENT', 10000);
  }

  async getCreditLimit(userId: string): Promise<number> {
    try {
      // First check if the user has an account with credit limit
      const account = await this.prisma.account.findUnique({
        where: { userId },
      });

      if (account) {
        return account.creditLimit;
      }

      // If no account exists, check the user profile
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!userProfile) {
        throw new NotFoundException(`User profile not found: ${userId}`);
      }

      // If no credit limit is set, return the default value
      return 1000; // Default credit limit
    } catch (error) {
      this.logger.error(`Error getting credit limit for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateCreditLimit(userId: string, newLimit: number, reason: string, adminId?: string): Promise<number> {
    try {
      // Get user information
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userProfile: true,
        },
      });

      if (!user || !user.userProfile) {
        throw new NotFoundException(`User or profile not found: ${userId}`);
      }

      // Check if user has an account
      let account = await this.prisma.account.findUnique({
        where: { userId },
      });

      let oldLimit = 0;

      // If account exists, update it
      if (account) {
        oldLimit = account.creditLimit;

        // Update account credit limit
        account = await this.prisma.account.update({
          where: { userId },
          data: {
            creditLimit: newLimit,
            availableCredit: newLimit, // This is simplified; in reality, we'd calculate available credit
          },
        });

        // Create credit limit history record
        await this.prisma.creditLimitHistory.create({
          data: {
            accountId: account.id,
            previousLimit: oldLimit,
            newLimit,
            reason,
          },
        });
      } else {
        // If no account exists, create one
        account = await this.prisma.account.create({
          data: {
            userId,
            accountNumber: `ACC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            creditLimit: newLimit,
            availableCredit: newLimit,
            totalOutstanding: 0,
            status: 'ACTIVE',
          },
        });

        oldLimit = 0; // New account, so old limit is 0

        // Create credit limit history record
        await this.prisma.creditLimitHistory.create({
          data: {
            accountId: account.id,
            previousLimit: oldLimit,
            newLimit,
            reason: 'Initial credit limit',
          },
        });
      }

      // Send notification to user
      await this.notificationsService.sendNotification({
        userId: userId,
        type: NotificationType.CREDIT_LIMIT_UPDATED,
        message: `Your credit limit has been updated from ${oldLimit} ETB to ${newLimit} ETB.`,
        data: {
          oldLimit,
          newLimit,
          currency: 'ETB',
        },
      });

      this.logger.log(`Credit limit updated for user ${userId}: ${oldLimit} ETB -> ${newLimit} ETB (${reason})`);

      return newLimit;
    } catch (error) {
      this.logger.error(`Error updating credit limit for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async adjustCreditLimit(userId: string, adjustment: CreditLimitAdjustmentDto, adminId: string): Promise<number> {
    try {
      // Validate adjustment amount
      if (adjustment.newLimit > this.maxManualAdjustment) {
        throw new ForbiddenException(`Manual credit limit adjustment cannot exceed ${this.maxManualAdjustment} ETB`);
      }

      // Update the credit limit
      return await this.updateCreditLimit(
        userId,
        adjustment.newLimit,
        adjustment.notes || 'Manual adjustment by admin',
        adminId,
      );
    } catch (error) {
      this.logger.error(`Error adjusting credit limit for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAvailableCredit(userId: string): Promise<{ total: number; available: number; used: number }> {
    try {
      // Get user's account with credit limit
      const account = await this.prisma.account.findUnique({
        where: { userId },
      });

      if (!account) {
        // If no account exists, return default values
        return {
          total: 0,
          available: 0,
          used: 0,
        };
      }

      // Get user's active payment plans
      const activePlans = await this.prisma.paymentPlan.findMany({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'LATE'], // Using LATE instead of OVERDUE to match the enum
          },
        },
        select: {
          totalAmount: true,
        },
      });

      // Calculate used credit - for now, we'll use the total amount as a simplification
      // In a real implementation, we would track the remaining amount for each payment plan
      const usedCredit = activePlans.reduce((sum, plan) => sum + plan.totalAmount, 0);

      // Calculate available credit
      const availableCredit = Math.max(0, account.creditLimit - usedCredit);

      return {
        total: account.creditLimit,
        available: availableCredit,
        used: usedCredit,
      };
    } catch (error) {
      this.logger.error(`Error getting available credit for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}


