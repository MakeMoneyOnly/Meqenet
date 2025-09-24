import { Module } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';
import { PushNotificationService } from './services/push-notification.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    NotificationsService,
    SmsService,
    EmailService,
    PushNotificationService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}