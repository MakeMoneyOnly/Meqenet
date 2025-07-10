import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Fayda National ID Encryption Utility
 *
 * Implements encryption standards for Ethiopian Fayda National ID data
 * as required by Ethiopian government data protection laws and NBE regulations.
 *
 * This utility ensures:
 * - AES-256-GCM encryption for maximum security
 * - Proper key derivation using PBKDF2
 * - Data integrity verification
 * - Compliance with Ethiopian data residency laws
 */
@Injectable()
export class FaydaEncryptionUtil {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationIterations = 100000;
  private readonly saltLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;

  constructor(private configService: ConfigService) {}

  /**
   * Encrypts Fayda National ID data
   * @param faydaId - The Fayda National ID to encrypt
   * @param additionalData - Optional additional authenticated data
   * @returns Encrypted data with metadata for decryption
   */
  async encryptFaydaId(
    faydaId: string,
    additionalData?: string
  ): Promise<{
    encryptedData: string;
    metadata: {
      algorithm: string;
      timestamp: number;
      checksum: string;
    };
  }> {
    try {
      // Validate Fayda ID format (basic validation)
      this.validateFaydaIdFormat(faydaId);

      // Generate salt and IV
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);

      // Derive encryption key
      const key = await this.deriveKey(salt);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(Buffer.from(additionalData || 'fayda-meqenet', 'utf8'));

      // Encrypt the data
      let encrypted = cipher.update(faydaId, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine all components
      const combined = Buffer.concat([salt, iv, tag, encrypted]);

      // Create checksum for integrity verification
      const checksum = crypto
        .createHash('sha256')
        .update(combined)
        .digest('hex');

      return {
        encryptedData: combined.toString('base64'),
        metadata: {
          algorithm: this.algorithm,
          timestamp: Date.now(),
          checksum,
        },
      };
    } catch (error) {
      throw new Error(`Fayda ID encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypts Fayda National ID data
   * @param encryptedData - Base64 encoded encrypted data
   * @param metadata - Encryption metadata
   * @param additionalData - Optional additional authenticated data
   * @returns Decrypted Fayda ID
   */
  async decryptFaydaId(
    encryptedData: string,
    metadata: {
      algorithm: string;
      timestamp: number;
      checksum: string;
    },
    additionalData?: string
  ): Promise<string> {
    try {
      // Verify integrity
      const combined = Buffer.from(encryptedData, 'base64');
      const currentChecksum = crypto
        .createHash('sha256')
        .update(combined)
        .digest('hex');

      if (currentChecksum !== metadata.checksum) {
        throw new Error('Data integrity verification failed');
      }

      // Extract components
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(
        this.saltLength,
        this.saltLength + this.ivLength
      );
      const tag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = combined.subarray(
        this.saltLength + this.ivLength + this.tagLength
      );

      // Derive decryption key
      const key = await this.deriveKey(salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(metadata.algorithm, key, iv);
      
      // Type assertion for GCM-specific methods
      const gcmDecipher = decipher as crypto.DecipherGCM;
      gcmDecipher.setAAD(Buffer.from(additionalData || 'fayda-meqenet', 'utf8'));
      gcmDecipher.setAuthTag(tag);

      // Decrypt the data
      let decrypted = gcmDecipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, gcmDecipher.final()]);

      const faydaId = decrypted.toString('utf8');

      // Validate decrypted Fayda ID format
      this.validateFaydaIdFormat(faydaId);

      return faydaId;
    } catch (error) {
      throw new Error(`Fayda ID decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Derives encryption key using PBKDF2
   * @param salt - Random salt for key derivation
   * @returns Derived encryption key
   */
  private async deriveKey(salt: Buffer): Promise<Buffer> {
    const masterKey = this.configService.get('FAYDA_ENCRYPTION_KEY');
    if (!masterKey) {
      throw new Error('Fayda encryption key not configured');
    }

    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.keyDerivationIterations,
      32, // 256 bits
      'sha256'
    );
  }

  /**
   * Validates Fayda National ID format
   * Ethiopian Fayda IDs follow specific format requirements
   * @param faydaId - Fayda ID to validate
   */
  private validateFaydaIdFormat(faydaId: string): void {
    // Basic validation - actual format may vary
    // Ethiopian Fayda ID format: typically numeric, specific length
    const faydaIdPattern = /^[0-9]{10,16}$/; // Adjust pattern as needed

    if (!faydaId || typeof faydaId !== 'string') {
      throw new Error('Invalid Fayda ID: must be a non-empty string');
    }

    if (!faydaIdPattern.test(faydaId)) {
      throw new Error('Invalid Fayda ID format: must be 10-16 digits');
    }
  }

  /**
   * Creates a secure hash of Fayda ID for database indexing
   * This allows searching without exposing the actual ID
   * @param faydaId - Fayda ID to hash
   * @returns Secure hash suitable for database indexing
   */
  createFaydaIdHash(faydaId: string): string {
    this.validateFaydaIdFormat(faydaId);

    const pepper = this.configService.get(
      'FAYDA_HASH_PEPPER',
      'meqenet-ethiopia'
    );
    const combined = `${faydaId}:${pepper}`;

    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Generates audit log entry for Fayda ID operations
   * Required for NBE compliance and audit trails
   * @param operation - Operation performed (encrypt/decrypt/hash)
   * @param userId - User performing the operation
   * @param success - Whether operation was successful
   * @returns Audit log entry
   */
  createAuditLogEntry(
    operation: 'encrypt' | 'decrypt' | 'hash',
    userId: string,
    success: boolean
  ): {
    timestamp: string;
    operation: string;
    userId: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      timestamp: new Date().toISOString(),
      operation: `fayda_${operation}`,
      userId,
      success,
      // Additional fields can be populated by the calling service
      ipAddress: undefined,
      userAgent: undefined,
    };
  }
}
