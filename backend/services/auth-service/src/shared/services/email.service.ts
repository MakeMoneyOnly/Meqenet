import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PasswordResetEmailData {
  email: string;
  resetToken: string;
  clientId: string;
  language?: string;
}

export interface SecurityNotificationData {
  email: string;
  subject: string;
  message: string;
  userId: string;
  language?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly FRONTEND_RESET_URL: string;

  constructor(@Optional() private readonly configService?: ConfigService) {
    // Make ConfigService optional for test environments where decorator metadata
    // may not be emitted by the transformer. Fallback to env var and a sane default.
    this.FRONTEND_RESET_URL =
      this.configService?.get<string>('FRONTEND_RESET_URL') ??
      'https://app.meqenet.et/reset-password';
  }

  /**
   * Sends a password reset email to the user
   * @param data - Password reset email data
   * @returns Promise<boolean>
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const { email, resetToken, clientId, language = 'en' } = data;

    try {
      // For now, we'll log the email content instead of sending actual emails
      // In production, this would integrate with an email service provider like SendGrid, SES, etc.

      const resetUrl = this.buildResetUrl(resetToken, clientId);
      const emailContent = this.buildPasswordResetEmailContent(
        email,
        resetUrl,
        language
      );

      // Log the email that would be sent
      this.logger.log(`Password reset email would be sent to: ${email}`);
      this.logger.debug(`Reset URL: ${resetUrl}`);
      this.logger.debug(`Email content: ${emailContent.subject}`);

      // TODO: Integrate with actual email service provider
      // await this.actualEmailProvider.send(emailContent);

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error
      );
      return false;
    }
  }

  /**
   * Builds the password reset URL
   * @param resetToken - The reset token
   * @param clientId - Client identifier
   * @returns string
   */
  private buildResetUrl(resetToken: string, clientId: string): string {
    const url = new URL(this.FRONTEND_RESET_URL);
    url.searchParams.set('token', resetToken);
    url.searchParams.set('clientId', clientId);
    return url.toString();
  }

  /**
   * Builds the email content based on language preference
   * @param email - Recipient email
   * @param resetUrl - Password reset URL
   * @param language - User's language preference
   * @returns Email content object
   */
  private buildPasswordResetEmailContent(
    email: string,
    resetUrl: string,
    language: string
  ): {
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
  } {
    const isAmharic = language === 'am';

    const subject = isAmharic
      ? 'የይለፍ ቃል ያዋቂ መልዕክት - Meqenet'
      : 'Password Reset Request - Meqenet';

    const htmlBody = isAmharic
      ? `
        <div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>የይለፍ ቃል ያዋቂ መልዕክት</h2>
          <p>ጤና ይስጥልኝ!</p>
          <p>እኛ ከ Meqenet እና የይለፍ ቃል ያዋቂ መልዕክት ስንልክ ለመለስ ተጠራን።</p>
          <p>የይለፍ ቃልዎን ለመቀየር ከታች ያለውን ሊንክ ይጫኑ፡-</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              የይለፍ ቃል ያዋቂ
            </a>
          </p>
          <p><strong>እንደሚተገበረው:</strong></p>
          <ul>
            <li>ያ ሊንክ ከ 24 ሰዓታት በኋላ ያልተለመደ ይሆናል።</li>
            <li>ያ ሊንክ አንድ ጊዜ ብቻ ሊያገለገለጥ ይችላል።</li>
            <li>ያ መልዕክት ካልለመዱት እንደገና አዲስ የይለፍ ቃል ያዋቂ መልዕክት ይለሙ።</li>
          </ul>
          <p>ከማንኛውም ችግር ካለዎት እባክዎ ከእኛ ጋር ያገናኙ።</p>
          <p>ከህዝብ ጋር በአስተማማኝ መልክ<br>Meqenet ቡድን</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            ያ መልዕክት በራሱ ተልኳል። እባክዎ ካልለመዱት የማትልም።
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello!</p>
          <p>We received a request to reset your password for your Meqenet account.</p>
          <p>To reset your password, please click the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This link will expire in 24 hours.</li>
            <li>This link can only be used once.</li>
            <li>If you didn't request this reset, please ignore this email.</li>
          </ul>
          <p>If you have any questions or concerns, please contact our support team.</p>
          <p>Best regards,<br>Meqenet Team</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `;

    return {
      to: email,
      subject,
      html: htmlBody,
      from: 'noreply@meqenet.et',
    };
  }

  /**
   * Sends a security notification email to the user
   * @param data - Security notification email data
   * @returns Promise<boolean>
   */
  async sendSecurityNotification(
    data: SecurityNotificationData
  ): Promise<boolean> {
    const { email, subject, message, userId, language = 'en' } = data;

    try {
      // For now, we'll log the security email content instead of sending actual emails
      // In production, this would integrate with an email service provider

      this.buildSecurityNotificationEmailContent(
        email,
        subject,
        message,
        userId,
        language
      );

      // Log the security email that would be sent
      this.logger.log(
        `🔐 Security notification email would be sent to: ${email}`
      );
      this.logger.log(`Subject: ${subject}`);
      this.logger.debug(`Security message: ${message}`);

      // TODO: Integrate with actual email service provider
      // await this.actualEmailProvider.send(emailContent);

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send security notification email to ${email}`,
        error
      );
      return false;
    }
  }

  /**
   * Builds the security notification email content based on language preference
   * @param email - Recipient email
   * @param subject - Email subject
   * @param message - Security message
   * @param userId - User ID for tracking
   * @param language - User's language preference
   * @returns Email content object
   */
  private buildSecurityNotificationEmailContent(
    email: string,
    subject: string,
    message: string,
    _userId: string,
    language: string
  ): {
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
  } {
    const isAmharic = language === 'am';

    const htmlBody = isAmharic
      ? `
        <div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc3545; margin: 0;">🛡️ የይለፍ ቃል ማሳወቂያ</h2>
          </div>
          <p>ጤና ይስጥልኝ!</p>
          <p>እኛ ከ Meqenet እና አንድ አስፈላጊ የይለፍ ቃል ማሳወቂያ ለመስጠት እንፈልጋለን።</p>
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>${message}</strong></p>
          </div>
          <p>ያ መልዕክት በራሱ ተልኳል። እባክዎ ካልለመዱት የማትልም።</p>
          <p>ከማንኛውም ችግር ካለዎት እባክዎ ከእኛ ጋር ያገናኙ።</p>
          <p>ከህዝብ ጋር በአስተማማኝ መልክ<br>Meqenet ቡድን</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            ያ መልዕክት በራሱ ተልኳል። እባክዎ ካልለመዱት የማትልም።
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc3545; margin: 0;">🛡️ Security Notification</h2>
          </div>
          <p>Hello!</p>
          <p>We from Meqenet are sending you an important security notification.</p>
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>${message}</strong></p>
          </div>
          <p>This message was sent automatically. Please do not reply to this email.</p>
          <p>If you have any concerns, please contact our support team.</p>
          <p>Best regards,<br>Meqenet Team</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `;

    return {
      to: email,
      subject: isAmharic ? `🛡️ ${subject}` : `🛡️ ${subject}`,
      html: htmlBody,
      from: 'security@meqenet.et',
    };
  }
}
