import { Test, TestingModule } from '@nestjs/testing';
import { MerchantCheckoutService } from './merchant-checkout.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentPlansService } from '../../payment-plans/services/payment-plans.service';
import { PaymentGatewaysService } from '../../payment-gateways/services/payment-gateways.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MerchantStatus } from '@prisma/client';

describe('MerchantCheckoutService', () => {
  let service: MerchantCheckoutService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    merchant: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    account: {
      update: jest.fn(),
    },
    paymentPlan: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    installment: {
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  };

  const mockPaymentPlansService = {
    create: jest.fn(),
  };

  const mockPaymentGatewaysService = {
    initiatePayment: jest.fn(),
  };

  const mockNotificationsService = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantCheckoutService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentPlansService,
          useValue: mockPaymentPlansService,
        },
        {
          provide: PaymentGatewaysService,
          useValue: mockPaymentGatewaysService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<MerchantCheckoutService>(MerchantCheckoutService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateCheckout', () => {
    const merchantId = 'merchant-id';
    const userId = 'user-id';
    const checkoutDto = {
      merchantOrderId: 'ORDER123',
      amount: 6000,
      currency: 'ETB',
      numberOfInstallments: 3,
      description: 'Test purchase',
      items: [
        {
          sku: 'SKU123',
          name: 'Test Product',
          quantity: 1,
          unitPriceEtb: 6000,
        },
      ],
    };

    const merchant = {
      id: merchantId,
      name: 'Test Merchant',
      status: MerchantStatus.ACTIVE,
    };

    const user = {
      id: userId,
      email: 'user@example.com',
      phoneNumber: '+251912345678',
      userProfile: {
        firstName: 'Test',
        lastName: 'User',
        preferredLanguage: 'en',
      },
      account: {
        id: 'account-id',
        creditLimit: 10000,
        availableCredit: 8000,
        totalOutstanding: 2000,
      },
    };

    const paymentPlan = {
      id: 'payment-plan-id',
      reference: 'FLEX-12345678-1234567890',
      totalAmount: 6000,
      currency: 'ETB',
      numberOfInstallments: 3,
      installmentAmount: 2000,
      startDate: new Date(),
      endDate: new Date(),
      status: 'ACTIVE',
    };

    const installment = {
      id: 'installment-id',
      paymentPlanId: paymentPlan.id,
      amount: 2000,
      dueDate: new Date(),
      status: 'UPCOMING',
      installmentNumber: 1,
    };

    const transaction = {
      id: 'transaction-id',
      reference: `TXN-${paymentPlan.reference}`,
      type: 'PAYMENT',
      amount: 6000,
      status: 'COMPLETED',
    };

    it('should initiate checkout successfully', async () => {
      // Mock responses
      mockPrismaService.merchant.findUnique.mockResolvedValue(merchant);
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.paymentPlan.create.mockResolvedValue(paymentPlan);
      mockPrismaService.installment.create.mockResolvedValue(installment);
      mockPrismaService.account.update.mockResolvedValue({
        ...user.account,
        availableCredit: user.account.availableCredit - checkoutDto.amount,
        totalOutstanding: user.account.totalOutstanding + checkoutDto.amount,
      });
      mockPrismaService.transaction.create.mockResolvedValue(transaction);
      mockNotificationsService.sendNotification.mockResolvedValue(undefined);

      const result = await service.initiateCheckout(merchantId, userId, checkoutDto);

      // Verify merchant was checked
      expect(mockPrismaService.merchant.findUnique).toHaveBeenCalledWith({
        where: { id: merchantId },
      });

      // Verify user and account were checked
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: {
          userProfile: true,
          account: true,
        },
      });

      // Verify payment plan was created
      expect(mockPrismaService.paymentPlan.create).toHaveBeenCalled();

      // Verify installments were created
      expect(mockPrismaService.installment.create).toHaveBeenCalled();

      // Verify account was updated
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: user.account.id },
        data: {
          availableCredit: {
            decrement: checkoutDto.amount,
          },
          totalOutstanding: {
            increment: checkoutDto.amount,
          },
        },
      });

      // Verify transaction was created
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();

      // Verify notification was sent
      expect(mockNotificationsService.sendNotification).toHaveBeenCalled();

      // Verify result
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('paymentPlanId', paymentPlan.id);
      expect(result).toHaveProperty('reference', paymentPlan.reference);
      expect(result).toHaveProperty('amount', checkoutDto.amount);
    });

    it('should throw NotFoundException if merchant not found', async () => {
      mockPrismaService.merchant.findUnique.mockResolvedValue(null);

      await expect(service.initiateCheckout(merchantId, userId, checkoutDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if merchant is not active', async () => {
      mockPrismaService.merchant.findUnique.mockResolvedValue({
        ...merchant,
        status: MerchantStatus.PENDING,
      });

      await expect(service.initiateCheckout(merchantId, userId, checkoutDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.merchant.findUnique.mockResolvedValue(merchant);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.initiateCheckout(merchantId, userId, checkoutDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user has no account', async () => {
      mockPrismaService.merchant.findUnique.mockResolvedValue(merchant);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...user,
        account: null,
      });

      await expect(service.initiateCheckout(merchantId, userId, checkoutDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user has insufficient credit', async () => {
      mockPrismaService.merchant.findUnique.mockResolvedValue(merchant);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...user,
        account: {
          ...user.account,
          availableCredit: 5000, // Less than checkout amount
        },
      });

      await expect(service.initiateCheckout(merchantId, userId, checkoutDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCheckoutStatus', () => {
    const merchantId = 'merchant-id';
    const reference = 'FLEX-12345678-1234567890';

    const paymentPlan = {
      id: 'payment-plan-id',
      reference,
      totalAmount: 6000,
      currency: 'ETB',
      numberOfInstallments: 3,
      installmentAmount: 2000,
      startDate: new Date(),
      endDate: new Date(),
      status: 'ACTIVE',
      installments: [
        {
          installmentNumber: 1,
          amount: 2000,
          dueDate: new Date(),
          status: 'UPCOMING',
          paidDate: null,
          paidAmount: null,
        },
      ],
    };

    it('should return checkout status', async () => {
      mockPrismaService.paymentPlan.findFirst.mockResolvedValue(paymentPlan);

      const result = await service.getCheckoutStatus(merchantId, reference);

      expect(mockPrismaService.paymentPlan.findFirst).toHaveBeenCalledWith({
        where: {
          merchantId,
          reference,
        },
        include: {
          installments: true,
        },
      });

      expect(result).toHaveProperty('reference', reference);
      expect(result).toHaveProperty('status', paymentPlan.status);
      expect(result).toHaveProperty('totalAmount', paymentPlan.totalAmount);
      expect(result).toHaveProperty('installments');
      expect(result.installments).toHaveLength(1);
    });

    it('should throw NotFoundException if payment plan not found', async () => {
      mockPrismaService.paymentPlan.findFirst.mockResolvedValue(null);

      await expect(service.getCheckoutStatus(merchantId, reference)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
