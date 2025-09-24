import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { DocumentValidationService } from './document-validation.service';
import { FaceMatchingService } from './face-matching.service';
import { KycStatus, KycDocumentType } from '../enums/kyc.enum';
import { SubmitKycDto } from '../dto/submit-kyc.dto';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly documentValidationService: DocumentValidationService,
    private readonly faceMatchingService: FaceMatchingService,
  ) {
    // Create uploads directory if it doesn't exist
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads/kyc');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Submit KYC documents for verification
   * @param userId User ID
   * @param files Uploaded files
   * @param data KYC submission data
   * @returns KYC submission result
   */
  async submitKyc(
    userId: string,
    files: {
      documentFront?: Express.Multer.File[];
      documentBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
    data: SubmitKycDto,
  ): Promise<any> {
    try {
      this.logger.log(`Submitting KYC for user ${userId}`);

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userProfile: true },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Check if user already has KYC verification in progress
      const existingKyc = await this.prisma.kycVerification.findFirst({
        where: {
          userId,
          status: {
            in: [KycStatus.PENDING, KycStatus.APPROVED],
          },
        },
      });

      if (existingKyc && existingKyc.status === KycStatus.APPROVED) {
        return {
          success: true,
          message: 'KYC already approved',
          status: existingKyc.status,
        };
      }

      if (existingKyc && existingKyc.status === KycStatus.PENDING) {
        return {
          success: true,
          message: 'KYC verification in progress',
          status: existingKyc.status,
        };
      }

      // Validate required files
      if (!files.documentFront || files.documentFront.length === 0) {
        throw new BadRequestException('Document front image is required');
      }

      if (data.documentType === KycDocumentType.FAYDA_ID && (!files.documentBack || files.documentBack.length === 0)) {
        throw new BadRequestException('Document back image is required for Fayda ID');
      }

      if (!files.selfie || files.selfie.length === 0) {
        throw new BadRequestException('Selfie image is required');
      }

      // Save files to disk
      const documentFrontPath = await this.saveFile(files.documentFront[0], userId, 'document_front');
      const documentBackPath = data.documentType === KycDocumentType.FAYDA_ID && files.documentBack && files.documentBack.length > 0
        ? await this.saveFile(files.documentBack[0], userId, 'document_back')
        : null;
      const selfiePath = await this.saveFile(files.selfie[0], userId, 'selfie');

      // Perform automated document validation
      const documentValidationResult = await this.documentValidationService.validateDocument(
        documentFrontPath,
        data.documentType,
        data.documentNumber,
      );

      // Perform face matching
      const faceMatchingResult = await this.faceMatchingService.matchFaces(
        selfiePath,
        documentFrontPath,
      );

      // Perform liveness detection
      const livenessResult = await this.faceMatchingService.detectLiveness(
        selfiePath,
      );

      // Create KYC verification record
      const kycVerification = await this.prisma.kycVerification.create({
        data: {
          userId,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          documentFrontPath,
          documentBackPath,
          selfiePath,
          status: KycStatus.PENDING,
          metadata: JSON.stringify({
            submittedAt: new Date().toISOString(),
            ipAddress: data.ipAddress,
            deviceInfo: data.deviceInfo,
            additionalInfo: data.additionalInfo,
            automatedChecks: {
              documentValidation: documentValidationResult,
              faceMatching: faceMatchingResult,
              liveness: livenessResult,
              performedAt: new Date().toISOString(),
            },
          }),
        },
      });

      // Send notification to user
      await this.notificationsService.sendNotification({
        userId,
        type: 'KYC_SUBMITTED',
        message: 'Your identity verification documents have been submitted for review.',
        data: {
          kycId: kycVerification.id,
          status: kycVerification.status,
        },
      });

      // If any automated checks failed severely, notify admins for priority review
      if (
        !documentValidationResult.isValid ||
        !faceMatchingResult.isMatch ||
        !livenessResult.isLive
      ) {
        // Get admin users
        const admins = await this.prisma.user.findMany({
          where: {
            role: {
              in: ['ADMIN', 'COMPLIANCE_OFFICER'],
            },
          },
        });

        // Send notification to each admin
        for (const admin of admins) {
          await this.notificationsService.sendNotification({
            userId: admin.id,
            type: 'KYC_REVIEW_NEEDED',
            message: `KYC verification for user ${user.email || user.phoneNumber} requires review. Automated checks failed.`,
            data: {
              kycId: kycVerification.id,
              userId: user.id,
              userEmail: user.email,
              userPhone: user.phoneNumber,
              automatedChecks: {
                documentValidation: documentValidationResult.isValid,
                faceMatching: faceMatchingResult.isMatch,
                liveness: livenessResult.isLive,
              },
            },
          });
        }
      }

      return {
        success: true,
        message: 'KYC documents submitted successfully',
        status: KycStatus.PENDING,
        kycId: kycVerification.id,
      };
    } catch (error) {
      this.logger.error(`Error submitting KYC: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get KYC verification status
   * @param userId User ID
   * @returns KYC verification status
   */
  async getKycStatus(userId: string): Promise<any> {
    try {
      this.logger.log(`Getting KYC status for user ${userId}`);

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Get latest KYC verification
      const kycVerification = await this.prisma.kycVerification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!kycVerification) {
        return {
          success: true,
          status: KycStatus.NOT_SUBMITTED,
          message: 'KYC not submitted',
        };
      }

      return {
        success: true,
        status: kycVerification.status,
        message: this.getStatusMessage(kycVerification.status as KycStatus),
        documentType: kycVerification.documentType,
        submittedAt: kycVerification.createdAt,
        updatedAt: kycVerification.updatedAt,
        verifiedAt: kycVerification.verifiedAt,
        rejectionReason: kycVerification.rejectionReason,
      };
    } catch (error) {
      this.logger.error(`Error getting KYC status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update KYC verification status (admin only)
   * @param kycId KYC verification ID
   * @param status New status
   * @param reason Rejection reason (if rejected)
   * @returns Updated KYC verification
   */
  async updateKycStatus(
    kycId: string,
    status: KycStatus,
    reason?: string,
  ): Promise<any> {
    try {
      this.logger.log(`Updating KYC status for ${kycId} to ${status}`);

      // Check if KYC verification exists
      const kycVerification = await this.prisma.kycVerification.findUnique({
        where: { id: kycId },
        include: { user: true },
      });

      if (!kycVerification) {
        throw new NotFoundException(`KYC verification ${kycId} not found`);
      }

      // Update KYC verification status
      const updatedKyc = await this.prisma.kycVerification.update({
        where: { id: kycId },
        data: {
          status,
          rejectionReason: status === KycStatus.REJECTED ? reason : null,
          verifiedAt: status === KycStatus.APPROVED ? new Date() : null,
        },
      });

      // Send notification to user
      await this.notificationsService.sendNotification({
        userId: kycVerification.userId,
        type: 'KYC_STATUS_UPDATED',
        message: `Your identity verification status has been updated to ${status}.`,
        data: {
          kycId: updatedKyc.id,
          status: updatedKyc.status,
          rejectionReason: updatedKyc.rejectionReason,
        },
      });

      return {
        success: true,
        message: `KYC status updated to ${status}`,
        status: updatedKyc.status,
      };
    } catch (error) {
      this.logger.error(`Error updating KYC status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Save file to disk
   * @param file File to save
   * @param userId User ID
   * @param fileType File type
   * @returns File path
   */
  private async saveFile(
    file: Express.Multer.File,
    userId: string,
    fileType: string,
  ): Promise<string> {
    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}_${fileType}_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    return filePath;
  }

  /**
   * Get status message based on status code
   * @param status KYC status
   * @returns Status message
   */
  private getStatusMessage(status: KycStatus): string {
    switch (status) {
      case KycStatus.NOT_SUBMITTED:
        return 'KYC not submitted';
      case KycStatus.PENDING:
        return 'KYC verification in progress';
      case KycStatus.APPROVED:
        return 'KYC verification approved';
      case KycStatus.REJECTED:
        return 'KYC verification rejected';
      default:
        return 'Unknown status';
    }
  }
}
