import { Controller, Get, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { SettlementStatus } from '@prisma/client';
import { SettlementsService } from '../services/settlements.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('settlements')
@Controller('settlements')
export class SettlementsController {
  private readonly logger = new Logger(SettlementsController.name);

  constructor(
    private readonly settlementsService: SettlementsService,
    private readonly prisma: PrismaService
  ) {}

  @Get('merchant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get settlements for the current merchant' })
  @ApiResponse({ status: 200, description: 'Returns settlements for the merchant' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  async getMerchantSettlements(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: SettlementStatus,
  ) {
    const merchantId = req.user.id;
    this.logger.log(`Getting settlements for merchant ${merchantId}`);

    return this.settlementsService.getMerchantSettlements(merchantId, {
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      offset: offset ? parseInt(offset.toString(), 10) : undefined,
      status,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get settlement details' })
  @ApiResponse({ status: 200, description: 'Returns settlement details' })
  @ApiResponse({ status: 404, description: 'Settlement not found' })
  async getSettlementDetails(@Param('id') id: string, @Request() req: any) {
    this.logger.log(`Getting settlement details for ${id}`);

    const settlement = await this.settlementsService.getSettlementDetails(id);

    // Check if user is authorized to view this settlement
    // Only the merchant who owns the settlement or an admin can view it
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'CREDIT_MANAGER' &&
      settlement.merchantId !== req.user.id
    ) {
      throw new Error('Unauthorized to view this settlement');
    }

    return settlement;
  }

  @Get('merchant/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get settlement summary for the current merchant' })
  @ApiResponse({ status: 200, description: 'Returns settlement summary' })
  async getMerchantSettlementSummary(@Request() req: any) {
    const merchantId = req.user.id;
    this.logger.log(`Getting settlement summary for merchant ${merchantId}`);

    // Get total settled amount, pending amount, and failed amount
    const [completed, pending, failed] = await Promise.all([
      this.prisma.settlement.aggregate({
        where: { merchantId, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.settlement.aggregate({
        where: { merchantId, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.settlement.aggregate({
        where: { merchantId, status: 'FAILED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      completed: {
        count: completed._count,
        amount: completed._sum.amount || 0,
      },
      pending: {
        count: pending._count,
        amount: pending._sum.amount || 0,
      },
      failed: {
        count: failed._count,
        amount: failed._sum.amount || 0,
      },
      total: {
        count: completed._count + pending._count + failed._count,
        amount: (completed._sum.amount || 0) + (pending._sum.amount || 0),
      },
    };
  }
}
