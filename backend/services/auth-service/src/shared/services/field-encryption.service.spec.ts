import { Logger } from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FieldEncryptionService } from './field-encryption.service';
import { SecretManagerService } from './secret-manager.service';

// Mock the services before any tests run
vi.mock('./secret-manager.service');
vi.mock('@nestjs/config');

describe('FieldEncryptionService', () => {
  let service: FieldEncryptionService;
  let mockSecretManagerService: import('vitest').MockedObject<SecretManagerService>;

  beforeEach(() => {
    const mockConfigService = {
      get: vi.fn(),
    };

    mockSecretManagerService = {
      encryptData: vi
        .fn()
        .mockImplementation(async (data: string) => `kms_encrypted_${data}`),
      decryptData: vi
        .fn()
        .mockImplementation(async (data: string) =>
          data.replace('kms_encrypted_', '')
        ),
      getKmsKeyId: vi.fn().mockReturnValue('aws-kms-key-id-123'),
    } as any;

    vi.spyOn(Logger.prototype, 'log').mockImplementation();
    vi.spyOn(Logger.prototype, 'error').mockImplementation();

    service = new FieldEncryptionService(
      mockConfigService as any,
      mockSecretManagerService as any
    );
    service.onModuleInit(); // Manually trigger init
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encryptFields', () => {
    const testData = {
      email: 'test@example.com',
      password: 'secret123',
      normalField: 'normal',
    };

    it('should encrypt sensitive fields using SecretManagerService', async () => {
      const result = await service.encryptFields(testData);

      expect(result.encryptedFields).toEqual(['email', 'password']);
      expect(mockSecretManagerService.encryptData).toHaveBeenCalledWith(
        JSON.stringify(testData.email),
        undefined
      );
      expect(mockSecretManagerService.encryptData).toHaveBeenCalledWith(
        JSON.stringify(testData.password),
        undefined
      );
      expect(mockSecretManagerService.encryptData).not.toHaveBeenCalledWith(
        JSON.stringify(testData.normalField),
        undefined
      );

      const encryptedEmail = result.data.email as any;
      expect(encryptedEmail.encrypted).toBe(true);
      expect(encryptedEmail.value).toBe('kms_encrypted_"test@example.com"');
      expect(encryptedEmail.keyId).toBe('aws-kms-key-id-123');
      expect(encryptedEmail.algorithm).toBe('kms-aes-256-gcm');
    });

    it('should handle custom keyId for encryption', async () => {
      await service.encryptFields(testData, { keyId: 'custom-key-456' });
      expect(mockSecretManagerService.encryptData).toHaveBeenCalledWith(
        expect.any(String),
        'custom-key-456'
      );
    });
  });

  describe('decryptFields', () => {
    const encryptedData = {
      email: {
        encrypted: true,
        value: 'kms_encrypted_"test@example.com"',
        algorithm: 'kms-aes-256-gcm',
        keyId: 'aws-kms-key-id-123',
      },
      password: {
        encrypted: true,
        value: 'kms_encrypted_"secret123"',
        algorithm: 'kms-aes-256-gcm',
        keyId: 'aws-kms-key-id-123',
      },
      normalField: 'normal',
    };

    it('should decrypt sensitive fields using SecretManagerService', async () => {
      const result = await service.decryptFields(encryptedData);

      expect(result.encryptedFields).toEqual(['email', 'password']);
      expect(mockSecretManagerService.decryptData).toHaveBeenCalledWith(
        'kms_encrypted_"test@example.com"'
      );
      expect(mockSecretManagerService.decryptData).toHaveBeenCalledWith(
        'kms_encrypted_"secret123"'
      );

      expect(result.data.email).toBe('test@example.com');
      expect(result.data.password).toBe('secret123');
      expect(result.data.normalField).toBe('normal');
    });

    it('should not decrypt fields that are not in the sensitive list by default', async () => {
      const dataWithNonSensitiveEncrypted = {
        ...encryptedData,
        normalField: {
          encrypted: true,
          value: 'kms_encrypted_"normal_encrypted"',
          algorithm: 'kms-aes-256-gcm',
          keyId: 'aws-kms-key-id-123',
        },
      };

      const result = await service.decryptFields(dataWithNonSensitiveEncrypted);
      expect(result.data.normalField).toEqual(
        dataWithNonSensitiveEncrypted.normalField
      );
    });
  });
});
