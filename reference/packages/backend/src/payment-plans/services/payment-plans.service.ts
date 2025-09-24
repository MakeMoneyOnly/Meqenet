import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentPlan, PaymentPlanStatus, Installment } from '@prisma/client';
import { PaymentPlanType } from '../enums/payment-plan-type.enum';
import { CreatePaymentPlanDto } from '../dto/create-payment-plan.dto';
import { AccountsService } from '../../accounts/services/accounts.service';

@Injectable()
export class PaymentPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async findById(id: string): Promise<(PaymentPlan & { installments: Installment[] }) | null> {
    return this.prisma.paymentPlan.findUnique({
      where: { id },
      include: {
        installments: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<(PaymentPlan & { installments: Installment[] })[]> {
    return this.prisma.paymentPlan.findMany({
      where: { userId: userId },
      include: {
        installments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(userId: string, accountId: string, createPaymentPlanDto: CreatePaymentPlanDto): Promise<PaymentPlan> {
    // Check if account exists and belongs to user
    const account = await this.accountsService.findById(accountId);

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    if (account.userId !== userId) {
      throw new BadRequestException('Account does not belong to user');
    }

    // Validate installments (must be 3, 6, or 12)
    if (![3, 6, 12].includes(createPaymentPlanDto.installments)) {
      throw new BadRequestException('Installments must be 3, 6, or 12');
    }

    // Calculate installment amount (rounded to 2 decimal places)
    const installmentAmount = parseFloat((createPaymentPlanDto.total_amount / createPaymentPlanDto.installments).toFixed(2));

    // Create payment plan with installments
    return this.prisma.$transaction(async (prisma) => {
      // Create payment plan
      // Generate a unique reference for the payment plan
      const reference = `PLAN-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

      // Calculate start and end dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + createPaymentPlanDto.installments);

      // Calculate installment amount
      const installmentAmount = Math.ceil(createPaymentPlanDto.total_amount / createPaymentPlanDto.installments);

      const paymentPlan = await prisma.paymentPlan.create({
        data: {
          userId: userId,
          reference: reference,
          description: createPaymentPlanDto.description,
          totalAmount: createPaymentPlanDto.total_amount,
          remainingAmount: createPaymentPlanDto.total_amount,
          currency: 'ETB',
          numberOfInstallments: createPaymentPlanDto.installments,
          installmentAmount: installmentAmount,
          startDate: startDate,
          endDate: endDate,
          status: PaymentPlanStatus.ACTIVE,
          merchantId: createPaymentPlanDto.merchant_id,
          metadata: {
            merchantReference: createPaymentPlanDto.merchantReference,
            planType: createPaymentPlanDto.planType || PaymentPlanType.STANDARD,
          },
        },
      });

      // Create installments
      const installments: Installment[] = [];
      const now = new Date();

      for (let i = 0; i < createPaymentPlanDto.installments; i++) {
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + i + 1); // Due next month, then month after, etc.

        const installment = await prisma.installment.create({
          data: {
            paymentPlanId: paymentPlan.id,
            amount: installmentAmount,
            dueDate: dueDate,
            status: i === 0 ? 'UPCOMING' : 'PENDING', // First installment is upcoming, rest are pending
            installmentNumber: i + 1,
          },
        });

        installments.push(installment);
      }

      // Return payment plan with installments
      return {
        ...paymentPlan,
        installments,
      };
    });
  }

  async updateStatus(id: string, status: PaymentPlanStatus): Promise<PaymentPlan & { installments: Installment[] }> {
    const paymentPlan = await this.findById(id);

    if (!paymentPlan) {
      throw new NotFoundException(`Payment plan with ID ${id} not found`);
    }

    return this.prisma.paymentPlan.update({
      where: { id },
      data: { status },
      include: {
        installments: true,
      },
    });
  }

  async processPayment(paymentPlanId: string, installmentId: string, amount: number): Promise<PaymentPlan & { installments: Installment[] }> {
    const paymentPlan = await this.findById(paymentPlanId);

    if (!paymentPlan) {
      throw new NotFoundException(`Payment plan with ID ${paymentPlanId} not found`);
    }

    const installment = paymentPlan.installments.find(i => i.id === installmentId);

    if (!installment) {
      throw new NotFoundException(`Installment with ID ${installmentId} not found`);
    }

    if (installment.status === 'PAID') {
      throw new BadRequestException('Installment already paid');
    }

    if (amount !== installment.amount) {
      throw new BadRequestException(`Payment amount must be ${installment.amount} ETB`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update installment status
      await prisma.installment.update({
        where: { id: installmentId },
        data: {
          status: 'PAID',
          paidDate: new Date(),
          paidAmount: amount,
        },
      });

      // Update payment plan remaining amount
      const updatedPaymentPlan = await prisma.paymentPlan.update({
        where: { id: paymentPlanId },
        data: {
          remainingAmount: {
            decrement: amount,
          },
          // If remaining amount is 0, mark as completed
          status: paymentPlan.remainingAmount - amount <= 0 ? PaymentPlanStatus.COMPLETED : undefined,
        },
        include: {
          installments: true,
        },
      });

      // Update next installment status if applicable
      const paidInstallmentNumber = installment.installmentNumber;
      const nextInstallment = paymentPlan.installments.find(i =>
        i.installmentNumber === paidInstallmentNumber + 1 && i.status === 'PENDING'
      );

      if (nextInstallment) {
        await prisma.installment.update({
          where: { id: nextInstallment.id },
          data: {
            status: 'UPCOMING',
          },
        });
      }

      return updatedPaymentPlan;
    });
  }
}