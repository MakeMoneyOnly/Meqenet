import { Test, TestingModule } from '@nestjs/testing';
import { MerchantCheckoutController } from './merchant-checkout.controller';
import { MerchantCheckoutService } from '../services/merchant-checkout.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MerchantCheckoutController', () => {
  let controller: MerchantCheckoutController;
  let merchantCheckoutService: MerchantCheckoutService;

  const mockMerchantCheckoutService = {
    initiateCheckout: jest.fn(),
    getCheckoutStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantCheckoutController],
      providers: [
        {
          provide: MerchantCheckoutService,
          useValue: mockMerchantCheckoutService,
        },
      ],
    }).compile();

    controller = module.get<MerchantCheckoutController>(MerchantCheckoutController);
    merchantCheckoutService = module.get<MerchantCheckoutService>(MerchantCheckoutService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    const checkoutResult = {
      success: true,
      paymentPlanId: 'payment-plan-id',
      reference: 'FLEX-12345678-1234567890',
      amount: 6000,
    };

    it('should initiate checkout for authenticated user', async () => {
      mockMerchantCheckoutService.initiateCheckout.mockResolvedValue(checkoutResult);
      const req = { user: { id: userId } };

      const result = await controller.initiateCheckout(checkoutDto, merchantId, req);

      expect(mockMerchantCheckoutService.initiateCheckout).toHaveBeenCalledWith(
        merchantId,
        userId,
        checkoutDto,
      );
      expect(result).toEqual(checkoutResult);
    });

    it('should throw BadRequestException if merchantId is not provided', async () => {
      const req = { user: { id: userId } };

      await expect(controller.initiateCheckout(checkoutDto, '' as any, req)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockMerchantCheckoutService.initiateCheckout).not.toHaveBeenCalled();
    });
  });

  describe('initiateCheckoutApi', () => {
    const merchantId = 'merchant-id';
    const userId = 'user-id';
    const apiKey = 'test_api_key';
    const apiSecret = 'test_api_secret';
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

    it('should throw BadRequestException if API authentication is not implemented', async () => {
      const req = { headers: {} };
      await expect(
        controller.initiateCheckoutApi(checkoutDto, userId, apiKey, apiSecret, req),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if userId, apiKey, or apiSecret is not provided', async () => {
      const req = { headers: {} };
      await expect(controller.initiateCheckoutApi(checkoutDto, '' as any, apiKey, apiSecret, req)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.initiateCheckoutApi(checkoutDto, userId, '' as any, apiSecret, req)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.initiateCheckoutApi(checkoutDto, userId, apiKey, '' as any, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCheckoutStatus', () => {
    const reference = 'FLEX-12345678-1234567890';
    const userId = 'user-id';
    const merchantId = 'merchant-id';

    const paymentPlan = {
      id: 'payment-plan-id',
      userId,
      merchantId,
    };

    const checkoutStatus = {
      reference,
      status: 'ACTIVE',
      totalAmount: 6000,
      installments: [
        {
          installmentNumber: 1,
          amount: 2000,
          status: 'UPCOMING',
        },
      ],
    };

    it('should throw NotFoundException if payment plan is not found', async () => {
      // Mock controller's findPaymentPlanByReference method to return null
      jest.spyOn(controller as any, 'findPaymentPlanByReference').mockResolvedValue(null);
      const req = { user: { id: userId } };

      await expect(controller.getCheckoutStatus(reference, req)).rejects.toThrow(NotFoundException);
      expect(mockMerchantCheckoutService.getCheckoutStatus).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not own the payment plan', async () => {
      // Mock controller's findPaymentPlanByReference method to return a payment plan
      jest.spyOn(controller as any, 'findPaymentPlanByReference').mockResolvedValue(paymentPlan);
      const req = { user: { id: 'other-user-id', role: 'USER' } };

      await expect(controller.getCheckoutStatus(reference, req)).rejects.toThrow(NotFoundException);
      expect(mockMerchantCheckoutService.getCheckoutStatus).not.toHaveBeenCalled();
    });
  });

  describe('getCheckoutStatusApi', () => {
    const reference = 'FLEX-12345678-1234567890';
    const apiKey = 'test_api_key';
    const apiSecret = 'test_api_secret';

    it('should throw BadRequestException if API authentication is not implemented', async () => {
      const req = { headers: {} };
      await expect(controller.getCheckoutStatusApi(reference, apiKey, apiSecret, req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if reference, apiKey, or apiSecret is not provided', async () => {
      const req = { headers: {} };
      await expect(controller.getCheckoutStatusApi('' as any, apiKey, apiSecret, req)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getCheckoutStatusApi(reference, '' as any, apiSecret, req)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getCheckoutStatusApi(reference, apiKey, '' as any, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
