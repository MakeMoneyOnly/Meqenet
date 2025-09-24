import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { KycService } from './services/kyc.service';
import { DocumentValidationService } from './services/document-validation.service';
import { FaceMatchingService } from './services/face-matching.service';
import { KycAdminService } from './services/kyc-admin.service';
import { KycController } from './controllers/kyc.controller';
import { KycAdminController } from './controllers/kyc-admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [KycController, KycAdminController],
  providers: [
    KycService,
    DocumentValidationService,
    FaceMatchingService,
    KycAdminService,
  ],
  exports: [KycService],
})
export class KycModule {}
