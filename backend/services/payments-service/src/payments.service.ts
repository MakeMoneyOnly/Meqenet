import { randomUUID } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<object> {
    this.logger.log('Processing new payment', { ...createPaymentDto });

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
}
