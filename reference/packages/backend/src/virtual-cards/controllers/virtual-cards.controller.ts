import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Logger, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VirtualCardsService } from '../services/virtual-cards.service';
import { CreateVirtualCardDto } from '../dto/create-virtual-card.dto';
import { UpdateVirtualCardDto } from '../dto/update-virtual-card.dto';
import { VirtualCard } from '@prisma/client';

@ApiTags('virtual-cards')
@Controller('virtual-cards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VirtualCardsController {
  private readonly logger = new Logger(VirtualCardsController.name);

  constructor(private readonly virtualCardsService: VirtualCardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new virtual card' })
  @ApiResponse({ status: 201, description: 'Virtual card created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createVirtualCardDto: CreateVirtualCardDto): Promise<VirtualCard> {
    this.logger.log(`Creating virtual card for user ${req.user.id}`);
    return this.virtualCardsService.create(req.user.id, createVirtualCardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all virtual cards for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Virtual cards retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req): Promise<VirtualCard[]> {
    this.logger.log(`Getting all virtual cards for user ${req.user.id}`);
    return this.virtualCardsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a virtual card by ID' })
  @ApiParam({ name: 'id', description: 'Virtual card ID' })
  @ApiResponse({ status: 200, description: 'Virtual card retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Virtual card not found' })
  async findOne(@Request() req, @Param('id') id: string): Promise<VirtualCard> {
    this.logger.log(`Getting virtual card ${id} for user ${req.user.id}`);
    const virtualCard = await this.virtualCardsService.findById(id);
    
    // Ensure the user owns the virtual card
    if (virtualCard.userId !== req.user.id) {
      this.logger.warn(`User ${req.user.id} attempted to access virtual card ${id} belonging to user ${virtualCard.userId}`);
      throw new Error('Unauthorized');
    }
    
    return virtualCard;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a virtual card' })
  @ApiParam({ name: 'id', description: 'Virtual card ID' })
  @ApiResponse({ status: 200, description: 'Virtual card updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Virtual card not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateVirtualCardDto: UpdateVirtualCardDto,
  ): Promise<VirtualCard> {
    this.logger.log(`Updating virtual card ${id} for user ${req.user.id}`);
    const virtualCard = await this.virtualCardsService.findById(id);
    
    // Ensure the user owns the virtual card
    if (virtualCard.userId !== req.user.id) {
      this.logger.warn(`User ${req.user.id} attempted to update virtual card ${id} belonging to user ${virtualCard.userId}`);
      throw new Error('Unauthorized');
    }
    
    return this.virtualCardsService.update(id, updateVirtualCardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a virtual card' })
  @ApiParam({ name: 'id', description: 'Virtual card ID' })
  @ApiResponse({ status: 200, description: 'Virtual card deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Virtual card not found' })
  async remove(@Request() req, @Param('id') id: string): Promise<VirtualCard> {
    this.logger.log(`Deleting virtual card ${id} for user ${req.user.id}`);
    const virtualCard = await this.virtualCardsService.findById(id);
    
    // Ensure the user owns the virtual card
    if (virtualCard.userId !== req.user.id) {
      this.logger.warn(`User ${req.user.id} attempted to delete virtual card ${id} belonging to user ${virtualCard.userId}`);
      throw new Error('Unauthorized');
    }
    
    return this.virtualCardsService.delete(id);
  }

  @Put(':id/suspend')
  @ApiOperation({ summary: 'Suspend a virtual card' })
  @ApiParam({ name: 'id', description: 'Virtual card ID' })
  @ApiResponse({ status: 200, description: 'Virtual card suspended successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Virtual card not found' })
  @HttpCode(HttpStatus.OK)
  async suspend(@Request() req, @Param('id') id: string): Promise<VirtualCard> {
    this.logger.log(`Suspending virtual card ${id} for user ${req.user.id}`);
    const virtualCard = await this.virtualCardsService.findById(id);
    
    // Ensure the user owns the virtual card
    if (virtualCard.userId !== req.user.id) {
      this.logger.warn(`User ${req.user.id} attempted to suspend virtual card ${id} belonging to user ${virtualCard.userId}`);
      throw new Error('Unauthorized');
    }
    
    return this.virtualCardsService.suspend(id);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate a virtual card' })
  @ApiParam({ name: 'id', description: 'Virtual card ID' })
  @ApiResponse({ status: 200, description: 'Virtual card activated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Virtual card not found' })
  @HttpCode(HttpStatus.OK)
  async activate(@Request() req, @Param('id') id: string): Promise<VirtualCard> {
    this.logger.log(`Activating virtual card ${id} for user ${req.user.id}`);
    const virtualCard = await this.virtualCardsService.findById(id);
    
    // Ensure the user owns the virtual card
    if (virtualCard.userId !== req.user.id) {
      this.logger.warn(`User ${req.user.id} attempted to activate virtual card ${id} belonging to user ${virtualCard.userId}`);
      throw new Error('Unauthorized');
    }
    
    return this.virtualCardsService.activate(id);
  }
}
