import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { TelebirrService } from '../services/telebirr.service';
import { HelloCashService } from '../services/hellocash.service';
import { ChapaService } from '../services/chapa.service';
import { Logger } from '@nestjs/common';

describe('WebhookController', () => {
  let controller: WebhookController;
  let telebirrService: TelebirrService;
  let helloCashService: HelloCashService;
  let chapaService: ChapaService;

  // Mock data
  const mockTelebirrPayload = {
    sign: 'mock-signature',
    ussd: 'encrypted-data',
    appId: 'telebirr-app-id',
  };

  const mockHelloCashPayload = {
    transactionId: 'hc-123456',
    amount: '1000',
    status: 'COMPLETED',
    phoneNumber: '+251911234567',
  };

  const mockChapaPayload = {
    tx_ref: 'chapa-123456',
    amount: '1000',
    status: 'successful',
    customer: {
      email: 'test@example.com',
      phone_number: '+251911234567',
    },
  };

  // Create mocks
  const mockTelebirrService = {
    handleCallback: jest.fn(),
  };

  const mockHelloCashService = {
    handleCallback: jest.fn(),
  };

  const mockChapaService = {
    handleCallback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: TelebirrService,
          useValue: mockTelebirrService,
        },
        {
          provide: HelloCashService,
          useValue: mockHelloCashService,
        },
        {
          provide: ChapaService,
          useValue: mockChapaService,
        },
        Logger,
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    telebirrService = module.get<TelebirrService>(TelebirrService);
    helloCashService = module.get<HelloCashService>(HelloCashService);
    chapaService = module.get<ChapaService>(ChapaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleTelebirrWebhook', () => {
    it('should process Telebirr webhook successfully', async () => {
      // Setup mocks
      mockTelebirrService.handleCallback.mockResolvedValue({
        success: true,
        message: 'Payment processed successfully',
        status: 'COMPLETED',
      });

      // Call the controller method
      const result = await controller.handleTelebirrWebhook(mockTelebirrPayload, {});

      // Assertions
      expect(mockTelebirrService.handleCallback).toHaveBeenCalledWith(mockTelebirrPayload);
      expect(result).toEqual({
        code: '0',
        message: 'Payment processed successfully',
      });
    });

    it('should handle Telebirr webhook errors', async () => {
      // Setup mocks
      mockTelebirrService.handleCallback.mockResolvedValue({
        success: false,
        message: 'Invalid signature',
        status: 'FAILED',
      });

      // Call the controller method
      const result = await controller.handleTelebirrWebhook(mockTelebirrPayload, {});

      // Assertions
      expect(mockTelebirrService.handleCallback).toHaveBeenCalledWith(mockTelebirrPayload);
      expect(result).toEqual({
        code: '1',
        message: 'Invalid signature',
      });
    });

    it('should handle exceptions in Telebirr webhook processing', async () => {
      // Setup mocks
      mockTelebirrService.handleCallback.mockRejectedValue(new Error('Service error'));

      // Call the controller method
      const result = await controller.handleTelebirrWebhook(mockTelebirrPayload, {});

      // Assertions
      expect(mockTelebirrService.handleCallback).toHaveBeenCalledWith(mockTelebirrPayload);
      expect(result).toEqual({
        code: '1',
        message: 'Error processing webhook',
      });
    });
  });

  describe('handleHelloCashWebhook', () => {
    it('should process HelloCash webhook successfully', async () => {
      // Setup mocks
      mockHelloCashService.handleCallback.mockResolvedValue({
        success: true,
        message: 'Payment processed successfully',
        status: 'COMPLETED',
      });

      // Call the controller method
      const result = await controller.handleHelloCashWebhook(mockHelloCashPayload, {});

      // Assertions
      expect(mockHelloCashService.handleCallback).toHaveBeenCalledWith(mockHelloCashPayload);
      expect(result).toEqual({
        status: 'success',
        message: 'Payment processed successfully',
      });
    });

    it('should handle HelloCash webhook errors', async () => {
      // Setup mocks
      mockHelloCashService.handleCallback.mockResolvedValue({
        success: false,
        message: 'Invalid transaction',
        status: 'FAILED',
      });

      // Call the controller method
      const result = await controller.handleHelloCashWebhook(mockHelloCashPayload, {});

      // Assertions
      expect(mockHelloCashService.handleCallback).toHaveBeenCalledWith(mockHelloCashPayload);
      expect(result).toEqual({
        status: 'error',
        message: 'Invalid transaction',
      });
    });
  });

  describe('handleChapaWebhook', () => {
    it('should process Chapa webhook successfully', async () => {
      // Setup mocks
      mockChapaService.handleCallback.mockResolvedValue({
        success: true,
        message: 'Payment processed successfully',
        status: 'COMPLETED',
      });

      const headers = {
        'x-chapa-signature': 'valid-signature',
      };

      // Call the controller method
      const result = await controller.handleChapaWebhook(mockChapaPayload, headers);

      // Assertions
      expect(mockChapaService.handleCallback).toHaveBeenCalledWith(
        mockChapaPayload,
        'valid-signature'
      );
      expect(result).toEqual({
        status: 'success',
        message: 'Payment processed successfully',
      });
    });
  });

  describe('handleTransactionWebhook', () => {
    it('should route Telebirr transaction webhook correctly', async () => {
      // Setup mocks
      mockTelebirrService.handleCallback.mockResolvedValue({
        success: true,
        message: 'Payment processed successfully',
        status: 'COMPLETED',
      });

      // Call the controller method
      const result = await controller.handleTransactionWebhook(
        'telebirr',
        'tx-123456',
        mockTelebirrPayload,
        {}
      );

      // Assertions
      expect(mockTelebirrService.handleCallback).toHaveBeenCalledWith({
        ...mockTelebirrPayload,
        transactionId: 'tx-123456',
      });
      expect(result).toEqual({
        status: 'success',
        message: 'Payment processed successfully',
      });
    });

    it('should handle unsupported payment provider', async () => {
      // Call the controller method with unsupported provider
      await expect(
        controller.handleTransactionWebhook('unsupported', 'tx-123456', {}, {})
      ).resolves.toEqual({
        status: 'error',
        message: 'Error processing webhook',
      });
    });
  });
});
