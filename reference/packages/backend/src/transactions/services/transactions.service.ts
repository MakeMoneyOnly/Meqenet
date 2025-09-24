import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Transaction, TransactionStatus, TransactionType } from '@prisma/client';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { AccountsService } from '../../accounts/services/accounts.service';
import { PaymentPlansService } from '../../payment-plans/services/payment-plans.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SettlementsService } from '../../settlements/services/settlements.service';
import { TransactionFeeService } from './transaction-fee.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly paymentPlansService: PaymentPlansService,
    private readonly notificationsService: NotificationsService,
    private readonly settlementsService: SettlementsService,
    private readonly transactionFeeService: TransactionFeeService,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: true,
        merchant: true,
        paymentMethod: true,
        paymentPlan: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        paymentPlan: true,
      },
    });
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    // Get the account to find the user ID
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    // Find transactions by user ID
    return this.prisma.transaction.findMany({
      where: { userId: account.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        paymentPlan: true,
      },
    });
  }

  async create(accountId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    // Get the account to get the userId
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    // Set the userId from the account
    createTransactionDto.userId = account.userId;

    // Create the transaction
    return this.createTransaction(createTransactionDto);
  }

  async findByMerchantId(merchantId: string, options: { limit?: number; offset?: number; status?: string } = {}): Promise<any> {
    const { limit = 10, offset = 0, status } = options;

    // Create a properly typed where clause
    const where: any = {
      merchantId,
    };

    // Only add status if it's provided and valid
    if (status) {
      // Convert string status to enum if it's valid
      if (Object.values(TransactionStatus).includes(status as TransactionStatus)) {
        where.status = status as TransactionStatus;
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
          },
        },
        paymentPlan: true,
        // Don't include settlement directly as it might not be defined in the schema yet
        // We'll fetch settlements separately
      },
    });

    const total = await this.prisma.transaction.count({ where });

    // Since the settlement table might not exist yet, we'll just return the transactions as is
    // In a production environment, we would fetch and include the settlements
    this.logger.log(`Found ${transactions.length} transactions for merchant ${merchantId}`);

    // Return transactions without trying to fetch settlements that might not exist yet
    const enrichedTransactions = transactions;

    return {
      transactions: enrichedTransactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Create a new transaction
   * This is the main entry point for creating a transaction
   * It handles the entire flow including:
   * - Creating the transaction record
   * - Updating the user's account
   * - Creating a payment plan if needed
   * - Settling with the merchant immediately
   */
  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const {
      userId,
      merchantId,
      amount,
      description,
      paymentMethodId,
      installments,
      includeTransactionFee = true // Default to true if not specified
    } = createTransactionDto;

    this.logger.log(`Creating transaction for user ${userId}, merchant ${merchantId}, amount ${amount}, includeTransactionFee: ${includeTransactionFee}`);

    // Start a transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      // Check if user exists and has sufficient credit
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { account: true },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (!user.account) {
        throw new BadRequestException(`User ${userId} does not have an account`);
      }

      if (user.account.availableCredit < amount) {
        throw new BadRequestException(`Insufficient credit. Available: ${user.account.availableCredit}, Required: ${amount}`);
      }

      // Check if merchant exists
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw new NotFoundException(`Merchant ${merchantId} not found`);
      }

      // Generate unique reference
      const reference = `TXN-${uuidv4().substring(0, 8)}`;

      // Calculate transaction fee if enabled
      let fee = 0;
      let totalWithFee = amount;
      let feeBreakdown = null;

      if (includeTransactionFee) {
        const feeResult = this.transactionFeeService.calculateFee(amount);
        fee = feeResult.fee;
        totalWithFee = feeResult.totalWithFee;
        feeBreakdown = feeResult.feeBreakdown;
        this.logger.log(`Transaction fee for ${amount} ETB: ${fee} ETB (total: ${totalWithFee} ETB)`);
      } else {
        this.logger.log(`Transaction fee calculation disabled for this transaction`);
      }

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          merchantId,
          reference,
          type: TransactionType.PAYMENT,
          amount,
          transactionFee: fee,
          totalAmount: totalWithFee,
          currency: 'ETB',
          status: TransactionStatus.COMPLETED,
          description,
          paymentMethodId,
          metadata: {
            createdAt: new Date().toISOString(),
            installments: installments || 1,
            feeBreakdown,
          },
        },
      });

      // Update user's available credit
      // Deduct the total amount (including fee) from available credit
      await prisma.account.update({
        where: { id: user.account.id },
        data: {
          availableCredit: {
            decrement: totalWithFee, // Deduct the total amount including fee
          },
          totalOutstanding: {
            increment: totalWithFee, // Add the total amount including fee to outstanding balance
          },
        },
      });

      // Create payment plan if installments > 1
      if (installments && installments > 1) {
        // Calculate installment amount based on total amount including fee
        const installmentAmount = Math.ceil(totalWithFee / installments);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + installments);

        await prisma.paymentPlan.create({
          data: {
            userId,
            merchantId,
            reference: `PLAN-${reference}`,
            totalAmount: totalWithFee, // Use total amount including fee
            remainingAmount: totalWithFee, // Initially, remaining amount equals total amount
            currency: 'ETB',
            numberOfInstallments: installments,
            installmentAmount,
            startDate,
            endDate,
            status: 'ACTIVE',
            description: `Payment plan for ${description}`,
            metadata: {
              originalAmount: amount,
              transactionFee: fee,
              totalWithFee,
              feeBreakdown,
            },
          },
        });
      }

      // Process immediate settlement to merchant
      await this.settlementsService.createSettlement(transaction.id);

      // Send notifications
      let notificationMessage = `Your payment of ${amount} ETB to ${merchant.name} has been processed.`;

      // Add fee information if transaction fees were applied
      if (includeTransactionFee && fee > 0) {
        notificationMessage += ` Transaction fee: ${fee} ETB. Total: ${totalWithFee} ETB.`;
      }

      await this.notificationsService.sendNotification({
        userId,
        type: 'TRANSACTION_COMPLETED',
        message: notificationMessage,
        data: {
          transactionId: transaction.id,
          amount,
          transactionFee: fee,
          totalAmount: totalWithFee,
          merchantName: merchant.name,
          feeBreakdown,
          includeTransactionFee,
        },
      });

      return transaction;
    });
  }

  /**
   * Update transaction status
   * This is used by admins to manually update transaction status
   */
  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    this.logger.log(`Updating transaction ${id} status from ${transaction.status} to ${status}`);

    return this.prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }
}
