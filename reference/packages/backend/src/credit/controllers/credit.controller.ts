import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  Get,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreditAssessmentService } from '../services/credit-assessment.service';
import { CreditAssessmentDto } from '../dto/credit-assessment.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

@ApiTags('credit')
@Controller('credit')
@ApiBearerAuth()
export class CreditController {
  private readonly logger = new Logger(CreditController.name);

  constructor(
    private readonly creditAssessmentService: CreditAssessmentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('assess')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assess credit limit for the current user' })
  @ApiResponse({ status: 201, description: 'Credit limit assessed successfully' })
  async assessCreditLimit(
    @Request() req: {
      user: {
        id: string;
        email: string;
        phoneNumber: string;
        profile: any;
      }
    },
    @Body() data: CreditAssessmentDto,
  ) {
    try {
      const userId = req.user.id;
      this.logger.log(`Assessing credit limit for user ${userId}`);

      // Get current credit limit if exists
      const userProfile = await req.user.profile;
      const oldLimit = userProfile?.creditLimit || 0;

      // Assess credit limit
      const newLimit = await this.creditAssessmentService.assessCreditLimit(userId, data);

      // Send notification if credit limit changed
      if (newLimit !== oldLimit) {
        await this.notificationsService.sendNotification({
          type: NotificationType.CREDIT_LIMIT_UPDATED,
          userId: userId,
          message: `Your credit limit has been updated from ${oldLimit} to ${newLimit} ETB.`,
          email: req.user.email,
          phoneNumber: req.user.phoneNumber,
          data: {
            oldLimit,
            newLimit,
          },
        });
      }

      return {
        success: true,
        creditLimit: newLimit,
        previousLimit: oldLimit,
        change: newLimit - oldLimit,
      };
    } catch (error) {
      this.logger.error(`Error assessing credit limit: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to assess credit limit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('limit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current credit limit for the user' })
  @ApiResponse({ status: 200, description: 'Credit limit retrieved successfully' })
  async getCreditLimit(@Request() req: { user: { id: string; profile: any } }) {
    try {
      // We're using the profile directly, so no need to store userId separately
      const userProfile = await req.user.profile;

      if (!userProfile || !userProfile.creditLimit) {
        return {
          creditLimit: 0,
          availableCredit: 0,
          assessed: false,
        };
      }

      return {
        creditLimit: userProfile.creditLimit,
        availableCredit: userProfile.availableCredit,
        lastAssessment: userProfile.lastCreditAssessment,
        assessed: true,
      };
    } catch (error) {
      this.logger.error(`Error getting credit limit: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve credit limit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reassess')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reassess credit limit based on payment history' })
  @ApiResponse({ status: 200, description: 'Credit limit reassessed successfully' })
  async reassessCreditLimit(@Request() req: {
    user: {
      id: string;
      email: string;
      phoneNumber: string;
      profile: any;
    }
  }) {
    try {
      const userId = req.user.id;
      this.logger.log(`Reassessing credit limit for user ${userId}`);

      // Get current credit limit
      const userProfile = await req.user.profile;

      if (!userProfile || !userProfile.creditLimit) {
        throw new HttpException(
          'No existing credit assessment found',
          HttpStatus.BAD_REQUEST,
        );
      }

      const oldLimit = userProfile.creditLimit;

      // Reassess credit limit
      const newLimit = await this.creditAssessmentService.reassessCreditLimit(userId);

      // Send notification if credit limit changed
      if (newLimit !== oldLimit) {
        await this.notificationsService.sendNotification({
          type: NotificationType.CREDIT_LIMIT_UPDATED,
          userId: userId,
          message: `Your credit limit has been updated from ${oldLimit} to ${newLimit} ETB.`,
          email: req.user.email,
          phoneNumber: req.user.phoneNumber,
          data: {
            oldLimit,
            newLimit,
          },
        });
      }

      return {
        success: true,
        creditLimit: newLimit,
        previousLimit: oldLimit,
        change: newLimit - oldLimit,
      };
    } catch (error) {
      this.logger.error(`Error reassessing credit limit: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to reassess credit limit',
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
