import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Transaction, User, Merchant } from '@prisma/client';

interface RuleResult {
  passed: boolean;
  ruleName: string;
  riskScore: number;
}

interface TransactionRuleResult {
  riskScore: number;
  flaggedRules: string[];
  allResults: RuleResult[];
}

@Injectable()
export class TransactionRulesService {
  private readonly logger = new Logger(TransactionRulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Evaluate a transaction against all fraud rules
   * @param transaction Transaction to evaluate
   * @param user User making the transaction
   * @param merchant Merchant receiving the transaction
   * @returns Evaluation results
   */
  async evaluateTransaction(
    transaction: Transaction,
    user: User,
    merchant: Merchant,
  ): Promise<TransactionRuleResult> {
    try {
      this.logger.log(`Evaluating transaction ${transaction.id} against fraud rules`);

      // Get user's transaction history
      const userTransactions = await this.prisma.transaction.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Apply all rules
      const results: RuleResult[] = await Promise.all([
        this.checkTransactionAmount(transaction, user),
        this.checkTransactionFrequency(transaction, userTransactions),
        this.checkMerchantRisk(transaction, merchant),
        this.checkUserLocation(transaction, user),
        this.checkTransactionTime(transaction, userTransactions),
        this.checkMultipleMerchants(transaction, userTransactions),
      ]);

      // Calculate overall risk score (average of failed rules)
      const failedRules = results.filter(r => !r.passed);
      const riskScore = failedRules.length > 0
        ? Math.round(failedRules.reduce((sum, r) => sum + r.riskScore, 0) / failedRules.length)
        : 0;

      return {
        riskScore,
        flaggedRules: failedRules.map(r => r.ruleName),
        allResults: results,
      };
    } catch (error) {
      this.logger.error(`Error evaluating transaction rules: ${error.message}`, error.stack);
      return {
        riskScore: 50, // Medium risk as default in case of error
        flaggedRules: ['error_evaluating_rules'],
        allResults: [],
      };
    }
  }

  /**
   * Check if transaction amount is unusually high for the user
   */
  private async checkTransactionAmount(
    transaction: Transaction,
    user: User,
  ): Promise<RuleResult> {
    try {
      // Get user's average transaction amount
      const avgResult = await this.prisma.transaction.aggregate({
        where: {
          userId: user.id,
          status: 'COMPLETED',
        },
        _avg: {
          amount: true,
        },
      });

      const avgAmount = avgResult._avg.amount || 0;
      
      // Get user's account credit limit
      const account = await this.prisma.account.findUnique({
        where: { userId: user.id },
      });
      
      const creditLimit = account?.creditLimit || 0;
      
      // Calculate threshold based on credit limit and average amount
      // Higher of: 3x average transaction or 50% of credit limit
      const threshold = Math.max(avgAmount * 3, creditLimit * 0.5);
      
      // Check if current transaction exceeds threshold
      const passed = transaction.amount <= threshold;
      
      // Calculate risk score based on how much it exceeds
      let riskScore = 0;
      if (!passed) {
        const excessRatio = transaction.amount / threshold;
        if (excessRatio > 3) riskScore = 90;
        else if (excessRatio > 2) riskScore = 70;
        else riskScore = 50;
      }
      
      return {
        passed,
        ruleName: 'unusual_transaction_amount',
        riskScore,
      };
    } catch (error) {
      this.logger.error(`Error checking transaction amount: ${error.message}`, error.stack);
      return {
        passed: true, // Default to passing in case of error
        ruleName: 'unusual_transaction_amount',
        riskScore: 0,
      };
    }
  }

  /**
   * Check if user is making transactions too frequently
   */
  private async checkTransactionFrequency(
    transaction: Transaction,
    recentTransactions: Transaction[],
  ): Promise<RuleResult> {
    try {
      // Check transactions in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const transactionsLastHour = recentTransactions.filter(
        t => new Date(t.createdAt) >= oneHourAgo && t.id !== transaction.id
      );
      
      // Flag if more than 3 transactions in the last hour
      const passed = transactionsLastHour.length <= 3;
      
      // Calculate risk score based on frequency
      let riskScore = 0;
      if (!passed) {
        if (transactionsLastHour.length > 10) riskScore = 90;
        else if (transactionsLastHour.length > 5) riskScore = 70;
        else riskScore = 50;
      }
      
      return {
        passed,
        ruleName: 'high_transaction_frequency',
        riskScore,
      };
    } catch (error) {
      this.logger.error(`Error checking transaction frequency: ${error.message}`, error.stack);
      return {
        passed: true,
        ruleName: 'high_transaction_frequency',
        riskScore: 0,
      };
    }
  }

