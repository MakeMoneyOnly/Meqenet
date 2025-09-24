import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('fraud-detection')
@Controller('fraud-detection')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FraudDetectionController {
  private readonly logger = new Logger(FraudDetectionController.name);

  constructor(
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get fraud detection statistics' })
  @ApiResponse({ status: 200, description: 'Returns fraud detection statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to include in stats' })
  async getFraudStats(@Query('days') days?: number) {
    this.logger.log(`Getting fraud stats for the last ${days || 30} days`);
    return this.fraudDetectionService.getFraudStats(days ? parseInt(days.toString()) : 30);
  }

  @Get('flagged-transactions')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get flagged transactions' })
  @ApiResponse({ status: 200, description: 'Returns flagged transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, enum: ['FLAG', 'BLOCK'] })
  async getFlaggedTransactions(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('action') action?: string,
  ) {
    const limitNum = limit ? parseInt(limit.toString()) : 10;
    const offsetNum = offset ? parseInt(offset.toString()) : 0;

    this.logger.log(`Getting flagged transactions with action: ${action || 'FLAG,BLOCK'}`);

    const where = {
      action: action ? action : { in: ['FLAG', 'BLOCK'] },
    };

    const [fraudChecks, total] = await Promise.all([
      this.prisma.fraudCheck.findMany({
        where,
        orderBy: {
          checkedAt: 'desc',
        },
        take: limitNum,
        skip: offsetNum,
        include: {
          transaction: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phoneNumber: true,
                  userProfile: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              merchant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.fraudCheck.count({ where }),
    ]);

    return {
      fraudChecks,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    };
  }

  @Get('transaction/:id')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get fraud check details for a transaction' })
  @ApiResponse({ status: 200, description: 'Returns fraud check details' })
  async getTransactionFraudCheck(@Param('id') id: string) {
    this.logger.log(`Getting fraud check details for transaction ${id}`);

    const fraudCheck = await this.prisma.fraudCheck.findFirst({
      where: {
        transactionId: id,
      },
      include: {
        transaction: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phoneNumber: true,
                userProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            merchant: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!fraudCheck) {
      return {
        message: 'No fraud check found for this transaction',
        transactionId: id,
      };
    }

    return fraudCheck;
  }

  @Get('user/:id/risk-score')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get risk score for a user' })
  @ApiResponse({ status: 200, description: 'Returns user risk score' })
  async getUserRiskScore(@Param('id') id: string) {
    this.logger.log(`Getting risk score for user ${id}`);

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
      },
    });

    if (!user) {
      return {
        message: 'User not found',
        userId: id,
      };
    }

    // Get user's fraud checks
    const fraudChecks = await this.prisma.fraudCheck.findMany({
      where: {
        transaction: {
          userId: id,
        },
      },
      orderBy: {
        checkedAt: 'desc',
      },
      take: 5,
    });

    // Get user's payment plans
    const paymentPlans = await this.prisma.paymentPlan.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Calculate risk score
    const riskScore = await this.fraudDetectionService['userBehaviorService'].getUserRiskScore(id);

    return {
      userId: id,
      userName: user.userProfile ? `${user.userProfile.firstName} ${user.userProfile.lastName}` : 'Unknown',
      email: user.email,
      phoneNumber: user.phoneNumber,
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      recentFraudChecks: fraudChecks,
      recentPaymentPlans: paymentPlans,
    };
  }

  private getRiskLevel(score: number): string {
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }
}
