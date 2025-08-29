import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Constants for magic numbers
const _MILLISECONDS_PER_SECOND = 1000;
const _SECONDS_PER_MINUTE = 60;

const _AES_KEY_LENGTH = 32; // 256-bit key
const _GCM_IV_LENGTH = 16; // 128-bit IV for GCM
const _SCRYPT_KEYLEN = 32;
const _SCRYPT_COST = 16384; // CPU/memory cost parameter
const _SCRYPT_BLOCK_SIZE = 8;
const _SCRYPT_PARALLELIZATION = 1;

const _MAX_ENCRYPTION_ATTEMPTS = 3;
const _FIELD_ENCRYPTION_VERSION = 1;

const _ENCRYPTION_TIMEOUT_SECONDS = 30;
const _CACHE_TTL_MINUTES = 5;

const _MAX_FIELD_SIZE_BYTES = 1048576; // 1MB limit
const _MAX_BATCH_SIZE = 100;

// String masking constants
const MIN_MASK_LENGTH = 4;
const MAX_VISIBLE_CHARS = 4;
const MASK_RATIO = 0.2;
const MASK_MULTIPLIER = 2;

import { SecretManagerService } from './secret-manager.service';

export interface EncryptionOptions {
  algorithm?: string;
  keyId?: string;
  fields?: string[];
  excludeFields?: string[];
}

export interface EncryptedField {
  encrypted: boolean;
  value: string;
  keyId?: string;
  algorithm: string;
  iv?: string;
}

export interface FieldEncryptionResult<T = Record<string, unknown>> {
  data: T;
  encryptedFields: string[];
  keyId: string;
  algorithm: string;
}