  /**
   * Check if merchant has high risk rating
   */
  private async checkMerchantRisk(
    transaction: Transaction,
    merchant: Merchant,
  ): Promise<RuleResult> {
    try {
      // Check if merchant is new (less than 30 days)
      const merchantAge = Date.now() - new Date(merchant.createdAt).getTime();
      const isNewMerchant = merchantAge < 30 * 24 * 60 * 60 * 1000;
      
      // Check merchant's fraud history
      const fraudChecks = await this.prisma.fraudCheck.findMany({
        where: {
          transaction: {
            merchantId: merchant.id,
          },
          action: {
            in: ['FLAG', 'BLOCK'],
          },
          checkedAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      });
      
      // Calculate merchant risk score
      const merchantRiskScore = isNewMerchant ? 30 : 0 + Math.min(fraudChecks.length * 10, 70);
      
      // Flag if merchant risk score is high
      const passed = merchantRiskScore < 50;
      
      return {
        passed,
        ruleName: 'high_risk_merchant',
        riskScore: merchantRiskScore,
      };
    } catch (error) {
      this.logger.error(`Error checking merchant risk: ${error.message}`, error.stack);
      return {
        passed: true,
        ruleName: 'high_risk_merchant',
        riskScore: 0,
      };
    }
  }

  /**
   * Check if transaction location is unusual for the user
   * This is a simplified implementation - in production, you would use IP geolocation
   */
  private async checkUserLocation(
    transaction: Transaction,
    user: User,
  ): Promise<RuleResult> {
    // In a real implementation, you would check IP address or device location
    // For now, we'll just return a passing result
    return {
      passed: true,
      ruleName: 'unusual_location',
      riskScore: 0,
    };
  }

  /**
   * Check if transaction time is unusual for the user
   */
  private async checkTransactionTime(
    transaction: Transaction,
    recentTransactions: Transaction[],
  ): Promise<RuleResult> {
    try {
      const transactionHour = new Date(transaction.createdAt).getHours();
      
      // Check if transaction is during late night hours (1am - 5am)
      const isLateNight = transactionHour >= 1 && transactionHour <= 5;
      
      // If not late night, pass the check
      if (!isLateNight) {
        return {
          passed: true,
          ruleName: 'unusual_transaction_time',
          riskScore: 0,
        };
      }
      
      // If late night, check if user has a history of late night transactions
      const lateNightTransactions = recentTransactions.filter(t => {
        const hour = new Date(t.createdAt).getHours();
        return hour >= 1 && hour <= 5;
      });
      
      // If user has late night transaction history, lower the risk
      const passed = lateNightTransactions.length > 0;
      
      return {
        passed,
        ruleName: 'unusual_transaction_time',
        riskScore: passed ? 0 : 60,
      };
    } catch (error) {
      this.logger.error(`Error checking transaction time: ${error.message}`, error.stack);
      return {
        passed: true,
        ruleName: 'unusual_transaction_time',
        riskScore: 0,
      };
    }
  }

  /**
   * Check if user is making transactions with multiple merchants in a short time
   */
  private async checkMultipleMerchants(
    transaction: Transaction,
    recentTransactions: Transaction[],
  ): Promise<RuleResult> {
    try {
      // Check transactions in the last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const recentTxns = recentTransactions.filter(
        t => new Date(t.createdAt) >= twoHoursAgo && t.id !== transaction.id
      );
      
      // Get unique merchants
      const merchantIds = new Set(recentTxns.map(t => t.merchantId).filter(Boolean));
      
      // Add current transaction merchant
      if (transaction.merchantId) {
        merchantIds.add(transaction.merchantId);
      }
      
      // Flag if more than 3 different merchants in 2 hours
      const passed = merchantIds.size <= 3;
      
      // Calculate risk score based on number of merchants
      let riskScore = 0;
      if (!passed) {
        if (merchantIds.size > 5) riskScore = 80;
        else riskScore = 60;
      }
      
      return {
        passed,
        ruleName: 'multiple_merchants',
        riskScore,
      };
    } catch (error) {
      this.logger.error(`Error checking multiple merchants: ${error.message}`, error.stack);
      return {
        passed: true,
        ruleName: 'multiple_merchants',
        riskScore: 0,
      };
    }
  }
}
