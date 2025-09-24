import { NotificationType } from '../enums/notification-type.enum';

/**
 * Interface for notification options
 */
export interface NotificationOptions {
  /**
   * Type of notification
   */
  type: NotificationType;

  /**
   * User ID to send notification to
   */
  userId: string;

  /**
   * Optional message for the notification
   */
  message?: string;

  /**
   * Optional email address to send notification to
   */
  email?: string;

  /**
   * Optional phone number to send notification to
   */
  phoneNumber?: string;

  /**
   * Optional data to include with the notification
   */
  data?: Record<string, any>;

  /**
   * Whether to send SMS notification
   * @default true
   */
  sendSms?: boolean;

  /**
   * Whether to send email notification
   * @default true
   */
  sendEmail?: boolean;

  /**
   * Whether to send push notification
   * @default false
   */
  sendPush?: boolean;
}
