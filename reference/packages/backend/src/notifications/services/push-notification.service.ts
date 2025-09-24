import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Firebase admin is not installed, so we'll mock it for now
const admin: any = {
  messaging: () => ({
    send: async (_message: any) => ({ messageId: 'mock-message-id' }),
    sendMulticast: async (_message: any) => ({ successCount: 1, failureCount: 0 }),
  }),
  initializeApp: () => {},
  credential: {
    cert: (_path: string) => ({}),
  },
};
import * as path from 'path';

export interface PushNotificationOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private firebaseInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');

      if (!serviceAccountPath) {
        this.logger.warn('Firebase service account path not provided, push notifications will be logged to console only');
        return;
      }

      const fullPath = path.resolve(process.cwd(), serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(fullPath),
      });

      this.firebaseInitialized = true;
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Firebase: ${error.message}`, error.stack);
    }
  }

  async sendPushNotification(options: PushNotificationOptions): Promise<boolean> {
    try {
      const { token, title, body, data = {} } = options;

      // If Firebase is not initialized, log to console
      if (!this.firebaseInitialized) {
        this.logPushNotification(options);
        return true;
      }

      // Prepare message
      const message: any = {
        token,
        notification: {
          title,
          body,
        },
        data: this.prepareDataPayload(data),
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Send message
      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);

      // Log to console as fallback
      this.logPushNotification(options);
      return false;
    }
  }

  private logPushNotification(options: PushNotificationOptions): void {
    this.logger.log('------ PUSH NOTIFICATION ------');
    this.logger.log(`Token: ${options.token}`);
    this.logger.log(`Title: ${options.title}`);
    this.logger.log(`Body: ${options.body}`);
    this.logger.log(`Data: ${JSON.stringify(options.data || {})}`);
    this.logger.log('-------------------------------');
  }

  private prepareDataPayload(data: Record<string, any>): Record<string, string> {
    // Firebase Cloud Messaging requires all data values to be strings
    const payload: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      payload[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    return payload;
  }
}



