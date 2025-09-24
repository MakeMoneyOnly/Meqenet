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
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: any;
  private isInitialized: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');

      if (!serviceAccountPath) {
        this.logger.warn('Firebase service account path not provided. Push notifications will be logged to console only.');
        return;
      }

      const fullPath = path.resolve(serviceAccountPath);

      // Initialize Firebase Admin SDK
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(fullPath),
      });

      this.isInitialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error(`Error initializing Firebase: ${error.message}`, error.stack);
    }
  }

  async sendPushNotification(options: PushNotificationOptions): Promise<boolean> {
    try {
      const { token, title, body, data } = options;

      // If Firebase is not initialized, log to console
      if (!this.isInitialized) {
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
        data: data ? this.stringifyData(data) : undefined,
        android: {
          priority: 'high',
          notification: {
            channelId: 'meqenet-notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      // Send message
      const response = await this.firebaseApp.messaging().send(message);
      this.logger.log(`Push notification sent: ${response}`);

      return true;
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error.message}`, error.stack);

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

  private stringifyData(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};

    // Convert all values to strings as required by FCM
    Object.keys(data).forEach(key => {
      result[key] = typeof data[key] === 'object'
        ? JSON.stringify(data[key])
        : String(data[key]);
    });

    return result;
  }
}