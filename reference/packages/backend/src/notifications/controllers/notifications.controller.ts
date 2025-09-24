import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotificationsService } from '../services/notifications.service';
import { NotificationType } from '../enums/notification-type.enum';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a test notification to the current user' })
  @ApiResponse({ status: 201, description: 'Test notification sent successfully' })
  async sendTestNotification(
    @Request() req: any,
    @Body() body: { message?: string; type?: NotificationType },
  ) {
    const userId = req.user.id;
    const userProfile = await req.user.profile;

    this.logger.log(`Sending test notification to user ${userId}`);

    const type = body.type || NotificationType.GENERAL_NOTIFICATION;
    const message = body.message || 'This is a test notification';

    const result = await this.notificationsService.sendNotification({
      type,
      userId,
      message,
      email: req.user.email,
      phoneNumber: req.user.phoneNumber,
      data: {
        message,
        timestamp: new Date().toISOString(),
        pushToken: userProfile?.pushToken,
        language: userProfile?.preferredLanguage || 'en',
      },
    });

    return {
      success: result,
      message: result ? 'Test notification sent successfully' : 'Failed to send test notification',
    };
  }
}



