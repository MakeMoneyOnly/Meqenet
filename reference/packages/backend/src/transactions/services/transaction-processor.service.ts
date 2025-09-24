import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGatewaysService } from '../../payment-gateways/services/payment-gateways.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { TransactionFeeService } from './transaction-fee.service';
import { SettlementsService } from '../../settlements/services/settlements.service';
import { FraudDetectionService } from '../../fraud-detection/services/fraud-detection.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { Transaction, TransactionStatus, TransactionType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

/**
 * Service for processing transactions and payments
 * Handles the complete payment flow from initiation to completion
 */
@Injectable()
export class TransactionProcessorService {
  private readonly logger = new Logger(TransactionProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymentGatewaysService))
    private readonly paymentGatewaysService: PaymentGatewaysService,
    private readonly notificationsService: NotificationsService,
    private readonly transactionFeeService: TransactionFeeService,
    private readonly settlementsService: SettlementsService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Process a payment for a transaction
   * @param processPaymentDto Payment processing data
   * @returns Payment processing result
   */
  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<any> {
    try {
      this.logger.log(`Processing payment for transaction ${processPaymentDto.transactionId}`);

      // Get transaction
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: processPaymentDto.transactionId },
        include: {
          user: true,
          merchant: true,
        },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${processPaymentDto.transactionId} not found`);
      }

      if (transaction.status !== 'PENDING') {
        throw new BadRequestException(`Transaction ${processPaymentDto.transactionId} is not in PENDING status`);
      }

      // Check for potential fraud
      const fraudCheckResult = await this.fraudDetectionService.checkTransaction(
        transaction,
        transaction.user,
        transaction.merchant as any,
      );

      // Log fraud check result
      this.logger.log(`Fraud check result for transaction ${transaction.id}: ${JSON.stringify(fraudCheckResult)}`);

      // If transaction is flagged as fraudulent, block it
      if (fraudCheckResult.action === 'BLOCK') {
        // Update transaction status to FAILED
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: JSON.stringify({
              ...(typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : {}),
              fraudCheck: {
                riskScore: fraudCheckResult.riskScore,
                flaggedRules: fraudCheckResult.flaggedRules,
                action: fraudCheckResult.action,
                checkedAt: new Date().toISOString(),
              },
            }),
          },
        });

        // Send notification to user
        await this.notificationsService.sendNotification({
          userId: transaction.userId,
          type: 'TRANSACTION_BLOCKED',
          message: `Your transaction ${transaction.reference} has been blocked for security reasons. Please contact customer support.`,
          data: {
            transactionId: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency || 'ETB',
          },
        });

        throw new ForbiddenException('Transaction blocked for security reasons. Please contact customer support.');
      }

      // Initiate payment with selected gateway
      const paymentRequest = {
        amount: transaction.totalAmount,
        currency: transaction.currency || 'ETB',
        description: transaction.description || `Payment for transaction ${transaction.reference}`,
        reference: transaction.reference,
        callbackUrl: `${this.configService.get<string>('API_URL')}/api/v1/payment-gateways/webhook/${processPaymentDto.gateway.toLowerCase()}/${transaction.id}`,
        returnUrl: processPaymentDto.returnUrl || `${this.configService.get<string>('FRONTEND_URL')}/payment/complete`,
        customerName: transaction.user.email ? transaction.user.email.split('@')[0] : undefined,
        customerPhone: transaction.user.phoneNumber,
        customerEmail: transaction.user.email || undefined,
      };

      const paymentResult = await this.paymentGatewaysService.initiatePayment(
        processPaymentDto.gateway,
        paymentRequest,
      );

      if (!paymentResult.success) {
        // Update transaction status to FAILED
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: JSON.stringify({
              ...(typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : {}),
              paymentError: paymentResult.error,
            }),
          },
        });

        // Send notification
        await this.notificationsService.sendNotification({
          userId: transaction.userId,
          type: 'PAYMENT_FAILED',
          message: `Your payment for ${transaction.amount} ${transaction.currency || 'ETB'} has failed.`,
          data: {
            transactionId: transaction.id,
            reference: transaction.reference,
            error: paymentResult.message,
          },
        });

        return {
          success: false,
          message: paymentResult.message,
          error: paymentResult.error,
        };
      }

      // Update transaction with payment information
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          // Store paymentId in metadata instead
          // We can't directly set paymentMethod to a string, so we'll handle this differently
          // in a real implementation, we would use a proper relation
          metadata: JSON.stringify({
            ...(typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : {}),
            paymentGateway: processPaymentDto.gateway,
            paymentInitiation: {
              gateway: processPaymentDto.gateway,
              redirectUrl: paymentResult.redirectUrl,
              paymentId: paymentResult.paymentId,
              initiatedAt: new Date().toISOString(),
            },
          }),
        },
      });

      return {
        success: true,
        message: 'Payment initiated successfully',
        redirectUrl: paymentResult.redirectUrl,
        transactionId: transaction.id,
        reference: transaction.reference,
      };
    } catch (error) {
      this.logger.error(`Error processing payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle payment callback from payment gateway
   * @param gatewayType Payment gateway type
   * @param transactionId Transaction ID
   * @param payload Callback payload
   * @param signature Callback signature
   * @returns Payment callback processing result
   */
  async handlePaymentCallback(
    gatewayType: string,
    transactionId: string,
    payload: any,
    signature?: string,
  ): Promise<any> {
    try {
      this.logger.log(`Handling payment callback from ${gatewayType} for transaction ${transactionId}`);

      // Get transaction
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          user: true,
          merchant: true,
        },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      // Process callback with payment gateway
      const callbackResult = await this.paymentGatewaysService.handleCallback(
        gatewayType,
        payload,
        signature,
      );

      if (!callbackResult.success) {
        this.logger.error(`Payment callback processing failed: ${callbackResult.message}`);
        return {
          success: false,
          message: callbackResult.message,
          error: callbackResult.error,
        };
      }

      // Update transaction based on callback result
      const updatedTransaction = await this.updateTransactionFromCallback(
        transaction,
        callbackResult,
      );

      return {
        success: true,
        message: 'Payment callback processed successfully',
        status: updatedTransaction.status,
        transactionId: updatedTransaction.id,
      };
    } catch (error) {
      this.logger.error(`Error handling payment callback: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update transaction based on payment callback result
   * @param transaction Transaction to update
   * @param callbackResult Payment callback result
   * @returns Updated transaction
   */
  private async updateTransactionFromCallback(
    transaction: Transaction,
    callbackResult: any,
  ): Promise<Transaction> {
    try {
      // Determine new transaction status
      const newStatus = this.mapPaymentStatusToTransactionStatus(callbackResult.status);

      // Update transaction
      const updatedTransaction = await this.prisma.$transaction(async (prisma) => {
        // Update transaction status
        const updated = await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: newStatus,
            // Store payment date in metadata instead of using a non-existent field
            metadata: JSON.stringify({
              ...(typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : {}),
              paymentDate: callbackResult.paymentDate || new Date().toISOString(),
              paymentCallback: {
                status: callbackResult.status,
                processedAt: new Date().toISOString(),
                paymentMethod: callbackResult.paymentMethod,
                paymentDate: callbackResult.paymentDate?.toISOString(),
              },
            }),
          },
        });

        // If payment is completed, process settlement
        if (newStatus === 'COMPLETED' && transaction.merchantId) {
          await this.settlementsService.createSettlement(transaction.id);
        }

        return updated;
      });

      // Send notification
      if (newStatus === 'COMPLETED') {
        await this.notificationsService.sendNotification({
          userId: transaction.userId,
          type: 'PAYMENT_COMPLETED',
          message: `Your payment of ${transaction.amount} ${transaction.currency || 'ETB'} has been completed.`,
          data: {
            transactionId: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency || 'ETB',
          },
        });
      } else if (newStatus === 'FAILED') {
        await this.notificationsService.sendNotification({
          userId: transaction.userId,
          type: 'PAYMENT_FAILED',
          message: `Your payment of ${transaction.amount} ${transaction.currency || 'ETB'} has failed.`,
          data: {
            transactionId: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency || 'ETB',
          },
        });
      }

      return updatedTransaction;
    } catch (error) {
      this.logger.error(`Error updating transaction from callback: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Map payment status to transaction status
   * @param paymentStatus Payment status
   * @returns Transaction status
   */
  private mapPaymentStatusToTransactionStatus(paymentStatus: string): TransactionStatus {
    switch (paymentStatus) {
      case 'COMPLETED':
        return 'COMPLETED';
      case 'PENDING':
        return 'PENDING';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'FAILED':
      default:
        return 'FAILED';
    }
  }
}
