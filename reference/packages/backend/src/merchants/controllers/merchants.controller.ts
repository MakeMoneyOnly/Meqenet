import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { MerchantsService } from '../services/merchants.service';
import { CreateMerchantDto } from '../dto/create-merchant.dto';
import { UpdateMerchantDto } from '../dto/update-merchant.dto';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { MerchantStatus } from '@prisma/client';

@ApiTags('merchants')
@Controller('merchants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MerchantsController {
  private readonly logger = new Logger(MerchantsController.name);

  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new merchant' })
  @ApiResponse({ status: 201, description: 'Merchant created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Merchant already exists' })
  async create(@Body() createMerchantDto: CreateMerchantDto) {
    this.logger.log('Creating new merchant');
    return this.merchantsService.create(createMerchantDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all merchants (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of merchants' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll() {
    this.logger.log('Getting all merchants');
    return this.merchantsService.findAll();
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending merchants (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pending merchants' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findPending() {
    this.logger.log('Getting pending merchants');
    return this.merchantsService.findAll(MerchantStatus.PENDING);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant by ID' })
  @ApiResponse({ status: 200, description: 'Merchant details' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    this.logger.log(`Getting merchant ${id}`);
    const merchant = await this.merchantsService.findById(id);

    // Only admins can view any merchant, others can only view their own
    if (req.user.role !== 'ADMIN' && req.user.merchantId !== id) {
      throw new ForbiddenException('Access denied');
    }

    return merchant;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update merchant' })
  @ApiResponse({ status: 200, description: 'Merchant updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async update(
    @Param('id') id: string,
    @Body() updateMerchantDto: UpdateMerchantDto,
    @Request() req: any
  ) {
    this.logger.log(`Updating merchant ${id}`);

    // Only admins can update any merchant, others can only update their own
    if (req.user.role !== 'ADMIN' && req.user.merchantId !== id) {
      throw new ForbiddenException('Access denied');
    }

    return this.merchantsService.update(id, updateMerchantDto);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update merchant status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Merchant status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: MerchantStatus
  ) {
    this.logger.log(`Updating merchant ${id} status to ${status}`);

    if (!Object.values(MerchantStatus).includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    return this.merchantsService.updateStatus(id, status);
  }

  @Post(':id/api-keys')
  @ApiOperation({ summary: 'Generate new API key for merchant' })
  @ApiResponse({ status: 201, description: 'API key generated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async generateApiKey(
    @Param('id') id: string,
    @Body() createApiKeyDto: CreateApiKeyDto,
    @Request() req: any
  ) {
    this.logger.log(`Generating API key for merchant ${id}`);

    // Only admins can generate API keys for any merchant, others can only generate for their own
    if (req.user.role !== 'ADMIN' && req.user.merchantId !== id) {
      throw new ForbiddenException('Access denied');
    }

    // Check if merchant exists and is active
    const merchant = await this.merchantsService.findById(id);
    if (merchant.status !== MerchantStatus.ACTIVE) {
      throw new BadRequestException('Cannot generate API key for inactive merchant');
    }

    return this.merchantsService.generateApiKey(
      id,
      createApiKeyDto.name,
      createApiKeyDto.isLive || false
    );
  }
}