@Injectable()
export class FieldEncryptionService {
  private readonly logger = new Logger(FieldEncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private encryptionKey!: Buffer;
  private readonly sensitiveFields = [
    'password',
    'ssn',
    'socialSecurityNumber',
    'creditCard',
    'cardNumber',
    'cvv',
    'cvvCode',
    'securityCode',
    'bankAccount',
    'accountNumber',
    'routingNumber',
    'iban',
    'swift',
    'taxId',
    'passportNumber',
    'driversLicense',
    'phoneNumber',
    'email',
    'address',
    'dateOfBirth',
    'motherMaidenName',
    'securityQuestion',
    'pin',
    'otp',
    'twoFactorSecret',
  ];

  constructor(
    private configService: ConfigService,
    private secretManagerService: SecretManagerService
  ) {
    this.initializeEncryptionKey();
  }

  private initializeEncryptionKey(): void {
    try {
      // Use a master key from configuration or generate one
      const masterKey =
        this.configService.get<string>('ENCRYPTION_MASTER_KEY') ??
        'default-master-key-change-in-production';

      // Derive encryption key using scrypt
      this.encryptionKey = scryptSync(masterKey, 'salt', _SCRYPT_KEYLEN);
      this.logger.log('✅ Field encryption service initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize encryption key:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive fields in an object
   */
  async encryptFields<T extends Record<string, unknown>>(
    data: T,
    options: EncryptionOptions = {}
  ): Promise<FieldEncryptionResult<T>> {
    const {
      algorithm = this.algorithm,
      keyId,
      fields = this.sensitiveFields,
      excludeFields = [],
    } = options;

    const encryptedData = { ...data };
    const encryptedFields: string[] = [];

    // Generate IV for this encryption operation
    const iv = randomBytes(_GCM_IV_LENGTH);

    for (const field of fields) {
      if (excludeFields.includes(field)) continue;
      // Validate field name to prevent object injection
      if (
        typeof field === 'string' &&
        /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field) &&
        field in encryptedData
      ) {
        // Safely access the field value using Object.getOwnPropertyDescriptor
        const descriptor = Object.getOwnPropertyDescriptor(
          encryptedData,
          field
        );
        const fieldValue =
          descriptor &&
          descriptor.value !== undefined &&
          descriptor.value != null
            ? descriptor.value
            : undefined;

        // Skip if already encrypted
        if (this.isEncryptedField(fieldValue)) continue;

        // Encrypt the field value
        const encryptedValue = await this.encryptValue(
          fieldValue,
          algorithm,
          iv
        );

        // Replace with encrypted field structure using safer property assignment
        Object.defineProperty(encryptedData, field, {
          value: {
            encrypted: true,
            value: encryptedValue,
            keyId: keyId ?? 'field-encryption-key',
            algorithm,
            iv: iv.toString('hex'),
          } as EncryptedField,
          writable: true,
          enumerable: true,
          configurable: true,
        });

        encryptedFields.push(field);
      }
    }

    return {
      data: encryptedData,
      encryptedFields,
      keyId: keyId ?? 'field-encryption-key',
      algorithm,
    };
  }

  /**
   * Decrypt sensitive fields in an object
   */
  async decryptFields<T extends Record<string, unknown>>(
    data: T,
    options: EncryptionOptions = {}
  ): Promise<FieldEncryptionResult<T>> {
    const { fields = this.sensitiveFields, excludeFields = [] } = options;

    const decryptedData = { ...data };
    const encryptedFields: string[] = [];

    for (const field of fields) {
      if (excludeFields.includes(field)) continue;
      // Validate field name to prevent object injection
      if (
        typeof field === 'string' &&
        /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field) &&
        field in decryptedData
      ) {
        // Safely access the field value using Object.getOwnPropertyDescriptor
        const descriptor = Object.getOwnPropertyDescriptor(
          decryptedData,
          field
        );
        const fieldValue =
          descriptor && descriptor.value !== undefined
            ? descriptor.value
            : undefined;

        // Check if field is encrypted
        if (fieldValue !== undefined && this.isEncryptedField(fieldValue)) {
          // Decrypt the field value
          const decryptedValue = await this.decryptValue(fieldValue);

          // Replace with decrypted value using safer property assignment
          Object.defineProperty(decryptedData, field, {
            value: decryptedValue,
            writable: true,
            enumerable: true,
            configurable: true,
          });
          encryptedFields.push(field);
        }
      }
    }

    return {
      data: decryptedData,
      encryptedFields,
      keyId: 'field-encryption-key',
      algorithm: this.algorithm,
    };
  }

  /**
   * Encrypt a single value
   */
  private async encryptValue(
    value: unknown,
    algorithm: string,
    iv: Buffer
  ): Promise<string> {
    try {
      const cipher = createCipheriv(algorithm, this.encryptionKey, iv);
      let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag for GCM mode
      const authTag = (
        cipher as unknown as { getAuthTag(): Buffer }
      ).getAuthTag();

      // Return encrypted data with auth tag
      return JSON.stringify({
        data: encrypted,
        authTag: authTag.toString('hex'),
      });
    } catch (error) {
      this.logger.error('❌ Field encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a single value
   */
  private async decryptValue(encryptedField: EncryptedField): Promise<unknown> {
    try {
      const { value, iv, algorithm = this.algorithm } = encryptedField;

      if (!iv || !value) {
        throw new Error('Invalid encrypted field structure');
      }

      const encryptedData = JSON.parse(value);
      const decipher = createDecipheriv(
        algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );

      // Set auth tag for GCM mode
      if (encryptedData.authTag) {
        (
          decipher as unknown as { setAuthTag(authTag: Buffer): void }
        ).setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      }

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('❌ Field decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Check if a field value is encrypted
   */
  private isEncryptedField(value: unknown): value is EncryptedField {
    return (
      typeof value === 'object' &&
      value !== null &&
      'encrypted' in value &&
      value.encrypted === true &&
      'value' in value
    );
  }

  /**
   * Encrypt sensitive data before database storage
   */
  async encryptForStorage<T extends Record<string, unknown>>(
    data: T,
    tableName: string
  ): Promise<FieldEncryptionResult<T>> {
    // Define field encryption rules based on table/entity type
    const fieldRules: Record<string, EncryptionOptions> = {
      users: {
        fields: ['password', 'email', 'phoneNumber', 'dateOfBirth', 'ssn'],
      },
      payments: {
        fields: ['cardNumber', 'cvv', 'expiryDate', 'cardholderName'],
      },
      bank_accounts: {
        fields: ['accountNumber', 'routingNumber', 'iban', 'swift'],
      },
      identities: {
        fields: ['passportNumber', 'driversLicense', 'taxId'],
      },
      addresses: {
        fields: ['streetAddress', 'city', 'postalCode'],
      },
    };

    // Safely access field rules with validation
    const tableKey =
      typeof tableName === 'string' &&
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)
        ? tableName
        : 'default';
    const fieldRuleDescriptor = Object.getOwnPropertyDescriptor(
      fieldRules,
      tableKey
    );
    const options = (fieldRuleDescriptor?.value as EncryptionOptions) ?? {
      fields: this.sensitiveFields,
    };

    return this.encryptFields(data, options);
  }

  /**
   * Decrypt data after retrieval from database
   */
  async decryptFromStorage<T extends Record<string, unknown>>(
    data: T,
    tableName: string
  ): Promise<FieldEncryptionResult<T>> {
    const fieldRules: Record<string, EncryptionOptions> = {
      users: {
        fields: ['password', 'email', 'phoneNumber', 'dateOfBirth', 'ssn'],
      },
      payments: {
        fields: ['cardNumber', 'cvv', 'expiryDate', 'cardholderName'],
      },
      bank_accounts: {
        fields: ['accountNumber', 'routingNumber', 'iban', 'swift'],
      },
      identities: {
        fields: ['passportNumber', 'driversLicense', 'taxId'],
      },
      addresses: {
        fields: ['streetAddress', 'city', 'postalCode'],
      },
    };

    // Safely access field rules with validation
    const tableKey =
      typeof tableName === 'string' &&
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)
        ? tableName
        : 'default';
    const fieldRuleDescriptor = Object.getOwnPropertyDescriptor(
      fieldRules,
      tableKey
    );
    const options = (fieldRuleDescriptor?.value as EncryptionOptions) ?? {
      fields: this.sensitiveFields,
    };

    return this.decryptFields(data, options);
  }

  /**
   * Encrypt data for API responses (selective encryption)
   */
  async encryptForResponse<T extends Record<string, unknown>>(
    data: T,
    sensitiveFields: string[] = []
  ): Promise<FieldEncryptionResult<T>> {
    const fieldsToEncrypt =
      sensitiveFields.length > 0 ? sensitiveFields : this.sensitiveFields;

    return this.encryptFields(data, {
      fields: fieldsToEncrypt,
      excludeFields: ['id', 'createdAt', 'updatedAt'], // Never encrypt metadata
    });
  }

  /**
   * Decrypt data from API requests
   */
  async decryptFromRequest<T extends Record<string, unknown>>(
    data: T,
    sensitiveFields: string[] = []
  ): Promise<FieldEncryptionResult<T>> {
    const fieldsToDecrypt =
      sensitiveFields.length > 0 ? sensitiveFields : this.sensitiveFields;

    return this.decryptFields(data, {
      fields: fieldsToDecrypt,
    });
  }

  /**
   * Generate a new encryption key for rotation
   */
  async rotateEncryptionKey(): Promise<string> {
    try {
      const newKey = randomBytes(_AES_KEY_LENGTH);
      const keyId = `encryption-key-${Date.now()}`;

      // Store the new key securely
      await this.secretManagerService.createSecret(keyId, {
        key: newKey.toString('hex'),
        createdAt: new Date().toISOString(),
        algorithm: this.algorithm,
      });

      this.logger.log(`🔄 Encryption key rotated: ${keyId}`);
      return keyId;
    } catch (error) {
      this.logger.error('❌ Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Validate encryption integrity
   */
  async validateEncryption(data: Record<string, unknown>): Promise<boolean> {
    try {
      // Attempt to decrypt all encrypted fields
      const decrypted = await this.decryptFields(data);
      return decrypted.encryptedFields.length > 0;
    } catch (error) {
      this.logger.error('❌ Encryption validation failed:', error);
      return false;
    }
  }

  /**
   * Get encryption statistics
   */
  getEncryptionStats(): {
    algorithm: string;
    keyId: string;
    sensitiveFields: string[];
    supportsKeyRotation: boolean;
  } {
    return {
      algorithm: this.algorithm,
      keyId: 'field-encryption-key',
      sensitiveFields: [...this.sensitiveFields],
      supportsKeyRotation: true,
    };
  }

  /**
   * Sanitize data for logging (remove encrypted values)
   */
  sanitizeForLogging<T extends Record<string, unknown>>(data: T): T {
    const sanitized = { ...data };

    for (const field of this.sensitiveFields) {
      // Validate field name to prevent object injection
      if (
        typeof field === 'string' &&
        /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field) &&
        field in sanitized
      ) {
        // Safely access the field value using Object.getOwnPropertyDescriptor
        const descriptor = Object.getOwnPropertyDescriptor(sanitized, field);
        const fieldValue =
          descriptor && descriptor.value !== undefined
            ? descriptor.value
            : undefined;

        if (fieldValue !== undefined && this.isEncryptedField(fieldValue)) {
          // Use Object.defineProperty for safer assignment
          Object.defineProperty(sanitized, field, {
            value: '[ENCRYPTED]',
            writable: true,
            enumerable: true,
            configurable: true,
          });
        } else if (typeof fieldValue === 'string') {
          // Mask sensitive string fields
          const maskedValue = this.maskSensitiveString(fieldValue);
          Object.defineProperty(sanitized, field, {
            value: maskedValue,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }
    }

    return sanitized;
  }

  /**
   * Mask sensitive string data for safe display
   */
  private maskSensitiveString(value: string): string {
    if (value.length <= MIN_MASK_LENGTH) return '*'.repeat(value.length);

    const visibleChars = Math.min(
      MAX_VISIBLE_CHARS,
      Math.floor(value.length * MASK_RATIO)
    );
    const maskedChars = value.length - visibleChars * MASK_MULTIPLIER;

    return (
      value.substring(0, visibleChars) +
      '*'.repeat(maskedChars) +
      value.substring(value.length - visibleChars)
    );
  }
}
