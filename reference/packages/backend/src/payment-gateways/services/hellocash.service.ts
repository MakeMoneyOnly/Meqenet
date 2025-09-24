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
export class HelloCashService implements PaymentGateway {
  private readonly logger = new Logger(HelloCashService.name);
  private readonly apiUrl: string = '';
  private readonly principalId: string = '';
  private readonly apiKey: string = '';
  private readonly merchantCode: string = '';
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('HELLOCASH_API_URL', 'https://api-et.hellocash.net/v2');
    this.principalId = this.configService.get<string>('HELLOCASH_PRINCIPAL_ID') || '';
    this.apiKey = this.configService.get<string>('HELLOCASH_API_KEY') || '';
    this.merchantCode = this.configService.get<string>('HELLOCASH_MERCHANT_CODE') || '';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with HelloCash API
   * @returns Access token
   */
  private async authenticate(): Promise<string> {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      this.logger.log('Authenticating with HelloCash API');

      // Prepare authentication payload
      const authPayload = {
        principal: this.principalId,
        credentials: this.apiKey,
        system: 'meqenet',
      };

      // Send authentication request
      const response = await axios.post(`${this.apiUrl}/authenticate`, authPayload);

      const responseData = response.data as any;
      if (responseData && responseData.token) {
        this.accessToken = responseData.token;

        // Set token expiry (typically 24 hours)
        const expiryInMs = responseData.expires_in * 1000 || 24 * 60 * 60 * 1000;
        this.tokenExpiry = new Date(Date.now() + expiryInMs);

        return this.accessToken || '';
      } else {
        throw new Error('Failed to authenticate with HelloCash API');
      }
    } catch (error) {
      this.logger.error('HelloCash authentication error', error);
      throw new Error(`HelloCash authentication failed: ${error.message}`);
    }
  }

  /**
   * Initiate payment with HelloCash
   * @param request Payment initiation request
   * @returns Payment initiation response
   */
  async initiate(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      this.logger.log(`Initiating HelloCash payment for ${request.amount} ETB`);

      // Authenticate with HelloCash
      const token = await this.authenticate();

      // Prepare payment request payload
      const payload = {
        fromAccount: this.merchantCode,
        toAccount: request.customerPhone, // Customer's phone number
        amount: request.amount,
        currency: request.currency || 'ETB',
        description: request.description,
        externalId: request.reference,
        notificationUrl: request.callbackUrl,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
      };

      // Send payment request
      const response = await axios.post(`${this.apiUrl}/invoices`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Process response
      const responseData = response.data as any;
      if (responseData && responseData.status === 'PENDING') {
        return {
          success: true,
          message: 'Payment initiated successfully',
          redirectUrl: `hellocash://pay?invoiceId=${responseData.id}`,
          paymentId: responseData.id,
          transactionId: request.reference,
          status: 'PENDING',
        };
      } else {
        this.logger.error('HelloCash payment initiation failed', responseData);
        return {
          success: false,
          message: responseData.message || 'Payment initiation failed',
          error: responseData,
        };
      }
    } catch (error) {
      this.logger.error('Error initiating HelloCash payment', error);
      return {
        success: false,
        message: 'Error initiating payment',
        error: error.message,
      };
    }
  }

  /**
   * Verify payment status with HelloCash
   * @param request Payment verification request
   * @returns Payment verification response
   */
  async verify(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      this.logger.log(`Verifying HelloCash payment ${request.paymentId}`);

      // Authenticate with HelloCash
      const token = await this.authenticate();

      // Send verification request
      const response = await axios.get(`${this.apiUrl}/invoices/${request.paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Process response
      const responseData = response.data as any;
      if (responseData) {
        return {
          success: true,
          message: 'Payment verification successful',
          status: this.mapHelloCashStatus(responseData.status),
          amount: responseData.amount,
          currency: responseData.currency || 'ETB',
          paymentDate: new Date(responseData.timestamp),
          paymentMethod: 'HELLOCASH',
          transactionId: responseData.id,
        };
      } else {
        this.logger.error('HelloCash payment verification failed', responseData);
        return {
          success: false,
          message: 'Payment verification failed',
          status: 'FAILED',
          error: responseData,
        };
      }
    } catch (error) {
      this.logger.error('Error verifying HelloCash payment', error);
      return {
        success: false,
        message: 'Error verifying payment',
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Handle HelloCash callback
   * @param payload Callback payload
   * @returns Payment verification response
   */
  async handleCallback(payload: any): Promise<PaymentVerificationResponse> {
    try {
      this.logger.log('Received HelloCash callback', payload);

      // Verify callback signature
      const isValid = this.verifyCallbackSignature(payload);
      if (!isValid) {
        this.logger.error('Invalid HelloCash callback signature');
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
        status: this.mapHelloCashStatus(payload.status),
        amount: payload.amount,
        currency: payload.currency || 'ETB',
        paymentDate: new Date(payload.timestamp),
        paymentMethod: 'HELLOCASH',
        transactionId: payload.id,
      };
    } catch (error) {
      this.logger.error('Error processing HelloCash callback', error);
      return {
        success: false,
        message: 'Error processing callback',
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Map HelloCash status to standard status
   * @param helloCashStatus HelloCash status
   * @returns Standard status
   */
  private mapHelloCashStatus(helloCashStatus: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
    switch (helloCashStatus) {
      case 'PAID':
        return 'COMPLETED';
      case 'PENDING':
        return 'PENDING';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'EXPIRED':
      case 'FAILED':
      default:
        return 'FAILED';
    }
  }

  /**
   * Verify HelloCash callback signature
   * @param payload Callback payload
   * @returns Whether signature is valid
   */
  private verifyCallbackSignature(payload: any): boolean {
    try {
      const receivedSignature = payload.signature;
      if (!receivedSignature) {
        return false;
      }

      // Remove signature from payload for verification
      const { signature, ...dataToVerify } = payload;

      // Sort keys alphabetically
      const sortedKeys = Object.keys(dataToVerify).sort();
      let signString = '';

      // Create string to sign
      for (const key of sortedKeys) {
        signString += `${key}=${dataToVerify[key]}&`;
      }

      // Remove trailing & and append API key
      signString = signString.slice(0, -1) + this.apiKey;

      // Generate SHA-256 hash
      const calculatedSignature = crypto
        .createHash('sha256')
        .update(signString)
        .digest('hex');

      return receivedSignature === calculatedSignature;
    } catch (error) {
      this.logger.error('Error verifying HelloCash signature', error);
      return false;
    }
  }
}
