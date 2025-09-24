import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  PaymentGateway,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class TelebirrService implements PaymentGateway {
  private readonly logger = new Logger(TelebirrService.name);
  private readonly apiUrl: string = '';
  private readonly apiKey: string = '';
  private readonly apiSecret: string = '';
  private readonly appId: string = '';

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('TELEBIRR_API_URL') || '';
    this.apiKey = this.configService.get<string>('TELEBIRR_API_KEY') || '';
    this.apiSecret = this.configService.get<string>('TELEBIRR_API_SECRET') || '';
    this.appId = this.configService.get<string>('TELEBIRR_APP_ID') || '';
  }

  async initiate(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      this.logger.log(`Initiating Telebirr payment for ${request.amount} ETB`);

      // Prepare request payload according to Telebirr API specifications
      const payload = {
        appId: this.appId,
        nonce: this.generateNonce(),
        timestamp: Date.now().toString(),
        notifyUrl: request.callbackUrl,
        returnUrl: request.returnUrl,
        subject: request.description,
        outTradeNo: request.reference,
        totalAmount: request.amount.toString(),
        shortCode: this.configService.get<string>('TELEBIRR_SHORT_CODE'),
        receiveName: this.configService.get<string>('TELEBIRR_RECEIVE_NAME', 'Meqenet'),
        timeoutExpress: '30', // 30 minutes timeout
      };

      // Sign the request
      const signature = this.generateSignature(payload);

      // Encrypt the payload
      const encryptedPayload = this.encryptPayload(payload);

      // Send request to Telebirr
      const response = await axios.post(`${this.apiUrl}/toTradeWebPay`, {
        appId: this.appId,
        sign: signature,
        ussd: encryptedPayload,
      });

      // Process response
      const responseData = response.data as any;
      if (responseData && responseData.code === '0') {
        return {
          success: true,
          message: 'Payment initiated successfully',
          redirectUrl: responseData.data.toPayUrl,
          paymentId: responseData.data.tradeNo,
          transactionId: request.reference,
          status: 'PENDING',
        };
      } else {
        this.logger.error('Telebirr payment initiation failed', responseData);
        return {
          success: false,
          message: responseData.message || 'Payment initiation failed',
          error: responseData,
        };
      }
    } catch (error) {
      this.logger.error('Error initiating Telebirr payment', error);
      return {
        success: false,
        message: 'Error initiating payment',
        error: error.message,
      };
    }
  }

  async verify(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      this.logger.log(`Verifying Telebirr payment ${request.paymentId}`);

      // Prepare verification payload
      const payload = {
        appId: this.appId,
        nonce: this.generateNonce(),
        timestamp: Date.now().toString(),
        tradeNo: request.paymentId,
        outTradeNo: request.reference,
      };

      // Sign the request
      const signature = this.generateSignature(payload);

      // Send verification request
      const response = await axios.post(`${this.apiUrl}/queryOrder`, {
        appId: this.appId,
        sign: signature,
        outTradeNo: request.reference,
        tradeNo: request.paymentId,
      });

      // Process response
      const responseData = response.data as any;
      if (responseData && responseData.code === '0') {
        const paymentData = responseData.data;
        return {
          success: true,
          message: 'Payment verification successful',
          status: paymentData.tradeStatus === 'SUCCESS' ? 'COMPLETED' : 'PENDING',
          amount: parseFloat(paymentData.totalAmount),
          currency: 'ETB',
          paymentDate: new Date(parseInt(paymentData.payTime)),
          paymentMethod: 'TELEBIRR',
          transactionId: paymentData.tradeNo,
        };
      } else {
        this.logger.error('Telebirr payment verification failed', responseData);
        return {
          success: false,
          message: responseData.message || 'Payment verification failed',
          status: 'FAILED',
          error: responseData,
        };
      }
    } catch (error) {
      this.logger.error('Error verifying Telebirr payment', error);
      return {
        success: false,
        message: 'Error verifying payment',
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  async handleCallback(payload: any): Promise<PaymentVerificationResponse> {
    try {
      this.logger.log('Received Telebirr callback', payload);

      // Verify signature
      const isValid = this.verifySignature(payload);
      if (!isValid) {
        this.logger.error('Invalid Telebirr callback signature');
        return {
          success: false,
          message: 'Invalid signature',
          status: 'FAILED',
        };
      }

      // Process callback data
      return {
        success: true,
        message: 'Payment callback processed',
        status: payload.tradeStatus === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
        amount: parseFloat(payload.totalAmount),
        currency: 'ETB',
        paymentDate: new Date(parseInt(payload.payTime)),
        paymentMethod: 'TELEBIRR',
        transactionId: payload.tradeNo,
      };
    } catch (error) {
      this.logger.error('Error processing Telebirr callback', error);
      return {
        success: false,
        message: 'Error processing callback',
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  // Helper methods
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateSignature(payload: any): string {
    // Sort payload keys alphabetically
    const sortedKeys = Object.keys(payload).sort();
    let signString = '';

    // Create string to sign
    for (const key of sortedKeys) {
      signString += `${key}=${payload[key]}&`;
    }

    // Remove trailing & and append secret
    signString = signString.slice(0, -1) + this.apiSecret;

    // Generate SHA-256 hash
    return crypto.createHash('sha256').update(signString).digest('hex');
  }

  private encryptPayload(payload: any): string {
    // Convert payload to JSON string
    const jsonPayload = JSON.stringify(payload);

    // Encrypt using AES-256-ECB (as per Telebirr documentation)
    const cipher = crypto.createCipheriv('aes-256-ecb', this.apiSecret.slice(0, 32), '');
    let encrypted = cipher.update(jsonPayload, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
  }

  private verifySignature(payload: any): boolean {
    const receivedSignature = payload.sign;
    delete payload.sign;

    const calculatedSignature = this.generateSignature(payload);
    return receivedSignature === calculatedSignature;
  }
}