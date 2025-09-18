import { randomUUID } from 'crypto';

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';

import { PrismaService } from './shared/prisma/prisma.service';
import { BnplService } from './bnpl/bnpl.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateContractDto } from './bnpl/dto/create-contract.dto';
import { ProcessPaymentDto } from './bnpl/dto/process-payment.dto';

const COOLING_OFF_PERIOD_HOURS = 24;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bnplService: BnplService
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<object> {
    this.logger.log('Processing new payment', { ...createPaymentDto });

    const user = await this.prisma.user.findUnique({
      where: { id: createPaymentDto.userId },
    });

    if (user?.phoneUpdatedAt) {
      const now = new Date();
      const phoneUpdateDate = new Date(user.phoneUpdatedAt);
      const hoursSinceUpdate =
        (now.getTime() - phoneUpdateDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < COOLING_OFF_PERIOD_HOURS) {
        throw new ForbiddenException(
          `High-risk actions are blocked for ${COOLING_OFF_PERIOD_HOURS} hours after a phone number change.`
        );
      }
    }

    // In a real application, this is where you would interact with a database
    // and a third-party payment gateway like Telebirr.

    // For now, we'll just simulate a successful payment creation.
    const transactionId = randomUUID();
    const paymentRecord = {
      id: transactionId,
      status: 'completed',
      ...createPaymentDto,
      createdAt: new Date(),
    };

    this.logger.log(
      `Payment processed successfully with transaction ID: ${transactionId}`
    );

    return paymentRecord;
  }

  /**
   * Create a BNPL contract
   */
  async createBnplContract(createContractDto: CreateContractDto) {
    this.logger.log('Creating BNPL contract via PaymentsService', {
      customerId: createContractDto.customerId,
      merchantId: createContractDto.merchantId,
      product: createContractDto.product
    });

    return await this.bnplService.createContract(createContractDto);
  }

  /**
   * Process a BNPL payment
   */
  async processBnplPayment(processPaymentDto: ProcessPaymentDto) {
    this.logger.log('Processing BNPL payment via PaymentsService', {
      contractId: processPaymentDto.contractId,
      amount: processPaymentDto.amount,
      paymentMethod: processPaymentDto.paymentMethod
    });

    return await this.bnplService.processPayment(processPaymentDto);
  }

  /**
   * Get BNPL contract details
   */
  async getBnplContractDetails(contractId: string) {
    this.logger.log('Fetching BNPL contract details via PaymentsService', { contractId });

    return await this.bnplService.getContractDetails(contractId);
  }
}
