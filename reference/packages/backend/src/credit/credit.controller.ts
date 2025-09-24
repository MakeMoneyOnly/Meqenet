import { Controller, Get, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreditService } from './credit.service';
import { CreditAssessmentService } from './services/credit-assessment.service';
import { UpdateCreditLimitDto } from './dto/update-credit-limit.dto';
import { CreditAssessmentDto } from './dto/credit-assessment.dto';

@ApiTags('credit')
@Controller('credit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditController {
  private readonly logger = new Logger(CreditController.name);

  constructor(
    private readonly creditService: CreditService,
    private readonly creditAssessmentService: CreditAssessmentService
  ) {}

  @Get('limit')
  @ApiOperation({ summary: 'Get current user credit limit information' })
  @ApiResponse({ status: 200, description: 'Credit limit information retrieved' })
  async getCreditLimit(@GetUser('id') userId: string) {
    this.logger.log(`Getting credit limit for user ${userId}`);
    return this.creditService.getCreditLimit(userId);
  }

  @Get('limit/history')
  @ApiOperation({ summary: 'Get credit limit history for current user' })
  @ApiResponse({ status: 200, description: 'Credit limit history retrieved' })
  async getCreditLimitHistory(@GetUser('id') userId: string) {
    this.logger.log(`Getting credit limit history for user ${userId}`);
    return this.creditService.getCreditLimitHistory(userId);
  }

  @Post('limit/update')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user credit limit (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credit limit updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updateCreditLimit(@Body() updateCreditLimitDto: UpdateCreditLimitDto) {
    const { userId, newLimit, reason } = updateCreditLimitDto;
    this.logger.log(`Admin updating credit limit for user ${userId} to ${newLimit} ETB`);
    return this.creditService.updateCreditLimit(userId, newLimit, reason);
  }

  @Get('assessment')
  @ApiOperation({ summary: 'Get credit assessment for current user' })
  @ApiResponse({ status: 200, description: 'Credit assessment retrieved' })
  async getCreditAssessment(@GetUser('id') userId: string) {
    this.logger.log(`Getting credit assessment for user ${userId}`);
    const suggestedLimit = await this.creditService.assessCreditLimit(userId);
    return { suggestedLimit };
  }

  @Post('assessment/submit')
  @ApiOperation({ summary: 'Submit credit assessment data for evaluation' })
  @ApiResponse({ status: 200, description: 'Credit assessment completed' })
  async submitCreditAssessment(
    @GetUser('id') userId: string,
    @Body() assessmentData: CreditAssessmentDto
  ) {
    this.logger.log(`Submitting credit assessment for user ${userId}`);
    const creditLimit = await this.creditAssessmentService.assessCreditLimit(userId, assessmentData);
    return {
      success: true,
      creditLimit,
      message: `Your credit limit has been set to ${creditLimit} ETB`
    };
  }

  @Post('assessment/reassess')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reassess user credit limit based on payment history (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credit limit reassessed' })
  async reassessCreditLimit(@Body('userId') userId: string) {
    this.logger.log(`Admin triggered credit reassessment for user ${userId}`);
    const newLimit = await this.creditAssessmentService.reassessCreditLimit(userId);
    return {
      success: true,
      userId,
      newLimit,
      message: `Credit limit reassessed to ${newLimit} ETB based on payment history`
    };
  }

  @Get('assessment/factors')
  @ApiOperation({ summary: 'Get credit assessment factors' })
  @ApiResponse({ status: 200, description: 'Credit assessment factors retrieved' })
  async getCreditAssessmentFactors() {
    return this.creditService.getCreditAssessmentFactors();
  }
}




