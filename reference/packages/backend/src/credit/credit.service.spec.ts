import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CreditService } from './credit.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CreditService', () => {
  let service: CreditService;
  let prismaService: PrismaService;
  let notificationsService: NotificationsService;

  const mockPrismaService: Record<string, any> = {
    user: {
      findUnique: jest.fn(),
    },
    account: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    creditLimitHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    paymentPlan: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (prisma: any) => any) => callback(mockPrismaService)),
  };

  const mockNotificationsService = {
    sendNotification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      const config: Record<string, any> = {
        CREDIT_MIN_LIMIT: 1000,
        CREDIT_MAX_LIMIT: 50000,
        CREDIT_BASE_MULTIPLIER: 2,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CreditService>(CreditService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateCreditLimit', () => {
    it('should update credit limit and create history record', async () => {
      const userId = 'user-123';
      const newLimit = 5000;
      const reason = 'Positive payment history';

      const mockUser = {
        id: userId,
        email: 'user@example.com',
        phoneNumber: '+251911234567',
        account: {
          id: 'account-123',
          creditLimit: 3000,
          availableCredit: 2000,
        },
        userProfile: {
          firstName: 'Test',
          lastName: 'User',
          preferredLanguage: 'en',
        },
      };

      const mockUpdatedAccount = {
        id: 'account-123',
        creditLimit: newLimit,
        availableCredit: 4000,
      };

      const mockHistoryRecord = {
        id: 'history-123',
        accountId: 'account-123',
        previousLimit: 3000,
        newLimit: 5000,
        reason,
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.account.update.mockResolvedValue(mockUpdatedAccount);
      mockPrismaService.creditLimitHistory.create.mockResolvedValue(mockHistoryRecord);

      const result = await service.updateCreditLimit(userId, newLimit, reason);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { account: true, userProfile: true },
      });

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: mockUser.account.id },
        data: {
          creditLimit: newLimit,
          availableCredit: expect.any(Number),
        },
      });

      expect(mockPrismaService.creditLimitHistory.create).toHaveBeenCalledWith({
        data: {
          accountId: mockUser.account.id,
          previousLimit: mockUser.account.creditLimit,
          newLimit,
          reason
        },
      });

      expect(mockNotificationsService.sendNotification).toHaveBeenCalled();

      expect(result).toEqual(mockUpdatedAccount);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateCreditLimit('non-existent-user', 5000, 'test')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if new limit is below minimum', async () => {
      const mockUser = {
        id: 'user-123',
        account: { id: 'account-123', creditLimit: 3000 },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.updateCreditLimit('user-123', 500, 'test')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new limit is above maximum', async () => {
      const mockUser = {
        id: 'user-123',
        account: { id: 'account-123', creditLimit: 3000 },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.updateCreditLimit('user-123', 60000, 'test')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCreditLimit', () => {
    it('should return user credit limit information', async () => {
      const userId = 'user-123';
      const mockAccount = {
        id: 'account-123',
        creditLimit: 5000,
        availableCredit: 3000,
        totalOutstanding: 2000,
      };

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.getCreditLimit(userId);

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.getCreditLimit('non-existent-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCreditLimitHistory', () => {
    it('should return credit limit history for a user', async () => {
      const userId = 'user-123';
      const mockAccount = { id: 'account-123' };
      const mockHistory = [
        {
          id: 'history-1',
          previousLimit: 1000,
          newLimit: 2000,
          reason: 'Initial increase',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'history-2',
          previousLimit: 2000,
          newLimit: 5000,
          reason: 'Good payment history',
          createdAt: new Date('2023-02-01'),
        },
      ];

      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.creditLimitHistory.findMany.mockResolvedValue(mockHistory);

      const result = await service.getCreditLimitHistory(userId);

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(mockPrismaService.creditLimitHistory.findMany).toHaveBeenCalledWith({
        where: { accountId: mockAccount.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockHistory);
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.getCreditLimitHistory('non-existent-user')).rejects.toThrow(NotFoundException);
    });
  });
});

