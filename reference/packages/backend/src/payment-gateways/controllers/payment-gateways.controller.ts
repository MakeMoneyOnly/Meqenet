import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentGatewaysService } from '../services/payment-gateways.service';
import { PaymentInitiationRequest, PaymentVerificationRequest } from '../interfaces/payment-gateway.interface';
import { Public } from '../../auth/decorators/public.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

@ApiTags('payment-gateways')
@Controller('payment-gateways')
export class PaymentGatewaysController {
  private readonly logger = new Logger(PaymentGatewaysController.name);

  constructor(private readonly paymentGatewaysService: PaymentGatewaysService) {}

  /**
   * Get available payment gateways
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available payment gateways' })
  @ApiResponse({ status: 200, description: 'List of available payment gateways' })
  async getAvailableGateways() {
    this.logger.log('Getting available payment gateways');
    return {
      success: true,
      gateways: [
        {
          id: 'TELEBIRR',
          name: 'Telebirr',
          description: 'Pay with Telebirr mobile money',
          logoUrl: 'https://meqenet.et/assets/telebirr-logo.png',
          isAvailable: true,
        },
        {
          id: 'HELLOCASH',
          name: 'HelloCash',
          description: 'Pay with HelloCash mobile wallet',
          logoUrl: 'https://meqenet.et/assets/hellocash-logo.png',
          isAvailable: true,
        },
        {
          id: 'CHAPA',
          name: 'Chapa',
          description: 'Pay with bank cards and mobile money',
          logoUrl: 'https://meqenet.et/assets/chapa-logo.png',
          isAvailable: true,
        },
      ],
    };
  }

  /**
   * Initiate payment with specified gateway
   */
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment with specified gateway' })
  @ApiResponse({ status: 200, description: 'Payment initiated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Gateway not found' })
  async initiatePayment(
    @Body() initiatePaymentDto: InitiatePaymentDto,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`Initiating payment with ${initiatePaymentDto.gateway} for user ${userId}`);

    // Create a reference if not provided
    if (!initiatePaymentDto.reference) {
      initiatePaymentDto.reference = `FLEX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }

    // Create payment initiation request
    const request: PaymentInitiationRequest = {
      amount: initiatePaymentDto.amount,
      currency: initiatePaymentDto.currency || 'ETB',
      description: initiatePaymentDto.description,
      reference: initiatePaymentDto.reference,
      callbackUrl: initiatePaymentDto.callbackUrl || `https://api.meqenet.et/api/v1/payment-gateways/${initiatePaymentDto.gateway}/callback`,
      returnUrl: initiatePaymentDto.returnUrl || 'https://meqenet.et/payment/complete',
      customerName: initiatePaymentDto.customerName,
      customerPhone: initiatePaymentDto.customerPhone,
      customerEmail: initiatePaymentDto.customerEmail,
    };

    // Initiate payment
    const result = await this.paymentGatewaysService.initiatePayment(initiatePaymentDto.gateway, request);

    // Store payment information in database (in a real implementation)
    // ...

    return result;
  }

  /**
   * Verify payment status
   */
  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment status by reference' })
  @ApiResponse({ status: 200, description: 'Payment status' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'reference', description: 'Payment reference' })
  @ApiQuery({ name: 'gateway', description: 'Payment gateway', required: false })
  async verifyPaymentByReference(
    @Param('reference') reference: string,
    @Query('gateway') gateway?: string,
  ) {
    this.logger.log(`Verifying payment with reference ${reference}`);

    // In a real implementation, you would:
    // 1. Look up the payment in the database
    // 2. Get the gateway and payment ID
    // 3. Verify with the appropriate gateway

    // For now, we'll just use the provided gateway or default to checking all
    if (gateway) {
      const request: PaymentVerificationRequest = {
        reference,
        paymentId: reference, // In a real implementation, this would be the actual payment ID
      };

      return this.paymentGatewaysService.verifyPayment(gateway, request);
    } else {
      // Check all gateways (in a real implementation)
      return {
        success: false,
        message: 'Gateway parameter is required',
        status: 'FAILED',
      };
    }
  }

  /**
   * Verify payment with specified gateway
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment with specified gateway' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Gateway not found' })
  async verifyPayment(
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    this.logger.log(`Verifying payment with ${verifyPaymentDto.gateway}`);

    const request: PaymentVerificationRequest = {
      paymentId: verifyPaymentDto.paymentId || '',
      reference: verifyPaymentDto.reference,
      transactionId: verifyPaymentDto.transactionId,
    };

    return this.paymentGatewaysService.verifyPayment(verifyPaymentDto.gateway, request);
  }

  /**
   * Callback endpoint for payment gateways
   */
  @Post(':gateway/callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Callback endpoint for payment gateways' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  @ApiParam({ name: 'gateway', description: 'Payment gateway' })
  async handleCallback(
    @Param('gateway') gateway: string,
    @Body() payload: any,
    @Request() req: any,
  ) {
    this.logger.log(`Received callback from ${gateway}`);

    // For Chapa, extract signature from headers
    let signature = null;
    if (gateway.toUpperCase() === 'CHAPA') {
      signature = req.headers['x-chapa-signature'];
    }

    // Process callback
    const result = await this.paymentGatewaysService.handleCallback(gateway, payload);

    // In a real implementation, you would:
    // 1. Update the payment status in the database
    // 2. Trigger any necessary actions (e.g., notify user, update order status)

    return result;
  }
}