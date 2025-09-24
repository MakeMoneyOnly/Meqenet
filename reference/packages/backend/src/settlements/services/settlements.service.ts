import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { BankTransferService } from './bank-transfer.service';
import { v4 as uuidv4 } from 'uuid';
import { SettlementStatus } from '@prisma/client';

// Define a type for the where clause in settlement queries
type SettlementWhereInput = {
  merchantId: string;
  status?: SettlementStatus;
};

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly bankTransferService: BankTransferService,
  ) {}

  /**
   * Create a settlement for a transaction
   * This is called after a transaction is approved to pay the merchant immediately
   */
  async createSettlement(transactionId: string): Promise<any> {
    // Start transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      // Get transaction details
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { merchant: true },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      if (!transaction.merchantId) {
        throw new NotFoundException(`Transaction ${transactionId} has no merchant`);
      }

      // Calculate merchant fee (based on original amount, not including customer transaction fee)
      const feePercentage = transaction.merchant ? transaction.merchant.commissionRate || 0.04 : 0.04; // Default 4%
      const feeAmount = transaction.amount * feePercentage;
      const settlementAmount = transaction.amount - feeAmount;

      // Note: The transaction fee charged to the customer is separate from the merchant fee
      // The customer pays: original amount + transaction fee
      // The merchant receives: original amount - merchant fee
      // Meqenet earns: transaction fee + merchant fee

      // Create settlement reference
      const reference = `STLM-${uuidv4().substring(0, 8)}`;

      // Create settlement record
      const settlement = await prisma.settlement.create({
        data: {
          merchantId: transaction.merchantId,
          transactionId: transaction.id,
          reference,
          amount: settlementAmount,
          feeAmount,
          currency: transaction.currency || 'ETB',
          status: 'PENDING',
          transferMethod: 'BANK_TRANSFER',
          metadata: {
            transactionReference: transaction.reference,
            merchantName: transaction.merchant ? transaction.merchant.name : 'Unknown Merchant',
            settlementDate: new Date().toISOString(),
            originalAmount: transaction.amount,
            merchantFee: feeAmount,
            merchantFeePercentage: feePercentage,
            customerTransactionFee: transaction.transactionFee || 0,
            totalCustomerCharge: transaction.totalAmount || transaction.amount,
            meqenetRevenue: feeAmount + (transaction.transactionFee || 0),
          },
        },
      });

      // Initiate bank transfer to merchant
      const transferResult = await this.bankTransferService.initiateTransfer({
        amount: settlementAmount,
        currency: transaction.currency || 'ETB',
        merchantId: transaction.merchantId,
        reference: settlement.reference,
        description: `Settlement for transaction ${transaction.reference}`,
      });

      // Update settlement status based on transfer result
      const updatedSettlement = await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          status: transferResult.success ? 'COMPLETED' : 'FAILED',
          transferReference: transferResult.reference,
          completedAt: transferResult.success ? new Date() : null,
        },
      });

      // Send notification to merchant
      if (transferResult.success) {
        await this.notificationsService.sendNotification({
          userId: transaction.merchant ? transaction.merchant.id : transaction.merchantId,
          type: 'SETTLEMENT_COMPLETED',
          message: `Settlement of ${settlementAmount} ${transaction.currency || 'ETB'} has been processed for transaction ${transaction.reference}. Original amount: ${transaction.amount} ETB, Merchant fee: ${feeAmount} ETB (${feePercentage * 100}%).`,
          data: {
            settlementId: settlement.id,
            amount: settlementAmount,
            originalAmount: transaction.amount,
            merchantFee: feeAmount,
            merchantFeePercentage: feePercentage,
            currency: transaction.currency || 'ETB',
            transactionReference: transaction.reference,
            customerTransactionFee: transaction.transactionFee || 0,
          },
        });
      }

      return updatedSettlement;
    });
  }

  /**
   * Get settlements for a merchant
   */
  async getMerchantSettlements(merchantId: string, options: { limit?: number; offset?: number; status?: SettlementStatus } = {}) {
    const { limit = 10, offset = 0, status } = options;

    const where: SettlementWhereInput = {
      merchantId,
      ...(status ? { status } : {}),
    };

    const settlements = await this.prisma.settlement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        transaction: {
          select: {
            reference: true,
            amount: true,
            currency: true,
            createdAt: true,
          },
        },
      },
    });

    const total = await this.prisma.settlement.count({ where });

    return {
      settlements,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get settlement details
   */
  async getSettlementDetails(settlementId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            bankName: true,
            bankAccountNumber: true,
            bankAccountName: true,
          },
        },
        transaction: {
          select: {
            id: true,
            reference: true,
            amount: true,
            currency: true,
            createdAt: true,
            description: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException(`Settlement ${settlementId} not found`);
    }

    return settlement;
  }
}
