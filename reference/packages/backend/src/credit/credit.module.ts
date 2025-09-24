import { Module } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CreditAssessmentService } from './services/credit-assessment.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CreditController],
  providers: [CreditService, CreditAssessmentService],
  exports: [CreditService, CreditAssessmentService],
})
export class CreditModule {}





