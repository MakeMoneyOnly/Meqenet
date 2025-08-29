import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

export interface FieldEncryptionResult<T = any> {
  data: T;
  encryptedFields: string[];
  keyId: string;
  algorithm: string;
}

@Injectable()
export class FieldEncryptionService {
  private readonly logger = new Logger(FieldEncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;
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
    private secretManagerService: SecretManagerService,
  ) {
    this.initializeEncryptionKey();
  }

  private initializeEncryptionKey(): void {
    try {
      // Use a master key from configuration or generate one
      const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY') ||
                       'default-master-key-change-in-production';

      // Derive encryption key using scrypt
      this.encryptionKey = scryptSync(masterKey, 'salt', 32);
      this.logger.log('✅ Field encryption service initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize encryption key:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive fields in an object
   */
  async encryptFields<T extends Record<string, any>>(
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
    const iv = randomBytes(16);

    for (const field of fields) {
      if (excludeFields.includes(field)) continue;
      if (field in encryptedData && encryptedData[field] != null) {
        const fieldValue = encryptedData[field];

        // Skip if already encrypted
        if (this.isEncryptedField(fieldValue)) continue;

        // Encrypt the field value
        const encryptedValue = await this.encryptValue(fieldValue, algorithm, iv);

        // Replace with encrypted field structure
        encryptedData[field] = {
          encrypted: true,
          value: encryptedValue,
          keyId: keyId || 'field-encryption-key',
          algorithm,
          iv: iv.toString('hex'),
        } as EncryptedField;

        encryptedFields.push(field);
      }
    }

    return {
      data: encryptedData,
      encryptedFields,
      keyId: keyId || 'field-encryption-key',
      algorithm,
    };
  }

  /**
   * Decrypt sensitive fields in an object
   */
  async decryptFields<T extends Record<string, any>>(
    data: T,
    options: EncryptionOptions = {}
  ): Promise<FieldEncryptionResult<T>> {
    const {
      fields = this.sensitiveFields,
      excludeFields = [],
    } = options;

    const decryptedData = { ...data };
    const encryptedFields: string[] = [];

    for (const field of fields) {
      if (excludeFields.includes(field)) continue;
      if (field in decryptedData) {
        const fieldValue = decryptedData[field];

        // Check if field is encrypted
        if (this.isEncryptedField(fieldValue)) {
          // Decrypt the field value
          const decryptedValue = await this.decryptValue(fieldValue);

          // Replace with decrypted value
          decryptedData[field] = decryptedValue;
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
    value: any,
    algorithm: string,
    iv: Buffer
  ): Promise<string> {
    try {
      const cipher = createCipheriv(algorithm, this.encryptionKey, iv);
      let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag for GCM mode
      const authTag = cipher.getAuthTag();

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
  private async decryptValue(encryptedField: EncryptedField): Promise<any> {
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
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
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
  private isEncryptedField(value: any): value is EncryptedField {
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
  async encryptForStorage<T extends Record<string, any>>(
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

    const options = fieldRules[tableName] || {
      fields: this.sensitiveFields,
    };

    return this.encryptFields(data, options);
  }

  /**
   * Decrypt data after retrieval from database
   */
  async decryptFromStorage<T extends Record<string, any>>(
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

    const options = fieldRules[tableName] || {
      fields: this.sensitiveFields,
    };

    return this.decryptFields(data, options);
  }

  /**
   * Encrypt data for API responses (selective encryption)
   */
  async encryptForResponse<T extends Record<string, any>>(
    data: T,
    sensitiveFields: string[] = []
  ): Promise<FieldEncryptionResult<T>> {
    const fieldsToEncrypt = sensitiveFields.length > 0
      ? sensitiveFields
      : this.sensitiveFields;

    return this.encryptFields(data, {
      fields: fieldsToEncrypt,
      excludeFields: ['id', 'createdAt', 'updatedAt'], // Never encrypt metadata
    });
  }

  /**
   * Decrypt data from API requests
   */
  async decryptFromRequest<T extends Record<string, any>>(
    data: T,
    sensitiveFields: string[] = []
  ): Promise<FieldEncryptionResult<T>> {
    const fieldsToDecrypt = sensitiveFields.length > 0
      ? sensitiveFields
      : this.sensitiveFields;

    return this.decryptFields(data, {
      fields: fieldsToDecrypt,
    });
  }

  /**
   * Generate a new encryption key for rotation
   */
  async rotateEncryptionKey(): Promise<string> {
    try {
      const newKey = randomBytes(32);
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
  async validateEncryption(data: Record<string, any>): Promise<boolean> {
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
  sanitizeForLogging<T extends Record<string, any>>(data: T): T {
    const sanitized = { ...data };

    for (const field of this.sensitiveFields) {
      if (field in sanitized) {
        if (this.isEncryptedField(sanitized[field])) {
          sanitized[field] = '[ENCRYPTED]';
        } else if (typeof sanitized[field] === 'string') {
          // Mask sensitive string fields
          sanitized[field] = this.maskSensitiveString(sanitized[field] as string);
        }
      }
    }

    return sanitized;
  }

  /**
   * Mask sensitive string data for safe display
   */
  private maskSensitiveString(value: string): string {
    if (value.length <= 4) return '*'.repeat(value.length);

    const visibleChars = Math.min(4, Math.floor(value.length * 0.2));
    const maskedChars = value.length - visibleChars * 2;

    return (
      value.substring(0, visibleChars) +
      '*'.repeat(maskedChars) +
      value.substring(value.length - visibleChars)
    );
  }
}
