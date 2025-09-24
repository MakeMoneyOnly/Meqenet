import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { TelebirrService } from './telebirr.service';
import { HelloCashService } from './hellocash.service';
import { ChapaService } from './chapa.service';
import {
  PaymentGateway,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class PaymentGatewaysService {
  private readonly logger = new Logger(PaymentGatewaysService.name);
  private readonly gateways: Map<string, PaymentGateway>;

  constructor(
    private readonly telebirrService: TelebirrService,
    private readonly helloCashService: HelloCashService,
    private readonly chapaService: ChapaService,
  ) {
    this.gateways = new Map<string, PaymentGateway>([
      ['TELEBIRR', telebirrService],
      ['HELLOCASH', helloCashService],
      ['CHAPA', chapaService],
    ]);
    this.logger.log('Payment gateways service initialized');
  }

  /**
   * Get payment gateway by type
   * @param type Gateway type (TELEBIRR, HELLOCASH, CHAPA)
   * @returns Payment gateway instance
   */
  getGateway(type: string): PaymentGateway {
    this.logger.debug(`Getting payment gateway: ${type}`);
    const gateway = this.gateways.get(type.toUpperCase());
    if (!gateway) {
      this.logger.error(`Payment gateway ${type} not found`);
      throw new NotFoundException(`Payment gateway ${type} not found`);
    }
    return gateway;
  }

  /**
   * Get all available payment gateways
   * @returns List of available payment gateways
   */
  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys());
  }

  /**
   * Initiate payment with specified gateway
   * @param gatewayType Gateway type
   * @param request Payment initiation request
   * @returns Payment initiation response
   */
  async initiatePayment(
    gatewayType: string,
    request: PaymentInitiationRequest,
  ): Promise<PaymentInitiationResponse> {
    this.logger.log(`Initiating payment with ${gatewayType} for ${request.amount} ${request.currency || 'ETB'}`);
    try {
      const gateway = this.getGateway(gatewayType);
      const result = await gateway.initiate(request);

      if (result.success) {
        this.logger.log(`Payment initiated successfully with ${gatewayType}, reference: ${request.reference}`);
      } else {
        this.logger.error(`Payment initiation failed with ${gatewayType}: ${result.message}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error initiating payment with ${gatewayType}: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error initiating payment: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Verify payment with specified gateway
   * @param gatewayType Gateway type
   * @param request Payment verification request
   * @returns Payment verification response
   */
  async verifyPayment(
    gatewayType: string,
    request: PaymentVerificationRequest,
  ): Promise<PaymentVerificationResponse> {
    this.logger.log(`Verifying payment with ${gatewayType}, reference: ${request.reference || request.paymentId}`);
    try {
      const gateway = this.getGateway(gatewayType);
      const result = await gateway.verify(request);

      if (result.success) {
        this.logger.log(`Payment verification successful with ${gatewayType}, status: ${result.status}`);
      } else {
        this.logger.error(`Payment verification failed with ${gatewayType}: ${result.message}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error verifying payment with ${gatewayType}: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error verifying payment: ${error.message}`,
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Handle callback from payment gateway
   * @param gatewayType Gateway type
   * @param payload Callback payload
   * @returns Payment verification response
   */
  async handleCallback(
    gatewayType: string,
    payload: any,
    signature?: string,
  ): Promise<PaymentVerificationResponse> {
    this.logger.log(`Handling callback from ${gatewayType}`);
    try {
      const gateway = this.getGateway(gatewayType);

      // For Chapa, we need to pass the signature
      if (gatewayType.toUpperCase() === 'CHAPA' && signature) {
        return (gateway as ChapaService).handleCallback(payload, signature);
      }

      const result = await gateway.handleCallback(payload);

      if (result.success) {
        this.logger.log(`Callback processed successfully from ${gatewayType}, status: ${result.status}`);
      } else {
        this.logger.error(`Callback processing failed from ${gatewayType}: ${result.message}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error handling callback from ${gatewayType}: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error handling callback: ${error.message}`,
        status: 'FAILED',
        error: error.message,
      };
    }
  }
}