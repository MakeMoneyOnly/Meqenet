import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { TransactionsService } from '../services/transactions.service';
import { TransactionProcessorService } from '../services/transaction-processor.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { TransactionStatus } from '@prisma/client';
import { AccountsService } from '../../accounts/services/accounts.service';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
    private readonly transactionProcessorService: TransactionProcessorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved' })
  async findAll(@Request() req: any) {
    return this.transactionsService.findByUserId(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Body('account_id') accountId: string,
    @Request() req: any
  ) {
    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }

    // Check if account belongs to user
    const account = await this.accountsService.findById(accountId);

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    if (account.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return this.transactionsService.create(accountId, createTransactionDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const transaction = await this.transactionsService.findById(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Get account to check ownership
    // Get the account associated with this transaction
    // In a real implementation, we would have a direct relationship between transactions and accounts
    // For now, we'll use the user ID to find the account
    const accounts = transaction.userId ? await this.accountsService.findByUserId(transaction.userId) : [];
    const account = accounts.length > 0 ? accounts[0] : null;

    // Ensure user can only access their own transactions
    if (account && account.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return transaction;
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get transactions by account ID' })
  @ApiResponse({ status: 200, description: 'Transactions found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findByAccountId(@Param('accountId') accountId: string, @Request() req: any) {
    // Check if account exists and belongs to user
    const account = await this.accountsService.findById(accountId);

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    if (account.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return this.transactionsService.findByAccountId(accountId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update transaction status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Transaction status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TransactionStatus,
    @Request() req: any
  ) {
    // Only admins can update transaction status
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return this.transactionsService.updateStatus(id, status);
  }

  @Get('merchant/transactions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get transactions for the current merchant' })
  @ApiResponse({ status: 200, description: 'Returns transactions for the merchant' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] })
  async getMerchantTransactions(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
  ) {
    const merchantId = req.user.id;
    this.logger.log(`Getting transactions for merchant ${merchantId}`);

    // Implement merchant transactions query
    // This would be similar to findByUserId but filtered by merchantId
    return this.transactionsService.findByMerchantId(merchantId, {
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      offset: offset ? parseInt(offset.toString(), 10) : undefined,
      status,
    });
  }

  @Post('merchant/create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Create a new transaction as a merchant' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient credit' })
  @ApiResponse({ status: 404, description: 'User or merchant not found' })
  async createMerchantTransaction(@Body() createTransactionDto: CreateTransactionDto, @Request() req: any) {
    this.logger.log(`Creating merchant transaction: ${JSON.stringify(createTransactionDto)}`);

    // Set the merchant ID to the authenticated merchant
    createTransactionDto.merchantId = req.user.id;

    // Validate that the user has sufficient credit
    // This will be handled in the service

    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Post(':id/process-payment')
  @ApiOperation({ summary: 'Process payment for a transaction' })
  @ApiResponse({ status: 200, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
    @Request() req: any
  ) {
    this.logger.log(`Processing payment for transaction ${id} with gateway ${processPaymentDto.gateway}`);

    // Get transaction to check ownership
    const transaction = await this.transactionsService.findById(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Ensure user can only process their own transactions
    if (transaction.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    // Set transaction ID in the DTO
    processPaymentDto.transactionId = id;

    // Process payment
    return this.transactionProcessorService.processPayment(processPaymentDto);
  }

  @Post(':id/verify-payment')
  @ApiOperation({ summary: 'Verify payment status for a transaction' })
  @ApiResponse({ status: 200, description: 'Payment status verified' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async verifyPayment(
    @Param('id') id: string,
    @Body('gateway') gateway: string,
    @Request() req: any
  ) {
    this.logger.log(`Verifying payment for transaction ${id} with gateway ${gateway}`);

    // Get transaction to check ownership
    const transaction = await this.transactionsService.findById(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Ensure user can only verify their own transactions
    if (transaction.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    // Verify payment
    // This would typically call the payment gateway service to check status
    // For now, we'll just return the current transaction status
    return {
      success: true,
      transactionId: id,
      status: transaction.status,
      paymentStatus: transaction.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
      message: `Payment status: ${transaction.status}`,
    };
  }
}