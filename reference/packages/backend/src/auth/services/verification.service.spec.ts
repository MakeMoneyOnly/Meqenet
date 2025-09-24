import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VerificationService } from './verification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { VerificationCodeType } from '../enums/verification-code-type.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('VerificationService', () => {
  let service: VerificationService;
  let _prismaService: PrismaService;
  let _notificationsService: NotificationsService;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    phoneNumber: '+251911234567',
    isEmailVerified: false,
    isPhoneVerified: false,
  };

  const mockVerificationCode = {
    id: 'code-123',
    userId: mockUser.id,
    code: '123456',
    type: VerificationCodeType.EMAIL,
    expiresAt: new Date(Date.now() + 600000), // 10 minutes from now
    attempts: 0,
    isVerified: false,
    channel: 'EMAIL',
    destination: mockUser.email,
    createdAt: new Date(),
    updatedAt: new Date(),
    verifiedAt: null,
  };

  // Create mocks
  const mockPrismaService = {
    verificationCode: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockNotificationsService = {
    sendNotification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      const config: Record<string, any> = {
        VERIFICATION_CODE_LENGTH: 6,
        VERIFICATION_CODE_EXPIRATION: 600, // 10 minutes
        VERIFICATION_MAX_ATTEMPTS: 5,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
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

    service = module.get<VerificationService>(VerificationService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _notificationsService =
      module.get<NotificationsService>(NotificationsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailVerificationCode', () => {
    it('should generate and send email verification code', async () => {
      // Setup mocks
      mockPrismaService.verificationCode.create.mockResolvedValue(
        mockVerificationCode
      );
      mockNotificationsService.sendNotification.mockResolvedValue(undefined);

      // Call the service method
      const result = await service.sendEmailVerificationCode(
        mockUser.id,
        mockUser.email,
        VerificationCodeType.EMAIL
      );

      // Assertions
      expect(mockPrismaService.verificationCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          type: VerificationCodeType.EMAIL,
          channel: 'EMAIL',
          destination: mockUser.email,
        }),
      });

      expect(mockNotificationsService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'VERIFICATION_CODE',
          userId: mockUser.id,
        })
      );

      expect(result).toEqual({
        success: true,
        message: `Verification code sent to ${mockUser.email}`,
      });
    });
  });

  describe('sendPhoneVerificationCode', () => {
    it('should generate and send phone verification code', async () => {
      // Setup mocks
      mockPrismaService.verificationCode.create.mockResolvedValue({
        ...mockVerificationCode,
        type: VerificationCodeType.PHONE,
        channel: 'SMS',
        destination: mockUser.phoneNumber,
      });
      mockNotificationsService.sendNotification.mockResolvedValue(undefined);

      // Call the service method
      const result = await service.sendPhoneVerificationCode(
        mockUser.id,
        mockUser.phoneNumber,
        VerificationCodeType.PHONE
      );

      // Assertions
      expect(mockPrismaService.verificationCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          type: VerificationCodeType.PHONE,
          channel: 'SMS',
          destination: mockUser.phoneNumber,
        }),
      });

      expect(mockNotificationsService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'VERIFICATION_CODE',
          userId: mockUser.id,
        })
      );

      expect(result).toEqual({
        success: true,
        message: `Verification code sent to ${mockUser.phoneNumber}`,
      });
    });
  });

  describe('verifyCode', () => {
    it('should verify a valid code', async () => {
      // Setup mocks
      mockPrismaService.verificationCode.findFirst.mockResolvedValue(
        mockVerificationCode
      );
      mockPrismaService.verificationCode.update.mockResolvedValue({
        ...mockVerificationCode,
        isVerified: true,
        verifiedAt: new Date(),
      });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });

      // Call the service method
      const result = await service.verifyCode(
        mockUser.id,
        mockVerificationCode.code,
        VerificationCodeType.EMAIL
      );

      // Assertions
      expect(mockPrismaService.verificationCode.findFirst).toHaveBeenCalledWith(
        {
          where: {
            userId: mockUser.id,
            type: VerificationCodeType.EMAIL,
            isVerified: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }
      );

      expect(mockPrismaService.verificationCode.update).toHaveBeenCalledTimes(
        2
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { isEmailVerified: true },
      });

      expect(result).toEqual({
        success: true,
        message: 'Verification successful',
      });
    });

    it('should return failure for invalid code', async () => {
      // Setup mocks
      mockPrismaService.verificationCode.findFirst.mockResolvedValue(
        mockVerificationCode
      );
      mockPrismaService.verificationCode.update.mockResolvedValue({
        ...mockVerificationCode,
        attempts: 1,
      });

      // Call the service method with wrong code
      const result = await service.verifyCode(
        mockUser.id,
        'wrong-code',
        VerificationCodeType.EMAIL
      );

      // Assertions
      expect(mockPrismaService.verificationCode.update).toHaveBeenCalledTimes(
        1
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();

      expect(result).toEqual({
        success: false,
        message: 'Invalid verification code',
      });
    });

    it('should throw NotFoundException when verification code not found', async () => {
      // Setup mocks
      mockPrismaService.verificationCode.findFirst.mockResolvedValue(null);

      // Assertions
      await expect(
        service.verifyCode(mockUser.id, 'any-code', VerificationCodeType.EMAIL)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when code is expired', async () => {
      // Setup mocks
      mockPrismaService.verificationCode.findFirst.mockResolvedValue({
        ...mockVerificationCode,
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      });

      // Assertions
      await expect(
        service.verifyCode(
          mockUser.id,
          mockVerificationCode.code,
          VerificationCodeType.EMAIL
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when max attempts reached', async () => {
      // Setup mocks
      mockPrismaService.verificationCode.findFirst.mockResolvedValue({
        ...mockVerificationCode,
        attempts: 5, // Max attempts
      });

      // Assertions
      await expect(
        service.verifyCode(
          mockUser.id,
          mockVerificationCode.code,
          VerificationCodeType.EMAIL
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
