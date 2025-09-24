import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ConfigService } from '@nestjs/config';
import { PaymentPlanStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LatePaymentService {
  private readonly logger = new Logger(LatePaymentService.name);
  private readonly gracePeriodDays: number;
  private readonly defaultPeriodDays: number;
  private readonly lateFeePercentage: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.gracePeriodDays = this.configService.get<number>('PAYMENT_GRACE_PERIOD_DAYS', 3);
    this.defaultPeriodDays = this.configService.get<number>('PAYMENT_DEFAULT_PERIOD_DAYS', 30);
    this.lateFeePercentage = this.configService.get<number>('LATE_FEE_PERCENTAGE', 5);
  }

  /**
   * Check for late payments and update their status
   * This is run as a scheduled job
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkLatePayments(): Promise<void> {
    try {
      this.logger.log('Checking for late payments');

      // Get current date
      const now = new Date();
      
      // Find active payment plans with due dates in the past
      const latePlans = await this.prisma.paymentPlan.findMany({
        where: {
          status: PaymentPlanStatus.ACTIVE,
          endDate: {
            lt: now,
          },
        },
        include: {
          user: true,
        },
      });

      this.logger.log(`Found ${latePlans.length} late payment plans`);

      // Process each late plan
      for (const plan of latePlans) {
        await this.handleLatePlan(plan);
      }

      // Find plans that are already marked as late and check if they should be defaulted
      const existingLatePlans = await this.prisma.paymentPlan.findMany({
        where: {
          status: PaymentPlanStatus.LATE,
        },
        include: {
          user: true,
        },
      });

      this.logger.log(`Found ${existingLatePlans.length} existing late payment plans to check for default`);

      // Process each existing late plan
      for (const plan of existingLatePlans) {
        await this.checkForDefault(plan);
      }
    } catch (error) {
      this.logger.error(`Error checking late payments: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle a late payment plan
   * @param plan Late payment plan
   */
  private async handleLatePlan(plan: any): Promise<void> {
    try {
      // Calculate days late
      const daysLate = this.calculateDaysLate(plan.endDate);
      
      // If within grace period, just send a reminder
      if (daysLate <= this.gracePeriodDays) {
        await this.sendPaymentReminder(plan, daysLate);
        return;
      }
      
      // If beyond grace period, mark as late and apply late fee
      await this.markPlanAsLate(plan, daysLate);
    } catch (error) {
      this.logger.error(`Error handling late plan ${plan.id}: ${error.message}`, error.stack);
    }
  }

  /**
   * Check if a late plan should be marked as defaulted
   * @param plan Late payment plan
   */
  private async checkForDefault(plan: any): Promise<void> {
    try {
      // Calculate days late
      const daysLate = this.calculateDaysLate(plan.endDate);
      
      // If beyond default period, mark as defaulted
      if (daysLate > this.defaultPeriodDays) {
        await this.markPlanAsDefaulted(plan, daysLate);
      }
    } catch (error) {
      this.logger.error(`Error checking for default on plan ${plan.id}: ${error.message}`, error.stack);
    }
  }

  /**
   * Calculate days late
   * @param endDate Payment due date
   * @returns Number of days late
   */
  private calculateDaysLate(endDate: Date): number {
    const now = new Date();
    const dueDate = new Date(endDate);
    const diffTime = Math.abs(now.getTime() - dueDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Send payment reminder notification
   * @param plan Payment plan
   * @param daysLate Number of days late
   */
  private async sendPaymentReminder(plan: any, daysLate: number): Promise<void> {
    try {
      // Send notification to user
      await this.notificationsService.sendNotification({
        userId: plan.userId,
        type: 'PAYMENT_REMINDER',
        message: `Your payment of ${plan.installmentAmount} ${plan.currency} is ${daysLate} day(s) overdue. Please make your payment to avoid late fees.`,
        data: {
          paymentPlanId: plan.id,
          daysLate,
          amount: plan.installmentAmount,
          currency: plan.currency,
          dueDate: plan.endDate,
        },
      });

      this.logger.log(`Sent payment reminder for plan ${plan.id}, ${daysLate} days late`);
    } catch (error) {
      this.logger.error(`Error sending payment reminder: ${error.message}`, error.stack);
    }
  }

  /**
   * Mark plan as late and apply late fee
   * @param plan Payment plan
   * @param daysLate Number of days late
   */
  private async markPlanAsLate(plan: any, daysLate: number): Promise<void> {
    try {
      // Calculate late fee
      const lateFee = (plan.installmentAmount * this.lateFeePercentage) / 100;
      
      // Update plan status to LATE
      await this.prisma.paymentPlan.update({
        where: { id: plan.id },
        data: {
          status: PaymentPlanStatus.LATE,
          metadata: {
            ...plan.metadata,
            lateFee,
            daysLate,
            lateAt: new Date().toISOString(),
          },
        },
      });
      
      // Send notification to user
      await this.notificationsService.sendNotification({
        userId: plan.userId,
        type: 'PAYMENT_LATE',
        message: `Your payment of ${plan.installmentAmount} ${plan.currency} is now marked as late. A late fee of ${lateFee} ${plan.currency} has been applied.`,
        data: {
          paymentPlanId: plan.id,
          daysLate,
          amount: plan.installmentAmount,
          lateFee,
          currency: plan.currency,
          dueDate: plan.endDate,
        },
      });

      this.logger.log(`Marked plan ${plan.id} as late, ${daysLate} days late, applied late fee of ${lateFee}`);
    } catch (error) {
      this.logger.error(`Error marking plan as late: ${error.message}`, error.stack);
    }
  }

  /**
   * Mark plan as defaulted
   * @param plan Payment plan
   * @param daysLate Number of days late
   */
  private async markPlanAsDefaulted(plan: any, daysLate: number): Promise<void> {
    try {
      // Update plan status to DEFAULTED
      await this.prisma.paymentPlan.update({
        where: { id: plan.id },
        data: {
          status: PaymentPlanStatus.DEFAULTED,
          metadata: {
            ...plan.metadata,
            daysLate,
            defaultedAt: new Date().toISOString(),
          },
        },
      });
      
      // Send notification to user
      await this.notificationsService.sendNotification({
        userId: plan.userId,
        type: 'PAYMENT_DEFAULTED',
        message: `Your payment of ${plan.installmentAmount} ${plan.currency} has been marked as defaulted. Please contact customer support immediately.`,
        data: {
          paymentPlanId: plan.id,
          daysLate,
          amount: plan.installmentAmount,
          currency: plan.currency,
          dueDate: plan.endDate,
        },
      });

      // Notify admins
      const admins = await this.prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'CREDIT_MANAGER'],
          },
        },
      });

      for (const admin of admins) {
        await this.notificationsService.sendNotification({
          userId: admin.id,
          type: 'PAYMENT_DEFAULTED_ADMIN',
          message: `Payment plan ${plan.id} for user ${plan.user.email || plan.user.phoneNumber} has defaulted after ${daysLate} days.`,
          data: {
            paymentPlanId: plan.id,
            userId: plan.userId,
            userEmail: plan.user.email,
            userPhone: plan.user.phoneNumber,
            daysLate,
            amount: plan.installmentAmount,
            currency: plan.currency,
            dueDate: plan.endDate,
          },
        });
      }

      this.logger.log(`Marked plan ${plan.id} as defaulted, ${daysLate} days late`);
    } catch (error) {
      this.logger.error(`Error marking plan as defaulted: ${error.message}`, error.stack);
    }
  }

  /**
   * Get payment plans with late status
   * @param options Pagination and filtering options
   * @returns Late payment plans
   */
  async getLatePayments(options: {
    status?: PaymentPlanStatus;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    try {
      const {
        status = PaymentPlanStatus.LATE,
        limit = 10,
        offset = 0,
        sortBy = 'endDate',
        sortOrder = 'asc',
      } = options;

      // Build where clause
      const where = { status };

      // Get late payment plans
      const [latePlans, total] = await Promise.all([
        this.prisma.paymentPlan.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phoneNumber: true,
                userProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          take: limit,
          skip: offset,
        }),
        this.prisma.paymentPlan.count({ where }),
      ]);

      return {
        latePlans,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting late payments: ${error.message}`, error.stack);
      throw error;
    }
  }
}
