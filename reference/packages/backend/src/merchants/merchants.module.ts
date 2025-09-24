import { Module } from '@nestjs/common';
import { MerchantsService } from './services/merchants.service';
import { MerchantsController } from './controllers/merchants.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MerchantAuthService } from './services/merchant-auth.service';
import { MerchantCheckoutService } from './services/merchant-checkout.service';
import { MerchantCheckoutController } from './controllers/merchant-checkout.controller';
import { PaymentPlansModule } from '../payment-plans/payment-plans.module';
import { PaymentGatewaysModule } from '../payment-gateways/payment-gateways.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MerchantApiGuard } from './guards/merchant-auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PaymentPlansModule,
    PaymentGatewaysModule,
    NotificationsModule,
  ],
  controllers: [MerchantsController, MerchantCheckoutController],
  providers: [
    MerchantsService,
    MerchantAuthService,
    MerchantCheckoutService,
    MerchantApiGuard
  ],
  exports: [
    MerchantsService,
    MerchantAuthService,
    MerchantCheckoutService,
    MerchantApiGuard
  ],
})
export class MerchantsModule {}
