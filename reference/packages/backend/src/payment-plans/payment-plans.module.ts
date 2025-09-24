import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentPlansService } from './services/payment-plans.service';
import { LatePaymentService } from './services/late-payment.service';
import { PaymentRescheduleService } from './services/payment-reschedule.service';
import { PaymentPlansController } from './controllers/payment-plans.controller';
import { LatePaymentController } from './controllers/late-payment.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AccountsModule,
    PrismaModule,
    NotificationsModule,
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PaymentPlansController, LatePaymentController],
  providers: [
    PaymentPlansService,
    LatePaymentService,
    PaymentRescheduleService,
  ],
  exports: [PaymentPlansService],
})
export class PaymentPlansModule {}