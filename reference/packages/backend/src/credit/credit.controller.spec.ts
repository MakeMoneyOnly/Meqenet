import { Test, TestingModule } from '@nestjs/testing';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { CreditAssessmentService } from './services/credit-assessment.service';
import { UpdateCreditLimitDto } from './dto/update-credit-limit.dto';
import {
  CreditAssessmentDto,
  EmploymentStatus,
  IncomeFrequency,
} from './dto/credit-assessment.dto';
import { Logger } from '@nestjs/common';

describe('CreditController', () => {
  let controller: CreditController;
  let _creditService: CreditService;
  let _creditAssessmentService: CreditAssessmentService;

  // Mock data
  const mockUserId = 'user-123';
  const mockCreditLimit = 10000;
  const mockCreditLimitHistory = [
    {
      id: 'history-1',
      userId: mockUserId,
      previousLimit: 5000,
      newLimit: 10000,
      reason: 'Initial assessment',
      createdAt: new Date(),
    },
  ];

  const mockCreditAssessmentDto: CreditAssessmentDto = {
    monthlyIncome: 15000,
    monthlyExpenses: 5000,
    employmentStatus: EmploymentStatus.FULL_TIME,
    incomeFrequency: IncomeFrequency.MONTHLY,
    existingLoanPayments: 2000,
    housingStatus: 'OWNED',
    yearsAtCurrentEmployer: 3,
  };

  const mockUpdateCreditLimitDto: UpdateCreditLimitDto = {
    userId: mockUserId,
    newLimit: 15000,
    reason: 'Manual adjustment',
  };

  // Create mocks
  const mockCreditService = {
    getCreditLimit: jest.fn(),
    getCreditLimitHistory: jest.fn(),
    updateCreditLimit: jest.fn(),
    assessCreditLimit: jest.fn(),
    getCreditAssessmentFactors: jest.fn(),
  };

  const mockCreditAssessmentService = {
    assessCreditLimit: jest.fn(),
    reassessCreditLimit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditController],
      providers: [
        {
          provide: CreditService,
          useValue: mockCreditService,
        },
        {
          provide: CreditAssessmentService,
          useValue: mockCreditAssessmentService,
        },
        Logger,
      ],
    }).compile();

    controller = module.get<CreditController>(CreditController);
    _creditService = module.get<CreditService>(CreditService);
    _creditAssessmentService = module.get<CreditAssessmentService>(
      CreditAssessmentService
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCreditLimit', () => {
    it('should return user credit limit', async () => {
      // Setup mocks
      mockCreditService.getCreditLimit.mockResolvedValue({
        creditLimit: mockCreditLimit,
        availableCredit: 8000,
        usedCredit: 2000,
      });

      // Call the controller method
      const result = await controller.getCreditLimit(mockUserId);

      // Assertions
      expect(mockCreditService.getCreditLimit).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        creditLimit: mockCreditLimit,
        availableCredit: 8000,
        usedCredit: 2000,
      });
    });
  });

  describe('getCreditLimitHistory', () => {
    it('should return user credit limit history', async () => {
      // Setup mocks
      mockCreditService.getCreditLimitHistory.mockResolvedValue(
        mockCreditLimitHistory
      );

      // Call the controller method
      const result = await controller.getCreditLimitHistory(mockUserId);

      // Assertions
      expect(mockCreditService.getCreditLimitHistory).toHaveBeenCalledWith(
        mockUserId
      );
      expect(result).toEqual(mockCreditLimitHistory);
    });
  });

  describe('updateCreditLimit', () => {
    it('should update user credit limit', async () => {
      // Setup mocks
      mockCreditService.updateCreditLimit.mockResolvedValue({
        id: mockUserId,
        creditLimit: mockUpdateCreditLimitDto.newLimit,
        previousLimit: mockCreditLimit,
      });

      // Call the controller method
      const result = await controller.updateCreditLimit(
        mockUpdateCreditLimitDto
      );

      // Assertions
      expect(mockCreditService.updateCreditLimit).toHaveBeenCalledWith(
        mockUpdateCreditLimitDto.userId,
        mockUpdateCreditLimitDto.newLimit,
        mockUpdateCreditLimitDto.reason
      );
      expect(result).toEqual({
        id: mockUserId,
        creditLimit: mockUpdateCreditLimitDto.newLimit,
        previousLimit: mockCreditLimit,
      });
    });
  });

  describe('getCreditAssessment', () => {
    it('should return credit assessment', async () => {
      // Setup mocks
      mockCreditService.assessCreditLimit.mockResolvedValue(12000);

      // Call the controller method
      const result = await controller.getCreditAssessment(mockUserId);

      // Assertions
      expect(mockCreditService.assessCreditLimit).toHaveBeenCalledWith(
        mockUserId
      );
      expect(result).toEqual({ suggestedLimit: 12000 });
    });
  });

  describe('submitCreditAssessment', () => {
    it('should submit credit assessment data and return credit limit', async () => {
      // Setup mocks
      mockCreditAssessmentService.assessCreditLimit.mockResolvedValue(15000);

      // Call the controller method
      const result = await controller.submitCreditAssessment(
        mockUserId,
        mockCreditAssessmentDto
      );

      // Assertions
      expect(
        mockCreditAssessmentService.assessCreditLimit
      ).toHaveBeenCalledWith(mockUserId, mockCreditAssessmentDto);
      expect(result).toEqual({
        success: true,
        creditLimit: 15000,
        message: 'Your credit limit has been set to 15000 ETB',
      });
    });
  });

  describe('reassessCreditLimit', () => {
    it('should reassess credit limit based on payment history', async () => {
      // Setup mocks
      mockCreditAssessmentService.reassessCreditLimit.mockResolvedValue(12000);

      // Call the controller method
      const result = await controller.reassessCreditLimit(mockUserId);

      // Assertions
      expect(
        mockCreditAssessmentService.reassessCreditLimit
      ).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        success: true,
        userId: mockUserId,
        newLimit: 12000,
        message:
          'Credit limit reassessed to 12000 ETB based on payment history',
      });
    });
  });

  describe('getCreditAssessmentFactors', () => {
    it('should return credit assessment factors', async () => {
      // Setup mocks
      const factors = {
        income: 'Monthly income',
        expenses: 'Monthly expenses',
        employment: 'Employment status',
        paymentHistory: 'Payment history',
      };
      mockCreditService.getCreditAssessmentFactors.mockResolvedValue(factors);

      // Call the controller method
      const result = await controller.getCreditAssessmentFactors();

      // Assertions
      expect(mockCreditService.getCreditAssessmentFactors).toHaveBeenCalled();
      expect(result).toEqual(factors);
    });
  });
});
