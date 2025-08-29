import 'reflect-metadata';
import {
  FieldEncryptionService,
  FieldEncryptionResult,
} from '../services/field-encryption.service';

export const ENCRYPT_FIELDS_METADATA = 'encrypt_fields';
export const ENCRYPT_FIELDS_OPTIONS = 'encrypt_fields_options';

/**
 * Decorator to mark fields that should be automatically encrypted
 */
export function EncryptField(options?: { algorithm?: string; keyId?: string }) {
  return function (target: object, propertyKey: string): void {
    // Get existing encrypted fields
    const existingFields =
      Reflect.getMetadata(ENCRYPT_FIELDS_METADATA, target.constructor) ?? [];
    existingFields.push(propertyKey);
    Reflect.defineMetadata(
      ENCRYPT_FIELDS_METADATA,
      existingFields,
      target.constructor
    );

    // Store options for this field
    if (options) {
      // Validate propertyKey to prevent object injection
      if (
        typeof propertyKey !== 'string' ||
        !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propertyKey)
      ) {
        throw new Error(`Invalid property key: ${propertyKey}`);
      }

      const existingOptions =
        Reflect.getMetadata(ENCRYPT_FIELDS_OPTIONS, target.constructor) ?? {};

      // Use Object.defineProperty for safer property assignment
      const updatedOptions = { ...existingOptions };
      Object.defineProperty(updatedOptions, propertyKey, {
        value: { ...options }, // Clone options for safety
        writable: true,
        enumerable: true,
        configurable: true,
      });

      Reflect.defineMetadata(
        ENCRYPT_FIELDS_OPTIONS,
        updatedOptions,
        target.constructor
      );
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
  return function (target: new (...args: unknown[]) => unknown): void {
    Reflect.defineMetadata(ENCRYPT_FIELDS_OPTIONS, options ?? {}, target);

    // Add encryption methods to the prototype
    target.prototype.encryptFields ??= async function (
      this: Record<string, unknown>,
      encryptionService: FieldEncryptionService
    ): Promise<FieldEncryptionResult<Record<string, unknown>>> {
      const fields =
        Reflect.getMetadata(ENCRYPT_FIELDS_METADATA, this.constructor) ?? [];
      const fieldOptions =
        Reflect.getMetadata(ENCRYPT_FIELDS_OPTIONS, this.constructor) ?? {};

      const data: Record<string, unknown> = {};
      for (const field of fields) {
        // Validate field name to prevent object injection
        if (
          typeof field === 'string' &&
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field) &&
          field in this
        ) {
          // Use safer property access to prevent object injection
          try {
            const descriptor = Object.getOwnPropertyDescriptor(this, field);
            if (descriptor && descriptor.value !== undefined) {
              Object.defineProperty(data, field, {
                value: descriptor.value,
                writable: true,
                enumerable: true,
                configurable: true,
              });
            }
          } catch {
            // Skip fields that can't be accessed safely
            continue;
          }
        }
      }

      const result = await encryptionService.encryptFields(data, fieldOptions);

      // Update the instance with encrypted data
      for (const field of result.encryptedFields) {
        // Validate field name and use safer property assignment
        if (
          typeof field === 'string' &&
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field) &&
          field in this
        ) {
          // Safely access the field value using Object.getOwnPropertyDescriptor
          const fieldValue =
            result.data &&
            typeof result.data === 'object' &&
            field in result.data
              ? Object.getOwnPropertyDescriptor(result.data, field)?.value
              : undefined;
          if (fieldValue !== undefined) {
            // Use Object.defineProperty for safer property assignment
            Object.defineProperty(this, field, {
              value: fieldValue,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
      }

      return result;
    };

    target.prototype.decryptFields ??= async function (
      this: Record<string, unknown>,
      encryptionService: FieldEncryptionService
    ): Promise<FieldEncryptionResult<Record<string, unknown>>> {
      const fields =
        Reflect.getMetadata(ENCRYPT_FIELDS_METADATA, this.constructor) ?? [];
      const fieldOptions =
        Reflect.getMetadata(ENCRYPT_FIELDS_OPTIONS, this.constructor) ?? {};

      const data: Record<string, unknown> = {};
      for (const field of fields) {
        // Validate field name to prevent object injection
        if (
          typeof field === 'string' &&
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field) &&
          field in this
        ) {
          // Use safer property access to prevent object injection
          try {
            const descriptor = Object.getOwnPropertyDescriptor(this, field);
            if (descriptor && descriptor.value !== undefined) {
              Object.defineProperty(data, field, {
                value: descriptor.value,
                writable: true,
                enumerable: true,
                configurable: true,
              });
            }
          } catch {
            // Skip fields that can't be accessed safely
            continue;
          }
        }
      }

      const result = await encryptionService.decryptFields(data, fieldOptions);

      // Update the instance with decrypted data
      for (const field of result.encryptedFields) {
        // Validate field name and use safer property assignment
        if (
          typeof field === 'string' &&
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field) &&
          field in this
        ) {
          // Safely access the field value using Object.getOwnPropertyDescriptor
          const fieldValue =
            result.data &&
            typeof result.data === 'object' &&
            field in result.data
              ? Object.getOwnPropertyDescriptor(result.data, field)?.value
              : undefined;
          if (fieldValue !== undefined) {
            // Use Object.defineProperty for safer property assignment
            Object.defineProperty(this, field, {
              value: fieldValue,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
      }

      return result;
    };
  };
}

/**
 * Decorator to automatically encrypt fields before saving to database
 */
export function EncryptBeforeSave(): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      // Get the encryption service (assuming it's injected)
      const encryptionService = (this as Record<string, unknown>)
        .encryptionService;

      if (encryptionService) {
        // Encrypt fields before calling the original method
        const instance = this as Record<string, unknown>;
        await (
          instance.encryptFields as (
            service: FieldEncryptionService
          ) => Promise<FieldEncryptionResult<Record<string, unknown>>>
        )(encryptionService as FieldEncryptionService);
      }

      // Call the original method
      return originalMethod.apply(this, args);
    };
  };
}

/**
 * Decorator to automatically decrypt fields after loading from database
 */
export function DecryptAfterLoad(): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      // Call the original method first
      const result = await originalMethod.apply(this, args);

      // Get the encryption service (assuming it's injected)
      const encryptionService = (this as Record<string, unknown>)
        .encryptionService;

      if (encryptionService && result) {
        // Decrypt fields after loading
        await result.decryptFields(encryptionService as FieldEncryptionService);
      }

      return result;
    };
  };
}
