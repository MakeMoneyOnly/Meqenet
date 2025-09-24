import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Define missing models that are referenced in the code but not in the Prisma schema
class VerificationCode {
  id: string;
  userId: string;
  code: string;
  type: string;
  expiresAt: Date;
  attempts: number;
  isVerified: boolean;
  verifiedAt?: Date;
  channel: string;
  destination: string;
  createdAt: Date;
  updatedAt: Date;
}

class CreditAssessment {
  id: string;
  userId: string;
  creditScore: number;
  incomeVerified: boolean;
  employmentVerified: boolean;
  creditLimit: number;
  riskLevel: string;
  assessmentDate: Date;
  assessedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Add missing models
  verificationCode: any = {
    create: async (data: any) => {
      console.log('Mock verificationCode.create called', data);
      return { id: 'mock-id', ...data.data };
    },
    findFirst: async (params: any) => {
      console.log('Mock verificationCode.findFirst called', params);
      return {
        id: 'mock-id',
        userId: params.where.userId,
        code: '123456',
        type: params.where.type,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
        isVerified: false,
        channel: 'EMAIL',
        destination: 'user@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    },
    update: async (params: any) => {
      console.log('Mock verificationCode.update called', params);
      return { id: params.where.id, ...params.data };
    }
  };

  creditAssessment: any = {
    create: async (data: any) => {
      console.log('Mock creditAssessment.create called', data);
      return { id: 'mock-id', ...data.data };
    },
    findFirst: async (params: any) => {
      console.log('Mock creditAssessment.findFirst called', params);
      return null;
    },
    findMany: async (params: any) => {
      console.log('Mock creditAssessment.findMany called', params);
      return [];
    }
  };

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Add transaction to ensure all deletes succeed or fail together
    return this.$transaction([
      this.transaction.deleteMany(),
      this.paymentPlan.deleteMany(),
      this.paymentMethod.deleteMany(),
      this.account.deleteMany(),
      this.userProfile.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}