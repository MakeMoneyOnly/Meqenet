import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserBehaviorService {
  private readonly logger = new Logger(UserBehaviorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Calculate a risk score for a user based on their behavior and history
   * @param userId User ID to evaluate
   * @returns Risk score (0-100, higher is riskier)
   */
  async getUserRiskScore(userId: string): Promise<number> {
    try {
      this.logger.log(`Calculating risk score for user ${userId}`);

      // Get user data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userProfile: true,
          kycVerifications: {
            where: {
              status: 'APPROVED',
            },
          },
        },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        return 80; // High risk for unknown user
      }

      // Calculate base score from various factors
      const scores: number[] = [];

      // 1. Account age
      scores.push(await this.getAccountAgeScore(user.createdAt));

      // 2. KYC verification status
      scores.push(this.getKycScore(user.kycVerifications.length > 0));

      // 3. Payment history
      scores.push(await this.getPaymentHistoryScore(userId));

      // 4. Transaction patterns
      scores.push(await this.getTransactionPatternScore(userId));

      // 5. Previous fraud flags
      scores.push(await this.getPreviousFraudScore(userId));

      // Calculate weighted average
      // We give more weight to payment history and previous fraud
      const weights = [0.15, 0.2, 0.3, 0.15, 0.2];
      let totalScore = 0;
      let totalWeight = 0;

      for (let i = 0; i < scores.length; i++) {
        totalScore += scores[i] * weights[i];
        totalWeight += weights[i];
      }

      const finalScore = Math.round(totalScore / totalWeight);
      
      // Log the score components for debugging
      this.logger.debug(`User ${userId} risk score components:`, {
        accountAge: scores[0],
        kyc: scores[1],
        paymentHistory: scores[2],
        transactionPatterns: scores[3],
        previousFraud: scores[4],
        finalScore,
      });

      return finalScore;
    } catch (error) {
      this.logger.error(`Error calculating user risk score: ${error.message}`, error.stack);
      return 50; // Default to medium risk in case of error
    }
  }

  /**
   * Calculate risk score based on account age
   * Newer accounts are higher risk
   */
  private async getAccountAgeScore(createdAt: Date): Promise<number> {
    const accountAgeInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (accountAgeInDays < 7) return 90; // Very new accounts are high risk
    if (accountAgeInDays < 30) return 70; // Less than a month
    if (accountAgeInDays < 90) return 50; // Less than 3 months
    if (accountAgeInDays < 180) return 30; // Less than 6 months
    return 10; // Established accounts are low risk
  }

  /**
   * Calculate risk score based on KYC verification status
   */
  private getKycScore(isVerified: boolean): number {
    return isVerified ? 10 : 80; // Unverified users are high risk
  }

  /**
   * Calculate risk score based on payment history
   */
  private async getPaymentHistoryScore(userId: string): Promise<number> {
    try {
      // Check for late payments
      const latePlans = await this.prisma.paymentPlan.count({
        where: {
          userId,
          status: 'LATE',
        },
      });

      // Check for defaulted payments
      const defaultedPlans = await this.prisma.paymentPlan.count({
        where: {
          userId,
          status: 'DEFAULTED',
        },
      });

      // Check for completed payments
      const completedPlans = await this.prisma.paymentPlan.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      });

      // Calculate score based on payment history
      if (defaultedPlans > 0) return 90; // Any defaults are very high risk
      if (latePlans > 2) return 80; // Multiple late payments are high risk
      if (latePlans > 0) return 60; // Some late payments are medium-high risk
      if (completedPlans === 0) return 50; // No payment history is medium risk
      if (completedPlans < 3) return 30; // Few completed payments are medium-low risk
      return 10; // Good payment history is low risk
    } catch (error) {
      this.logger.error(`Error calculating payment history score: ${error.message}`, error.stack);
      return 50; // Default to medium risk
    }
  }

  /**
   * Calculate risk score based on transaction patterns
   */
  private async getTransactionPatternScore(userId: string): Promise<number> {
    try {
      // Get recent transactions
      const recentTransactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (recentTransactions.length === 0) {
        return 50; // No transaction history is medium risk
      }

      // Check for rapid succession transactions
      const rapidTransactions = this.checkRapidTransactions(recentTransactions);
      
      // Check for unusual amounts
      const unusualAmounts = this.checkUnusualAmounts(recentTransactions);
      
      // Calculate score based on patterns
      if (rapidTransactions && unusualAmounts) return 80;
      if (rapidTransactions) return 70;
      if (unusualAmounts) return 60;
      return 20; // Normal patterns are low risk
    } catch (error) {
      this.logger.error(`Error calculating transaction pattern score: ${error.message}`, error.stack);
      return 50; // Default to medium risk
    }
  }

  /**
   * Check if there are transactions in rapid succession
   */
  private checkRapidTransactions(transactions: any[]): boolean {
    if (transactions.length < 3) return false;
    
    // Check for 3+ transactions within 1 hour
    for (let i = 0; i < transactions.length - 2; i++) {
      const t1 = new Date(transactions[i].createdAt).getTime();
      const t3 = new Date(transactions[i + 2].createdAt).getTime();
      
      // If time difference between 1st and 3rd transaction is less than 1 hour
      if (t1 - t3 < 60 * 60 * 1000) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if there are transactions with unusual amounts
   */
  private checkUnusualAmounts(transactions: any[]): boolean {
    if (transactions.length < 3) return false;
    
    // Calculate average and standard deviation
    const amounts = transactions.map(t => t.amount);
    const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Check for any amount that's more than 3 standard deviations from the mean
    return amounts.some(amount => Math.abs(amount - avg) > 3 * stdDev);
  }

  /**
   * Calculate risk score based on previous fraud flags
   */
  private async getPreviousFraudScore(userId: string): Promise<number> {
    try {
      // Check for previous fraud flags
      const fraudChecks = await this.prisma.fraudCheck.findMany({
        where: {
          transaction: {
            userId,
          },
          action: {
            in: ['FLAG', 'BLOCK'],
          },
          checkedAt: {
            gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Last 180 days
          },
        },
      });

      // Calculate score based on previous fraud flags
      if (fraudChecks.length === 0) return 10; // No flags is low risk
      if (fraudChecks.length === 1) return 50; // One flag is medium risk
      if (fraudChecks.length === 2) return 70; // Two flags is high risk
      return 90; // Three or more flags is very high risk
    } catch (error) {
      this.logger.error(`Error calculating previous fraud score: ${error.message}`, error.stack);
      return 50; // Default to medium risk
    }
  }
}
