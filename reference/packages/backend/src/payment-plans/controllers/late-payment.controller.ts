import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { LatePaymentService } from '../services/late-payment.service';
import { PaymentRescheduleService } from '../services/payment-reschedule.service';
import { PaymentPlanStatus } from '@prisma/client';
import { GetUser } from '../../auth/decorators/get-user.decorator';

class ReschedulePaymentDto {
  newEndDate: Date;
  reason: string;
}

@ApiTags('late-payments')
@Controller('late-payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LatePaymentController {
  private readonly logger = new Logger(LatePaymentController.name);

  constructor(
    private readonly latePaymentService: LatePaymentService,
    private readonly paymentRescheduleService: PaymentRescheduleService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get late payments (admin only)' })
  @ApiResponse({ status: 200, description: 'Late payments retrieved' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentPlanStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getLatePayments(
    @Query('status') status?: PaymentPlanStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    this.logger.log(`Getting late payments with status: ${status || PaymentPlanStatus.LATE}`);
    return this.latePaymentService.getLatePayments({
      status: status || PaymentPlanStatus.LATE,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user\'s late payments' })
  @ApiResponse({ status: 200, description: 'User\'s late payments retrieved' })
  async getUserLatePayments(@GetUser('id') userId: string) {
    this.logger.log(`Getting late payments for user ${userId}`);
    return this.latePaymentService.getLatePayments({
      status: PaymentPlanStatus.LATE,
      limit: 100,
      offset: 0,
    });
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a payment' })
  @ApiResponse({ status: 200, description: 'Payment rescheduled' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Payment plan not found' })
  async reschedulePayment(
    @Param('id') id: string,
    @Body() reschedulePaymentDto: ReschedulePaymentDto,
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
  ) {
    this.logger.log(`Rescheduling payment ${id} to ${reschedulePaymentDto.newEndDate}`);

    // Check if admin-initiated
    const isAdmin = ['ADMIN', 'CREDIT_MANAGER'].includes(userRole);

    return this.paymentRescheduleService.reschedulePayment({
      paymentPlanId: id,
      newEndDate: reschedulePaymentDto.newEndDate,
      reason: reschedulePaymentDto.reason,
      adminId: isAdmin ? userId : undefined,
    });
  }

  @Get(':id/reschedule-history')
  @ApiOperation({ summary: 'Get reschedule history for a payment plan' })
  @ApiResponse({ status: 200, description: 'Reschedule history retrieved' })
  @ApiResponse({ status: 404, description: 'Payment plan not found' })
  async getRescheduleHistory(@Param('id') id: string) {
    this.logger.log(`Getting reschedule history for payment plan ${id}`);
    return this.paymentRescheduleService.getRescheduleHistory(id);
  }

  @Post('check')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually trigger late payment check (admin only)' })
  @ApiResponse({ status: 200, description: 'Late payment check triggered' })
  async triggerLatePaymentCheck() {
    this.logger.log('Manually triggering late payment check');
    await this.latePaymentService.checkLatePayments();
    return {
      success: true,
      message: 'Late payment check triggered successfully',
    };
  }
}
