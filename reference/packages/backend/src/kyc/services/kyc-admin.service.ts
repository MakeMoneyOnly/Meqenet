import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { KycStatus } from '../enums/kyc.enum';

@Injectable()
export class KycAdminService {
  private readonly logger = new Logger(KycAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get all KYC verifications with pagination and filtering
   * @param options Pagination and filtering options
   * @returns KYC verifications
   */
  async getAllKycVerifications(options: {
    status?: KycStatus;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    try {
      const {
        status,
        limit = 10,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      // Build where clause
      const where = status ? { status } : {};

      // Get KYC verifications
      const [kycVerifications, total] = await Promise.all([
        this.prisma.kycVerification.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phoneNumber: true,
                userProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          take: limit,
          skip: offset,
        }),
        this.prisma.kycVerification.count({ where }),
      ]);

      return {
        kycVerifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting KYC verifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get KYC verification details
   * @param kycId KYC verification ID
   * @returns KYC verification details
   */
  async getKycVerificationDetails(kycId: string): Promise<any> {
    try {
      // Get KYC verification
      const kycVerification = await this.prisma.kycVerification.findUnique({
        where: { id: kycId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              createdAt: true,
              userProfile: true,
            },
          },
        },
      });

      if (!kycVerification) {
        throw new NotFoundException(`KYC verification ${kycId} not found`);
      }

      return kycVerification;
    } catch (error) {
      this.logger.error(`Error getting KYC verification details: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Assign KYC verification to admin for review
   * @param kycId KYC verification ID
   * @param adminId Admin user ID
   * @returns Updated KYC verification
   */
  async assignKycVerification(kycId: string, adminId: string): Promise<any> {
    try {
      // Check if KYC verification exists
      const kycVerification = await this.prisma.kycVerification.findUnique({
        where: { id: kycId },
      });

      if (!kycVerification) {
        throw new NotFoundException(`KYC verification ${kycId} not found`);
      }

      // Update KYC verification with assigned admin
      const updatedKyc = await this.prisma.kycVerification.update({
        where: { id: kycId },
        data: {
          metadata: JSON.stringify({
            ...(typeof kycVerification.metadata === 'string'
              ? JSON.parse(kycVerification.metadata)
              : kycVerification.metadata || {}),
            assignedTo: adminId,
            assignedAt: new Date().toISOString(),
          }),
        },
      });

      return {
        success: true,
        message: 'KYC verification assigned successfully',
        kycId: updatedKyc.id,
        assignedTo: adminId,
      };
    } catch (error) {
      this.logger.error(`Error assigning KYC verification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get KYC verification statistics
   * @returns KYC verification statistics
   */
  async getKycStatistics(): Promise<any> {
    try {
      // Get counts for each status
      const [pending, approved, rejected, total] = await Promise.all([
        this.prisma.kycVerification.count({
          where: { status: KycStatus.PENDING },
        }),
        this.prisma.kycVerification.count({
          where: { status: KycStatus.APPROVED },
        }),
        this.prisma.kycVerification.count({
          where: { status: KycStatus.REJECTED },
        }),
        this.prisma.kycVerification.count(),
      ]);

      // Get average processing time (in hours)
      const recentCompletedKyc = await this.prisma.kycVerification.findMany({
        where: {
          status: {
            in: [KycStatus.APPROVED, KycStatus.REJECTED],
          },
          verifiedAt: {
            not: null,
          },
        },
        orderBy: {
          verifiedAt: 'desc',
        },
        take: 100,
      });

      let avgProcessingTime = 0;
      if (recentCompletedKyc.length > 0) {
        const processingTimes = recentCompletedKyc.map(kyc => {
          const createdAt = new Date(kyc.createdAt).getTime();
          const verifiedAt = kyc.verifiedAt ? new Date(kyc.verifiedAt).getTime() : Date.now();
          return (verifiedAt - createdAt) / (1000 * 60 * 60); // Convert to hours
        });
        avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      }

      return {
        total,
        pending,
        approved,
        rejected,
        approvalRate: total > 0 ? (approved / total) * 100 : 0,
        rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
        avgProcessingTime,
      };
    } catch (error) {
      this.logger.error(`Error getting KYC statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
}
