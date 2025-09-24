import { Module, forwardRef } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransactionsController } from './controllers/transactions.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { PaymentPlansModule } from '../payment-plans/payment-plans.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettlementsModule } from '../settlements/settlements.module';
import { PaymentGatewaysModule } from '../payment-gateways/payment-gateways.module';
import { FraudDetectionModule } from '../fraud-detection/fraud-detection.module';
import { TransactionFeeService } from './services/transaction-fee.service';
import { TransactionProcessorService } from './services/transaction-processor.service';

@Module({
  imports: [
    AccountsModule,
    PaymentPlansModule,
    NotificationsModule,
    SettlementsModule,
    FraudDetectionModule,
    forwardRef(() => PaymentGatewaysModule)
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionFeeService,
    TransactionProcessorService
  ],
  exports: [
    TransactionsService,
    TransactionFeeService,
    TransactionProcessorService
  ],
})
export class TransactionsModule {}