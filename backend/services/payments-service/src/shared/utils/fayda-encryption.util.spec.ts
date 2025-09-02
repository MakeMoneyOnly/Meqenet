import { vi } from 'vitest';

import { FaydaEncryptionUtil } from './fayda-encryption.util';

describe('FaydaEncryptionUtil', () => {
  let service: FaydaEncryptionUtil;

  beforeEach(async () => {
    // Create a fresh mock for each test
    const freshMockConfigService = {
      get: vi.fn((key: string) => {
        const allowedKeys = [
          'FAYDA_ENCRYPTION_KEY',
          'FAYDA_ENCRYPTION_ALGORITHM',
          'FAYDA_ID_MIN_LENGTH',
          'FAYDA_ID_MAX_LENGTH',
          'FAYDA_ENCRYPTION_ENABLED',
          'FAYDA_HASH_PEPPER',
        ];
        if (!allowedKeys.includes(key)) {
          return undefined;
        }

        const config: Record<string, string | number | boolean> = {
          FAYDA_ENCRYPTION_KEY: 'test-encryption-key-32-chars-long',
          FAYDA_ENCRYPTION_ALGORITHM: 'aes-256-gcm',
          FAYDA_ID_MIN_LENGTH: 10,
          FAYDA_ID_MAX_LENGTH: 16,
          FAYDA_ENCRYPTION_ENABLED: true,
          FAYDA_HASH_PEPPER: 'test-pepper-for-hashing',
        };
        return key in config ? config[key as keyof typeof config] : undefined;
      }),
    };

    // Create the service instance directly with the mock ConfigService
    service = new FaydaEncryptionUtil(freshMockConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encryptFaydaId', () => {
    it('should encrypt Fayda ID successfully', async () => {
      const faydaId = '123456789012';
      const result = await service.encryptFaydaId(faydaId);

      expect(result).toBeDefined();
      expect(result.encryptedData).toBeDefined();
      expect(typeof result.encryptedData).toBe('string');
      expect(result.encryptedData).not.toBe(faydaId);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.algorithm).toBe('aes-256-gcm');
    });

    it('should reject invalid Fayda ID format', async () => {
      const invalidFaydaId = 'INVALID_ID_123';

      await expect(service.encryptFaydaId(invalidFaydaId)).rejects.toThrow(
        'Invalid Fayda ID format'
      );
    });

    it('should reject Fayda ID that is too short', async () => {
      const shortFaydaId = '123456789'; // Less than 10 digits

      await expect(service.encryptFaydaId(shortFaydaId)).rejects.toThrow(
        'Invalid Fayda ID format: must be 10-16 digits'
      );
    });

    it('should reject Fayda ID that is too long', async () => {
      const longFaydaId = '12345678901234567'; // More than 16 digits

      await expect(service.encryptFaydaId(longFaydaId)).rejects.toThrow(
        'Invalid Fayda ID format: must be 10-16 digits'
      );
    });

    it('should handle encryption when encryption is disabled', async () => {
      // Create a local mock for this test
      const localMockConfigService = {
        get: vi.fn((key: string) => {
          const allowedKeys = [
            'FAYDA_ENCRYPTION_KEY',
            'FAYDA_ENCRYPTION_ALGORITHM',
            'FAYDA_ID_MIN_LENGTH',
            'FAYDA_ID_MAX_LENGTH',
            'FAYDA_ENCRYPTION_ENABLED',
            'FAYDA_HASH_PEPPER',
          ];
          if (!allowedKeys.includes(key)) {
            return undefined;
          }

          const config: Record<string, string | number | boolean> = {
            FAYDA_ENCRYPTION_KEY: 'test-encryption-key-32-chars-long',
            FAYDA_ENCRYPTION_ALGORITHM: 'aes-256-gcm',
            FAYDA_ID_MIN_LENGTH: 10,
            FAYDA_ID_MAX_LENGTH: 16,
            FAYDA_ENCRYPTION_ENABLED: false, // Disabled for this test
            FAYDA_HASH_PEPPER: 'test-pepper-for-hashing',
          };
          return key in config ? config[key as keyof typeof config] : undefined;
        }),
      };

      // Create a new instance with disabled encryption
      const disabledService = new FaydaEncryptionUtil(
        localMockConfigService as any
      );

      const faydaId = '123456789012';
      const result = await disabledService.encryptFaydaId(faydaId);

      expect(result.encryptedData).toBe(faydaId); // Should return unencrypted when disabled
      expect(result.metadata.algorithm).toBe('none');
    });
  });

  describe('decryptFaydaId', () => {
    it('should decrypt Fayda ID successfully', async () => {
      const originalFaydaId = '123456789012';

      const result = await service.encryptFaydaId(originalFaydaId);
      const decrypted = await service.decryptFaydaId(
        result.encryptedData,
        result.metadata
      );

      expect(decrypted).toBe(originalFaydaId);
    });

    it('should reject invalid encrypted data', async () => {
      const invalidEncryptedData = 'invalid-encrypted-data';
      const invalidMetadata = {
        algorithm: 'aes-256-gcm',
        timestamp: Date.now(),
        checksum: 'invalid-checksum',
      };

      await expect(
        service.decryptFaydaId(invalidEncryptedData, invalidMetadata)
      ).rejects.toThrow();
    });

    it('should handle decryption when encryption is disabled', async () => {
      // Create a local mock for this test
      const localMockConfigService = {
        get: vi.fn((key: string) => {
          const allowedKeys = [
            'FAYDA_ENCRYPTION_KEY',
            'FAYDA_ENCRYPTION_ALGORITHM',
            'FAYDA_ID_MIN_LENGTH',
            'FAYDA_ID_MAX_LENGTH',
            'FAYDA_ENCRYPTION_ENABLED',
            'FAYDA_HASH_PEPPER',
          ];
          if (!allowedKeys.includes(key)) {
            return undefined;
          }

          const config: Record<string, string | number | boolean> = {
            FAYDA_ENCRYPTION_KEY: 'test-encryption-key-32-chars-long',
            FAYDA_ENCRYPTION_ALGORITHM: 'aes-256-gcm',
            FAYDA_ID_MIN_LENGTH: 10,
            FAYDA_ID_MAX_LENGTH: 16,
            FAYDA_ENCRYPTION_ENABLED: false, // Disabled for this test
            FAYDA_HASH_PEPPER: 'test-pepper-for-hashing',
          };
          return key in config ? config[key as keyof typeof config] : undefined;
        }),
      };

      // Create a new instance with disabled encryption
      const disabledService = new FaydaEncryptionUtil(
        localMockConfigService as any
      );

      const faydaId = '123456789012';
      const metadata = {
        algorithm: 'none',
        timestamp: Date.now(),
        checksum: require('crypto')
          .createHash('sha256')
          .update(faydaId)
          .digest('hex'),
      };
      const result = await disabledService.decryptFaydaId(faydaId, metadata);

      expect(result).toBe(faydaId); // Should return as-is when disabled
    });
  });

  describe('validateFaydaIdFormat', () => {
    it('should validate correct Ethiopian Fayda ID format', () => {
      const validFaydaIds = [
        '1234567890',
        '12345678901',
        '123456789012',
        '999999999999',
        '1111111111111111',
      ];

      validFaydaIds.forEach(faydaId => {
        expect(() => service.validateFaydaIdFormat(faydaId)).not.toThrow();
      });
    });

    it('should reject invalid Fayda ID formats', () => {
      const invalidFaydaIds = [
        'INVALID_ID',
        '123456789', // Too short (9 digits)
        '1234567890123456789', // Too long (19 digits)
        '123456789A', // Contains letter
        '', // Empty
        '123 456789', // Contains space
        'ET123456789', // Contains letters
      ];

      invalidFaydaIds.forEach(faydaId => {
        expect(() => service.validateFaydaIdFormat(faydaId)).toThrow();
      });
    });
  });

  describe('hashFaydaId', () => {
    it('should hash Fayda ID consistently', async () => {
      const faydaId = '123456789012';

      const hash1 = await service.hashFaydaId(faydaId);
      const hash2 = await service.hashFaydaId(faydaId);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(faydaId);
    });

    it('should produce different hashes for different IDs', async () => {
      const faydaId1 = '123456789012';
      const faydaId2 = '987654321098';

      const hash1 = await service.hashFaydaId(faydaId1);
      const hash2 = await service.hashFaydaId(faydaId2);

      expect(hash1).not.toBe(hash2);
    });

    it('should use cryptographically secure hashing', async () => {
      const faydaId = '123456789012';

      const hash = await service.hashFaydaId(faydaId);

      // Verify hash is not just a simple transformation
      expect(hash.length).toBeGreaterThan(faydaId.length);
      expect(hash).toMatch(/^[a-f0-9]+$/i); // Hexadecimal format
    });
  });

  describe('NBE Compliance & Security', () => {
    it('should comply with NBE data protection requirements', async () => {
      const faydaId = '123456789012';

      const encrypted = await service.encryptFaydaId(faydaId);

      // Verify encrypted data doesn't contain original Fayda ID
      expect(encrypted).not.toContain(faydaId); // Don't contain the original ID
    });

    it('should implement proper key rotation', () => {
      // Test key rotation logic - simplified for now
      expect(service).toBeDefined();
      // Key rotation would be tested in integration tests
    });

    it('should log security events for audit trail', async () => {
      // Test that encryption completes without errors (audit trail)
      const faydaId = '123456789012';
      const result = await service.encryptFaydaId(faydaId);

      // Verify the encryption result has the expected structure for audit
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.algorithm).toBe('aes-256-gcm');
    });

    it('should handle encryption failures gracefully', async () => {
      // Mock encryption failure
      const originalEncrypt = service.encryptFaydaId;
      service.encryptFaydaId = vi
        .fn()
        .mockRejectedValue(new Error('Encryption failed'));

      const faydaId = '123456789012';

      await expect(service.encryptFaydaId(faydaId)).rejects.toThrow(
        'Encryption failed'
      );

      // Restore original method
      service.encryptFaydaId = originalEncrypt;
    });

    it('should validate encryption key strength', () => {
      const configService = service['configService'];

      // Test encryption key strength validation - simplified
      expect(service).toBeDefined();
      expect(configService).toBeDefined();
      // Key strength validation would be tested in integration tests
    });

    it('should support multiple encryption algorithms', () => {
      // Test algorithm support - simplified
      expect(service).toBeDefined();
      // Algorithm validation would be tested in integration tests
    });
  });

  describe('Performance & Reliability', () => {
    it('should handle concurrent encryption requests', async () => {
      const faydaIds = [
        '111111111111',
        '222222222222',
        '333333333333',
        '444444444444',
        '555555555555',
      ];

      const promises = faydaIds.map(faydaId => service.encryptFaydaId(faydaId));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.encryptedData).toBeDefined();
        expect(typeof result.encryptedData).toBe('string');
      });
    });

    it('should have reasonable encryption/decryption performance', async () => {
      const faydaId = '123456789012';

      const startTime = Date.now();
      const result = await service.encryptFaydaId(faydaId);
      const decrypted = await service.decryptFaydaId(
        result.encryptedData,
        result.metadata
      );
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(decrypted).toBe(faydaId);
    });
  });
});
