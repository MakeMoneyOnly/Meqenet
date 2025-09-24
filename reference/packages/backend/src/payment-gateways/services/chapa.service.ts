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
export class ChapaService implements PaymentGateway {
  private readonly logger = new Logger(ChapaService.name);
  private readonly apiUrl: string;
  private readonly secretKey: string = '';
  private readonly publicKey: string = '';
  private readonly webhookSecret: string = '';

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('CHAPA_API_URL', 'https://api.chapa.co/v1');
    this.secretKey = this.configService.get<string>('CHAPA_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('CHAPA_PUBLIC_KEY') || '';
    this.webhookSecret = this.configService.get<string>('CHAPA_WEBHOOK_SECRET') || '';
  }

  /**
   * Initiate payment with Chapa
   * @param request Payment initiation request
   * @returns Payment initiation response
   */
  async initiate(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      this.logger.log(`Initiating Chapa payment for ${request.amount} ${request.currency || 'ETB'}`);

      // Prepare payment request payload
      const payload = {
        amount: request.amount,
        currency: request.currency || 'ETB',
        tx_ref: request.reference,
        callback_url: request.callbackUrl,
        return_url: request.returnUrl,
        first_name: request.customerName?.split(' ')[0] || 'Customer',
        last_name: request.customerName?.split(' ').slice(1).join(' ') || 'User',
        email: request.customerEmail || 'customer@example.com',
        phone_number: request.customerPhone || '',
        title: 'Meqenet Payment',
        description: request.description,
        meta: {
          source: 'meqenet',
          reference: request.reference,
        },
        customization: {
          title: 'Meqenet',
          description: 'Pay with Meqenet',
          logo: 'https://meqenet.et/logo.png',
        },
      };

      // Send payment request
      const response = await axios.post(`${this.apiUrl}/transaction/initialize`, payload, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Process response
      const responseData = response.data as any;
      if (responseData && responseData.status === 'success') {
        return {
          success: true,
          message: 'Payment initiated successfully',
          redirectUrl: responseData.data.checkout_url,
          paymentId: responseData.data.checkout_url.split('/').pop(),
          transactionId: request.reference,
          status: 'PENDING',
        };
      } else {
        this.logger.error('Chapa payment initiation failed', responseData);
        return {
          success: false,
          message: responseData.message || 'Payment initiation failed',
          error: responseData,
        };
      }
    } catch (error) {
      this.logger.error('Error initiating Chapa payment', error);
      return {
        success: false,
        message: 'Error initiating payment',
        error: error.message,
      };
    }
  }

  /**
   * Verify payment status with Chapa
   * @param request Payment verification request
   * @returns Payment verification response
   */
  async verify(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      this.logger.log(`Verifying Chapa payment ${request.reference}`);

      // Send verification request
      const response = await axios.get(`${this.apiUrl}/transaction/verify/${request.reference}`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      // Process response
      const responseData = response.data as any;
      if (responseData && responseData.status === 'success') {
        const paymentData = responseData.data;
        return {
          success: true,
          message: 'Payment verification successful',
          status: this.mapChapaStatus(paymentData.status),
          amount: paymentData.amount,
          currency: paymentData.currency,
          paymentDate: new Date(paymentData.created_at),
          paymentMethod: 'CHAPA',
          transactionId: paymentData.tx_ref,
        };
      } else {
        this.logger.error('Chapa payment verification failed', responseData);
        return {
          success: false,
          message: responseData.message || 'Payment verification failed',
          status: 'FAILED',
          error: responseData,
        };
      }
    } catch (error) {
      this.logger.error('Error verifying Chapa payment', error);
      return {
        success: false,
        message: 'Error verifying payment',
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Handle Chapa callback
   * @param payload Callback payload
   * @param signature Callback signature
   * @returns Payment verification response
   */
  async handleCallback(payload: any, signature?: string): Promise<PaymentVerificationResponse> {
    try {
      this.logger.log('Received Chapa callback', payload);

      // Verify webhook signature if provided
      if (signature && !this.verifyWebhookSignature(payload, signature)) {
        this.logger.error('Invalid Chapa webhook signature');
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
        status: this.mapChapaStatus(payload.status),
        amount: payload.amount,
        currency: payload.currency,
        paymentDate: new Date(payload.created_at),
        paymentMethod: 'CHAPA',
        transactionId: payload.tx_ref,
      };
    } catch (error) {
      this.logger.error('Error processing Chapa callback', error);
      return {
        success: false,
        message: 'Error processing callback',
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Map Chapa status to standard status
   * @param chapaStatus Chapa status
   * @returns Standard status
   */
  private mapChapaStatus(chapaStatus: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
    switch (chapaStatus.toLowerCase()) {
      case 'success':
      case 'successful':
      case 'completed':
        return 'COMPLETED';
      case 'pending':
        return 'PENDING';
      case 'cancelled':
      case 'canceled':
        return 'CANCELLED';
      case 'failed':
      default:
        return 'FAILED';
    }
  }

  /**
   * Verify Chapa webhook signature
   * @param payload Webhook payload
   * @param signature Webhook signature
   * @returns Whether signature is valid
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // Convert payload to string
      const payloadString = typeof payload === 'string'
        ? payload
        : JSON.stringify(payload);

      // Calculate HMAC using webhook secret
      const hmac = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      // Compare calculated signature with received signature
      return hmac === signature;
    } catch (error) {
      this.logger.error('Error verifying Chapa webhook signature', error);
      return false;
    }
  }
}
