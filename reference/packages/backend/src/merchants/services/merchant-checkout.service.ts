import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutDto } from '../dto/checkout.dto';
import { PaymentPlansService } from '../../payment-plans/services/payment-plans.service';
import { PaymentGatewaysService } from '../../payment-gateways/services/payment-gateways.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { MerchantStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MerchantCheckoutService {
  private readonly logger = new Logger(MerchantCheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentPlansService: PaymentPlansService,
    private readonly paymentGatewaysService: PaymentGatewaysService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async initiateCheckout(merchantId: string, userId: string, checkoutDto: CheckoutDto) {
    try {
      this.logger.log(`Initiating checkout for merchant ${merchantId}, user ${userId}`);

      // Validate merchant
      const merchant = await this.prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        this.logger.warn(`Checkout attempt with invalid merchant ID: ${merchantId}`);
        throw new NotFoundException(`Merchant with ID ${merchantId} not found`);
      }

      if (merchant.status !== MerchantStatus.ACTIVE) {
        this.logger.warn(`Checkout attempt with inactive merchant: ${merchantId}, status: ${merchant.status}`);
        throw new BadRequestException('Merchant account is not active');
      }

      // Validate checkout data
      this.validateCheckoutData(checkoutDto);

      // Validate user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userProfile: true,
          account: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!user.account) {
        throw new BadRequestException('User does not have an active account');
      }

      // Check if user has sufficient credit
      if (user.account.availableCredit < checkoutDto.amount) {
        throw new BadRequestException('Insufficient credit available');
      }

      // Validate installments
      if (![3, 6, 12].includes(checkoutDto.numberOfInstallments)) {
        throw new BadRequestException('Number of installments must be 3, 6, or 12');
      }

      // Generate unique reference
      const reference = `FLEX-${uuidv4().substring(0, 8)}-${Date.now()}`;

      // Calculate installment amount
      const installmentAmount = Math.ceil(checkoutDto.amount / checkoutDto.numberOfInstallments);

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + checkoutDto.numberOfInstallments);

      // Create payment plan
      const paymentPlan = await this.prisma.paymentPlan.create({
        data: {
          userId,
          reference,
          totalAmount: checkoutDto.amount,
          remainingAmount: checkoutDto.amount,
          currency: checkoutDto.currency || 'ETB',
          numberOfInstallments: checkoutDto.numberOfInstallments,
          installmentAmount,
          startDate,
          endDate,
          status: 'ACTIVE',
          merchantId,
          description: checkoutDto.description,
          metadata: checkoutDto.metadata || {},
        },
      });

      // Create installments
      const installments = [];
      const now = new Date();

      for (let i = 0; i < checkoutDto.numberOfInstallments; i++) {
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + i + 1); // Due next month, then month after, etc.

        const installment = await this.prisma.installment.create({
          data: {
            paymentPlanId: paymentPlan.id,
            amount: installmentAmount,
            dueDate,
            status: i === 0 ? 'UPCOMING' : 'PENDING', // First installment is upcoming, rest are pending
            installmentNumber: i + 1,
          },
        });

        installments.push(installment);
      }

      // Update account available credit
      await this.prisma.account.update({
        where: { id: user.account.id },
        data: {
          availableCredit: {
            decrement: checkoutDto.amount,
          },
          totalOutstanding: {
            increment: checkoutDto.amount,
          },
        },
      });

      // Create transaction record
      const transaction = await this.prisma.transaction.create({
        data: {
          userId,
          reference: `TXN-${reference}`,
          type: 'PAYMENT',
          amount: checkoutDto.amount,
          currency: checkoutDto.currency || 'ETB',
          status: 'COMPLETED',
          merchantId,
          description: `Payment to ${merchant.name} - ${checkoutDto.description}`,
          metadata: JSON.stringify({
            merchantOrderId: checkoutDto.merchantOrderId,
            items: checkoutDto.items,
            ...(checkoutDto.metadata ? JSON.parse(JSON.stringify(checkoutDto.metadata)) : {}),
          }),
        },
      });

      // Send notification to user
      await this.notificationsService.sendNotification({
        type: 'PAYMENT_PLAN_CREATED',
        userId,
        message: `Your payment plan with ${merchant.name} for ${checkoutDto.amount} ${checkoutDto.currency || 'ETB'} has been created.`,
        email: user.email || undefined,
        phoneNumber: user.phoneNumber,
        data: {
          merchantName: merchant.name,
          amount: checkoutDto.amount,
          currency: checkoutDto.currency || 'ETB',
          installments: checkoutDto.numberOfInstallments,
          installmentAmount,
          firstDueDate: installments[0].dueDate,
        },
      });

      this.logger.log(`Checkout completed for merchant ${merchantId}, user ${userId}, payment plan ${paymentPlan.id}`);

      return {
        success: true,
        paymentPlanId: paymentPlan.id,
        reference: paymentPlan.reference,
        transactionId: transaction.id,
        amount: checkoutDto.amount,
        currency: checkoutDto.currency || 'ETB',
        installments: checkoutDto.numberOfInstallments,
        installmentAmount,
        firstPaymentDue: installments[0].dueDate,
        merchantOrderId: checkoutDto.merchantOrderId,
      };
    } catch (error) {
      this.logger.error(`Checkout error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCheckoutStatus(merchantId: string, reference: string) {
    try {
      const paymentPlan = await this.prisma.paymentPlan.findFirst({
        where: {
          merchantId,
          reference,
        },
        include: {
          installments: true,
        },
      });

      if (!paymentPlan) {
        throw new NotFoundException(`Payment plan with reference ${reference} not found`);
      }

      return {
        reference: paymentPlan.reference,
        status: paymentPlan.status,
        totalAmount: paymentPlan.totalAmount,
        currency: paymentPlan.currency,
        numberOfInstallments: paymentPlan.numberOfInstallments,
        installmentAmount: paymentPlan.installmentAmount,
        startDate: paymentPlan.startDate,
        endDate: paymentPlan.endDate,
        installments: paymentPlan.installments.map(i => ({
          installmentNumber: i.installmentNumber,
          amount: i.amount,
          dueDate: i.dueDate,
          status: i.status,
          paidDate: i.paidDate,
          paidAmount: i.paidAmount,
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting checkout status: ${error.message}`, error.stack);
      throw error;
    }
  }

  private validateCheckoutData(checkoutDto: CheckoutDto): void {
    // Validate amount (must be positive and reasonable)
    if (checkoutDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Set a reasonable maximum amount (e.g., 100,000 ETB)
    const maxAmount = 100000;
    if (checkoutDto.amount > maxAmount) {
      throw new BadRequestException(`Amount exceeds maximum allowed (${maxAmount} ETB)`);
    }

    // Validate installments
    if (![3, 6, 12].includes(checkoutDto.numberOfInstallments)) {
      throw new BadRequestException('Number of installments must be 3, 6, or 12');
    }

    // Validate currency (must be ETB for Ethiopian market)
    if (checkoutDto.currency && checkoutDto.currency !== 'ETB') {
      throw new BadRequestException('Currency must be ETB');
    }

    // Validate items if provided
    if (checkoutDto.items && checkoutDto.items.length > 0) {
      // Check that item prices add up to total (with small tolerance for rounding)
      const itemsTotal = checkoutDto.items.reduce(
        (sum, item) => sum + item.unitPriceEtb * item.quantity,
        0
      );

      const tolerance = 0.01; // 1 cent tolerance
      if (Math.abs(itemsTotal - checkoutDto.amount) > tolerance) {
        throw new BadRequestException(
          `Sum of item prices (${itemsTotal} ETB) does not match total amount (${checkoutDto.amount} ETB)`
        );
      }

      // Validate each item
      checkoutDto.items.forEach(item => {
        if (item.quantity <= 0) {
          throw new BadRequestException(`Item ${item.name} has invalid quantity`);
        }
        if (item.unitPriceEtb <= 0) {
          throw new BadRequestException(`Item ${item.name} has invalid price`);
        }
      });
    }

    // Validate URLs if provided
    if (checkoutDto.callbackUrl) {
      this.validateUrl(checkoutDto.callbackUrl, 'Callback URL');
    }

    if (checkoutDto.returnUrl) {
      this.validateUrl(checkoutDto.returnUrl, 'Return URL');
    }
  }

  private validateUrl(url: string, fieldName: string): void {
    try {
      new URL(url);
    } catch (error) {
      throw new BadRequestException(`Invalid ${fieldName}: ${url}`);
    }
  }
}
