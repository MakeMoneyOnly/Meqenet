import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

export interface NotificationOptions {
  userId: string;
  type: string;
  message: string;
  data?: Record<string, any>;
  sendSms?: boolean;
  sendEmail?: boolean;
  sendPush?: boolean;
  email?: string;
  phoneNumber?: string;
  recipient?: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async sendNotification(options: NotificationOptions) {
    const {
      userId,
      type,
      message,
      data = {},
      sendSms = true,
      sendEmail = true,
      sendPush = false, // Push notifications not implemented in MVP
    } = options;

    try {
      // Get user details for sending notifications
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userProfile: true },
      });

      if (!user) {
        this.logger.warn(`Cannot send notification: User ${userId} not found`);
        return false;
      }

      // Create notification record in database
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          message,
          data,
        },
      });

      // Send SMS if enabled and phone number available
      if (sendSms && user.phoneNumber) {
        // Check if the SMS service has the sendSms method
        if (typeof this.smsService.sendSms === 'function') {
          await this.smsService.sendSms({
            to: user.phoneNumber,
            message,
          });
        } else {
          this.logger.warn('SmsService does not have sendSms method');
        }
      }

      // Send email if enabled and email available
      if (sendEmail && user.email) {
        const emailSubject = this.getEmailSubject(type, user.userProfile?.preferredLanguage);

        // Check if the email service has the sendEmail method
        if (typeof this.emailService.sendEmail === 'function') {
          await this.emailService.sendEmail({
            to: user.email,
            subject: emailSubject,
            text: message,
            html: `<p>${message}</p>`,
          });
        } else {
          this.logger.warn('EmailService does not have sendEmail method');
        }
      }

      // Push notifications would be implemented here in future versions
      if (sendPush) {
        // Future implementation
        this.logger.log('Push notifications not implemented in MVP');
      }

      this.logger.log(`Notification sent to user ${userId} (${type}): ${notification.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}: ${error.message}`, error.stack);
      return false;
    }
  }

  private getEmailSubject(type: string, language = 'am'): string {
    const subjects: Record<string, Record<string, string>> = {
      CREDIT_LIMIT_UPDATE: {
        am: 'የክሬዲት ገደብ ማሻሻያ - Meqenet',
        en: 'Credit Limit Update - Meqenet',
      },
      PAYMENT_DUE: {
        am: 'የክፍያ ማሳሰቢያ - Meqenet',
        en: 'Payment Reminder - Meqenet',
      },
      PAYMENT_RECEIVED: {
        am: 'ክፍያ ተቀብለናል - Meqenet',
        en: 'Payment Received - Meqenet',
      },
      ACCOUNT_UPDATE: {
        am: 'የመለያ ማሻሻያ - Meqenet',
        en: 'Account Update - Meqenet',
      },
    };

    return subjects[type]?.[language] || subjects[type]?.['en'] || 'Meqenet Notification';
  }

  async getNotifications(userId: string, options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}) {
    const { limit = 10, offset = 0, unreadOnly = false } = options;

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.notification.count({ where });

    return {
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}

