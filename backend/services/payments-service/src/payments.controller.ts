import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<object> {
    this.logger.log('Received request to create payment');
    return this.paymentsService.createPayment(createPaymentDto);
  }
}
