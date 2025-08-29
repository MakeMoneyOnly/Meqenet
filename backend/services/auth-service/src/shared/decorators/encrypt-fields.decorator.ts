import 'reflect-metadata';
import { FieldEncryptionService } from '../services/field-encryption.service';

export const ENCRYPT_FIELDS_METADATA = 'encrypt_fields';
export const ENCRYPT_FIELDS_OPTIONS = 'encrypt_fields_options';

/**
 * Decorator to mark fields that should be automatically encrypted
 */
export function EncryptField(options?: {
  algorithm?: string;
  keyId?: string;
}) {
  return function (target: any, propertyKey: string) {
    // Get existing encrypted fields
    const existingFields = Reflect.getMetadata(ENCRYPT_FIELDS_METADATA, target.constructor) || [];
    existingFields.push(propertyKey);
    Reflect.defineMetadata(ENCRYPT_FIELDS_METADATA, existingFields, target.constructor);

    // Store options for this field
    if (options) {
      const existingOptions = Reflect.getMetadata(ENCRYPT_FIELDS_OPTIONS, target.constructor) || {};
      existingOptions[propertyKey] = options;
      Reflect.defineMetadata(ENCRYPT_FIELDS_OPTIONS, existingOptions, target.constructor);
    }
  };
}

/**
 * Decorator to mark classes that should have field encryption applied
 */
export function EncryptFields(options?: {
  fields?: string[];
  excludeFields?: string[];
  algorithm?: string;
  keyId?: string;
}) {
  return function (target: any) {
    Reflect.defineMetadata(ENCRYPT_FIELDS_OPTIONS, options || {}, target);

    // Add encryption methods to the prototype
    if (!target.prototype.encryptFields) {
      target.prototype.encryptFields = async function(
        this: any,
        encryptionService: FieldEncryptionService
      ) {
        const fields = Reflect.getMetadata(ENCRYPT_FIELDS_METADATA, this.constructor) || [];
        const fieldOptions = Reflect.getMetadata(ENCRYPT_FIELDS_OPTIONS, this.constructor) || {};

        const data: Record<string, any> = {};
        for (const field of fields) {
          if (field in this) {
            data[field] = this[field];
          }
        }

        const result = await encryptionService.encryptFields(data, fieldOptions);

        // Update the instance with encrypted data
        for (const field of result.encryptedFields) {
          this[field] = result.data[field];
        }

        return result;
      };
    }

    if (!target.prototype.decryptFields) {
      target.prototype.decryptFields = async function(
        this: any,
        encryptionService: FieldEncryptionService
      ) {
        const fields = Reflect.getMetadata(ENCRYPT_FIELDS_METADATA, this.constructor) || [];
        const fieldOptions = Reflect.getMetadata(ENCRYPT_FIELDS_OPTIONS, this.constructor) || {};

        const data: Record<string, any> = {};
        for (const field of fields) {
          if (field in this) {
            data[field] = this[field];
          }
        }

        const result = await encryptionService.decryptFields(data, fieldOptions);

        // Update the instance with decrypted data
        for (const field of result.encryptedFields) {
          this[field] = result.data[field];
        }

        return result;
      };
    }
  };
}

/**
 * Decorator to automatically encrypt fields before saving to database
 */
export function EncryptBeforeSave() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get the encryption service (assuming it's injected)
      const encryptionService = (this as any).encryptionService;

      if (encryptionService) {
        // Encrypt fields before calling the original method
        await (this as any).encryptFields(encryptionService);
      }

      // Call the original method
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to automatically decrypt fields after loading from database
 */
export function DecryptAfterLoad() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Call the original method first
      const result = await originalMethod.apply(this, args);

      // Get the encryption service (assuming it's injected)
      const encryptionService = (this as any).encryptionService;

      if (encryptionService && result) {
        // Decrypt fields after loading
        await result.decryptFields(encryptionService);
      }

      return result;
    };

    return descriptor;
  };
}
