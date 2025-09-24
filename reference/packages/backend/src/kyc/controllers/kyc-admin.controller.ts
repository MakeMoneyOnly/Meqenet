import {
  Controller,
  Get,
  Post,
  Put,
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
import { KycAdminService } from '../services/kyc-admin.service';
import { KycService } from '../services/kyc.service';
import { KycStatus } from '../enums/kyc.enum';
import { UpdateKycStatusDto } from '../dto/submit-kyc.dto';

@ApiTags('kyc-admin')
@Controller('kyc-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
@ApiBearerAuth()
export class KycAdminController {
  private readonly logger = new Logger(KycAdminController.name);

  constructor(
    private readonly kycAdminService: KycAdminService,
    private readonly kycService: KycService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all KYC verifications' })
  @ApiResponse({ status: 200, description: 'KYC verifications retrieved' })
  @ApiQuery({ name: 'status', required: false, enum: KycStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getAllKycVerifications(
    @Query('status') status?: KycStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    this.logger.log(`Getting KYC verifications with status: ${status || 'all'}`);
    return this.kycAdminService.getAllKycVerifications({
      status,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get KYC verification statistics' })
  @ApiResponse({ status: 200, description: 'KYC statistics retrieved' })
  async getKycStatistics() {
    this.logger.log('Getting KYC statistics');
    return this.kycAdminService.getKycStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get KYC verification details' })
  @ApiResponse({ status: 200, description: 'KYC verification details retrieved' })
  @ApiResponse({ status: 404, description: 'KYC verification not found' })
  async getKycVerificationDetails(@Param('id') id: string) {
    this.logger.log(`Getting KYC verification details for ${id}`);
    return this.kycAdminService.getKycVerificationDetails(id);
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign KYC verification to admin for review' })
  @ApiResponse({ status: 200, description: 'KYC verification assigned' })
  @ApiResponse({ status: 404, description: 'KYC verification not found' })
  async assignKycVerification(
    @Param('id') id: string,
    @Request() req: { user: { id: string, email?: string } },
  ) {
    this.logger.log(`Assigning KYC verification ${id} to admin ${req.user.id}`);
    return this.kycAdminService.assignKycVerification(id, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update KYC verification status' })
  @ApiResponse({ status: 200, description: 'KYC status updated' })
  @ApiResponse({ status: 404, description: 'KYC verification not found' })
  async updateKycStatus(
    @Param('id') id: string,
    @Body() updateKycStatusDto: UpdateKycStatusDto,
    @Request() req: { user: { id: string, email?: string } },
  ) {
    this.logger.log(`Updating KYC status for ${id} to ${updateKycStatusDto.status}`);

    // Add reviewer information to the notes
    const reviewerInfo = `Reviewed by: ${req.user.email || req.user.id}`;
    const notes = updateKycStatusDto.reason
      ? `${updateKycStatusDto.reason}\n\n${reviewerInfo}`
      : reviewerInfo;

    return this.kycService.updateKycStatus(
      id,
      updateKycStatusDto.status as any,
      notes,
    );
  }
}
