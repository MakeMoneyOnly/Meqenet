import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { TransactionRulesService } from './transaction-rules.service';
import { UserBehaviorService } from './user-behavior.service';
import { ConfigService } from '@nestjs/config';
import { Transaction, User, Merchant } from '@prisma/client';

export interface FraudCheckResult {
  isFraudulent: boolean;
  riskScore: number;
  flaggedRules: string[];
  action: 'ALLOW' | 'FLAG' | 'BLOCK';
  reason?: string;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);
  private readonly highRiskThreshold: number;
  private readonly mediumRiskThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly transactionRulesService: TransactionRulesService,
    private readonly userBehaviorService: UserBehaviorService,
    private readonly configService: ConfigService,
  ) {
    this.highRiskThreshold = this.configService.get<number>('FRAUD_HIGH_RISK_THRESHOLD', 80);
    this.mediumRiskThreshold = this.configService.get<number>('FRAUD_MEDIUM_RISK_THRESHOLD', 50);
  }

  /**
   * Check a transaction for potential fraud
   * @param transaction Transaction to check
   * @param user User making the transaction
   * @param merchant Merchant receiving the transaction
   * @returns Fraud check result
   */
  async checkTransaction(
    transaction: Transaction,
    user: User,
    merchant: Merchant,
  ): Promise<FraudCheckResult> {
    try {
      this.logger.log(`Checking transaction ${transaction.id} for fraud`);

      // Get user behavior score
      const behaviorScore = await this.userBehaviorService.getUserRiskScore(user.id);

      // Check transaction against rules
      const ruleResults = await this.transactionRulesService.evaluateTransaction(
        transaction,
        user,
        merchant,
      );

      // Calculate overall risk score (weighted average)
      // 40% from user behavior, 60% from transaction rules
      const riskScore = Math.round(
        (behaviorScore * 0.4) + (ruleResults.riskScore * 0.6)
      );

      // Determine action based on risk score
      let action: 'ALLOW' | 'FLAG' | 'BLOCK' = 'ALLOW';
      if (riskScore >= this.highRiskThreshold) {
        action = 'BLOCK';
      } else if (riskScore >= this.mediumRiskThreshold) {
        action = 'FLAG';
      }

      // Log the fraud check result
      await this.logFraudCheck(transaction.id, riskScore, action, ruleResults.flaggedRules);

      // If high risk, notify admin
      if (action === 'BLOCK' || action === 'FLAG') {
        await this.notifyFraudSuspicion(transaction, user, merchant, riskScore, action, ruleResults.flaggedRules);
      }

      return {
        isFraudulent: action === 'BLOCK',
        riskScore,
        flaggedRules: ruleResults.flaggedRules,
        action,
        reason: ruleResults.flaggedRules.join(', '),
      };
    } catch (error) {
      this.logger.error(`Error checking transaction for fraud: ${error.message}`, error.stack);

      // In case of error, default to flagging the transaction for review
      return {
        isFraudulent: false,
        riskScore: this.mediumRiskThreshold,
        flaggedRules: ['error_during_check'],
        action: 'FLAG',
        reason: 'Error during fraud check',
      };
    }
  }

  /**
   * Log fraud check result to database
   */
  private async logFraudCheck(
    transactionId: string,
    riskScore: number,
    action: string,
    flaggedRules: string[],
  ): Promise<void> {
    try {
      await this.prisma.fraudCheck.create({
        data: {
          transactionId,
          riskScore,
          action,
          flaggedRules: flaggedRules,
          checkedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error logging fraud check: ${error.message}`, error.stack);
    }
  }

  /**
   * Notify administrators about suspected fraud
   */
  private async notifyFraudSuspicion(
    transaction: Transaction,
    user: User,
    merchant: Merchant,
    riskScore: number,
    action: string,
    flaggedRules: string[],
  ): Promise<void> {
    try {
      // Get admin users to notify
      const admins = await this.prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'COMPLIANCE_OFFICER'],
          },
        },
      });

      // Send notification to each admin
      for (const admin of admins) {
        await this.notificationsService.sendNotification({
          userId: admin.id,
          type: 'FRAUD_ALERT',
          message: `Potential fraud detected: Transaction ${transaction.reference} with risk score ${riskScore}. Action: ${action}`,
          data: {
            transactionId: transaction.id,
            transactionReference: transaction.reference,
            userId: user.id,
            userEmail: user.email,
            userPhone: user.phoneNumber,
            merchantId: merchant.id,
            merchantName: merchant.name,
            amount: transaction.amount,
            currency: transaction.currency,
            riskScore,
            action,
            flaggedRules,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error sending fraud notification: ${error.message}`, error.stack);
    }
  }

  /**
   * Get fraud statistics for dashboard
   */
  async getFraudStats(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalChecks,
      flaggedTransactions,
      blockedTransactions,
      averageRiskScore,
      topRules,
    ] = await Promise.all([
      // Total checks
      this.prisma.fraudCheck.count({
        where: {
          checkedAt: {
            gte: startDate,
          },
        },
      }),
      // Flagged transactions
      this.prisma.fraudCheck.count({
        where: {
          action: 'FLAG',
          checkedAt: {
            gte: startDate,
          },
        },
      }),
      // Blocked transactions
      this.prisma.fraudCheck.count({
        where: {
          action: 'BLOCK',
          checkedAt: {
            gte: startDate,
          },
        },
      }),
      // Average risk score
      this.prisma.fraudCheck.aggregate({
        where: {
          checkedAt: {
            gte: startDate,
          },
        },
        _avg: {
          riskScore: true,
        },
      }),
      // Top flagged rules
      this.prisma.fraudCheck.findMany({
        where: {
          checkedAt: {
            gte: startDate,
          },
          NOT: {
            flaggedRules: {
              isEmpty: true
            },
          },
        },
        select: {
          flaggedRules: true,
        },
      }),
    ]);

    // Process top rules
    const ruleCount: Record<string, number> = {};
    topRules.forEach(check => {
      check.flaggedRules.forEach((rule: string) => {
        ruleCount[rule] = (ruleCount[rule] || 0) + 1;
      });
    });

    const sortedRules = Object.entries(ruleCount)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([rule, count]) => ({ rule, count }));

    return {
      totalChecks,
      flaggedTransactions,
      blockedTransactions,
      flagRate: totalChecks ? (flaggedTransactions / totalChecks) * 100 : 0,
      blockRate: totalChecks ? (blockedTransactions / totalChecks) * 100 : 0,
      averageRiskScore: averageRiskScore._avg.riskScore || 0,
      topFlaggedRules: sortedRules,
      period: `Last ${days} days`,
    };
  }
}
