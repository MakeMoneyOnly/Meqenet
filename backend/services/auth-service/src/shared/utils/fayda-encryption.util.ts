import * as crypto from 'crypto';
import { promisify } from 'util';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

const pbkdf2Async = promisify(crypto.pbkdf2);

const CRYPTO_CONSTANTS = {
  ALGORITHM: 'aes-256-gcm',
  KEY_DERIVATION_ITERATIONS: 100_000,
  SALT_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  PBKDF2_KEY_LENGTH: 32,
  MIN_PASSWORD_LENGTH: 8,
} as const;

/**
 * Encrypted Fayda ID result interface
 */
interface EncryptedFaydaIdResult {
  readonly encryptedData: string;
  readonly metadata: {
    readonly algorithm: string;
    readonly timestamp: number;
    readonly checksum: string;
  };
}

/**
 * Fayda ID hash result interface
 */
interface FaydaIdHashResult {
  readonly hash: string;
  readonly algorithm: string;
  readonly timestamp: number;
}

/**
 * Audit log entry interface
 */
interface AuditLogEntry {
  readonly timestamp: string;
  readonly operation: 'encrypt' | 'decrypt' | 'hash';
  readonly userId: string;
  readonly success: boolean;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

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
  private readonly algorithm = CRYPTO_CONSTANTS.ALGORITHM;
  private readonly keyDerivationIterations =
    CRYPTO_CONSTANTS.KEY_DERIVATION_ITERATIONS;
  private readonly saltLength = CRYPTO_CONSTANTS.SALT_LENGTH;
  private readonly ivLength = CRYPTO_CONSTANTS.IV_LENGTH;
  private readonly tagLength = CRYPTO_CONSTANTS.TAG_LENGTH;
  private readonly pbkdf2KeyLength = CRYPTO_CONSTANTS.PBKDF2_KEY_LENGTH;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Encrypts Fayda National ID data
   * @param faydaId - The Fayda National ID to encrypt
   * @param additionalData - Optional additional authenticated data
   * @returns Encrypted data with metadata for decryption
   */
  async encryptFaydaId(
    faydaId: string,
    additionalData?: string
  ): Promise<EncryptedFaydaIdResult> {
    // Input validation
    if (!faydaId || typeof faydaId !== 'string') {
      throw new Error('Fayda ID must be a non-empty string');
    }

    if (additionalData !== undefined && typeof additionalData !== 'string') {
      throw new Error('Additional data must be a string if provided');
    }

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
      cipher.setAAD(Buffer.from(additionalData ?? 'fayda-meqenet', 'utf8'));

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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown encryption error';
      throw new Error(`Fayda ID encryption failed: ${errorMessage}`);
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
    // Input validation
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Encrypted data must be a non-empty string');
    }

    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Metadata must be provided');
    }

    if (
      !metadata.algorithm ||
      !metadata.checksum ||
      typeof metadata.timestamp !== 'number'
    ) {
      throw new Error('Invalid metadata: missing required fields');
    }

    if (additionalData !== undefined && typeof additionalData !== 'string') {
      throw new Error('Additional data must be a string if provided');
    }

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

      // Validate buffer length
      const minimumLength =
        this.saltLength + this.ivLength + this.tagLength + 1;
      if (combined.length < minimumLength) {
        throw new Error('Invalid encrypted data: buffer too short');
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
      gcmDecipher.setAAD(
        Buffer.from(additionalData ?? 'fayda-meqenet', 'utf8')
      );
      gcmDecipher.setAuthTag(tag);

      // Decrypt the data
      let decrypted = gcmDecipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, gcmDecipher.final()]);

      const faydaId = decrypted.toString('utf8');

      // Validate decrypted Fayda ID format
      this.validateFaydaIdFormat(faydaId);

      return faydaId;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown decryption error';
      throw new Error(`Fayda ID decryption failed: ${errorMessage}`);
    }
  }

  /**
   * Derives encryption key using PBKDF2 asynchronously.
   * @param salt - Random salt for key derivation
   * @returns Derived encryption key
   */
  private async deriveKey(salt: Buffer): Promise<Buffer> {
    const masterKey = this.configService.get<string>('faydaEncryptionKey');
    if (!masterKey || typeof masterKey !== 'string') {
      throw new Error('Fayda encryption key not configured');
    }

    // Use the promisified asynchronous version of pbkdf2
    return pbkdf2Async(
      masterKey,
      salt,
      this.keyDerivationIterations,
      this.pbkdf2KeyLength, // 256 bits
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

    if (faydaId.trim() !== faydaId) {
      throw new Error(
        'Invalid Fayda ID: contains leading or trailing whitespace'
      );
    }

    if (!faydaIdPattern.test(faydaId)) {
      throw new Error('Invalid Fayda ID format: must be 10-16 digits');
    }
  }

  /**
   * Creates a secure hash of Fayda ID for database indexing
   * This allows searching without exposing the actual ID
   * @param faydaId - Fayda ID to hash
   * @returns Secure hash for indexing
   */
  createFaydaIdHash(faydaId: string): FaydaIdHashResult {
    if (!faydaId || typeof faydaId !== 'string') {
      throw new Error('Fayda ID must be a non-empty string');
    }

    this.validateFaydaIdFormat(faydaId);

    const salt = this.configService.get<string>('faydaHashSalt');
    if (!salt || typeof salt !== 'string') {
      throw new Error('Fayda hash salt not configured');
    }

    const hash = crypto
      .createHmac('sha256', salt)
      .update(faydaId)
      .digest('hex');

    return {
      hash,
      algorithm: 'sha256-hmac',
      timestamp: Date.now(),
    };
  }

  /**
   * Creates an audit log entry for compliance tracking
   * @param operation - Type of operation performed
   * @param userId - ID of user performing operation
   * @param success - Whether operation was successful
   * @returns Audit log entry
   */
  createAuditLogEntry(
    operation: 'encrypt' | 'decrypt' | 'hash',
    userId: string,
    success: boolean
  ): AuditLogEntry {
    if (!operation || !['encrypt', 'decrypt', 'hash'].includes(operation)) {
      throw new Error('Invalid operation type');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }

    if (typeof success !== 'boolean') {
      throw new Error('Success flag must be a boolean');
    }

    return {
      timestamp: new Date().toISOString(),
      operation,
      userId: userId.trim(),
      success,
      // Note: IP address and user agent would be injected by middleware
      // in a real implementation to avoid dependency on request context
    };
  }

  /**
   * Hashes a password using Argon2id (industry standard for FinTech)
   * Argon2id is the winner of the Password Hashing Competition and provides
   * the best security against both GPU and ASIC attacks.
   * @param password - Plain text password to hash
   * @returns Hashed password string
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < CRYPTO_CONSTANTS.MIN_PASSWORD_LENGTH) {
      throw new Error(
        `Password must be at least ${CRYPTO_CONSTANTS.MIN_PASSWORD_LENGTH} characters long`
      );
    }

    try {
      // Use Argon2id with secure parameters for FinTech applications
      // timeCost: 3 (iterations), memoryCost: 65536 KB (64 MB), parallelism: 4
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB - recommended for server applications
        timeCost: 3, // 3 iterations - good balance of security and performance
        parallelism: 4, // 4 threads - suitable for most server environments
        hashLength: 32, // 256-bit hash output
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown hashing error';
      throw new Error(`Password hashing failed: ${errorMessage}`);
    }
  }

  /**
   * Verifies a password against its Argon2 hash
   * @param password - Plain text password to verify
   * @param hash - Argon2 hash to verify against
   * @returns True if password matches, false otherwise
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (!hash || typeof hash !== 'string') {
      throw new Error('Hash must be a non-empty string');
    }

    try {
      return await argon2.verify(hash, password);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown verification error';
      throw new Error(`Password verification failed: ${errorMessage}`);
    }
  }
}
