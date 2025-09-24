import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ConfigService } from '@nestjs/config';
import { PaymentPlanStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface RescheduleOptions {
  paymentPlanId: string;
  newEndDate: Date;
  reason: string;
  adminId?: string;
}

@Injectable()
export class PaymentRescheduleService {
  private readonly logger = new Logger(PaymentRescheduleService.name);
  private readonly maxReschedulesAllowed: number;
  private readonly rescheduleFeePercentage: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.maxReschedulesAllowed = this.configService.get<number>('MAX_RESCHEDULES_ALLOWED', 3);
    this.rescheduleFeePercentage = this.configService.get<number>('RESCHEDULE_FEE_PERCENTAGE', 2);
  }

  /**
   * Reschedule a payment plan
   * @param options Reschedule options
   * @returns Rescheduled payment plan
   */
  async reschedulePayment(options: RescheduleOptions): Promise<any> {
    try {
      const { paymentPlanId, newEndDate, reason, adminId } = options;

      // Get payment plan
      const paymentPlan = await this.prisma.paymentPlan.findUnique({
        where: { id: paymentPlanId },
        include: {
          user: true,
        },
      });

      if (!paymentPlan) {
        throw new NotFoundException(`Payment plan ${paymentPlanId} not found`);
      }

      // Check if plan can be rescheduled
      if (paymentPlan.status === PaymentPlanStatus.COMPLETED) {
        throw new BadRequestException('Cannot reschedule a completed payment plan');
      }

      if (paymentPlan.status === PaymentPlanStatus.DEFAULTED && !adminId) {
        throw new BadRequestException('Defaulted payment plans can only be rescheduled by an admin');
      }

      // Check if new end date is valid (must be in the future)
      const now = new Date();
      if (new Date(newEndDate) <= now) {
        throw new BadRequestException('New end date must be in the future');
      }

      // Check if maximum reschedules have been reached
      const metadata = typeof paymentPlan.metadata === 'string'
        ? JSON.parse(paymentPlan.metadata)
        : (paymentPlan.metadata || {});
      const rescheduleHistory = metadata.rescheduleHistory || [];
      if (rescheduleHistory.length >= this.maxReschedulesAllowed && !adminId) {
        throw new BadRequestException(`Maximum number of reschedules (${this.maxReschedulesAllowed}) has been reached`);
      }

      // Calculate reschedule fee (only if not admin-initiated)
      const rescheduleFee = adminId ? 0 : (paymentPlan.installmentAmount * this.rescheduleFeePercentage) / 100;

      // Create reschedule record
      const rescheduleRecord = {
        id: uuidv4(),
        originalEndDate: paymentPlan.endDate,
        newEndDate,
        reason,
        rescheduleFee,
        rescheduledBy: adminId || paymentPlan.userId,
        isAdminInitiated: !!adminId,
        rescheduledAt: new Date().toISOString(),
      };

      // Update payment plan
      const updatedPlan = await this.prisma.paymentPlan.update({
        where: { id: paymentPlanId },
        data: {
          endDate: newEndDate,
          status: PaymentPlanStatus.ACTIVE, // Reset to active if it was late
          metadata: JSON.stringify({
            ...metadata,
            rescheduleHistory: [...rescheduleHistory, rescheduleRecord],
            lateFee: 0, // Reset late fee if it was applied
            daysLate: 0,
          }),
        },
      });

      // Send notification to user
      await this.notificationsService.sendNotification({
        userId: paymentPlan.userId,
        type: 'PAYMENT_RESCHEDULED',
        message: `Your payment of ${paymentPlan.installmentAmount} ${paymentPlan.currency} has been rescheduled to ${new Date(newEndDate).toLocaleDateString()}.`,
        data: {
          paymentPlanId,
          originalEndDate: paymentPlan.endDate,
          newEndDate,
          rescheduleFee,
          reason,
          isAdminInitiated: !!adminId,
        },
      });

      // If admin-initiated, also notify the admin
      if (adminId) {
        await this.notificationsService.sendNotification({
          userId: adminId,
          type: 'PAYMENT_RESCHEDULED_ADMIN',
          message: `Payment plan ${paymentPlanId} for user ${paymentPlan.user.email || paymentPlan.user.phoneNumber} has been rescheduled.`,
          data: {
            paymentPlanId,
            userId: paymentPlan.userId,
            userEmail: paymentPlan.user.email,
            userPhone: paymentPlan.user.phoneNumber,
            originalEndDate: paymentPlan.endDate,
            newEndDate,
            reason,
          },
        });
      }

      return {
        success: true,
        message: 'Payment plan rescheduled successfully',
        paymentPlan: updatedPlan,
        rescheduleFee,
      };
    } catch (error) {
      this.logger.error(`Error rescheduling payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get reschedule history for a payment plan
   * @param paymentPlanId Payment plan ID
   * @returns Reschedule history
   */
  async getRescheduleHistory(paymentPlanId: string): Promise<any> {
    try {
      // Get payment plan
      const paymentPlan = await this.prisma.paymentPlan.findUnique({
        where: { id: paymentPlanId },
      });

      if (!paymentPlan) {
        throw new NotFoundException(`Payment plan ${paymentPlanId} not found`);
      }

      // Get reschedule history from metadata
      const metadata = typeof paymentPlan.metadata === 'string'
        ? JSON.parse(paymentPlan.metadata)
        : (paymentPlan.metadata || {});
      const rescheduleHistory = metadata.rescheduleHistory || [];

      return {
        success: true,
        paymentPlanId,
        rescheduleHistory,
        totalReschedules: rescheduleHistory.length,
        maxReschedulesAllowed: this.maxReschedulesAllowed,
        remainingReschedules: Math.max(0, this.maxReschedulesAllowed - rescheduleHistory.length),
      };
    } catch (error) {
      this.logger.error(`Error getting reschedule history: ${error.message}`, error.stack);
      throw error;
    }
  }
}
