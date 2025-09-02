import { Test, TestingModule } from '@nestjs/testing';
import { FieldEncryptionInterceptor } from './field-encryption.interceptor';
import { FieldEncryptionService } from '../services/field-encryption.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FieldEncryptionInterceptor', () => {
  let interceptor: FieldEncryptionInterceptor;
  let fieldEncryptionService: import('vitest').MockedObject<FieldEncryptionService>;
  let mockContext: ExecutionContext;
  let mockNext: CallHandler;

  const mockRequest = {
    body: {
      password: 'encrypted_password_value',
      email: 'user@example.com',
      cardNumber: 'encrypted_card_number',
    },
    query: {
      search: 'encrypted_search_term',
      filter: 'encrypted_filter_value',
    },
    url: '/users',
    method: 'POST',
    ip: '127.0.0.1',
  };

  const mockResponse = {
    statusCode: 200,
    setHeader: vi.fn(),
  };

  beforeEach(async () => {
    const mockFieldEncryptionService = {
      decryptFromRequest: vi.fn().mockResolvedValue({
        data: {
          password: 'decrypted_password',
          email: 'user@example.com',
        },
        encryptedFields: ['password'],
      }),
      encryptForResponse: vi.fn().mockResolvedValue({
        data: {
          id: 1,
          email: 'encrypted_email@example.com',
          cardNumber: 'encrypted_card_number',
        },
        encryptedFields: ['email', 'cardNumber'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldEncryptionInterceptor,
        {
          provide: FieldEncryptionService,
          useValue: mockFieldEncryptionService,
        },
      ],
    }).compile();

    interceptor = module.get<FieldEncryptionInterceptor>(
      FieldEncryptionInterceptor
    );
    fieldEncryptionService = module.get(FieldEncryptionService);

    // Manually assign the mock to the interceptor instance
    (interceptor as any).fieldEncryptionService = mockFieldEncryptionService;

    mockContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
        getResponse: vi.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    mockNext = {
      handle: vi.fn().mockReturnValue(
        of({
          id: 1,
          email: 'decrypted_email@example.com',
          cardNumber: 'decrypted_card_number',
        })
      ),
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should decrypt request data and encrypt response data', async () => {
      // Mock decryption result
      fieldEncryptionService.decryptFromRequest
        .mockResolvedValueOnce({
          data: {
            password: 'decrypted_password',
            email: 'user@example.com',
          },
          encryptedFields: ['password'],
        })
        .mockResolvedValueOnce({
          data: {
            search: 'decrypted_search',
          },
          encryptedFields: ['search'],
        });

      // Mock encryption result
      fieldEncryptionService.encryptForResponse.mockResolvedValue({
        data: {
          id: 1,
          email: 'encrypted_email@example.com',
          cardNumber: 'encrypted_card_number',
        },
        encryptedFields: ['email', 'cardNumber'],
      });

      const observable = await interceptor.intercept(mockContext, mockNext);
      const result = await new Promise(resolve => {
        observable.subscribe(async data => {
          resolve(await data);
        });
      });

      expect(fieldEncryptionService.decryptFromRequest).toHaveBeenCalledTimes(
        2
      );
      expect(fieldEncryptionService.encryptForResponse).toHaveBeenCalledWith(
        {
          id: 1,
          email: 'decrypted_email@example.com',
          cardNumber: 'decrypted_card_number',
        },
        ['password', 'email', 'phoneNumber', 'dateOfBirth', 'ssn']
      );
      expect(result).toEqual({
        id: 1,
        email: 'encrypted_email@example.com',
        cardNumber: 'encrypted_card_number',
      });
    });

    it('should handle array responses correctly', async () => {
      const arrayResponse = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];

      mockNext.handle = vi.fn().mockReturnValue(of(arrayResponse));

      fieldEncryptionService.decryptFromRequest.mockResolvedValue({
        data: mockRequest.body,
        encryptedFields: [],
      });

      fieldEncryptionService.encryptForResponse
        .mockResolvedValueOnce({
          data: { id: 1, email: 'encrypted_user1@example.com' },
          encryptedFields: ['email'],
        })
        .mockResolvedValueOnce({
          data: { id: 2, email: 'encrypted_user2@example.com' },
          encryptedFields: ['email'],
        });

      const observable = await interceptor.intercept(mockContext, mockNext);
      const result = await new Promise(resolve => {
        observable.subscribe(async data => {
          resolve(await data);
        });
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('email', 'encrypted_user1@example.com');
      expect(result[1]).toHaveProperty('email', 'encrypted_user2@example.com');
    });

    it('should handle non-object responses', async () => {
      const stringResponse = 'success';

      mockNext.handle = vi.fn().mockReturnValue(of(stringResponse));

      fieldEncryptionService.decryptFromRequest.mockResolvedValue({
        data: mockRequest.body,
        encryptedFields: [],
      });

      const observable = await interceptor.intercept(mockContext, mockNext);
      const result = await new Promise(resolve => {
        observable.subscribe(async data => {
          resolve(await data);
        });
      });

      expect(result).toBe('success');
    });

    it('should handle decryption errors gracefully', async () => {
      fieldEncryptionService.decryptFromRequest.mockRejectedValue(
        new Error('Decryption failed')
      );

      fieldEncryptionService.encryptForResponse.mockResolvedValue({
        data: {
          id: 1,
          email: 'decrypted_email@example.com',
          cardNumber: 'decrypted_card_number',
        },
        encryptedFields: ['email', 'cardNumber'],
      });

      const observable = await interceptor.intercept(mockContext, mockNext);
      const result = await new Promise(resolve => {
        observable.subscribe(async data => {
          resolve(await data);
        });
      });

      // Should still process the response even if decryption fails
      expect(fieldEncryptionService.encryptForResponse).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        email: 'decrypted_email@example.com',
        cardNumber: 'decrypted_card_number',
      });
    });

    it('should handle encryption errors gracefully', async () => {
      fieldEncryptionService.decryptFromRequest.mockResolvedValue({
        data: mockRequest.body,
        encryptedFields: [],
      });

      fieldEncryptionService.encryptForResponse.mockRejectedValue(
        new Error('Encryption failed')
      );

      const observable = await interceptor.intercept(mockContext, mockNext);
      const result = await new Promise(resolve => {
        observable.subscribe(async data => {
          resolve(await data);
        });
      });

      // Should return original data if encryption fails
      expect(result).toEqual({
        id: 1,
        email: 'decrypted_email@example.com',
        cardNumber: 'decrypted_card_number',
      });
    });
  });

  describe('getSensitiveFieldsForEndpoint', () => {
    it('should return user-related fields for /users endpoint', () => {
      const request = { url: '/users', method: 'POST' };
      const fields = (interceptor as any).getSensitiveFieldsForEndpoint(
        request
      );
      expect(fields).toEqual([
        'password',
        'email',
        'phoneNumber',
        'dateOfBirth',
        'ssn',
      ]);
    });

    it('should return payment-related fields for /payments endpoint', () => {
      const request = { url: '/payments', method: 'POST' };
      const fields = (interceptor as any).getSensitiveFieldsForEndpoint(
        request
      );
      expect(fields).toEqual([
        'cardNumber',
        'cvv',
        'expiryDate',
        'cardholderName',
      ]);
    });

    it('should return auth-related fields for /auth/login endpoint', () => {
      const request = { url: '/auth/login', method: 'POST' };
      const fields = (interceptor as any).getSensitiveFieldsForEndpoint(
        request
      );
      expect(fields).toEqual(['password']);
    });

    it('should return auth-related fields for /auth/register endpoint', () => {
      const request = { url: '/auth/register', method: 'POST' };
      const fields = (interceptor as any).getSensitiveFieldsForEndpoint(
        request
      );
      expect(fields).toEqual(['password', 'email', 'phoneNumber']);
    });

    it('should return default fields for unknown endpoints', () => {
      const request = { url: '/unknown/endpoint', method: 'GET' };
      const fields = (interceptor as any).getSensitiveFieldsForEndpoint(
        request
      );
      expect(fields).toEqual([
        'password',
        'email',
        'phoneNumber',
        'cardNumber',
        'accountNumber',
      ]);
    });

    it('should match patterns correctly', () => {
      const request = { url: '/users/123/profile', method: 'PUT' };
      const fields = (interceptor as any).getSensitiveFieldsForEndpoint(
        request
      );
      expect(fields).toEqual([
        'password',
        'email',
        'phoneNumber',
        'dateOfBirth',
        'ssn',
      ]);
    });
  });
});
