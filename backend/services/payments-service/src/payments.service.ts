import { randomUUID } from 'crypto';

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';

import { PrismaService } from './shared/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

const COOLING_OFF_PERIOD_HOURS = 24;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
}
