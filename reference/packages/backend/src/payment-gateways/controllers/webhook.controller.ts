import { Controller, Post, Body, Param, Logger, HttpCode, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TelebirrService } from '../services/telebirr.service';
import { HelloCashService } from '../services/hellocash.service';
import { ChapaService } from '../services/chapa.service';
import { TransactionProcessorService } from '../../transactions/services/transaction-processor.service';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * Controller for handling payment gateway webhooks
 * These endpoints are public and don't require authentication
 * as they are called by payment gateways
 */
@ApiTags('payment-webhooks')
@Controller('payment-gateways/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly telebirrService: TelebirrService,
    private readonly helloCashService: HelloCashService,
    private readonly chapaService: ChapaService,
    private readonly transactionProcessorService: TransactionProcessorService,
  ) {}

  /**
   * Handle Telebirr payment callback
   * @param payload Webhook payload from Telebirr
   * @param headers HTTP headers
   * @returns Processing result
   */
  @Post('telebirr')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Telebirr payment callback' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleTelebirrWebhook(
    @Body() payload: any,
    @Headers() headers: any,
  ) {
    this.logger.log(`Received Telebirr webhook: ${JSON.stringify(payload)}`);

    try {
      // Process the webhook
      const result = await this.telebirrService.handleCallback(payload);

      // Return success response as expected by Telebirr
      return {
        code: result.success ? '0' : '1',
        message: result.message,
      };
    } catch (error) {
      this.logger.error(`Error processing Telebirr webhook: ${error.message}`, error.stack);

      // Return error response
      return {
        code: '1',
        message: 'Error processing webhook',
      };
    }
  }

  /**
   * Handle HelloCash payment callback
   * @param payload Webhook payload from HelloCash
   * @param headers HTTP headers
   * @returns Processing result
   */
  @Post('hellocash')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle HelloCash payment callback' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleHelloCashWebhook(
    @Body() payload: any,
    @Headers() headers: any,
  ) {
    this.logger.log(`Received HelloCash webhook: ${JSON.stringify(payload)}`);

    try {
      // Process the webhook
      const result = await this.helloCashService.handleCallback(payload);

      // Return success response as expected by HelloCash
      return {
        status: result.success ? 'success' : 'error',
        message: result.message,
      };
    } catch (error) {
      this.logger.error(`Error processing HelloCash webhook: ${error.message}`, error.stack);

      // Return error response
      return {
        status: 'error',
        message: 'Error processing webhook',
      };
    }
  }

  /**
   * Handle Chapa payment callback
   * @param payload Webhook payload from Chapa
   * @param headers HTTP headers
   * @returns Processing result
   */
  @Post('chapa')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Chapa payment callback' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleChapaWebhook(
    @Body() payload: any,
    @Headers() headers: any,
  ) {
    this.logger.log(`Received Chapa webhook: ${JSON.stringify(payload)}`);

    try {
      // Verify Chapa webhook signature from headers
      const signature = headers['x-chapa-signature'];

      // Process the webhook
      const result = await this.chapaService.handleCallback(payload, signature);

      // Return success response as expected by Chapa
      return {
        status: result.success ? 'success' : 'error',
        message: result.message,
      };
    } catch (error) {
      this.logger.error(`Error processing Chapa webhook: ${error.message}`, error.stack);

      // Return error response
      return {
        status: 'error',
        message: 'Error processing webhook',
      };
    }
  }

  /**
   * Handle transaction-specific webhook for any payment gateway
   * @param provider Payment gateway provider name
   * @param transactionId Transaction ID
   * @param payload Webhook payload
   * @returns Processing result
   */
  @Post(':provider/:transactionId')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle transaction-specific payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleTransactionWebhook(
    @Param('provider') provider: string,
    @Param('transactionId') transactionId: string,
    @Body() payload: any,
    @Headers() headers: any,
  ) {
    this.logger.log(`Received ${provider} webhook for transaction ${transactionId}`);

    try {
      // Get signature from headers if available
      const signature = provider.toLowerCase() === 'chapa' ? headers['x-chapa-signature'] : undefined;

      // Process the payment callback using the transaction processor service
      const result = await this.transactionProcessorService.handlePaymentCallback(
        provider.toLowerCase(),
        transactionId,
        payload,
        signature,
      );

      // Return success response
      return {
        status: result.success ? 'success' : 'error',
        message: result.message,
        transactionStatus: result.status,
      };
    } catch (error) {
      this.logger.error(`Error processing ${provider} webhook: ${error.message}`, error.stack);

      // Return error response
      return {
        status: 'error',
        message: 'Error processing webhook',
      };
    }
  }
}
