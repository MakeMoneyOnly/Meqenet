import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentMethodsService } from '../services/payment-methods.service';
import { CreatePaymentMethodDto } from '../dto/create-payment-method.dto';

@ApiTags('payment-methods')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment methods for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
  async findAll(@Request() req: any) {
    return this.paymentMethodsService.findByUserId(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment method' })
  @ApiResponse({ status: 201, description: 'Payment method created' })
  async create(@Body() createPaymentMethodDto: CreatePaymentMethodDto, @Request() req: any) {
    return this.paymentMethodsService.create(req.user.id, createPaymentMethodDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment method by ID' })
  @ApiResponse({ status: 200, description: 'Payment method found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const paymentMethod = await this.paymentMethodsService.findById(id);

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    // Ensure user can only access their own payment methods
    if (paymentMethod.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return paymentMethod;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update payment method' })
  @ApiResponse({ status: 200, description: 'Payment method updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: Partial<CreatePaymentMethodDto>,
    @Request() req: any
  ) {
    const paymentMethod = await this.paymentMethodsService.findById(id);

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    // Ensure user can only update their own payment methods
    if (paymentMethod.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    return this.paymentMethodsService.update(id, updatePaymentMethodDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment method' })
  @ApiResponse({ status: 200, description: 'Payment method deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const paymentMethod = await this.paymentMethodsService.findById(id);

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    // Ensure user can only delete their own payment methods
    if (paymentMethod.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    await this.paymentMethodsService.delete(id);
    return { message: 'Payment method deleted successfully' };
  }
}