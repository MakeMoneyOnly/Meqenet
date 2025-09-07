import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { FieldEncryptionService } from './field-encryption.service';

// Prisma middleware types
interface PrismaMiddlewareParams {
  model?: string;
  action: string;
  args?: Record<string, unknown>;
  dataPath?: string[];
  runInTransaction?: boolean;
}

interface PrismaMiddlewareNext {
  (params: PrismaMiddlewareParams): Promise<unknown>;
}

type EncryptedFieldValue = {
  encrypted: boolean;
  value: string;
  algorithm: string;
  keyId?: string;
  iv?: string;
};

@Injectable()
export class DatabaseEncryptionMiddleware implements OnModuleInit {
  private readonly logger = new Logger(DatabaseEncryptionMiddleware.name);

  // Level 1 classified fields that require encryption
  private readonly LEVEL_1_FIELDS = {
    User: [
      'email',
      'firstName',
      'lastName',
      'displayName',
      'phone',
      'passwordHash',
      'twoFactorSecret',
      'faydaIdHash',
    ],
    Profile: ['faydaId'],
    UserSession: ['token', 'refreshToken'],
    PasswordReset: ['token', 'hashedToken'],
    AuditLog: [
      'userEmail',
      'ipAddress',
      'eventData',
      'previousValues',
      'newValues',
    ],
  };

  constructor(
    private readonly fieldEncryptionService: FieldEncryptionService
  ) {}

  onModuleInit(): void {
    this.logger.log('✅ Database encryption middleware initialized');
  }

  /**
   * Apply encryption middleware to Prisma client
   */
  applyMiddleware(prisma: PrismaClient): void {
    // Apply middleware for each model that has encrypted fields
    Object.keys(this.LEVEL_1_FIELDS).forEach(modelName => {
      this.applyModelMiddleware(prisma, modelName);
    });

    this.logger.log('🔐 Database encryption middleware applied to all models');
  }

  /**
   * Apply middleware for a specific model
   */
  private applyModelMiddleware(prisma: PrismaClient, modelName: string): void {
    const model = (prisma as unknown as Record<string, unknown>)[
      modelName.toLowerCase()
    ] as {
      $use?: (
        middleware: (
          params: PrismaMiddlewareParams,
          next: PrismaMiddlewareNext
        ) => Promise<unknown>
      ) => void;
    };
    const encryptedFields =
      this.LEVEL_1_FIELDS[modelName as keyof typeof this.LEVEL_1_FIELDS];

    if (!model || !encryptedFields || !model.$use) {
      return;
    }

    // Middleware for create operations
    model.$use(
      async (params: PrismaMiddlewareParams, next: PrismaMiddlewareNext) => {
        if (params.action === 'create' || params.action === 'createMany') {
          await this.encryptFieldsInParams(params, modelName, encryptedFields);
        }
        return next(params);
      }
    );

    // Middleware for update operations
    model.$use(
      async (params: PrismaMiddlewareParams, next: PrismaMiddlewareNext) => {
        if (
          params.action === 'update' ||
          params.action === 'updateMany' ||
          params.action === 'upsert'
        ) {
          await this.encryptFieldsInParams(params, modelName, encryptedFields);
        }
        return next(params);
      }
    );

    // Middleware for find operations (decrypt results)
    model.$use(
      async (params: PrismaMiddlewareParams, next: PrismaMiddlewareNext) => {
        const result = await next(params);

        if (params.action.startsWith('find') && result) {
          return await this.decryptFieldsInResult(
            result,
            modelName,
            encryptedFields
          );
        }

        return result;
      }
    );

    this.logger.log(`🔐 Applied encryption middleware to ${modelName} model`);
  }

