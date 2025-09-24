import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PaymentGatewaysService } from './services/payment-gateways.service';
import { TelebirrService } from './services/telebirr.service';
import { HelloCashService } from './services/hellocash.service';
import { ChapaService } from './services/chapa.service';
import { PaymentGatewaysController } from './controllers/payment-gateways.controller';
import { WebhookController } from './controllers/webhook.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    NotificationsModule,
    forwardRef(() => TransactionsModule),
  ],
  controllers: [
    PaymentGatewaysController,
    WebhookController,
  ],
  providers: [
    PaymentGatewaysService,
    TelebirrService,
    HelloCashService,
    ChapaService,
  ],
  exports: [
    PaymentGatewaysService,
    TelebirrService,
    HelloCashService,
    ChapaService,
  ],
})
export class PaymentGatewaysModule {}