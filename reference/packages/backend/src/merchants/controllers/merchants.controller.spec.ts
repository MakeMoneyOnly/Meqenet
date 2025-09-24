import { Test, TestingModule } from '@nestjs/testing';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from '../services/merchants.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MerchantStatus } from '@prisma/client';

describe('MerchantsController', () => {
  let controller: MerchantsController;
  let merchantsService: MerchantsService;

  const mockMerchantsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    generateApiKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantsController],
      providers: [
        {
          provide: MerchantsService,
          useValue: mockMerchantsService,
        },
      ],
    }).compile();

    controller = module.get<MerchantsController>(MerchantsController);
    merchantsService = module.get<MerchantsService>(MerchantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createMerchantDto = {
      name: 'Test Merchant',
      businessType: 'RETAIL',
      contactPerson: 'John Doe',
      email: 'test@merchant.com',
      phoneNumber: '+251912345678',
    };

    const createdMerchant = {
      id: 'merchant-id',
      ...createMerchantDto,
      status: MerchantStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a new merchant', async () => {
      mockMerchantsService.create.mockResolvedValue(createdMerchant);

      const result = await controller.create(createMerchantDto);

      expect(mockMerchantsService.create).toHaveBeenCalledWith(createMerchantDto);
      expect(result).toEqual(createdMerchant);
    });
  });

  describe('findAll', () => {
    const merchants = [
      {
        id: 'merchant-id-1',
        name: 'Merchant 1',
        status: MerchantStatus.ACTIVE,
      },
      {
        id: 'merchant-id-2',
        name: 'Merchant 2',
        status: MerchantStatus.PENDING,
      },
    ];

    it('should return all merchants', async () => {
      mockMerchantsService.findAll.mockResolvedValue(merchants);

      const result = await controller.findAll();

      expect(mockMerchantsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(merchants);
    });
  });

  describe('findPending', () => {
    const pendingMerchants = [
      {
        id: 'merchant-id-2',
        name: 'Merchant 2',
        status: MerchantStatus.PENDING,
      },
    ];

    it('should return pending merchants', async () => {
      mockMerchantsService.findAll.mockResolvedValue(pendingMerchants);

      const result = await controller.findPending();

      expect(mockMerchantsService.findAll).toHaveBeenCalledWith(MerchantStatus.PENDING);
      expect(result).toEqual(pendingMerchants);
    });
  });

  describe('findOne', () => {
    const merchantId = 'merchant-id';
    const merchant = {
      id: merchantId,
      name: 'Test Merchant',
      status: MerchantStatus.ACTIVE,
    };

    it('should return a merchant if user is admin', async () => {
      mockMerchantsService.findById.mockResolvedValue(merchant);
      const req = { user: { role: 'ADMIN' } };

      const result = await controller.findOne(merchantId, req);

      expect(mockMerchantsService.findById).toHaveBeenCalledWith(merchantId);
      expect(result).toEqual(merchant);
    });

    it('should return a merchant if user is the merchant', async () => {
      mockMerchantsService.findById.mockResolvedValue(merchant);
      const req = { user: { role: 'MERCHANT', merchantId } };

      const result = await controller.findOne(merchantId, req);

      expect(mockMerchantsService.findById).toHaveBeenCalledWith(merchantId);
      expect(result).toEqual(merchant);
    });

    it('should throw ForbiddenException if user is not admin or the merchant', async () => {
      mockMerchantsService.findById.mockResolvedValue(merchant);
      const req = { user: { role: 'USER', merchantId: 'other-merchant-id' } };

      await expect(controller.findOne(merchantId, req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    const merchantId = 'merchant-id';
    const merchant = {
      id: merchantId,
      name: 'Test Merchant',
      status: MerchantStatus.PENDING,
    };

    const updatedMerchant = {
      ...merchant,
      status: MerchantStatus.ACTIVE,
    };

    it('should update merchant status', async () => {
      mockMerchantsService.updateStatus.mockResolvedValue(updatedMerchant);

      const result = await controller.updateStatus(merchantId, MerchantStatus.ACTIVE);

      expect(mockMerchantsService.updateStatus).toHaveBeenCalledWith(merchantId, MerchantStatus.ACTIVE);
      expect(result).toEqual(updatedMerchant);
    });

    it('should throw BadRequestException if status is invalid', async () => {
      await expect(controller.updateStatus(merchantId, 'INVALID_STATUS' as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockMerchantsService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('generateApiKey', () => {
    const merchantId = 'merchant-id';
    const createApiKeyDto = {
      name: 'Test API Key',
      isLive: false,
    };

    const apiKey = {
      key: 'test_api_key',
      secret: 'test_api_secret',
    };

    const merchant = {
      id: merchantId,
      name: 'Test Merchant',
      status: MerchantStatus.ACTIVE,
    };

    it('should generate API key if user is admin', async () => {
      mockMerchantsService.findById.mockResolvedValue(merchant);
      mockMerchantsService.generateApiKey.mockResolvedValue(apiKey);
      const req = { user: { role: 'ADMIN' } };

      const result = await controller.generateApiKey(merchantId, createApiKeyDto, req);

      expect(mockMerchantsService.findById).toHaveBeenCalledWith(merchantId);
      expect(mockMerchantsService.generateApiKey).toHaveBeenCalledWith(
        merchantId,
        createApiKeyDto.name,
        createApiKeyDto.isLive,
      );
      expect(result).toEqual(apiKey);
    });

    it('should generate API key if user is the merchant', async () => {
      mockMerchantsService.findById.mockResolvedValue(merchant);
      mockMerchantsService.generateApiKey.mockResolvedValue(apiKey);
      const req = { user: { role: 'MERCHANT', merchantId } };

      const result = await controller.generateApiKey(merchantId, createApiKeyDto, req);

      expect(mockMerchantsService.findById).toHaveBeenCalledWith(merchantId);
      expect(mockMerchantsService.generateApiKey).toHaveBeenCalledWith(
        merchantId,
        createApiKeyDto.name,
        createApiKeyDto.isLive,
      );
      expect(result).toEqual(apiKey);
    });

    it('should throw ForbiddenException if user is not admin or the merchant', async () => {
      mockMerchantsService.findById.mockResolvedValue(merchant);
      const req = { user: { role: 'USER', merchantId: 'other-merchant-id' } };

      await expect(controller.generateApiKey(merchantId, createApiKeyDto, req)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockMerchantsService.generateApiKey).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if merchant is not active', async () => {
      mockMerchantsService.findById.mockResolvedValue({
        ...merchant,
        status: MerchantStatus.PENDING,
      });
      const req = { user: { role: 'ADMIN' } };

      await expect(controller.generateApiKey(merchantId, createApiKeyDto, req)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockMerchantsService.generateApiKey).not.toHaveBeenCalled();
    });
  });
});
