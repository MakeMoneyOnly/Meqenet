import { Logger } from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FieldEncryptionService } from './field-encryption.service';

// Mock the services before any tests run
vi.mock('@nestjs/config');
vi.mock('./secret-manager.service');

describe('FieldEncryptionService', () => {
  let service: FieldEncryptionService;
  let mockConfigService: any;
  let mockSecretManagerService: any;
  let loggerSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Create mock services
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'ENCRYPTION_MASTER_KEY') {
          return 'test-master-key-for-testing';
        }
        return undefined;
      }),
    };

    mockSecretManagerService = {
      createSecret: vi.fn(),
    };

    // Mock logger before creating service
    loggerSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation();
    vi.spyOn(Logger.prototype, 'warn').mockImplementation();
    vi.spyOn(Logger.prototype, 'debug').mockImplementation();
    vi.spyOn(Logger.prototype, 'verbose').mockImplementation();

    // Create service with mocked dependencies
    service = new FieldEncryptionService(
      mockConfigService,
      mockSecretManagerService
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Initialization', () => {
    it('should initialize with default master key when config not provided', () => {
      vi.spyOn(mockConfigService, 'get').mockReturnValue(undefined);

      const newService = new FieldEncryptionService(
        mockConfigService,
        mockSecretManagerService
      );

      expect(newService).toBeDefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        '✅ Field encryption service initialized'
      );
    });

    it('should handle initialization errors gracefully', () => {
      vi.spyOn(mockConfigService, 'get').mockImplementation(() => {
        throw new Error('Config error');
      });

      expect(() => {
        new FieldEncryptionService(mockConfigService, mockSecretManagerService);
      }).toThrow('Config error');

      expect(errorSpy).toHaveBeenCalledWith(
        '❌ Failed to initialize encryption key:',
        expect.any(Error)
      );
    });
  });

  describe('encryptFields', () => {
    const testData = {
      email: 'test@example.com',
      password: 'secret123',
      firstName: 'John',
      lastName: 'Doe',
      normalField: 'normal',
    };

    it('should encrypt sensitive fields with default options', async () => {
      const result = await service.encryptFields(testData);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.encryptedFields).toBeDefined();
      expect(result.keyId).toBe('field-encryption-key');
      expect(result.algorithm).toBe('aes-256-gcm');

      // Check that sensitive fields are encrypted
      expect(result.encryptedFields).toContain('email');
      expect(result.encryptedFields).toContain('password');
      expect(result.encryptedFields).toContain('firstName');
      expect(result.encryptedFields).toContain('lastName');

      // Check that normal fields are not encrypted
      expect(result.encryptedFields).not.toContain('normalField');
    });

    it('should encrypt specific fields when provided', async () => {
      const result = await service.encryptFields(testData, {
        fields: ['email', 'normalField'],
      });

      expect(result.encryptedFields).toEqual(['email', 'normalField']);
      expect(result.encryptedFields).not.toContain('password');
    });

    it('should exclude specified fields from encryption', async () => {
      const result = await service.encryptFields(testData, {
        excludeFields: ['email'],
      });

      expect(result.encryptedFields).toContain('password');
      expect(result.encryptedFields).toContain('firstName');
      expect(result.encryptedFields).not.toContain('email');
    });

    it('should use custom keyId and algorithm', async () => {
      const result = await service.encryptFields(testData, {
        keyId: 'custom-key',
        algorithm: 'aes-256-gcm',
      });

      expect(result.keyId).toBe('custom-key');
      expect(result.algorithm).toBe('aes-256-gcm');
    });

    it('should handle empty data object', async () => {
      const result = await service.encryptFields({});

      expect(result.encryptedFields).toEqual([]);
      expect(result.data).toEqual({});
    });

    it('should handle null and undefined values', async () => {
      const dataWithNulls = {
        nullField: null,
        undefinedField: undefined,
        normalField: 'normal',
      };

      const result = await service.encryptFields(dataWithNulls);

      // null and undefined values are not encrypted, only string/number values
      expect(result.encryptedFields).not.toContain('nullField');
      expect(result.encryptedFields).not.toContain('undefinedField');
    });

    it('should handle already encrypted fields', async () => {
      // First encrypt some data
      const firstResult = await service.encryptFields(testData);

      // Try to encrypt again
      const secondResult = await service.encryptFields(firstResult.data);

      // Should not double-encrypt
      expect(secondResult.encryptedFields).toEqual([]);
    });

    it('should handle complex nested objects', async () => {
      const complexData = {
        profile: {
          email: 'test@example.com',
          settings: {
            notifications: true,
          },
        },
        contact: {
          phone: '+1234567890',
        },
        normalField: 'normal',
      };

      const result = await service.encryptFields(complexData);

      // The service only encrypts top-level sensitive fields, not nested ones
      expect(result.encryptedFields).toEqual([]);
      expect(result.encryptedFields).not.toContain('email'); // Nested field not encrypted
      expect(result.encryptedFields).not.toContain('phone'); // Nested field not encrypted
      expect(result.encryptedFields).not.toContain('profile');
      expect(result.encryptedFields).not.toContain('contact');
      expect(result.encryptedFields).not.toContain('normalField');
    });
  });

  describe('decryptFields', () => {
    it('should decrypt previously encrypted fields', async () => {
      const originalData = {
        email: 'test@example.com',
        password: 'secret123',
        normalField: 'normal',
      };

      // Encrypt first
      const encryptedResult = await service.encryptFields(originalData);
      expect(encryptedResult.encryptedFields.length).toBeGreaterThan(0);

      // Decrypt
      const decryptedResult = await service.decryptFields(encryptedResult.data);

      expect(decryptedResult.encryptedFields).toEqual(
        encryptedResult.encryptedFields
      );

      // Check that values are correctly decrypted
      const decryptedData = decryptedResult.data as any;
      expect(decryptedData.email).toBe(originalData.email);
      expect(decryptedData.password).toBe(originalData.password);
      expect(decryptedData.normalField).toBe(originalData.normalField);
    });

    it('should handle decryption with field restrictions', async () => {
      const originalData = {
        email: 'test@example.com',
        password: 'secret123',
        phone: '+1234567890',
      };

      const encryptedResult = await service.encryptFields(originalData);

      // Decrypt only specific fields
      const decryptedResult = await service.decryptFields(
        encryptedResult.data,
        {
          fields: ['email'],
        }
      );

      const decryptedData = decryptedResult.data as any;
      expect(decryptedData.email).toBe(originalData.email);
      // Password and phone should still be encrypted
      expect(decryptedData.password).not.toBe(originalData.password);
      expect(decryptedData.phone).not.toBe(originalData.phone);
    });

    it('should handle empty encrypted data', async () => {
      const result = await service.decryptFields({});

      expect(result.encryptedFields).toEqual([]);
      expect(result.data).toEqual({});
    });

    it('should handle data without encrypted fields', async () => {
      const normalData = {
        normalField: 'value',
        anotherField: 123,
      };

      const result = await service.decryptFields(normalData);

      expect(result.encryptedFields).toEqual([]);
      expect(result.data).toEqual(normalData);
    });
  });

  describe('encryptForStorage', () => {
    it('should encrypt fields based on table rules', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        age: 30, // Not sensitive
      };

      const result = await service.encryptForStorage(userData, 'users');

      expect(result.encryptedFields).toContain('email');
      expect(result.encryptedFields).toContain('password');
      expect(result.encryptedFields).toContain('firstName');
      expect(result.encryptedFields).toContain('lastName');
      expect(result.encryptedFields).not.toContain('age');
    });

    it('should use default encryption for unknown table', async () => {
      const data = {
        email: 'test@example.com',
        customField: 'value',
      };

      const result = await service.encryptForStorage(data, 'unknown_table');

      // Should use default sensitive fields
      expect(result.encryptedFields).toContain('email');
    });

    it('should handle invalid table names safely', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.encryptForStorage(
        data,
        'invalid-table-name!@#'
      );

      // Should fall back to default encryption
      expect(result.encryptedFields).toContain('email');
      expect(result.encryptedFields).toContain('password');
    });
  });

  describe('decryptFromStorage', () => {
    it('should decrypt fields based on table rules', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'password123',
        firstName: 'John',
        age: 30,
      };

      // Encrypt
      const encrypted = await service.encryptForStorage(userData, 'users');

      // Decrypt
      const decrypted = await service.decryptFromStorage(
        encrypted.data,
        'users'
      );

      const decryptedData = decrypted.data as any;
      expect(decryptedData.email).toBe(userData.email);
      expect(decryptedData.password).toBe(userData.password);
      expect(decryptedData.firstName).toBe(userData.firstName);
      expect(decryptedData.age).toBe(userData.age);
    });
  });

  describe('encryptForResponse', () => {
    it('should encrypt sensitive fields and exclude metadata', async () => {
      const data = {
        id: '123',
        email: 'test@example.com',
        password: 'secret',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.encryptForResponse(data);

      expect(result.encryptedFields).toContain('email');
      expect(result.encryptedFields).toContain('password');
      expect(result.encryptedFields).not.toContain('id');
      expect(result.encryptedFields).not.toContain('createdAt');
      expect(result.encryptedFields).not.toContain('updatedAt');
    });

    it('should encrypt only specified sensitive fields', async () => {
      const data = {
        email: 'test@example.com',
        password: 'secret',
        phone: '+1234567890',
      };

      const result = await service.encryptForResponse(data, ['email']);

      expect(result.encryptedFields).toEqual(['email']);
    });
  });

  describe('decryptFromRequest', () => {
    it('should decrypt fields from request data', async () => {
      const originalData = {
        email: 'test@example.com',
        password: 'secret',
      };

      const encrypted = await service.encryptForResponse(originalData);
      const decrypted = await service.decryptFromRequest(encrypted.data);

      const decryptedData = decrypted.data as any;
      expect(decryptedData.email).toBe(originalData.email);
      expect(decryptedData.password).toBe(originalData.password);
    });
  });

  describe('rotateEncryptionKey', () => {
    it('should create new encryption key and store it', async () => {
      const mockCreateSecret = vi
        .spyOn(mockSecretManagerService, 'createSecret')
        .mockResolvedValue({
          id: 'new-key-id',
          value: 'mock-value',
        });

      const keyId = await service.rotateEncryptionKey();

      expect(keyId).toBeDefined();
      expect(mockCreateSecret).toHaveBeenCalledWith(
        expect.stringContaining('encryption-key-'),
        expect.objectContaining({
          key: expect.any(String),
          createdAt: expect.any(String),
          algorithm: 'aes-256-gcm',
        })
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Encryption key rotated:')
      );
    });

    it('should handle secret manager errors', async () => {
      vi.spyOn(mockSecretManagerService, 'createSecret').mockRejectedValue(
        new Error('Secret manager error')
      );

      await expect(service.rotateEncryptionKey()).rejects.toThrow(
        'Secret manager error'
      );

      expect(errorSpy).toHaveBeenCalledWith(
        '❌ Key rotation failed:',
        expect.any(Error)
      );
    });
  });

  describe('validateEncryption', () => {
    it('should validate encrypted data successfully', async () => {
      const data = {
        email: 'test@example.com',
        password: 'secret',
      };

      const encrypted = await service.encryptFields(data);
      const isValid = await service.validateEncryption(encrypted.data);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid encrypted data', async () => {
      const invalidData = {
        email: 'not-encrypted@example.com',
        password: 'not-encrypted',
      };

      const isValid = await service.validateEncryption(invalidData);

      expect(isValid).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      const corruptedData = {
        email: {
          encrypted: true,
          value: 'corrupted-data',
          algorithm: 'aes-256-gcm',
        },
      };

      const isValid = await service.validateEncryption(corruptedData);

      expect(isValid).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        '❌ Encryption validation failed:',
        expect.any(Error)
      );
    });
  });

  describe('getEncryptionStats', () => {
    it('should return encryption statistics', () => {
      const stats = service.getEncryptionStats();

      expect(stats).toEqual({
        algorithm: 'aes-256-gcm',
        keyId: 'field-encryption-key',
        sensitiveFields: expect.any(Array),
        supportsKeyRotation: true,
      });

      expect(stats.sensitiveFields).toContain('email');
      expect(stats.sensitiveFields).toContain('password');
      expect(stats.sensitiveFields).toContain('phone');
    });
  });

  describe('sanitizeForLogging', () => {
    it('should mask sensitive string fields', () => {
      const data = {
        email: 'user@example.com',
        password: 'verylongpassword',
        phone: '1234567890',
        normalField: 'normal',
        shortField: 'hi',
      };

      const sanitized = service.sanitizeForLogging(data);

      // Sensitive string fields should be masked, not marked as [ENCRYPTED]
      expect(sanitized.email).toBe('use**********com');
      expect(sanitized.password).toBe('ver**********ord');
      expect(sanitized.phone).toBe('12******90');
      expect(sanitized.normalField).toBe('normal');
      expect(sanitized.shortField).toBe('hi'); // Not a sensitive field, so not masked
    });

    it('should handle encrypted fields', () => {
      const encryptedData = {
        email: {
          encrypted: true,
          value: 'encrypted-value',
          algorithm: 'aes-256-gcm',
        },
        normalField: 'normal',
      };

      const sanitized = service.sanitizeForLogging(encryptedData);

      expect(sanitized.email).toBe('[ENCRYPTED]');
      expect(sanitized.normalField).toBe('normal');
    });

    it('should mask strings longer than minimum length', () => {
      const data = {
        password: 'verylongstringthatshouldbemasked',
        shortString: 'hi',
        email: 'secretpassword',
      };

      const sanitized = service.sanitizeForLogging(data);

      expect(sanitized.password).toMatch(/^very\*{24}sked$/);
      expect(sanitized.shortString).toBe('hi'); // Not a sensitive field
      expect(sanitized.email).toMatch(/\w{2}\*+\w{2}/);
    });
  });

  describe('Private Methods', () => {
    describe('isEncryptedField', () => {
      it('should identify encrypted fields correctly', async () => {
        // Test the logic by creating a field encryption service instance and testing behavior
        const testData = {
          encryptedField: {
            encrypted: true,
            value: 'encrypted-data',
            algorithm: 'aes-256-gcm',
          },
          email: 'plain-data',
          nullField: null,
          undefinedField: undefined,
          plainObject: {},
        };

        // Test through public methods to verify private method logic
        const encryptedResult = await service.encryptFields(testData);

        // Should have encrypted the sensitive fields that weren't already encrypted
        expect(encryptedResult.encryptedFields).toContain('email');
        expect(encryptedResult.encryptedFields).not.toContain('encryptedField'); // Already encrypted
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', async () => {
      // Test with invalid algorithm to trigger error
      await expect(
        service.encryptFields(
          { email: 'test@example.com' },
          { algorithm: 'invalid' }
        )
      ).rejects.toThrow();

      // Verify that some error was logged
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should handle decryption errors gracefully', async () => {
      const corruptedEncryptedData = {
        email: {
          encrypted: true,
          value: 'corrupted-data',
          algorithm: 'invalid-algorithm',
        },
      };

      await expect(
        service.decryptFields(corruptedEncryptedData)
      ).rejects.toThrow();

      // Verify that some error was logged
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
