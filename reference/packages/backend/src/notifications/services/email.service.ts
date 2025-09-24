import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT', 587);
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@meqenet.et');

    // If email credentials are provided, create a real transporter
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      // Otherwise, create a preview transporter for development
      this.logger.warn('Email credentials not provided. Using preview mode for development.');
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, text, html, attachments } = options;

      // If no transporter is available, just log the email
      if (!this.transporter) {
        this.logEmail(to, subject, text);
        return true;
      }

      // Send the email
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html: html || text,
        attachments,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`, error.stack);
      return false;
    }
  }

  private logEmail(to: string, subject: string, text: string): void {
    this.logger.log('------ EMAIL MESSAGE ------');
    this.logger.log(`From: ${this.from}`);
    this.logger.log(`To: ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Body: ${text}`);
    this.logger.log('---------------------------');
  }
}



