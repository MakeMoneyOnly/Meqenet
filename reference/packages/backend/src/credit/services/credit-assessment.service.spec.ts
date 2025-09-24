import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CreditAssessmentService } from './credit-assessment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import {
  EmploymentStatus,
  IncomeFrequency,
} from '../dto/credit-assessment.dto';
import { NotFoundException } from '@nestjs/common';

describe('CreditAssessmentService', () => {
  let service: CreditAssessmentService;
  let _prismaService: PrismaService;
  let _notificationsService: NotificationsService;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    phoneNumber: '+251911234567',
    userProfile: {
      creditLimit: 5000,
      preferredLanguage: 'en',
      kycStatus: 'VERIFIED',
      address: {
        region: 'Addis Ababa',
      },
    },
    account: {
      id: 'account-123',
      creditLimit: 5000,
      availableCredit: 5000,
      totalOutstanding: 0,
    },
  };

  const mockCreditAssessmentDto = {
    monthlyIncome: 10000,
    monthlyExpenses: 3000,
    employmentStatus: EmploymentStatus.FULL_TIME,
    incomeFrequency: IncomeFrequency.MONTHLY,
    existingLoanPayments: 1000,
    housingStatus: 'OWNED',
    yearsAtCurrentEmployer: 3,
    additionalIncomeSources: [
      {
        source: 'Freelancing',
        amount: 2000,
        frequency: IncomeFrequency.MONTHLY,
      },
    ],
  };

  // Create mocks
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    account: {
      create: jest.fn(),
      update: jest.fn(),
    },
    creditLimitHistory: {
      create: jest.fn(),
    },
    creditAssessment: {
      create: jest.fn(),
    },
    paymentPlan: {
      findMany: jest.fn(),
    },
  };

  const mockNotificationsService = {
    sendNotification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      const config: Record<string, any> = {
        CREDIT_BASE_MULTIPLIER: 2,
        CREDIT_MAX_LIMIT: 50000,
        CREDIT_MIN_LIMIT: 1000,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditAssessmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<CreditAssessmentService>(CreditAssessmentService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _notificationsService =
      module.get<NotificationsService>(NotificationsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assessCreditLimit', () => {
    it('should assess credit limit for a new user', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.account.update.mockResolvedValue({
        ...mockUser.account,
        creditLimit: 12000,
        availableCredit: 12000,
      });
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.creditLimitHistory.create.mockResolvedValue({
        id: 'history-123',
        userId: mockUser.id,
        previousLimit: 5000,
        newLimit: 12000,
      });
      mockPrismaService.creditAssessment.create.mockResolvedValue({
        id: 'assessment-123',
        userId: mockUser.id,
        score: 75,
      });

      // Call the service method
      const result = await service.assessCreditLimit(
        mockUser.id,
        mockCreditAssessmentDto
      );

      // Assertions
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: {
          userProfile: true,
          account: true,
        },
      });

      // Verify credit limit is calculated correctly
      // The exact value will depend on the implementation details
      expect(result).toBeGreaterThan(mockUser.account.creditLimit);
      expect(result % 100).toBe(0); // Should be rounded to nearest 100

      // Verify notifications are sent
      expect(mockNotificationsService.sendNotification).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Assertions
      await expect(
        service.assessCreditLimit('non-existent-user', mockCreditAssessmentDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reassessCreditLimit', () => {
    it('should reassess credit limit based on payment history', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.paymentPlan.findMany.mockResolvedValue([
        {
          id: 'plan-123',
          userId: mockUser.id,
          transactions: [
            {
              status: 'COMPLETED',
              dueDate: new Date(Date.now() - 86400000), // Yesterday
              completedAt: new Date(), // Today
            },
            {
              status: 'COMPLETED',
              dueDate: new Date(Date.now() - 172800000), // 2 days ago
              completedAt: new Date(Date.now() - 172800000 + 3600000), // 1 hour after due date
            },
          ],
        },
      ]);
      mockPrismaService.account.update.mockResolvedValue({
        ...mockUser.account,
        creditLimit: 5500,
        availableCredit: 5500,
      });
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.creditLimitHistory.create.mockResolvedValue({
        id: 'history-124',
        userId: mockUser.id,
        previousLimit: 5000,
        newLimit: 5500,
      });

      // Call the service method
      const result = await service.reassessCreditLimit(mockUser.id);

      // Assertions
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: {
          userProfile: true,
          account: true,
        },
      });

      expect(mockPrismaService.paymentPlan.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          transactions: true,
        },
      });

      // Verify credit limit is adjusted based on payment history
      expect(result).not.toEqual(mockUser.account.creditLimit);
      expect(result % 100).toBe(0); // Should be rounded to nearest 100
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Setup mocks
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Assertions
      await expect(
        service.reassessCreditLimit('non-existent-user')
      ).rejects.toThrow(NotFoundException);
    });
  });

  // Test private methods through public methods
  describe('credit assessment calculations', () => {
    it('should apply employment adjustments correctly', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.account.update.mockResolvedValue({
        ...mockUser.account,
        creditLimit: 12000,
        availableCredit: 12000,
      });
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.creditLimitHistory.create.mockResolvedValue({});
      mockPrismaService.creditAssessment.create.mockResolvedValue({});

      // Test full-time employment (should get highest multiplier)
      const fullTimeResult = await service.assessCreditLimit(mockUser.id, {
        ...mockCreditAssessmentDto,
        employmentStatus: EmploymentStatus.FULL_TIME,
      });

      // Test unemployed (should get lowest multiplier)
      const unemployedResult = await service.assessCreditLimit(mockUser.id, {
        ...mockCreditAssessmentDto,
        employmentStatus: EmploymentStatus.UNEMPLOYED,
      });

      // Assertions
      expect(fullTimeResult).toBeGreaterThan(unemployedResult);
    });

    it('should apply income frequency adjustments correctly', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.account.update.mockResolvedValue({
        ...mockUser.account,
        creditLimit: 12000,
        availableCredit: 12000,
      });
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.creditLimitHistory.create.mockResolvedValue({});
      mockPrismaService.creditAssessment.create.mockResolvedValue({});

      // Test monthly income (should get highest multiplier)
      const monthlyResult = await service.assessCreditLimit(mockUser.id, {
        ...mockCreditAssessmentDto,
        incomeFrequency: IncomeFrequency.MONTHLY,
      });

      // Test irregular income (should get lowest multiplier)
      const irregularResult = await service.assessCreditLimit(mockUser.id, {
        ...mockCreditAssessmentDto,
        incomeFrequency: IncomeFrequency.IRREGULAR,
      });

      // Assertions
      expect(monthlyResult).toBeGreaterThan(irregularResult);
    });
  });
});
