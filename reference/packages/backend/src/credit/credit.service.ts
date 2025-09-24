import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/services/notifications.service';

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);
  private readonly minCreditLimit: number;
  private readonly maxCreditLimit: number;
  private readonly baseMultiplier: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.minCreditLimit = this.configService.get<number>('CREDIT_MIN_LIMIT', 1000);
    this.maxCreditLimit = this.configService.get<number>('CREDIT_MAX_LIMIT', 50000);
    this.baseMultiplier = this.configService.get<number>('CREDIT_BASE_MULTIPLIER', 2);
  }

  async getCreditLimit(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException(`Account not found for user ${userId}`);
    }

    return {
      creditLimit: account.creditLimit,
      availableCredit: account.availableCredit,
      totalOutstanding: account.totalOutstanding,
    };
  }

  async getCreditLimitHistory(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException(`Account not found for user ${userId}`);
    }

    const history = await this.prisma.creditLimitHistory.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }

  async updateCreditLimit(userId: string, newLimit: number, reason: string) {
    // Validate the new limit
    if (newLimit < this.minCreditLimit) {
      throw new Error(`Credit limit cannot be less than ${this.minCreditLimit} ETB`);
    }

    if (newLimit > this.maxCreditLimit) {
      throw new Error(`Credit limit cannot exceed ${this.maxCreditLimit} ETB`);
    }

    // Get the account
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException(`Account not found for user ${userId}`);
    }

    const previousLimit = account.creditLimit;

    // Calculate the new available credit
    const additionalCredit = newLimit - previousLimit;
    const newAvailableCredit = account.availableCredit + additionalCredit;

    // Update the account in a transaction
    const updatedAccount = await this.prisma.$transaction(async (prisma) => {
      // Update the account
      const updated = await prisma.account.update({
        where: { id: account.id },
        data: {
          creditLimit: newLimit,
          availableCredit: newAvailableCredit,
        },
      });

      // Record the change in history
      await prisma.creditLimitHistory.create({
        data: {
          accountId: account.id,
          previousLimit,
          newLimit,
          reason,
        },
      });

      return updated;
    });

    // Send notification to the user
    await this.notificationsService.sendNotification({
      userId,
      type: 'CREDIT_LIMIT_UPDATE',
      message: `Your credit limit has been updated from ${previousLimit} ETB to ${newLimit} ETB.`,
      data: {
        previousLimit,
        newLimit,
        reason
      }
    });

    return {
      creditLimit: updatedAccount.creditLimit,
      availableCredit: updatedAccount.availableCredit,
      totalOutstanding: updatedAccount.totalOutstanding,
    };
  }

  async assessCreditLimit(userId: string): Promise<number> {
    // Get user profile and transaction history
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: true,
        transactions: {
          where: {
            status: 'COMPLETED',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        paymentPlans: {
          where: {
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Calculate base score (simplified algorithm for MVP)
    const baseScore = 50; // Start with a middle score

    // Factor 1: Payment history (35% weight)
    const completedPayments = user.transactions.filter(t =>
      t.type === 'PAYMENT' && t.status === 'COMPLETED'
    ).length;

    const paymentHistoryScore = Math.min(completedPayments * 5, 35);

    // Factor 2: Completed payment plans (25% weight)
    const completedPlans = user.paymentPlans.filter(p => p.status === 'COMPLETED').length;
    const paymentPlanScore = Math.min(completedPlans * 8, 25);

    // Factor 3: Account age (15% weight)
    const accountAgeInDays = Math.floor(
      (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const accountAgeScore = Math.min(accountAgeInDays / 30 * 5, 15);

    // Factor 4: Profile completeness (10% weight)
    let profileScore = 0;
    if (user.userProfile) {
      profileScore += user.userProfile.firstName ? 2 : 0;
      profileScore += user.userProfile.lastName ? 2 : 0;
      profileScore += user.userProfile.dateOfBirth ? 2 : 0;
      profileScore += user.userProfile.address ? 2 : 0;
      profileScore += user.userProfile.city ? 2 : 0;
    }

    // Factor 5: Default rate (15% weight)
    const defaultedPlans = user.paymentPlans.filter(p => p.status === 'DEFAULTED').length;
    const totalPlans = user.paymentPlans.length;
    const defaultScore = totalPlans > 0
      ? Math.max(15 - (defaultedPlans / totalPlans) * 30, 0)
      : 7.5; // Middle score if no history

    // Calculate final score
    const finalScore = baseScore +
      paymentHistoryScore +
      paymentPlanScore +
      accountAgeScore +
      profileScore +
      defaultScore;

    // Convert score to credit limit
    const scorePercentage = finalScore / 100;
    const suggestedLimit = Math.max(
      this.minCreditLimit,
      Math.min(
        this.maxCreditLimit,
        Math.round(this.minCreditLimit + (this.maxCreditLimit - this.minCreditLimit) * scorePercentage)
      )
    );

    this.logger.log(`Credit assessment for user ${userId}: Score ${finalScore}, Limit ${suggestedLimit} ETB`);

    return suggestedLimit;
  }

  async getCreditAssessmentFactors() {
    return [
      {
        name: 'Payment History',
        description: 'Your history of on-time payments',
        weight: '35%',
        tips: 'Make all payments on time to improve this factor',
      },
      {
        name: 'Completed Payment Plans',
        description: 'Number of successfully completed payment plans',
        weight: '25%',
        tips: 'Successfully complete payment plans to improve this factor',
      },
      {
        name: 'Account Age',
        description: 'How long you have been a Meqenet customer',
        weight: '15%',
        tips: 'This factor improves naturally over time',
      },
      {
        name: 'Profile Completeness',
        description: 'How complete your profile information is',
        weight: '10%',
        tips: 'Complete all profile fields to improve this factor',
      },
      {
        name: 'Default Rate',
        description: 'Percentage of payment plans that have defaulted',
        weight: '15%',
        tips: 'Avoid defaulting on payment plans to maintain a good score',
      },
    ];
  }
}