  /**
   * Encrypt sensitive fields in operation parameters
   */
  private async encryptFieldsInParams(
    params: PrismaMiddlewareParams,
    modelName: string,
    encryptedFields: string[]
  ): Promise<void> {
    try {
      if (params.action === 'createMany' && params.args?.data) {
        // Handle createMany operations
        if (Array.isArray(params.args.data)) {
          for (const item of params.args.data) {
            await this.encryptObjectFields(item, modelName, encryptedFields);
          }
        }
      } else if (params.args?.data) {
        // Handle single operations
        await this.encryptObjectFields(
          params.args.data as Record<string, unknown>,
          modelName,
          encryptedFields
        );
      }
    } catch (error) {
      this.logger.error(`❌ Failed to encrypt fields for ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Encrypt fields in a data object
   */
  private async encryptObjectFields(
    data: Record<string, unknown>,
    modelName: string,
    encryptedFields: string[]
  ): Promise<void> {
    const fieldsToEncrypt: Record<string, unknown> = {};

    for (const field of encryptedFields) {
      if (data[field] !== undefined && data[field] !== null) {
        fieldsToEncrypt[field] = data[field];
      }
    }

    if (Object.keys(fieldsToEncrypt).length > 0) {
      const encryptionResult = await this.fieldEncryptionService.encryptFields(
        fieldsToEncrypt,
        {
          fields: Object.keys(fieldsToEncrypt),
        }
      );

      // Replace original values with encrypted ones
      for (const field of Object.keys(fieldsToEncrypt)) {
        if (encryptionResult.data[field]) {
          data[field] = JSON.stringify(encryptionResult.data[field]);
        }
      }

      this.logger.debug(
        `🔐 Encrypted ${Object.keys(fieldsToEncrypt).length} fields for ${modelName}`
      );
    }
  }

  /**
   * Decrypt sensitive fields in query results
   */
  private async decryptFieldsInResult(
    result: unknown,
    modelName: string,
    encryptedFields: string[]
  ): Promise<unknown> {
    try {
      if (Array.isArray(result)) {
        // Handle array results
        for (const item of result) {
          await this.decryptObjectFields(item, modelName, encryptedFields);
        }
      } else if (result) {
        // Handle single object results
        await this.decryptObjectFields(
          result as Record<string, unknown>,
          modelName,
          encryptedFields
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to decrypt fields for ${modelName}:`, error);
      // Return original result if decryption fails to avoid breaking queries
      return result;
    }
  }

  /**
   * Decrypt fields in a result object
   */
  private async decryptObjectFields(
    data: Record<string, unknown>,
    modelName: string,
    encryptedFields: string[]
  ): Promise<void> {
    const fieldsToDecrypt: Record<string, unknown> = {};

    for (const field of encryptedFields) {
      if (data[field] !== undefined && data[field] !== null) {
        try {
          // Try to parse as encrypted field
          const parsedField = JSON.parse(data[field] as string);
          if (this.isEncryptedField(parsedField)) {
            fieldsToDecrypt[field] = parsedField;
          }
        } catch {
          // Field might not be encrypted, skip
        }
      }
    }

    if (Object.keys(fieldsToDecrypt).length > 0) {
      const decryptionResult = await this.fieldEncryptionService.decryptFields(
        fieldsToDecrypt,
        {
          fields: Object.keys(fieldsToDecrypt),
        }
      );

      // Replace encrypted values with decrypted ones
      for (const field of Object.keys(fieldsToDecrypt)) {
        if (decryptionResult.data[field] !== undefined) {
          data[field] = decryptionResult.data[field];
        }
      }

      this.logger.debug(
        `🔓 Decrypted ${Object.keys(fieldsToDecrypt).length} fields for ${modelName}`
      );
    }
  }

  /**
   * Check if a field value is encrypted
   */
  private isEncryptedField(value: unknown): value is EncryptedFieldValue {
    return (
      typeof value === 'object' &&
      value !== null &&
      (value as EncryptedFieldValue).encrypted === true &&
      typeof (value as EncryptedFieldValue).value === 'string' &&
      typeof (value as EncryptedFieldValue).algorithm === 'string'
    );
  }

  /**
   * Get encryption statistics for monitoring
   */
  getEncryptionStats(): {
    models: string[];
    totalFields: number;
    fieldsByModel: Record<string, string[]>;
  } {
    const models = Object.keys(this.LEVEL_1_FIELDS);
    const fieldsByModel = this.LEVEL_1_FIELDS;
    const totalFields = Object.values(this.LEVEL_1_FIELDS).flat().length;

    return {
      models,
      totalFields,
      fieldsByModel,
    };
  }
}
