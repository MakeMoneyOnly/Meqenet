import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { BnplService } from './bnpl.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Controller('bnpl')
export class BnplController {
  private readonly logger = new Logger(BnplController.name);

  constructor(private readonly bnplService: BnplService) {}

  /**
   * Create a new BNPL contract
   * POST /bnpl/contracts
   */
  @Post('contracts')
  async createContract(@Body() createContractDto: CreateContractDto) {
    this.logger.log('Creating BNPL contract via API', {
      customerId: createContractDto.customerId,
      merchantId: createContractDto.merchantId,
      product: createContractDto.product
    });

    const contract = await this.bnplService.createContract(createContractDto);

    return {
      success: true,
      data: {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        amount: contract.principalAmount,
        totalAmount: contract.totalAmount,
        outstandingBalance: contract.outstandingBalance,
        createdAt: contract.createdAt
      }
    };
  }

  /**
   * Process a payment for an existing contract
   * POST /bnpl/payments
   */
  @Post('payments')
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto) {
    this.logger.log('Processing payment via API', {
      contractId: processPaymentDto.contractId,
      amount: processPaymentDto.amount,
      paymentMethod: processPaymentDto.paymentMethod
    });

    const payment = await this.bnplService.processPayment(processPaymentDto);

    return {
      success: true,
      data: {
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.initiatedAt
      }
    };
  }

  /**
   * Get contract details with installment schedule
   * GET /bnpl/contracts/:contractId
   */
  @Get('contracts/:contractId')
  async getContractDetails(@Param('contractId') contractId: string) {
    this.logger.log('Fetching contract details via API', { contractId });

    const contract = await this.bnplService.getContractDetails(contractId);

    return {
      success: true,
      data: {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        customerId: contract.customerId,
        merchantId: contract.merchantId,
        merchantName: contract.merchant.businessName,
        product: contract.product,
        status: contract.status,
        principalAmount: contract.principalAmount,
        totalAmount: contract.totalAmount,
        outstandingBalance: contract.outstandingBalance,
        apr: contract.apr,
        termMonths: contract.termMonths,
        paymentFrequency: contract.paymentFrequency,
        firstPaymentDate: contract.firstPaymentDate,
        maturityDate: contract.maturityDate,
        installments: contract.installments.map(installment => ({
          installmentNumber: installment.installmentNumber,
          status: installment.status,
          scheduledAmount: installment.scheduledAmount,
          principalAmount: installment.principalAmount,
          interestAmount: installment.interestAmount,
          feeAmount: installment.feeAmount,
          dueDate: installment.dueDate,
          paidAt: installment.paidAt,
          paidAmount: installment.paidAmount
        })),
        createdAt: contract.createdAt,
        activatedAt: contract.activatedAt
      }
    };
  }

  /**
   * Get available BNPL products and terms
   * GET /bnpl/products
   */
  @Get('products')
  async getAvailableProducts() {
    this.logger.log('Fetching available BNPL products');

    // This would typically come from configuration or database
    const products = [
      {
        product: 'PAY_IN_4',
        name: 'Pay in 4',
        description: 'Split your purchase into 4 interest-free payments over 6 weeks',
        interestRate: 0,
        termWeeks: 6,
        minAmount: 100,
        maxAmount: 5000
      },
      {
        product: 'PAY_IN_30',
        name: 'Pay in 30',
        description: 'Full payment deferred for 30 days with buyer protection',
        interestRate: 0,
        termDays: 30,
        minAmount: 50,
        maxAmount: 10000
      },
      {
        product: 'PAY_IN_FULL',
        name: 'Pay in Full',
        description: 'Pay immediately and earn maximum cashback rewards',
        interestRate: 0,
        termDays: 0,
        minAmount: 10,
        maxAmount: 100000
      },
      {
        product: 'FINANCING',
        name: 'Installment Financing',
        description: 'Long-term financing with competitive rates',
        interestRate: 15,
        termMonths: 12,
        minAmount: 1000,
        maxAmount: 100000
      }
    ];

    return {
      success: true,
      data: {
        products,
        currency: 'ETB',
        timezone: 'Africa/Addis_Ababa'
      }
    };
  }
}
