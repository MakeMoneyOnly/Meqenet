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
  NotFoundException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountStatus } from '../enums/account-status.enum';
import { Request as ExpressRequest } from 'express';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved' })
  async findAll(@Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.accountsService.findByUserId(req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Account created' })
  async create(@Body() createAccountDto: CreateAccountDto, @Request() req: ExpressRequest & { user: JwtPayload }) {
    return this.accountsService.create(req.user.sub, createAccountDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(@Param('id') id: string, @Request() req: ExpressRequest & { user: JwtPayload }) {
    const account = await this.accountsService.findById(id);
    
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    
    // Ensure user can only access their own accounts
    if (account.userId !== req.user.sub && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }
    
    return account;
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update account status' })
  @ApiResponse({ status: 200, description: 'Account status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AccountStatus,
    @Request() req: ExpressRequest & { user: JwtPayload }
  ) {
    const account = await this.accountsService.findById(id);
    
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    
    // Ensure user can only update their own accounts
    if (account.userId !== req.user.sub && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }
    
    // ... existing code ...
  }
}