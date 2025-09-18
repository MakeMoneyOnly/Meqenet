import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { Contract, InstallmentSchedule, Payment, BNPLProduct } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BnplService {
  private readonly logger = new Logger(BnplService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new BNPL contract
   */
  async createContract(createContractDto: CreateContractDto): Promise<Contract> {
    this.logger.log('Creating BNPL contract', {
      customerId: createContractDto.customerId,
      merchantId: createContractDto.merchantId,
      product: createContractDto.product,
      amount: createContractDto.amount
    });

    // Validate merchant exists and is active
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: createContractDto.merchantId },
      include: { merchantSettings: true }
    });

    if (!merchant || merchant.status !== 'ACTIVE') {
      throw new BadRequestException('Merchant not found or not active');
    }

    // Check merchant settings and limits
    const settings = merchant.merchantSettings;
    if (!settings || !this.isProductEnabled(settings, createContractDto.product)) {
      throw new BadRequestException(`BNPL product ${createContractDto.product} not enabled for this merchant`);
    }

    // Validate amount limits
    if (createContractDto.amount < settings.minContractAmount ||
        createContractDto.amount > settings.maxContractAmount) {
      throw new BadRequestException('Contract amount outside merchant limits');
    }

    // Calculate contract terms based on product
    const contractTerms = this.calculateContractTerms(createContractDto);

    // Generate contract number
    const contractNumber = await this.generateContractNumber();

    // Create contract in database
    const contract = await this.prisma.contract.create({
      data: {
        contractNumber,
        customerId: createContractDto.customerId,
        merchantId: createContractDto.merchantId,
        product: createContractDto.product,
        principalAmount: createContractDto.amount,
        totalAmount: contractTerms.totalAmount,
        outstandingBalance: contractTerms.totalAmount,
        apr: contractTerms.apr,
        termMonths: contractTerms.termMonths,
        paymentFrequency: contractTerms.paymentFrequency,
        firstPaymentDate: contractTerms.firstPaymentDate,
        maturityDate: contractTerms.maturityDate,
        description: createContractDto.description,
        merchantReference: createContractDto.merchantReference,
        status: 'ACTIVE',
        activatedAt: new Date(),
        ipAddress: createContractDto.ipAddress,
        userAgent: createContractDto.userAgent,
        deviceFingerprint: createContractDto.deviceFingerprint
      }
    });

    // Create installment schedule
    await this.createInstallmentSchedule(contract.id, contractTerms);

    // Create audit log
    await this.createAuditLog({
      eventType: 'CONTRACT_CREATED',
      entityType: 'Contract',
      entityId: contract.id,
      userId: createContractDto.customerId,
      eventData: {
        product: createContractDto.product,
        amount: createContractDto.amount,
        merchantId: createContractDto.merchantId
      }
    });

    // Publish contract created event
    await this.publishOutboxMessage({
      aggregateType: 'Contract',
      aggregateId: contract.id,
      eventType: 'contract.created',
      payload: {
        contractId: contract.id,
        customerId: createContractDto.customerId,
        merchantId: createContractDto.merchantId,
        amount: createContractDto.amount,
        product: createContractDto.product
      }
    });

    this.logger.log(`BNPL contract created successfully: ${contract.id}`);
    return contract;
  }

  /**
   * Process a payment for a contract
   */
  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<Payment> {
    this.logger.log('Processing BNPL payment', {
      contractId: processPaymentDto.contractId,
      amount: processPaymentDto.amount,
      paymentMethod: processPaymentDto.paymentMethod
    });

    // Get contract and validate
    const contract = await this.prisma.contract.findUnique({
      where: { id: processPaymentDto.contractId },
      include: { installments: { where: { status: 'DUE' }, orderBy: { dueDate: 'asc' } } }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status !== 'ACTIVE') {
      throw new BadRequestException('Contract is not active');
    }

    // Generate payment reference
    const paymentReference = await this.generatePaymentReference();

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        paymentReference,
        contractId: processPaymentDto.contractId,
        customerId: contract.customerId,
        merchantId: contract.merchantId,
        paymentMethod: processPaymentDto.paymentMethod,
        amount: processPaymentDto.amount,
        currency: processPaymentDto.currency || 'ETB',
        idempotencyKey: processPaymentDto.idempotencyKey,
        status: 'PENDING',
        ipAddress: processPaymentDto.ipAddress,
        userAgent: processPaymentDto.userAgent,
        deviceFingerprint: processPaymentDto.deviceFingerprint
      }
    });

    // Allocate payment to installments
    await this.allocatePaymentToInstallments(payment.id, processPaymentDto.amount);

    // Update contract outstanding balance
    await this.updateContractBalance(processPaymentDto.contractId, processPaymentDto.amount);

    // Create audit log
    await this.createAuditLog({
      eventType: 'PAYMENT_INITIATED',
      entityType: 'Payment',
      entityId: payment.id,
      userId: contract.customerId,
      eventData: {
        contractId: processPaymentDto.contractId,
        amount: processPaymentDto.amount,
        paymentMethod: processPaymentDto.paymentMethod
      }
    });

    this.logger.log(`Payment initiated successfully: ${payment.id}`);
    return payment;
  }

  /**
   * Get contract details with installment schedule
   */
  async getContractDetails(contractId: string): Promise<Contract & { installments: InstallmentSchedule[] }> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' }
        },
        merchant: {
          select: {
            id: true,
            businessName: true,
            category: true
          }
        }
      }
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  /**
   * Calculate contract terms based on product type
   */
  private calculateContractTerms(dto: CreateContractDto) {
    const { product, amount } = dto;
    const now = new Date();
    const ethiopianTimezone = 'Africa/Addis_Ababa';

    switch (product) {
      case BNPLProduct.PAY_IN_4:
        return {
          totalAmount: amount, // Interest-free
          apr: new Decimal(0),
          termMonths: 0, // 6 weeks = ~1.5 months
          paymentFrequency: 'WEEKLY',
          firstPaymentDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
          maturityDate: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000), // 6 weeks
          installmentCount: 4,
          installmentAmount: new Decimal(amount).div(4)
        };

      case BNPLProduct.PAY_IN_30:
        return {
          totalAmount: amount, // Interest-free
          apr: new Decimal(0),
          termMonths: 1,
          paymentFrequency: 'MONTHLY',
          firstPaymentDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          maturityDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          installmentCount: 1,
          installmentAmount: amount
        };

      case BNPLProduct.PAY_IN_FULL:
        return {
          totalAmount: amount,
          apr: new Decimal(0),
          termMonths: 0,
          paymentFrequency: 'IMMEDIATE',
          firstPaymentDate: now,
          maturityDate: now,
          installmentCount: 1,
          installmentAmount: amount
        };

      case BNPLProduct.FINANCING:
        // Default to 12 months with 15% APR
        const apr = new Decimal(0.15);
        const termMonths = 12;
        const monthlyRate = apr.div(12);
        const installmentAmount = new Decimal(amount)
          .mul(monthlyRate)
          .mul(new Decimal(1).add(monthlyRate).pow(termMonths))
          .div(new Decimal(1).add(monthlyRate).pow(termMonths).sub(1));

        return {
          totalAmount: installmentAmount.mul(termMonths),
          apr,
          termMonths,
          paymentFrequency: 'MONTHLY',
          firstPaymentDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          maturityDate: new Date(now.getTime() + termMonths * 30 * 24 * 60 * 60 * 1000),
          installmentCount: termMonths,
          installmentAmount
        };

      default:
        throw new BadRequestException(`Unsupported BNPL product: ${product}`);
    }
  }

  /**
   * Create installment schedule for a contract
   */
  private async createInstallmentSchedule(contractId: string, terms: any): Promise<void> {
    const installments = [];

    for (let i = 1; i <= terms.installmentCount; i++) {
      const dueDate = new Date(terms.firstPaymentDate);
      if (terms.paymentFrequency === 'WEEKLY') {
        dueDate.setDate(dueDate.getDate() + (i - 1) * 14); // Every 2 weeks
      } else if (terms.paymentFrequency === 'MONTHLY') {
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
      }

      installments.push({
        contractId,
        installmentNumber: i,
        scheduledAmount: terms.installmentAmount,
        principalAmount: terms.installmentAmount,
        interestAmount: new Decimal(0),
        feeAmount: new Decimal(0),
        dueDate
      });
    }

    await this.prisma.installmentSchedule.createMany({
      data: installments
    });
  }

  /**
   * Allocate payment amount to outstanding installments
   */
  private async allocatePaymentToInstallments(paymentId: string, amount: Decimal): Promise<void> {
    let remainingAmount = amount;

    const dueInstallments = await this.prisma.installmentSchedule.findMany({
      where: {
        contract: {
          payments: {
            some: { id: paymentId }
          }
        },
        status: { in: ['PENDING', 'DUE', 'OVERDUE'] }
      },
      orderBy: { dueDate: 'asc' }
    });

    for (const installment of dueInstallments) {
      if (remainingAmount.lte(0)) break;

      const paymentAmount = Decimal.min(remainingAmount, installment.scheduledAmount);

      await this.prisma.installmentSchedule.update({
        where: { id: installment.id },
        data: {
          status: paymentAmount.gte(installment.scheduledAmount) ? 'PAID' : 'PENDING',
          paidAmount: installment.paidAmount?.add(paymentAmount) || paymentAmount,
          paidAt: new Date(),
          paymentId
        }
      });

      remainingAmount = remainingAmount.sub(paymentAmount);
    }
  }

  /**
   * Update contract outstanding balance
   */
  private async updateContractBalance(contractId: string, paymentAmount: Decimal): Promise<void> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) return;

    const newBalance = contract.outstandingBalance.sub(paymentAmount);

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        outstandingBalance: newBalance,
        status: newBalance.lte(0) ? 'COMPLETED' : contract.status,
        completedAt: newBalance.lte(0) ? new Date() : null
      }
    });
  }

  /**
   * Generate unique contract number
   */
  private async generateContractNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MEQ-${timestamp}-${random}`;
  }

  /**
   * Generate unique payment reference
   */
  private async generatePaymentReference(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  /**
   * Check if BNPL product is enabled for merchant
   */
  private isProductEnabled(settings: any, product: BNPLProduct): boolean {
    switch (product) {
      case BNPLProduct.PAY_IN_4:
        return settings.payIn4Enabled;
      case BNPLProduct.PAY_IN_30:
        return settings.payIn30Enabled;
      case BNPLProduct.FINANCING:
        return settings.financingEnabled;
      case BNPLProduct.PAY_IN_FULL:
        return true; // Always enabled
      default:
        return false;
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(data: {
    eventType: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    eventData?: any;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        eventData: data.eventData || {},
        createdAt: new Date()
      }
    });
  }

  /**
   * Publish message to outbox for reliable messaging
   */
  private async publishOutboxMessage(data: {
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: any;
  }): Promise<void> {
    await this.prisma.outboxMessage.create({
      data: {
        messageId: `${data.aggregateType}-${data.aggregateId}-${Date.now()}`,
        aggregateType: data.aggregateType,
        aggregateId: data.aggregateId,
        eventType: data.eventType,
        payload: data.payload,
        status: 'PENDING'
      }
    });
  }
}
