import { Module } from '@nestjs/common';
import { FraudDetectionService } from './services/fraud-detection.service';
import { TransactionRulesService } from './services/transaction-rules.service';
import { UserBehaviorService } from './services/user-behavior.service';
import { FraudDetectionController } from './controllers/fraud-detection.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    ConfigModule,
  ],
  controllers: [FraudDetectionController],
  providers: [
    FraudDetectionService,
    TransactionRulesService,
    UserBehaviorService,
  ],
  exports: [FraudDetectionService],
})
export class FraudDetectionModule {}
