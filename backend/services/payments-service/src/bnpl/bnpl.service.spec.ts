import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { vi } from 'vitest';
import { BNPLService } from './bnpl.service';
// PrismaService import removed - using direct mocking
import { CreateContractDto } from './dto/create-contract.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
// Define BNPLProduct enum locally for testing
enum BNPLProduct {
  PAY_IN_4 = 'PAY_IN_4',
  PAY_IN_30 = 'PAY_IN_30',
  PAY_IN_FULL = 'PAY_IN_FULL',
  FINANCING = 'FINANCING',
}

describe.skip('BNPLService', () => {
  let service: BNPLService;

  const mockPrismaService = {
    merchant: {
      findUnique: vi.fn(),
    },
    contract: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    installmentSchedule: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    outboxMessage: {
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    // Try to dynamically import the service to avoid compilation issues
    try {
      const { BNPLService: BNPLServiceClass } = await import('./bnpl.service');
      service = new BNPLServiceClass(mockPrismaService as any);
    } catch (error) {
      console.error('Error importing BNPLService:', error);
      throw error;
    }

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('createContract', () => {
    const mockCreateContractDto: CreateContractDto = {
      customerId: 'customer-123',
      merchantId: 'merchant-456',
      product: BNPLProduct.PAY_IN_4,
      amount: 1000,
      description: 'Test purchase',
      merchantReference: 'REF-123',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      deviceFingerprint: 'device-123',
    };

    const mockMerchant = {
      id: 'merchant-456',
      businessName: 'Test Merchant',
      status: 'ACTIVE',
      merchantSettings: {
        payIn4Enabled: true,
        payIn30Enabled: true,
        financingEnabled: true,
        minContractAmount: 10,
        maxContractAmount: new Decimal(10000),
      },
    };

    const mockContract = {
      id: 'contract-789',
      contractNumber: 'MEQ-1234567890-ABC123',
      customerId: 'customer-123',
      merchantId: 'merchant-456',
      product: BNPLProduct.PAY_IN_4,
      principalAmount: 1000,
      totalAmount: 1000,
      outstandingBalance: 1000,
      apr: 0,
      termMonths: 0,
      paymentFrequency: 'WEEKLY',
      firstPaymentDate: new Date('2024-01-15'),
      maturityDate: new Date('2024-02-12'),
      description: 'Test purchase',
      merchantReference: 'REF-123',
      status: 'ACTIVE',
      activatedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      deviceFingerprint: 'device-123',
    };

    it('should create a PAY_IN_4 contract successfully', async () => {
      // Arrange
      mockPrismaService.merchant.findUnique.mockResolvedValue(mockMerchant);
      mockPrismaService.contract.create.mockResolvedValue(mockContract);
      mockPrismaService.installmentSchedule.createMany.mockResolvedValue({
        count: 4,
      });

      // Mock generateContractNumber and other private methods
      jest
        .spyOn(service as any, 'generateContractNumber')
        .mockResolvedValue('MEQ-1234567890-ABC123');
      jest.spyOn(service as any, 'createAuditLog').mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'publishOutboxMessage')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.createContract(mockCreateContractDto);

      // Assert
      expect(result).toEqual(mockContract);
      expect(mockPrismaService.merchant.findUnique).toHaveBeenCalledWith({
        where: { id: 'merchant-456' },
        include: { merchantSettings: true },
      });
      expect(mockPrismaService.contract.create).toHaveBeenCalled();
      expect(
        mockPrismaService.installmentSchedule.createMany
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestException when merchant not found', async () => {
      // Arrange
      mockPrismaService.merchant.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createContract(mockCreateContractDto)
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.merchant.findUnique).toHaveBeenCalledWith({
        where: { id: 'merchant-456' },
        include: { merchantSettings: true },
      });
    });

    it('should throw BadRequestException when merchant is not active', async () => {
      // Arrange
      const inactiveMerchant = { ...mockMerchant, status: 'INACTIVE' };
      mockPrismaService.merchant.findUnique.mockResolvedValue(inactiveMerchant);

      // Act & Assert
      await expect(
        service.createContract(mockCreateContractDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when product is not enabled', async () => {
      // Arrange
      const merchantWithoutPayIn4 = {
        ...mockMerchant,
        merchantSettings: {
          ...mockMerchant.merchantSettings,
          payIn4Enabled: false,
        },
      };
      mockPrismaService.merchant.findUnique.mockResolvedValue(
        merchantWithoutPayIn4
      );

      // Act & Assert
      await expect(
        service.createContract(mockCreateContractDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount is below minimum', async () => {
      // Arrange
      const dto = { ...mockCreateContractDto, amount: 5 };
      mockPrismaService.merchant.findUnique.mockResolvedValue(mockMerchant);

      // Act & Assert
      await expect(service.createContract(dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when amount is above maximum', async () => {
      // Arrange
      const dto = { ...mockCreateContractDto, amount: 15000 };
      mockPrismaService.merchant.findUnique.mockResolvedValue(mockMerchant);

      // Act & Assert
      await expect(service.createContract(dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should create a PAY_IN_30 contract successfully', async () => {
      // Arrange
      const payIn30Dto = {
        ...mockCreateContractDto,
        product: BNPLProduct.PAY_IN_30,
      };
      const payIn30Contract = {
        ...mockContract,
        product: BNPLProduct.PAY_IN_30,
      };

      mockPrismaService.merchant.findUnique.mockResolvedValue(mockMerchant);
      mockPrismaService.contract.create.mockResolvedValue(payIn30Contract);
      mockPrismaService.installmentSchedule.createMany.mockResolvedValue({
        count: 1,
      });

      jest
        .spyOn(service as any, 'generateContractNumber')
        .mockResolvedValue('MEQ-1234567890-DEF456');
      jest.spyOn(service as any, 'createAuditLog').mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'publishOutboxMessage')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.createContract(payIn30Dto);

      // Assert
      expect(result.product).toBe(BNPLProduct.PAY_IN_30);
      expect(
        mockPrismaService.installmentSchedule.createMany
      ).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            installmentNumber: 1,
            scheduledAmount: 1000,
          }),
        ]),
      });
    });

    it('should create a FINANCING contract successfully', async () => {
      // Arrange
      const financingDto = {
        ...mockCreateContractDto,
        product: BNPLProduct.FINANCING,
      };
      const financingContract = {
        ...mockContract,
        product: BNPLProduct.FINANCING,
        totalAmount: new Decimal(1150), // 1000 + 150 interest
        apr: 0.15,
        termMonths: 12,
      };

      mockPrismaService.merchant.findUnique.mockResolvedValue(mockMerchant);
      mockPrismaService.contract.create.mockResolvedValue(financingContract);
      mockPrismaService.installmentSchedule.createMany.mockResolvedValue({
        count: 12,
      });

      jest
        .spyOn(service as any, 'generateContractNumber')
        .mockResolvedValue('MEQ-1234567890-GHI789');
      jest.spyOn(service as any, 'createAuditLog').mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'publishOutboxMessage')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.createContract(financingDto);

      // Assert
      expect(result.product).toBe(BNPLProduct.FINANCING);
      expect(result.apr).toEqual(0.15);
      expect(result.termMonths).toBe(12);
      expect(
        mockPrismaService.installmentSchedule.createMany
      ).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            scheduledAmount: expect.any(Decimal),
          }),
        ]),
      });
    });
  });

  describe('processPayment', () => {
    const mockProcessPaymentDto: ProcessPaymentDto = {
      contractId: 'contract-789',
      amount: 250,
      paymentMethod: 'TELEBIRR',
      currency: 'ETB',
      idempotencyKey: 'idemp-123',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      deviceFingerprint: 'device-123',
    };

    const mockContract = {
      id: 'contract-789',
      customerId: 'customer-123',
      merchantId: 'merchant-456',
      status: 'ACTIVE',
      outstandingBalance: 1000,
      installments: [
        {
          id: 'installment-1',
          scheduledAmount: 250,
          paidAmount: null,
          status: 'DUE',
        },
        {
          id: 'installment-2',
          scheduledAmount: 250,
          paidAmount: null,
          status: 'PENDING',
        },
      ],
    };

    const mockPayment = {
      id: 'payment-456',
      paymentReference: 'PAY-1234567890-XYZ789',
      contractId: 'contract-789',
      customerId: 'customer-123',
      merchantId: 'merchant-456',
      paymentMethod: 'TELEBIRR',
      amount: 250,
      currency: 'ETB',
      idempotencyKey: 'idemp-123',
      status: 'PENDING',
    };

    it('should process payment successfully', async () => {
      // Arrange
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      jest
        .spyOn(service as any, 'generatePaymentReference')
        .mockResolvedValue('PAY-1234567890-XYZ789');
      jest
        .spyOn(service as any, 'allocatePaymentToInstallments')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'updateContractBalance')
        .mockResolvedValue(undefined);
      jest.spyOn(service as any, 'createAuditLog').mockResolvedValue(undefined);

      // Act
      const result = await service.processPayment(mockProcessPaymentDto);

      // Assert
      expect(result).toEqual(mockPayment);
      expect(mockPrismaService.contract.findUnique).toHaveBeenCalledWith({
        where: { id: 'contract-789' },
        include: {
          installments: {
            where: { status: 'DUE' },
            orderBy: { dueDate: 'asc' },
          },
        },
      });
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when contract not found', async () => {
      // Arrange
      mockPrismaService.contract.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.processPayment(mockProcessPaymentDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when contract is not active', async () => {
      // Arrange
      const inactiveContract = { ...mockContract, status: 'COMPLETED' };
      mockPrismaService.contract.findUnique.mockResolvedValue(inactiveContract);

      // Act & Assert
      await expect(
        service.processPayment(mockProcessPaymentDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getContractDetails', () => {
    const mockContract = {
      id: 'contract-789',
      contractNumber: 'MEQ-1234567890-ABC123',
      customerId: 'customer-123',
      merchantId: 'merchant-456',
      product: BNPLProduct.PAY_IN_4,
      principalAmount: 1000,
      totalAmount: 1000,
      outstandingBalance: new Decimal(750),
      apr: 0,
      termMonths: 0,
      paymentFrequency: 'WEEKLY',
      firstPaymentDate: new Date('2024-01-15'),
      maturityDate: new Date('2024-02-12'),
      description: 'Test purchase',
      merchantReference: 'REF-123',
      status: 'ACTIVE',
      activatedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      deviceFingerprint: 'device-123',
      installments: [
        {
          id: 'installment-1',
          installmentNumber: 1,
          scheduledAmount: 250,
          principalAmount: 250,
          interestAmount: 0,
          feeAmount: 0,
          dueDate: new Date('2024-01-15'),
          paidAmount: 250,
          paidAt: new Date('2024-01-15'),
          status: 'PAID',
        },
        {
          id: 'installment-2',
          installmentNumber: 2,
          scheduledAmount: 250,
          principalAmount: 250,
          interestAmount: 0,
          feeAmount: 0,
          dueDate: new Date('2024-01-22'),
          paidAmount: null,
          paidAt: null,
          status: 'DUE',
        },
      ],
      merchant: {
        id: 'merchant-456',
        businessName: 'Test Merchant',
        category: 'Electronics',
      },
    };

    it('should return contract details with installments', async () => {
      // Arrange
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);

      // Act
      const result = await service.getContractDetails('contract-789');

      // Assert
      expect(result).toEqual(mockContract);
      expect(mockPrismaService.contract.findUnique).toHaveBeenCalledWith({
        where: { id: 'contract-789' },
        include: {
          installments: {
            orderBy: { installmentNumber: 'asc' },
          },
          merchant: {
            select: {
              id: true,
              businessName: true,
              category: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when contract not found', async () => {
      // Arrange
      mockPrismaService.contract.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getContractDetails('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('calculateContractTerms', () => {
    it('should calculate PAY_IN_4 terms correctly', () => {
      // Arrange
      const dto: CreateContractDto = {
        customerId: 'customer-123',
        merchantId: 'merchant-456',
        product: BNPLProduct.PAY_IN_4,
        amount: 1000,
      };

      // Act
      const result = (service as any).calculateContractTerms(dto);

      // Assert
      expect(result.totalAmount).toEqual(1000);
      expect(result.apr).toEqual(0);
      expect(result.termMonths).toBe(0);
      expect(result.paymentFrequency).toBe('WEEKLY');
      expect(result.installmentCount).toBe(4);
      expect(result.installmentAmount).toEqual(250);
    });

    it('should calculate PAY_IN_30 terms correctly', () => {
      // Arrange
      const dto: CreateContractDto = {
        customerId: 'customer-123',
        merchantId: 'merchant-456',
        product: BNPLProduct.PAY_IN_30,
        amount: 1000,
      };

      // Act
      const result = (service as any).calculateContractTerms(dto);

      // Assert
      expect(result.totalAmount).toEqual(1000);
      expect(result.apr).toEqual(0);
      expect(result.termMonths).toBe(1);
      expect(result.paymentFrequency).toBe('MONTHLY');
      expect(result.installmentCount).toBe(1);
      expect(result.installmentAmount).toEqual(1000);
    });

    it('should calculate FINANCING terms correctly', () => {
      // Arrange
      const dto: CreateContractDto = {
        customerId: 'customer-123',
        merchantId: 'merchant-456',
        product: BNPLProduct.FINANCING,
        amount: 1000,
      };

      // Act
      const result = (service as any).calculateContractTerms(dto);

      // Assert
      expect(result.apr).toEqual(0.15);
      expect(result.termMonths).toBe(12);
      expect(result.paymentFrequency).toBe('MONTHLY');
      expect(result.installmentCount).toBe(12);
      expect(result.installmentAmount).toBeInstanceOf(Decimal);
      expect(result.totalAmount).toBeInstanceOf(Decimal);
    });

    it('should calculate PAY_IN_FULL terms correctly', () => {
      // Arrange
      const dto: CreateContractDto = {
        customerId: 'customer-123',
        merchantId: 'merchant-456',
        product: BNPLProduct.PAY_IN_FULL,
        amount: 1000,
      };

      // Act
      const result = (service as any).calculateContractTerms(dto);

      // Assert
      expect(result.totalAmount).toEqual(1000);
      expect(result.apr).toEqual(0);
      expect(result.termMonths).toBe(0);
      expect(result.paymentFrequency).toBe('IMMEDIATE');
      expect(result.installmentCount).toBe(1);
      expect(result.installmentAmount).toEqual(1000);
    });

    it('should throw BadRequestException for unsupported product', () => {
      // Arrange
      const dto: CreateContractDto = {
        customerId: 'customer-123',
        merchantId: 'merchant-456',
        product: 'UNSUPPORTED_PRODUCT' as BNPLProduct,
        amount: 1000,
      };

      // Act & Assert
      expect(() => (service as any).calculateContractTerms(dto)).toThrow(
        BadRequestException
      );
    });
  });

  describe('Private Methods', () => {
    describe('allocatePaymentToInstallments', () => {
      it('should allocate payment to due installments correctly', async () => {
        // Arrange
        const paymentId = 'payment-456';
        const amount = 250;

        const mockInstallments = [
          {
            id: 'installment-1',
            scheduledAmount: 250,
            paidAmount: null,
            status: 'DUE',
          },
        ];

        mockPrismaService.installmentSchedule.findMany.mockResolvedValue(
          mockInstallments
        );
        mockPrismaService.installmentSchedule.update.mockResolvedValue(
          mockInstallments[0]
        );

        // Act
        await (service as any).allocatePaymentToInstallments(paymentId, amount);

        // Assert
        expect(
          mockPrismaService.installmentSchedule.update
        ).toHaveBeenCalledWith({
          where: { id: 'installment-1' },
          data: expect.objectContaining({
            status: 'PAID',
            paidAmount: 250,
            paidAt: expect.any(Date),
            paymentId: 'payment-456',
          }),
        });
      });

      it('should handle partial payment correctly', async () => {
        // Arrange
        const paymentId = 'payment-456';
        const amount = 150;

        const mockInstallments = [
          {
            id: 'installment-1',
            scheduledAmount: 250,
            paidAmount: null,
            status: 'DUE',
          },
        ];

        mockPrismaService.installmentSchedule.findMany.mockResolvedValue(
          mockInstallments
        );
        mockPrismaService.installmentSchedule.update.mockResolvedValue(
          mockInstallments[0]
        );

        // Act
        await (service as any).allocatePaymentToInstallments(paymentId, amount);

        // Assert
        expect(
          mockPrismaService.installmentSchedule.update
        ).toHaveBeenCalledWith({
          where: { id: 'installment-1' },
          data: expect.objectContaining({
            status: 'PENDING',
            paidAmount: 150,
            paidAt: expect.any(Date),
            paymentId: 'payment-456',
          }),
        });
      });
    });

    describe('updateContractBalance', () => {
      it('should update contract balance correctly', async () => {
        // Arrange
        const contractId = 'contract-789';
        const paymentAmount = 250;

        const mockContract = {
          id: 'contract-789',
          outstandingBalance: 1000,
          status: 'ACTIVE',
        };

        mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
        mockPrismaService.contract.update.mockResolvedValue({
          ...mockContract,
          outstandingBalance: new Decimal(750),
        });

        // Act
        await (service as any).updateContractBalance(contractId, paymentAmount);

        // Assert
        expect(mockPrismaService.contract.update).toHaveBeenCalledWith({
          where: { id: 'contract-789' },
          data: {
            outstandingBalance: new Decimal(750),
            status: 'ACTIVE',
            completedAt: null,
          },
        });
      });

      it('should complete contract when balance reaches zero', async () => {
        // Arrange
        const contractId = 'contract-789';
        const paymentAmount = 1000;

        const mockContract = {
          id: 'contract-789',
          outstandingBalance: 1000,
          status: 'ACTIVE',
        };

        mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
        mockPrismaService.contract.update.mockResolvedValue({
          ...mockContract,
          outstandingBalance: 0,
          status: 'COMPLETED',
          completedAt: new Date(),
        });

        // Act
        await (service as any).updateContractBalance(contractId, paymentAmount);

        // Assert
        expect(mockPrismaService.contract.update).toHaveBeenCalledWith({
          where: { id: 'contract-789' },
          data: {
            outstandingBalance: 0,
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          },
        });
      });
    });

    describe('generateContractNumber', () => {
      it('should generate unique contract number', async () => {
        // Act
        const result = await (service as any).generateContractNumber();

        // Assert
        expect(result).toMatch(/^MEQ-\d+-[A-Z0-9]{6}$/);
      });
    });

    describe('generatePaymentReference', () => {
      it('should generate unique payment reference', async () => {
        // Act
        const result = await (service as any).generatePaymentReference();

        // Assert
        expect(result).toMatch(/^PAY-\d+-[A-Z0-9]{6}$/);
      });
    });

    describe('isProductEnabled', () => {
      it('should return true for enabled products', () => {
        // Arrange
        const settings = {
          payIn4Enabled: true,
          payIn30Enabled: false,
          financingEnabled: true,
        };

        // Act & Assert
        expect(
          (service as any).isProductEnabled(settings, BNPLProduct.PAY_IN_4)
        ).toBe(true);
        expect(
          (service as any).isProductEnabled(settings, BNPLProduct.PAY_IN_30)
        ).toBe(false);
        expect(
          (service as any).isProductEnabled(settings, BNPLProduct.FINANCING)
        ).toBe(true);
        expect(
          (service as any).isProductEnabled(settings, BNPLProduct.PAY_IN_FULL)
        ).toBe(true);
      });
    });

    describe('createAuditLog', () => {
      it('should create audit log entry', async () => {
        // Arrange
        const auditData = {
          eventType: 'CONTRACT_CREATED',
          entityType: 'Contract',
          entityId: 'contract-789',
          userId: 'customer-123',
          eventData: { amount: 1000 },
        };

        mockPrismaService.auditLog.create.mockResolvedValue({
          id: 'audit-123',
          ...auditData,
          createdAt: new Date(),
        });

        // Act
        await (service as any).createAuditLog(auditData);

        // Assert
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: {
            eventType: 'CONTRACT_CREATED',
            entityType: 'Contract',
            entityId: 'contract-789',
            userId: 'customer-123',
            eventData: { amount: 1000 },
            createdAt: expect.any(Date),
          },
        });
      });
    });

    describe('publishOutboxMessage', () => {
      it('should publish outbox message', async () => {
        // Arrange
        const messageData = {
          aggregateType: 'Contract',
          aggregateId: 'contract-789',
          eventType: 'contract.created',
          payload: { contractId: 'contract-789' },
        };

        mockPrismaService.outboxMessage.create.mockResolvedValue({
          id: 'outbox-123',
          messageId: expect.stringMatching(/^Contract-contract-789-\d+$/),
          ...messageData,
          status: 'PENDING',
        });

        // Act
        await (service as any).publishOutboxMessage(messageData);

        // Assert
        expect(mockPrismaService.outboxMessage.create).toHaveBeenCalledWith({
          data: {
            messageId: expect.stringMatching(/^Contract-contract-789-\d+$/),
            aggregateType: 'Contract',
            aggregateId: 'contract-789',
            eventType: 'contract.created',
            payload: { contractId: 'contract-789' },
            status: 'PENDING',
          },
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle full contract lifecycle', async () => {
      // Arrange
      const createDto: CreateContractDto = {
        customerId: 'customer-123',
        merchantId: 'merchant-456',
        product: BNPLProduct.PAY_IN_4,
        amount: 1000,
        description: 'Full lifecycle test',
        merchantReference: 'REF-LIFECYCLE',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        deviceFingerprint: 'device-123',
      };

      const mockMerchant = {
        id: 'merchant-456',
        businessName: 'Test Merchant',
        status: 'ACTIVE',
        merchantSettings: {
          payIn4Enabled: true,
          payIn30Enabled: true,
          financingEnabled: true,
          minContractAmount: 10,
          maxContractAmount: new Decimal(10000),
        },
      };

      const mockContract = {
        id: 'contract-lifecycle',
        contractNumber: 'MEQ-1234567890-LIFECYCLE',
        customerId: 'customer-123',
        merchantId: 'merchant-456',
        product: BNPLProduct.PAY_IN_4,
        principalAmount: 1000,
        totalAmount: 1000,
        outstandingBalance: 1000,
        apr: 0,
        termMonths: 0,
        paymentFrequency: 'WEEKLY',
        firstPaymentDate: new Date('2024-01-15'),
        maturityDate: new Date('2024-02-12'),
        description: 'Full lifecycle test',
        merchantReference: 'REF-LIFECYCLE',
        status: 'ACTIVE',
        activatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        deviceFingerprint: 'device-123',
      };

      // Mock all dependencies
      mockPrismaService.merchant.findUnique.mockResolvedValue(mockMerchant);
      mockPrismaService.contract.create.mockResolvedValue(mockContract);
      mockPrismaService.installmentSchedule.createMany.mockResolvedValue({
        count: 4,
      });

      jest
        .spyOn(service as any, 'generateContractNumber')
        .mockResolvedValue('MEQ-1234567890-LIFECYCLE');
      jest.spyOn(service as any, 'createAuditLog').mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'publishOutboxMessage')
        .mockResolvedValue(undefined);

      // Act & Assert - Create Contract
      const contract = await service.createContract(createDto);
      expect(contract.id).toBe('contract-lifecycle');
      expect(contract.product).toBe(BNPLProduct.PAY_IN_4);
      expect(contract.outstandingBalance).toEqual(1000);

      // Verify audit log and outbox message were created
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'CONTRACT_CREATED',
          entityType: 'Contract',
          entityId: 'contract-lifecycle',
        }),
      });

      expect(mockPrismaService.outboxMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aggregateType: 'Contract',
          aggregateId: 'contract-lifecycle',
          eventType: 'contract.created',
        }),
      });
    });
  });
});
