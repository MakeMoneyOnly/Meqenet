import { Test, TestingModule } from '@nestjs/testing';
import { MerchantsService } from './merchants.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MerchantStatus } from '@prisma/client';

describe('MerchantsService', () => {
  let service: MerchantsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    merchant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    merchantApiKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MerchantsService>(MerchantsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      mockPrismaService.merchant.findFirst.mockResolvedValue(null);
      mockPrismaService.merchant.create.mockResolvedValue(createdMerchant);

      const result = await service.create(createMerchantDto);

      expect(mockPrismaService.merchant.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: createMerchantDto.email },
            { phoneNumber: createMerchantDto.phoneNumber },
          ],
        },
      });
      expect(mockPrismaService.merchant.create).toHaveBeenCalledWith({
        data: {
          ...createMerchantDto,
          status: MerchantStatus.PENDING,
        },
      });
      expect(result).toEqual(createdMerchant);
    });

    it('should throw ConflictException if merchant with same email exists', async () => {
      mockPrismaService.merchant.findFirst.mockResolvedValue({
        id: 'existing-merchant-id',
        email: createMerchantDto.email,
      });

      await expect(service.create(createMerchantDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.merchant.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    const merchantId = 'merchant-id';
    const merchant = {
      id: merchantId,
      name: 'Test Merchant',
      status: MerchantStatus.ACTIVE,
    };

    it('should return a merchant if found', async () => {
      mockPrismaService.merchant.findUnique.mockResolvedValue(merchant);

      const result = await service.findById(merchantId);

      expect(mockPrismaService.merchant.findUnique).toHaveBeenCalledWith({
        where: { id: merchantId },
      });
      expect(result).toEqual(merchant);
    });

    it('should throw NotFoundException if merchant not found', async () => {
      mockPrismaService.merchant.findUnique.mockResolvedValue(null);

      await expect(service.findById(merchantId)).rejects.toThrow(NotFoundException);
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
      mockPrismaService.merchant.findUnique.mockResolvedValue(merchant);
      mockPrismaService.merchant.update.mockResolvedValue(updatedMerchant);

      const result = await service.updateStatus(merchantId, MerchantStatus.ACTIVE);

      expect(mockPrismaService.merchant.findUnique).toHaveBeenCalledWith({
        where: { id: merchantId },
      });
      expect(mockPrismaService.merchant.update).toHaveBeenCalledWith({
        where: { id: merchantId },
        data: { status: MerchantStatus.ACTIVE },
      });
      expect(result).toEqual(updatedMerchant);
    });

    it('should throw NotFoundException if merchant not found', async () => {
      mockPrismaService.merchant.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(merchantId, MerchantStatus.ACTIVE)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.merchant.update).not.toHaveBeenCalled();
    });
  });
});
