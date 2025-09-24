import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Account,
  PaymentMethod,
  TransactionType,
  TransactionStatus,
  PaymentPlanStatus
} from '@prisma/client';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAutopaySettingsDto } from '../dto/update-autopay-settings.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountStatus } from '../enums/account-status.enum';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { accountNumber },
    });
  }

  async create(userId: string, createAccountDto: CreateAccountDto): Promise<Account> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Generate unique account number (in a real app, this would be more sophisticated)
    const accountNumber = `FLEX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create account
    return this.prisma.account.create({
      data: {
        userId,
        accountNumber,
        status: createAccountDto.status || AccountStatus.ACTIVE,
      },
    });
  }

  async updateStatus(id: string, status: AccountStatus): Promise<Account> {
    const account = await this.findById(id);

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return this.prisma.account.update({
      where: { id },
      data: { status },
    });
  }

  async updateAvailableCredit(id: string, amount: number): Promise<Account> {
    const account = await this.findById(id);

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    // Calculate new available credit
    const newAvailableCredit = account.availableCredit + amount;

    // Ensure available credit doesn't go negative
    if (newAvailableCredit < 0) {
      throw new ConflictException('Insufficient available credit');
    }

    return this.prisma.account.update({
      where: { id },
      data: { availableCredit: newAvailableCredit },
    });
  }

  /**
   * Update autopay settings for an account
   */
  async updateAutopaySettings(id: string, updateAutopaySettingsDto: UpdateAutopaySettingsDto): Promise<Account> {
    const account = await this.findById(id);

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    // If enabling autopay, ensure a payment method is provided
    if (updateAutopaySettingsDto.autopayEnabled && !updateAutopaySettingsDto.autopayPaymentMethodId && !account.autopayPaymentMethodId) {
      throw new ConflictException('A payment method must be provided when enabling autopay');
    }

    // If a payment method is provided, verify it exists and belongs to the user
    if (updateAutopaySettingsDto.autopayPaymentMethodId) {
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id: updateAutopaySettingsDto.autopayPaymentMethodId },
      });

      if (!paymentMethod) {
        throw new NotFoundException(`Payment method with ID ${updateAutopaySettingsDto.autopayPaymentMethodId} not found`);
      }

      if (paymentMethod.userId !== account.userId) {
        throw new ConflictException('Payment method does not belong to the account owner');
      }

      // Ensure the payment method is verified
      if (!paymentMethod.isVerified) {
        throw new ConflictException('Payment method must be verified to use for autopay');
      }
    }

    // Update autopay settings
    return this.prisma.account.update({
      where: { id },
      data: {
        autopayEnabled: updateAutopaySettingsDto.autopayEnabled,
        autopayPaymentMethodId: updateAutopaySettingsDto.autopayPaymentMethodId || account.autopayPaymentMethodId,
      },
      include: {
        autopayPaymentMethod: true,
      },
    });
  }

  /**
   * Process automatic payments for upcoming installments
   * This is run as a scheduled job
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processAutomaticPayments(): Promise<void> {
    try {
      this.logger.log('Processing automatic payments for upcoming installments');

      // Get current date
      const now = new Date();

      // Add one day to get tomorrow's date
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find active payment plans with installments due tomorrow
      const upcomingInstallments = await this.prisma.installment.findMany({
        where: {
          status: 'UPCOMING',
          dueDate: {
            gte: now,
            lt: tomorrow,
          },
        },
        include: {
          paymentPlan: {
            include: {
              user: {
                include: {
                  account: {
                    include: {
                      autopayPaymentMethod: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      this.logger.log(`Found ${upcomingInstallments.length} upcoming installments due tomorrow`);

      // Process each installment for accounts with autopay enabled
      for (const installment of upcomingInstallments) {
        const account = installment.paymentPlan.user.account;

        // Skip if account is null or autopay is not enabled or no payment method is set
        if (!account || !account.autopayEnabled || !account.autopayPaymentMethodId) {
          continue;
        }

        try {
          // Process the payment using the payment plans service
          // Note: This is a placeholder - you'll need to implement the actual payment processing
          await this.prisma.$transaction(async (prisma) => {
            // Update installment status
            await prisma.installment.update({
              where: { id: installment.id },
              data: {
                status: 'PAID',
                paidDate: now,
                paidAmount: installment.amount,
              },
            });

            // Update payment plan remaining amount
            await prisma.paymentPlan.update({
              where: { id: installment.paymentPlanId },
              data: {
                remainingAmount: {
                  decrement: installment.amount,
                },
                // If remaining amount is 0, mark as completed
                status: installment.paymentPlan.remainingAmount - installment.amount <= 0
                  ? PaymentPlanStatus.COMPLETED
                  : undefined,
              },
            });

            // Create transaction record
            await prisma.transaction.create({
              data: {
                userId: installment.paymentPlan.userId,
                reference: `AUTOPAY-${Date.now()}-${installment.id.substring(0, 8)}`,
                type: TransactionType.PAYMENT,
                amount: installment.amount,
                currency: installment.paymentPlan.currency || 'ETB',
                status: TransactionStatus.COMPLETED,
                paymentMethodId: account.autopayPaymentMethodId || undefined,
                paymentPlanId: installment.paymentPlanId,
                description: `Automatic payment for installment #${installment.installmentNumber} of payment plan ${installment.paymentPlan.reference}`,
                metadata: {
                  isAutopay: true,
                  installmentId: installment.id,
                  installmentNumber: installment.installmentNumber,
                },
              },
            });

            // Create notification for the user
            await prisma.notification.create({
              data: {
                userId: installment.paymentPlan.userId,
                type: 'AUTOPAY_SUCCESS',
                message: `Automatic payment of ${installment.amount} ${installment.paymentPlan.currency || 'ETB'} for installment #${installment.installmentNumber} was successful.`,
                data: {
                  installmentId: installment.id,
                  paymentPlanId: installment.paymentPlanId,
                  amount: installment.amount,
                  currency: installment.paymentPlan.currency || 'ETB',
                },
              },
            });
          });

          this.logger.log(`Successfully processed automatic payment for installment ${installment.id}`);
        } catch (error) {
          this.logger.error(`Error processing automatic payment for installment ${installment.id}: ${error.message}`, error.stack);

          // Create notification for failed payment
          await this.prisma.notification.create({
            data: {
              userId: installment.paymentPlan.userId,
              type: 'AUTOPAY_FAILED',
              message: `Automatic payment for installment #${installment.installmentNumber} failed. Please make a manual payment to avoid late fees.`,
              data: {
                installmentId: installment.id,
                paymentPlanId: installment.paymentPlanId,
                amount: installment.amount,
                currency: installment.paymentPlan.currency || 'ETB',
                error: error.message,
              },
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error processing automatic payments: ${error.message}`, error.stack);
    }
  }
}