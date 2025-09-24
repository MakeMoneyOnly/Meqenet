import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as axios from 'axios';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl: string = '';
  private readonly apiKey: string = '';
  private readonly sender: string = 'Meqenet';

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('SMS_API_URL') || '';
    this.apiKey = this.configService.get<string>('SMS_API_KEY') || '';
    this.sender = this.configService.get<string>('SMS_SENDER', 'Meqenet');
  }

  async sendSms(options: SmsOptions): Promise<boolean> {
    const { to, message } = options;

    // If SMS credentials are not provided, just log the message
    if (!this.apiUrl || !this.apiKey) {
      this.logSms(to, message);
      return true;
    }

    try {
      // Format phone number if needed (ensure it's in international format)
      const formattedPhone = this.formatPhoneNumber(to);

      // Send SMS via API
      const response = await axios.post(
        this.apiUrl,
        {
          to: formattedPhone,
          message,
          sender: this.sender,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        this.logger.log(`SMS sent to ${formattedPhone}`);
        return true;
      } else {
        this.logger.warn(`Failed to send SMS: ${response.status} ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error sending SMS: ${error.message}`, error.stack);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Ensure phone number is in international format for Ethiopia
    // If it starts with 0, replace with +251
    if (phone.startsWith('0')) {
      return `+251${phone.substring(1)}`;
    }

    // If it doesn't have a country code, add +251
    if (!phone.startsWith('+')) {
      return `+251${phone}`;
    }

    return phone;
  }

  private logSms(to: string, message: string): void {
    this.logger.log('------ SMS MESSAGE ------');
    this.logger.log(`From: ${this.sender}`);
    this.logger.log(`To: ${to}`);
    this.logger.log(`Message: ${message}`);
    this.logger.log('-------------------------');
  }
}




