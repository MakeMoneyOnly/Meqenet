import { Logger } from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FaydaEncryptionUtil } from './fayda-encryption.util';
import { SecretManagerService } from '../services/secret-manager.service';
import { ConfigService } from '@nestjs/config';

// Mock the services before any tests run
vi.mock('../services/secret-manager.service');
vi.mock('@nestjs/config');

describe('FaydaEncryptionUtil', () => {
  let service: FaydaEncryptionUtil;
  let mockSecretManagerService: import('vitest').MockedObject<SecretManagerService>;
  let mockConfigService: import('vitest').MockedObject<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn().mockReturnValue('aws-kms-key-id-123'),
    } as any;

    mockSecretManagerService = {
      encryptData: vi
        .fn()
        .mockImplementation(async (data: string) => `kms_encrypted_${data}`),
      decryptData: vi
        .fn()
        .mockImplementation(async (data: string) =>
          data.replace('kms_encrypted_', '')
        ),
    } as any;

    vi.spyOn(Logger.prototype, 'log').mockImplementation();
    vi.spyOn(Logger.prototype, 'error').mockImplementation();

    service = new FaydaEncryptionUtil(
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

  describe('encryptFaydaId', () => {
    const faydaId = '1234567890123456';

    it('should call SecretManagerService to encrypt the Fayda ID', async () => {
      const result = await service.encryptFaydaId(faydaId);

      expect(mockSecretManagerService.encryptData).toHaveBeenCalledWith(
        faydaId,
        'aws-kms-key-id-123',
        undefined
      );
      expect(result.encryptedData).toBe(`kms_encrypted_${faydaId}`);
      expect(result.keyId).toBe('aws-kms-key-id-123');
      expect(result.algorithm).toBe('kms-aes-256-gcm');
    });

    it('should throw an error if Fayda ID is invalid', async () => {
      await expect(service.encryptFaydaId('')).rejects.toThrow(
        'Fayda ID must be a non-empty string'
      );
    });
  });

  describe('decryptFaydaId', () => {
    const encryptedFaydaId = 'kms_encrypted_1234567890123456';

    it('should call SecretManagerService to decrypt the Fayda ID', async () => {
      const result = await service.decryptFaydaId(encryptedFaydaId);

      expect(mockSecretManagerService.decryptData).toHaveBeenCalledWith(
        encryptedFaydaId,
        undefined
      );
      expect(result).toBe('1234567890123456');
    });

    it('should throw an error if encrypted data is invalid', async () => {
      await expect(service.decryptFaydaId('')).rejects.toThrow(
        'Encrypted data must be a non-empty string'
      );
    });
  });
});
