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
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentPlansService } from '../services/payment-plans.service';
import { CreatePaymentPlanDto } from '../dto/create-payment-plan.dto';
import { PaymentPlanStatus } from '@prisma/client';

@ApiTags('payment-plans')
@Controller('payment-plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentPlansController {
  constructor(private readonly paymentPlansService: PaymentPlansService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment plans for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Payment plans retrieved' })
  async findAll(@Request() req: any) {
    return this.paymentPlansService.findByUserId(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment plan' })
  @ApiResponse({ status: 201, description: 'Payment plan created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async create(
    @Body() createPaymentPlanDto: CreatePaymentPlanDto,
    @Body('account_id') accountId: string,
    @Request() req: any
  ) {
    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }

    return this.paymentPlansService.create(req.user.id, accountId, createPaymentPlanDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment plan by ID' })
  @ApiResponse({ status: 200, description: 'Payment plan found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment plan not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const paymentPlan = await this.paymentPlansService.findById(id);

    if (!paymentPlan) {
      throw new NotFoundException(`Payment plan with ID ${id} not found`);
    }

    // Ensure user can only access their own payment plans
    if (paymentPlan.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return paymentPlan;
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update payment plan status' })
  @ApiResponse({ status: 200, description: 'Payment plan status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment plan not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentPlanStatus,
    @Request() req: any
  ) {
    const paymentPlan = await this.paymentPlansService.findById(id);

    if (!paymentPlan) {
      throw new NotFoundException(`Payment plan with ID ${id} not found`);
    }

    // Ensure user can only update their own payment plans
    if (paymentPlan.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return this.paymentPlansService.updateStatus(id, status);
  }

  @Post(':id/installments/:installmentId/pay')
  @ApiOperation({ summary: 'Process payment for an installment' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment plan or installment not found' })
  async processPayment(
    @Param('id') id: string,
    @Param('installmentId') installmentId: string,
    @Body('amount') amount: number,
    @Request() req: any
  ) {
    const paymentPlan = await this.paymentPlansService.findById(id);

    if (!paymentPlan) {
      throw new NotFoundException(`Payment plan with ID ${id} not found`);
    }

    // Ensure user can only process payments for their own payment plans
    if (paymentPlan.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return this.paymentPlansService.processPayment(id, installmentId, amount);
  }
}