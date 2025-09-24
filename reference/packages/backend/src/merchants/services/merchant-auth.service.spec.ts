import { Test, TestingModule } from '@nestjs/testing';
import { MerchantAuthService } from './merchant-auth.service';
import { MerchantsService } from './merchants.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { MerchantStatus } from '@prisma/client';

describe('MerchantAuthService', () => {
  let service: MerchantAuthService;
  let merchantsService: MerchantsService;
  let jwtService: JwtService;

  const mockMerchantsService = {
    validateApiKey: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      const config: Record<string, any> = {
        JWT_SECRET: 'test-secret',
        JWT_MERCHANT_EXPIRATION: 86400,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantAuthService,
        {
          provide: MerchantsService,
          useValue: mockMerchantsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MerchantAuthService>(MerchantAuthService);
    merchantsService = module.get<MerchantsService>(MerchantsService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateApiKey', () => {
    const apiKey = 'test_api_key';
    const apiSecret = 'test_api_secret';
    const merchant = {
      id: 'merchant-id',
      name: 'Test Merchant',
      status: MerchantStatus.ACTIVE,
    };

    it('should return merchant if API key is valid', async () => {
      mockMerchantsService.validateApiKey.mockResolvedValue(merchant);

      const result = await service.validateApiKey(apiKey, apiSecret);

      expect(mockMerchantsService.validateApiKey).toHaveBeenCalledWith(apiKey, apiSecret);
      expect(result).toEqual(merchant);
    });

    it('should throw UnauthorizedException if API key is invalid', async () => {
      mockMerchantsService.validateApiKey.mockResolvedValue(null);

      await expect(service.validateApiKey(apiKey, apiSecret)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if merchant is not active', async () => {
      mockMerchantsService.validateApiKey.mockResolvedValue({
        ...merchant,
        status: MerchantStatus.PENDING,
      });

      await expect(service.validateApiKey(apiKey, apiSecret)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateMerchantToken', () => {
    const merchantId = 'merchant-id';
    const email = 'merchant@example.com';
    const name = 'Test Merchant';
    const token = 'jwt-token';

    it('should generate a JWT token', () => {
      mockJwtService.sign.mockReturnValue(token);

      const result = service.generateMerchantToken(merchantId, email, name);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: merchantId,
          email,
          name,
        },
        {
          secret: 'test-secret',
          expiresIn: '86400s',
        },
      );
      expect(result).toEqual(token);
    });
  });

  describe('verifyMerchantToken', () => {
    const token = 'jwt-token';
    const payload = {
      sub: 'merchant-id',
      email: 'merchant@example.com',
      name: 'Test Merchant',
    };

    it('should verify and return token payload', () => {
      mockJwtService.verify.mockReturnValue(payload);

      const result = service.verifyMerchantToken(token);

      expect(mockJwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'test-secret',
      });
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException if token is invalid', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.verifyMerchantToken(token)).toThrow(UnauthorizedException);
    });
  });
});
