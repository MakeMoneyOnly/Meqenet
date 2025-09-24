import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, PaymentPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreditAssessmentDto,
  EmploymentStatus,
  IncomeFrequency,
} from '../dto/credit-assessment.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

/**
 * Service for assessing and managing user credit limits
 * Implements Ethiopian-specific credit assessment logic based on alternative data
 * as described in docs/Stage 2 -Development/12. Credit_Risk_Assessment.md
 */
@Injectable()
export class CreditAssessmentService {
  private readonly logger = new Logger(CreditAssessmentService.name);
  private readonly baseMultiplier: number;
  private readonly maxLimit: number;
  private readonly minLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService
  ) {
    this.baseMultiplier = this.configService.get<number>(
      'CREDIT_BASE_MULTIPLIER',
      2
    );
    this.maxLimit = this.configService.get<number>('CREDIT_MAX_LIMIT', 50000);
    this.minLimit = this.configService.get<number>('CREDIT_MIN_LIMIT', 1000);
  }

  /**
   * Assess credit limit for a user based on provided financial information
   * Implements Ethiopian-specific credit assessment logic
   * @param userId User ID
   * @param data Credit assessment data
   * @returns Assessed credit limit in ETB
   */
  async assessCreditLimit(
    userId: string,
    data: CreditAssessmentDto
  ): Promise<number> {
    try {
      this.logger.log(`Assessing credit limit for user ${userId}`);

      // Get user profile and account
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userProfile: true,
          account: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Calculate base credit limit
      let creditLimit = this.calculateBaseCreditLimit(data);

      // Apply adjustments based on employment status
      creditLimit = this.applyEmploymentAdjustment(
        creditLimit,
        data.employmentStatus
      );

      // Apply adjustments based on income frequency
      creditLimit = this.applyIncomeFrequencyAdjustment(
        creditLimit,
        data.incomeFrequency
      );

      // Apply additional adjustments
      creditLimit = this.applyAdditionalAdjustments(creditLimit, data);

      // Apply Ethiopian market specific adjustments
      creditLimit = this.applyEthiopianMarketAdjustments(
        creditLimit,
        data,
        user
      );

      // Ensure credit limit is within allowed range
      creditLimit = Math.max(
        this.minLimit,
        Math.min(this.maxLimit, creditLimit)
      );

      // Round to nearest 100 (for cleaner limits in ETB)
      creditLimit = Math.floor(creditLimit / 100) * 100;

      // Store assessment result
      await this.storeCreditAssessment(userId, creditLimit, data);

      // Get old limit for comparison
      const oldLimit: number =
        user.userProfile && 'creditLimit' in user.userProfile
          ? typeof user.userProfile.creditLimit === 'number'
            ? user.userProfile.creditLimit
            : 0
          : 0;

      // Create or update account
      if (!user.account) {
        await this.prisma.account.create({
          data: {
            userId,
            accountNumber: `ACC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            creditLimit,
            availableCredit: creditLimit,
            totalOutstanding: 0,
            status: 'ACTIVE',
          },
        });
      } else {
        // Calculate the change in available credit
        const additionalCredit = creditLimit - oldLimit;
        const newAvailableCredit =
          user.account.availableCredit + additionalCredit;

        await this.prisma.account.update({
          where: { id: user.account.id },
          data: {
            creditLimit,
            availableCredit: newAvailableCredit,
          },
        });
      }

      // Update user profile with assessment date if needed
      if (!user.userProfile) {
        await this.prisma.userProfile.create({
          data: {
            userId,
            firstName: '',
            lastName: '',
          },
        });
      }

      // Log credit limit history
      if (user.account) {
        await this.prisma.creditLimitHistory.create({
          data: {
            accountId: user.account.id,
            previousLimit: oldLimit,
            newLimit: creditLimit,
            reason: 'Initial credit assessment',
          },
        });
      }

      // Send notification if credit limit changed
      if (creditLimit !== oldLimit) {
        await this.notificationsService.sendNotification({
          type: NotificationType.CREDIT_LIMIT_UPDATED,
          userId,
          message: `Your credit limit has been updated from ${oldLimit} to ${creditLimit} ETB.`,
          email: user.email || undefined,
          phoneNumber: user.phoneNumber,
          data: {
            oldLimit,
            newLimit: creditLimit,
          },
        });
      }

      this.logger.log(
        `Credit limit for user ${userId} set to ${creditLimit} ETB`
      );
      return creditLimit;
    } catch (error) {
      this.logger.error(
        `Error assessing credit limit: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Reassess credit limit based on payment history and behavior
   * @param userId User ID
   * @returns Updated credit limit in ETB
   */
  async reassessCreditLimit(userId: string): Promise<number> {
    try {
      this.logger.log(`Reassessing credit limit for user ${userId}`);

      // Get user profile and account
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userProfile: true,
          account: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (!user.userProfile) {
        throw new NotFoundException(
          `User profile not found for user ${userId}`
        );
      }

      if (!user.account) {
        throw new NotFoundException(`Account not found for user ${userId}`);
      }

      // Get payment history
      const paymentPlans = await this.prisma.paymentPlan.findMany({
        where: { userId },
        include: {
          transactions: true,
        },
      });

      // Calculate payment reliability score (0-1)
      const reliabilityScore =
        this.calculatePaymentReliabilityScore(paymentPlans);

      // Get current credit limit
      const currentLimit = user.account.creditLimit;

      // Adjust credit limit based on payment history
      let newLimit = currentLimit;

      if (reliabilityScore > 0.95) {
        // Excellent payment history - increase by 25%
        newLimit = currentLimit * 1.25;
      } else if (reliabilityScore > 0.85) {
        // Good payment history - increase by 15%
        newLimit = currentLimit * 1.15;
      } else if (reliabilityScore > 0.75) {
        // Above average payment history - increase by 10%
        newLimit = currentLimit * 1.1;
      } else if (reliabilityScore < 0.5) {
        // Poor payment history - decrease by 25%
        newLimit = currentLimit * 0.75;
      } else if (reliabilityScore < 0.7) {
        // Below average payment history - decrease by 10%
        newLimit = currentLimit * 0.9;
      }

      // Ensure credit limit is within allowed range
      newLimit = Math.max(this.minLimit, Math.min(this.maxLimit, newLimit));

      // Round to nearest 100 (for cleaner limits in ETB)
      newLimit = Math.floor(newLimit / 100) * 100;

      // Only update if the limit has changed
      if (newLimit !== currentLimit) {
        // Calculate the change in available credit
        const additionalCredit = newLimit - currentLimit;
        const newAvailableCredit =
          user.account.availableCredit + additionalCredit;

        // Update account
        await this.prisma.account.update({
          where: { id: user.account.id },
          data: {
            creditLimit: newLimit,
            availableCredit: newAvailableCredit,
          },
        });

        // No need to update user profile with credit limit

        // Log credit limit history
        await this.prisma.creditLimitHistory.create({
          data: {
            accountId: user.account.id,
            previousLimit: currentLimit,
            newLimit,
            reason: `Automatic reassessment based on payment history (reliability score: ${reliabilityScore.toFixed(2)})`,
          },
        });

        // Send notification
        await this.notificationsService.sendNotification({
          type: NotificationType.CREDIT_LIMIT_UPDATED,
          userId,
          message: `Your credit limit has been updated from ${currentLimit} to ${newLimit} ETB.`,
          email: user.email || undefined,
          phoneNumber: user.phoneNumber,
          data: {
            oldLimit: currentLimit,
            newLimit,
          },
        });
      }

      this.logger.log(
        `Credit limit for user ${userId} reassessed from ${currentLimit} to ${newLimit} ETB`
      );
      return newLimit;
    } catch (error) {
      this.logger.error(
        `Error reassessing credit limit: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private calculateBaseCreditLimit(data: CreditAssessmentDto): number {
    // Calculate disposable income
    const disposableIncome =
      data.monthlyIncome -
      data.monthlyExpenses -
      (data.existingLoanPayments || 0);

    // Base credit limit is disposable income multiplied by a factor
    return disposableIncome * this.baseMultiplier;
  }

  private applyEmploymentAdjustment(
    baseLimit: number,
    employmentStatus: EmploymentStatus
  ): number {
    // Apply multipliers based on employment stability
    switch (employmentStatus) {
      case EmploymentStatus.FULL_TIME:
        return Number(baseLimit) * 1.2; // 20% increase for stable employment
      case EmploymentStatus.SELF_EMPLOYED:
        return Number(baseLimit) * 1.0; // No adjustment
      case EmploymentStatus.PART_TIME:
        return Number(baseLimit) * 0.8; // 20% decrease for less stable income
      case EmploymentStatus.CONTRACT:
        return Number(baseLimit) * 0.9; // 10% decrease for temporary employment
      case EmploymentStatus.STUDENT:
        return Number(baseLimit) * 0.6; // 40% decrease for students
      case EmploymentStatus.UNEMPLOYED:
        return Number(baseLimit) * 0.3; // 70% decrease for unemployed
      default:
        return Number(baseLimit);
    }
  }

  private applyIncomeFrequencyAdjustment(
    baseLimit: number,
    incomeFrequency: IncomeFrequency
  ): number {
    // Apply multipliers based on income stability
    switch (incomeFrequency) {
      case IncomeFrequency.MONTHLY:
        return Number(baseLimit) * 1.1; // 10% increase for stable monthly income
      case IncomeFrequency.WEEKLY:
        return Number(baseLimit) * 1.0; // No adjustment
      case IncomeFrequency.IRREGULAR:
        return Number(baseLimit) * 0.8; // 20% decrease for irregular income
      default:
        return Number(baseLimit);
    }
  }

  private applyAdditionalAdjustments(
    baseLimit: number,
    data: CreditAssessmentDto
  ): number {
    let adjustedLimit = baseLimit;

    // Adjust based on existing loans
    if (data.existingLoanPayments && data.existingLoanPayments > 0) {
      const debtToIncomeRatio = data.existingLoanPayments / data.monthlyIncome;

      if (debtToIncomeRatio > 0.5) {
        adjustedLimit *= 0.6; // Significant reduction for high debt
      } else if (debtToIncomeRatio > 0.3) {
        adjustedLimit *= 0.8; // Moderate reduction for medium debt
      }
    }

    // Adjust based on housing status
    if (data.housingStatus === 'OWNED') {
      adjustedLimit *= 1.2; // 20% increase for homeowners (asset ownership)
    } else if (data.housingStatus === 'RENTED') {
      // No adjustment for renters
    } else if (data.housingStatus === 'LIVING_WITH_FAMILY') {
      adjustedLimit *= 1.1; // 10% increase for lower expenses
    }

    // Adjust based on length of employment
    if (data.yearsAtCurrentEmployer) {
      if (data.yearsAtCurrentEmployer >= 5) {
        adjustedLimit *= 1.2; // 20% increase for long-term employment
      } else if (data.yearsAtCurrentEmployer >= 2) {
        adjustedLimit *= 1.1; // 10% increase for medium-term employment
      } else if (data.yearsAtCurrentEmployer < 0.5) {
        adjustedLimit *= 0.9; // 10% decrease for very new employment
      }
    }

    return adjustedLimit;
  }

  /**
   * Apply Ethiopian market specific adjustments
   * Based on docs/Stage 2 -Development/12. Credit_Risk_Assessment.md
   * @param baseLimit Base credit limit
   * @param data Credit assessment data
   * @param user User data
   * @returns Adjusted credit limit
   */
  private applyEthiopianMarketAdjustments(
    baseLimit: number,
    data: CreditAssessmentDto,
    user: User
  ): number {
    let adjustedLimit = baseLimit;

    // Adjust based on KYC verification status
    // In Ethiopia, verified identity is crucial for credit assessment
    if (user.userProfile?.kycStatus === 'VERIFIED') {
      adjustedLimit *= 1.15; // 15% increase for verified identity
    } else if (user.userProfile?.kycStatus === 'PENDING') {
      adjustedLimit *= 0.7; // 30% decrease for pending verification
    } else if (
      !user.userProfile?.kycStatus ||
      user.userProfile?.kycStatus === 'NOT_SUBMITTED'
    ) {
      adjustedLimit *= 0.5; // 50% decrease for unverified users
    }

    // Adjust based on mobile money usage (if available)
    // This is a key alternative data source in Ethiopia
    if (user.userProfile?.mobileMoneyData) {
      const mobileMoneyData = user.userProfile.mobileMoneyData;

      // Check average balance
      if (mobileMoneyData.avgBalance > data.monthlyIncome * 0.5) {
        adjustedLimit *= 1.2; // 20% increase for high average balance
      } else if (mobileMoneyData.avgBalance > data.monthlyIncome * 0.2) {
        adjustedLimit *= 1.1; // 10% increase for medium average balance
      }

      // Check transaction frequency
      if (mobileMoneyData.monthlyTransactions > 20) {
        adjustedLimit *= 1.1; // 10% increase for high transaction frequency
      }
    }

    // Adjust based on region (if available)
    // Different regions in Ethiopia have different economic conditions
    if (user.userProfile?.address?.region) {
      const region = user.userProfile.address.region.toUpperCase();

      // Adjust based on region's economic development
      // This is a simplified example - in production, would use more granular data
      if (['ADDIS ABABA', 'DIRE DAWA'].includes(region)) {
        adjustedLimit *= 1.1; // 10% increase for major urban centers
      } else if (['OROMIA', 'AMHARA', 'TIGRAY'].includes(region)) {
        // No adjustment for major regions
      } else {
        adjustedLimit *= 0.9; // 10% decrease for other regions
      }
    }

    return adjustedLimit;
  }

  /**
   * Calculate assessment score for record-keeping
   * @param data Credit assessment data
   * @returns Assessment score (0-100)
   */
  private calculateAssessmentScore(data: CreditAssessmentDto): number {
    let score = 50; // Start with middle score

    // Factor 1: Income to expense ratio (30 points)
    const incomeToExpenseRatio =
      data.monthlyIncome / (data.monthlyExpenses || 1);
    if (incomeToExpenseRatio > 3) {
      score += 30;
    } else if (incomeToExpenseRatio > 2) {
      score += 20;
    } else if (incomeToExpenseRatio > 1.5) {
      score += 10;
    } else if (incomeToExpenseRatio < 1.2) {
      score -= 10;
    }

    // Factor 2: Employment stability (20 points)
    switch (data.employmentStatus) {
      case EmploymentStatus.FULL_TIME:
        score += 20;
        break;
      case EmploymentStatus.SELF_EMPLOYED:
        score += 10;
        break;
      case EmploymentStatus.PART_TIME:
        score += 5;
        break;
      case EmploymentStatus.CONTRACT:
        score += 5;
        break;
      case EmploymentStatus.STUDENT:
        score -= 5;
        break;
      case EmploymentStatus.UNEMPLOYED:
        score -= 15;
        break;
    }

    // Factor 3: Income frequency (10 points)
    switch (data.incomeFrequency) {
      case IncomeFrequency.MONTHLY:
        score += 10;
        break;
      case IncomeFrequency.WEEKLY:
        score += 5;
        break;
      case IncomeFrequency.IRREGULAR:
        score -= 5;
        break;
    }

    // Factor 4: Existing debt (10 points)
    if (data.existingLoanPayments) {
      const debtToIncomeRatio = data.existingLoanPayments / data.monthlyIncome;
      if (debtToIncomeRatio > 0.5) {
        score -= 10;
      } else if (debtToIncomeRatio > 0.3) {
        score -= 5;
      } else if (debtToIncomeRatio < 0.1) {
        score += 5;
      }
    } else {
      score += 10; // No existing debt
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Store credit assessment data for future reference and analysis
   * @param userId User ID
   * @param creditLimit Assessed credit limit
   * @param data Credit assessment data
   */
  private async storeCreditAssessment(
    userId: string,
    creditLimit: number,
    data: CreditAssessmentDto
  ): Promise<void> {
    try {
      const score = this.calculateAssessmentScore(data);

      // Store assessment data in a log or custom table if needed
      this.logger.log(
        `Credit assessment for user ${userId}: score=${score}, limit=${creditLimit}`
      );
    } catch (error) {
      // Log error but don't fail the assessment
      this.logger.error(
        `Error storing credit assessment: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Calculate payment reliability score based on payment history
   * @param paymentPlans User's payment plans
   * @returns Reliability score (0-1)
   */
  private calculatePaymentReliabilityScore(
    paymentPlans: PaymentPlan[]
  ): number {
    // If no payment history, return neutral score
    if (!paymentPlans.length) {
      return 0.7;
    }

    let totalPayments = 0;
    let latePayments = 0;
    let missedPayments = 0;

    // Analyze payment history
    for (const plan of paymentPlans) {
      for (const transaction of plan.transactions) {
        totalPayments++;

        // Check if payment was late
        if (transaction.status === 'COMPLETED') {
          const dueDate = new Date(transaction.dueDate);
          const paymentDate = new Date(transaction.completedAt);

          // Payment is late if completed after due date
          if (paymentDate > dueDate) {
            const daysLate = Math.floor(
              (paymentDate.getTime() - dueDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (daysLate > 30) {
              missedPayments++; // Consider as missed if more than 30 days late
            } else if (daysLate > 0) {
              latePayments++; // Late but not missed
            }
          }
        } else if (transaction.status === 'OVERDUE') {
          missedPayments++;
        }
      }
    }

    // Calculate reliability score
    // Formula: 1 - (0.2 * lateRatio + 0.8 * missedRatio)
    const lateRatio = totalPayments > 0 ? latePayments / totalPayments : 0;
    const missedRatio = totalPayments > 0 ? missedPayments / totalPayments : 0;

    return Math.max(0, Math.min(1, 1 - (0.2 * lateRatio + 0.8 * missedRatio)));
  }
}
