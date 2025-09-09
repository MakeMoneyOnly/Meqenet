import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretManagerService } from './secret-manager.service';

// NOTE: Local crypto functions have been deprecated and removed in favor of KMS-based operations via SecretManagerService.

export interface EncryptionOptions {
  fields?: string[];
  excludeFields?: string[];
  keyId?: string;
}

export interface EncryptedField {
  encrypted: boolean;
  value: string; // Base64 encoded encrypted value
  keyId: string;
  algorithm: string;
  iv?: string; // IV is managed by KMS, but kept for schema compatibility if needed
}

export interface FieldEncryptionResult<T = Record<string, unknown>> {
  data: T;
  encryptedFields: string[];
  keyId: string;
}

@Injectable()
export class FieldEncryptionService implements OnModuleInit {
  private readonly logger = new Logger(FieldEncryptionService.name);
  private isInitialized = false;

  // List of fields considered sensitive by default across the application
  private readonly sensitiveFields = [
    // User details
    'email',
    'password',
    'passwordHash',
    'phone',
    'firstName',
    'lastName',
    'displayName',
    'faydaId',
    'faydaIdHash',
    'twoFactorSecret',

    // Financial & PII
    'accountNumber',
    'bankName',
    'cardNumber',
    'cvv',
    'expiryDate',
    'tin',
    'passportNumber',
    'nationalId',
    'address',
    'city',
    'country',
    'zipCode',

    // Security & Tokens
    'token',
    'accessToken',
    'refreshToken',
    'hashedToken',
    'clientSecret',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly secretManagerService: SecretManagerService
  ) {}

  onModuleInit() {
    this.initializeEncryptionKey();
  }

  private initializeEncryptionKey(): void {
    if (this.secretManagerService) {
      this.isInitialized = true;
      this.logger.log(
        '✅ Field encryption service initialized and linked to SecretManagerService (KMS)'
      );
    } else {
      this.logger.error(
        '❌ SecretManagerService not available. Field encryption is disabled.'
      );
      this.isInitialized = false;
    }
  }

  /**
   * Encrypt sensitive fields in an object using KMS
   */
  async encryptFields<T extends Record<string, unknown>>(
    data: T,
    options: EncryptionOptions = {}
  ): Promise<FieldEncryptionResult<T>> {
    if (!this.isInitialized)
      throw new Error('Encryption service not initialized');

    const {
      fields = this.sensitiveFields,
      excludeFields = [],
      keyId,
    } = options;
    const fieldsToProcess = fields.filter(f => !excludeFields.includes(f));

    const encryptedData = { ...data };
    const encryptedFields: string[] = [];

    for (const field of fieldsToProcess) {
      if (
        field in encryptedData &&
        encryptedData[field] !== null &&
        encryptedData[field] !== undefined
      ) {
        const fieldValue = encryptedData[field];
        if (this.isEncryptedField(fieldValue)) continue;

        const encryptedValue = await this.encryptValue(
          JSON.stringify(fieldValue),
          keyId
        );

        Object.defineProperty(encryptedData, field, {
          value: {
            encrypted: true,
            value: encryptedValue,
            keyId: keyId ?? this.secretManagerService.getKmsKeyId(),
            algorithm: 'kms-aes-256-gcm',
          } as EncryptedField,
          enumerable: true,
          configurable: true,
          writable: true,
        });

        encryptedFields.push(field);
      }
    }

    return {
      data: encryptedData,
      encryptedFields,
      keyId: keyId ?? this.secretManagerService.getKmsKeyId(),
    };
  }

  /**
   * Decrypt sensitive fields in an object using KMS
   */
  async decryptFields<T extends Record<string, unknown>>(
    data: T,
    options: EncryptionOptions = {}
  ): Promise<FieldEncryptionResult<T>> {
    if (!this.isInitialized)
      throw new Error('Encryption service not initialized');

    const { fields = this.sensitiveFields, excludeFields = [] } = options;
    const decryptedData = { ...data };
    const encryptedFields: string[] = [];

    for (const field of Object.keys(decryptedData)) {
      if (excludeFields.includes(field)) continue;

      const fieldValue = decryptedData[field];
      if (fieldValue !== undefined && this.isEncryptedField(fieldValue)) {
        if (fields.includes(field)) {
          try {
            const decryptedValue = await this.decryptValue(fieldValue);
            decryptedData[field] = decryptedValue as T[Extract<
              keyof T,
              string
            >];
            encryptedFields.push(field);
          } catch (error) {
            this.logger.error(`❌ Failed to decrypt field: ${field}`, error);
            // Decide on error handling: throw, or leave field encrypted
          }
        }
      }
    }

    return {
      data: decryptedData,
      encryptedFields,
      keyId: this.secretManagerService.getKmsKeyId(),
    };
  }

  /**
   * Encrypt a single value using KMS
   */
  private async encryptValue(value: string, keyId?: string): Promise<string> {
    try {
      return await this.secretManagerService.encryptData(value, keyId);
    } catch (error) {
      this.logger.error('❌ Field encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a single value using KMS
   */
  private async decryptValue(encryptedField: EncryptedField): Promise<unknown> {
    try {
      const decryptedString = await this.secretManagerService.decryptData(
        encryptedField.value
      );
      return JSON.parse(decryptedString);
    } catch (error) {
      this.logger.error('❌ Field decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Check if a field value is an encrypted structure
   */
  private isEncryptedField(value: unknown): value is EncryptedField {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const val = value as EncryptedField;
    return (
      'encrypted' in val &&
      val.encrypted === true &&
      typeof val.value === 'string' &&
      typeof val.algorithm === 'string'
    );
  }

  // Other methods like encryptForStorage, encryptForResponse can be simplified
  // or refactored to use the main encryptFields/decryptFields methods.
}
