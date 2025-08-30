import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { DLQService, DLQAction } from './dlq.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../../shared/enums/user-role.enum';

@ApiTags('DLQ Management')
@ApiBearerAuth()
@Controller('dlq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COMPLIANCE)
export class DLQController {
  constructor(private readonly dlqService: DLQService) {}

  @Get()
  @ApiOperation({
    summary: 'Get DLQ messages',
    description: 'Retrieve paginated list of Dead Letter Queue messages'
  })
  @ApiResponse({
    status: 200,
    description: 'DLQ messages retrieved successfully'
  })
  async getDLQMessages(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('eventType') eventType?: string,
    @Query('aggregateType') aggregateType?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.dlqService.getDLQMessages(pageNum, limitNum, eventType, aggregateType);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search DLQ messages',
    description: 'Search DLQ messages by various criteria'
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully'
  })
  async searchDLQMessages(
    @Query('q') searchTerm: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.dlqService.searchDLQMessages(searchTerm, pageNum, limitNum);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get DLQ statistics',
    description: 'Retrieve statistics about DLQ messages'
  })
  @ApiResponse({
    status: 200,
    description: 'DLQ statistics retrieved successfully'
  })
  async getDLQStatistics() {
    return this.dlqService.getDLQStatistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get DLQ message by ID',
    description: 'Retrieve a specific DLQ message by its ID'
  })
  @ApiResponse({
    status: 200,
    description: 'DLQ message retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'DLQ message not found'
  })
  async getDLQMessageById(@Param('id') id: string) {
    const message = await this.dlqService.getDLQMessageById(id);
    if (!message) {
      throw new Error('DLQ message not found');
    }
    return message;
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process DLQ message',
    description: 'Process a DLQ message with specified action'
  })
  @ApiResponse({
    status: 200,
    description: 'DLQ message processed successfully'
  })
  async processDLQMessage(
    @Param('id') id: string,
    @Body() body: { action: DLQAction; notes?: string },
  ) {
    await this.dlqService.processDLQMessage(id, body.action, body.notes);
    return { message: 'DLQ message processed successfully' };
  }

  @Post('bulk-process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk process DLQ messages',
    description: 'Process multiple DLQ messages with the same action'
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk processing completed'
  })
  async bulkProcessDLQMessages(
    @Body() body: { messageIds: string[]; action: DLQAction; notes?: string },
  ) {
    const result = await this.dlqService.bulkProcessDLQMessages(
      body.messageIds,
      body.action,
      body.notes,
    );
    return {
      message: 'Bulk processing completed',
      processed: result.processed,
      failed: result.failed,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete DLQ message',
    description: 'Permanently delete a DLQ message'
  })
  @ApiResponse({
    status: 204,
    description: 'DLQ message deleted successfully'
  })
  async deleteDLQMessage(
    @Param('id') id: string,
    @Body() body: { notes?: string } = {},
  ) {
    await this.dlqService.processDLQMessage(id, DLQAction.DELETE, body.notes);
  }
}
