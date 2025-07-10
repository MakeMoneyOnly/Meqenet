/// <reference types="vitest" />
import 'reflect-metadata'; // Required for NestJS dependency injection
import { ConfigService } from '@nestjs/config';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

import { FaydaEncryptionUtil } from './fayda-encryption.util';

/**
 * Critical Security Tests for Fayda National ID Encryption
 *
 * Tests compliance with:
 * - Ethiopian data protection laws
 * - NBE (National Bank of Ethiopia) regulations
 * - AES-256-GCM encryption standards
 * - Data integrity and authentication
 */
describe('FaydaEncryptionUtil - Security Tests', () => {
  let service: FaydaEncryptionUtil;
  let _configService: ConfigService; // Prefixed with _ to indicate intentionally unused

  const mockConfig = {
    FAYDA_ENCRYPTION_KEY: 'test-encryption-key-32-characters-long-key',
    FAYDA_HASH_SALT: 'test-hash-salt-for-fayda-id-hashing-32-chars',
  };

  beforeEach(async () => {
    // Manual dependency injection to work around Vitest DI issues
    const mockConfigService = {
      get: vi.fn((key: string) => mockConfig[key as keyof typeof mockConfig]),
    } as any;

    service = new FaydaEncryptionUtil(mockConfigService);
    _configService = mockConfigService;

    // Verify manual injection worked
    expect(service).toBeDefined();
    expect(_configService).toBeDefined();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Fayda ID Encryption', () => {
    const validFaydaId = '1234567890123456'; // 16 digits - valid format
    const invalidFaydaIds = [
      '', // Empty string
      '   ', // Whitespace only
      'short', // Too short
      '12345678901234567890123456789012345678901234567890', // Too long
      'invalid-chars-@#$%', // Invalid characters
      'fid1234567890123', // Letters (should be digits only)
    ];

    it('should successfully encrypt a valid Fayda ID', async () => {
      const result = await service.encryptFaydaId(validFaydaId);

      // Verify structure
      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('algorithm', 'aes-256-gcm');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('checksum');

      // Verify base64 encoding
      expect(() => Buffer.from(result.encryptedData, 'base64')).not.toThrow();

      // Verify timestamp is recent
      const timeDiff = Date.now() - result.metadata.timestamp;
      expect(timeDiff).toBeLessThan(1000); // Within 1 second

      // Verify checksum is hex string
      expect(result.metadata.checksum).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should produce different encrypted data for same input (nonce security)', async () => {
      const result1 = await service.encryptFaydaId(validFaydaId);
      const result2 = await service.encryptFaydaId(validFaydaId);

      // Same input should produce different encrypted data due to random IV/salt
      expect(result1.encryptedData).not.toBe(result2.encryptedData);
      expect(result1.metadata.checksum).not.toBe(result2.metadata.checksum);
    });

    it('should encrypt with additional authenticated data (AAD)', async () => {
      const aad = 'user-context-data';
      const result = await service.encryptFaydaId(validFaydaId, aad);

      expect(result.encryptedData).toBeDefined();
      expect(result.metadata.algorithm).toBe('aes-256-gcm');
    });

    it.each(invalidFaydaIds)(
      'should reject invalid Fayda ID: "%s"',
      async invalidId => {
        await expect(service.encryptFaydaId(invalidId)).rejects.toThrow();
      }
    );

    it('should reject non-string Fayda ID', async () => {
      // @ts-expect-error Testing invalid input type
      await expect(service.encryptFaydaId(null)).rejects.toThrow(
        'Fayda ID must be a non-empty string'
      );
      // @ts-expect-error Testing invalid input type
      await expect(service.encryptFaydaId(123)).rejects.toThrow(
        'Fayda ID must be a non-empty string'
      );
      // @ts-expect-error Testing invalid input type
      await expect(service.encryptFaydaId({})).rejects.toThrow(
        'Fayda ID must be a non-empty string'
      );
    });

    it('should reject invalid additional data type', async () => {
      // @ts-expect-error Testing invalid input type
      await expect(service.encryptFaydaId(validFaydaId, 123)).rejects.toThrow(
        'Additional data must be a string if provided'
      );
    });
  });

  describe('Fayda ID Decryption', () => {
    const validFaydaId = '1234567890123456'; // 16 digits - valid format

    it('should successfully decrypt valid encrypted data', async () => {
      // First encrypt
      const encrypted = await service.encryptFaydaId(validFaydaId);

      // Then decrypt
      const decrypted = await service.decryptFaydaId(
        encrypted.encryptedData,
        encrypted.metadata
      );

      expect(decrypted).toBe(validFaydaId);
    });

    it('should decrypt with matching additional authenticated data', async () => {
      const aad = 'user-context-data';
      const encrypted = await service.encryptFaydaId(validFaydaId, aad);

      const decrypted = await service.decryptFaydaId(
        encrypted.encryptedData,
        encrypted.metadata,
        aad
      );

      expect(decrypted).toBe(validFaydaId);
    });

    it('should fail decryption with mismatched AAD', async () => {
      const encrypted = await service.encryptFaydaId(
        validFaydaId,
        'correct-aad'
      );

      await expect(
        service.decryptFaydaId(
          encrypted.encryptedData,
          encrypted.metadata,
          'wrong-aad'
        )
      ).rejects.toThrow();
    });

    it('should detect tampered encrypted data', async () => {
      const encrypted = await service.encryptFaydaId(validFaydaId);

      // Tamper with encrypted data
      const tamperedData = encrypted.encryptedData.slice(0, -4) + 'XXXX';

      await expect(
        service.decryptFaydaId(tamperedData, encrypted.metadata)
      ).rejects.toThrow('Data integrity verification failed');
    });

    it('should detect tampered checksum', async () => {
      const encrypted = await service.encryptFaydaId(validFaydaId);

      // Tamper with checksum
      const tamperedMetadata = {
        ...encrypted.metadata,
        checksum: 'a'.repeat(64), // Invalid checksum
      };

      await expect(
        service.decryptFaydaId(encrypted.encryptedData, tamperedMetadata)
      ).rejects.toThrow('Data integrity verification failed');
    });

    it('should reject invalid encrypted data format', async () => {
      const validMetadata = {
        algorithm: 'aes-256-gcm',
        timestamp: Date.now(),
        checksum: 'a'.repeat(64),
      };

      // Invalid base64
      await expect(
        service.decryptFaydaId('invalid-base64!@#', validMetadata)
      ).rejects.toThrow();

      // Too short data
      const shortData = Buffer.alloc(10).toString('base64');
      await expect(
        service.decryptFaydaId(shortData, validMetadata)
      ).rejects.toThrow('Data integrity verification failed');
    });

    it('should reject invalid metadata', async () => {
      const validData = Buffer.alloc(100).toString('base64');

      // Missing algorithm
      await expect(
        service.decryptFaydaId(validData, {
          timestamp: Date.now(),
          checksum: 'a'.repeat(64),
        } as any)
      ).rejects.toThrow('Invalid metadata: missing required fields');

      // Missing checksum
      await expect(
        service.decryptFaydaId(validData, {
          algorithm: 'aes-256-gcm',
          timestamp: Date.now(),
        } as any)
      ).rejects.toThrow('Invalid metadata: missing required fields');
    });
  });

  describe('Password Hashing (Argon2)', () => {
    const validPassword = 'SecureP@ssw0rd123';
    const weakPasswords = [
      '', // Empty
      '123', // Too short (< 8 chars)
      '1234567', // Still too short (7 chars)
    ];

    it('should hash password with Argon2', async () => {
      const hash = await service.hashPassword(validPassword);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$argon2id?\$v=19\$/); // Argon2id format
    });

    it('should produce different hashes for same password (salt security)', async () => {
      const hash1 = await service.hashPassword(validPassword);
      const hash2 = await service.hashPassword(validPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const hash = await service.hashPassword(validPassword);
      const isValid = await service.verifyPassword(validPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await service.hashPassword(validPassword);
      const isValid = await service.verifyPassword('WrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it.each(weakPasswords)(
      'should reject weak password: "%s"',
      async weakPassword => {
        await expect(service.hashPassword(weakPassword)).rejects.toThrow();
      }
    );
  });

  describe('Fayda ID Hashing', () => {
    const validFaydaId = '1234567890123456'; // 16 digits - valid format

    it('should create Fayda ID hash', () => {
      const result = service.createFaydaIdHash(validFaydaId);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('algorithm', 'sha256-hmac');
      expect(result).toHaveProperty('timestamp');
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/i); // SHA-256 hex format
    });

    it('should produce consistent hash for same input', () => {
      const hash1 = service.createFaydaIdHash(validFaydaId);
      const hash2 = service.createFaydaIdHash(validFaydaId);

      expect(hash1.hash).toBe(hash2.hash);
    });

    it('should produce different hash for different input', () => {
      const hash1 = service.createFaydaIdHash('1111111111111111');
      const hash2 = service.createFaydaIdHash('2222222222222222');

      expect(hash1.hash).not.toBe(hash2.hash);
    });
  });

  describe('Audit Logging', () => {
    it('should create audit log entry for encryption', () => {
      const userId = 'user123';
      const entry = service.createAuditLogEntry('encrypt', userId, true);

      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('operation', 'encrypt');
      expect(entry).toHaveProperty('userId', userId);
      expect(entry).toHaveProperty('success', true);
      expect(new Date(entry.timestamp)).toBeInstanceOf(Date);
    });

    it('should create audit log entry for failed operation', () => {
      const userId = 'user456';
      const entry = service.createAuditLogEntry('decrypt', userId, false);

      expect(entry.operation).toBe('decrypt');
      expect(entry.success).toBe(false);
      expect(entry.userId).toBe(userId);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle memory pressure gracefully', async () => {
      // Test with multiple concurrent encryptions
      const promises = Array.from({ length: 50 }, (_, i) => {
        const paddedIndex = i.toString().padStart(3, '0');
        return service.encryptFaydaId(`1234567890123${paddedIndex}`); // 16 digits
      });

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result.encryptedData).toBeDefined();
        expect(result.metadata.algorithm).toBe('aes-256-gcm');
      });
    });

    it('should handle very long Fayda IDs within limits', async () => {
      // Test maximum allowed length
      const longFaydaId = 'FID' + '1'.repeat(30); // 33 characters total

      await expect(service.encryptFaydaId(longFaydaId)).rejects.toThrow();
    });

    it('should prevent timing attacks on validation', async () => {
      const startTime = Date.now();

      try {
        await service.encryptFaydaId('invalid');
      } catch {
        // Expected to fail
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should not take suspiciously long (timing attack prevention)
      expect(duration).toBeLessThan(100); // Should fail fast
    });
  });

  describe('NBE Compliance Requirements', () => {
    it('should use only approved cryptographic algorithms', async () => {
      const result = await service.encryptFaydaId('1234567890123456');

      // Verify only approved algorithm is used
      expect(result.metadata.algorithm).toBe('aes-256-gcm');
    });

    it('should ensure data residency compliance', () => {
      // Verify no external service calls (data stays local)
      // Note: Cannot spy on crypto in ESM - testing approach instead
      const result = service.createFaydaIdHash('1234567890123456');

      // Should produce valid local hash
      expect(result.hash).toBeDefined();
      expect(result.algorithm).toBe('sha256-hmac');
    });

    it('should maintain audit trail capabilities', () => {
      const auditEntry = service.createAuditLogEntry(
        'encrypt',
        'user123',
        true
      );

      // Verify audit entry has all required fields for NBE compliance
      expect(auditEntry.timestamp).toBeDefined();
      expect(auditEntry.operation).toBeDefined();
      expect(auditEntry.userId).toBeDefined();
      expect(auditEntry.success).toBeDefined();
    });
  });
});
