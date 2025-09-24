import { Module } from '@nestjs/common';
import { SettlementsService } from './services/settlements.service';
import { SettlementsController } from './controllers/settlements.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BankTransferService } from './services/bank-transfer.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SettlementsController],
  providers: [SettlementsService, BankTransferService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
