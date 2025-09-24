import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  Logger,
} from '@nestjs/common';
import { Express } from 'express';

// Define the missing Multer interface
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { KycService } from '../services/kyc.service';
import { SubmitKycDto, UpdateKycStatusDto } from '../dto/submit-kyc.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';

@ApiTags('kyc')
@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(private readonly kycService: KycService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit KYC documents for verification' })
  @ApiResponse({ status: 201, description: 'KYC documents submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          enum: ['FAYDA_ID', 'PASSPORT', 'RESIDENCE_PERMIT'],
          description: 'Type of document being submitted',
        },
        documentNumber: {
          type: 'string',
          description: 'Document number (ID number, passport number, etc.)',
        },
        documentFront: {
          type: 'string',
          format: 'binary',
          description: 'Front side of the document',
        },
        documentBack: {
          type: 'string',
          format: 'binary',
          description: 'Back side of the document (required for Fayda ID)',
        },
        selfie: {
          type: 'string',
          format: 'binary',
          description: 'Selfie of the user holding the document',
        },
        additionalInfo: {
          type: 'object',
          description: 'Additional information for KYC verification',
        },
      },
      required: ['documentType', 'documentNumber', 'documentFront', 'selfie'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'documentFront', maxCount: 1 },
      { name: 'documentBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  async submitKyc(
    @GetUser('id') userId: string,
    @UploadedFiles() files: {
      documentFront?: Express.Multer.File[];
      documentBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
    @Body() submitKycDto: SubmitKycDto,
    @Request() req: { ip: string, headers: { [key: string]: string } },
  ) {
    this.logger.log(`Submitting KYC for user ${userId}`);

    // Add IP address and device info
    submitKycDto.ipAddress = req.ip;
    submitKycDto.deviceInfo = req.headers['user-agent'];

    return this.kycService.submitKyc(userId, files, submitKycDto);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get KYC verification status' })
  @ApiResponse({ status: 200, description: 'KYC status retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getKycStatus(@GetUser('id') userId: string) {
    this.logger.log(`Getting KYC status for user ${userId}`);
    return this.kycService.getKycStatus(userId);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update KYC verification status (admin only)' })
  @ApiResponse({ status: 200, description: 'KYC status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'KYC verification not found' })
  async updateKycStatus(
    @Param('id') id: string,
    @Body() updateKycStatusDto: UpdateKycStatusDto,
  ) {
    this.logger.log(`Updating KYC status for ${id} to ${updateKycStatusDto.status}`);
    return this.kycService.updateKycStatus(
      id,
      updateKycStatusDto.status as any,
      updateKycStatusDto.reason,
    );
  }
}
