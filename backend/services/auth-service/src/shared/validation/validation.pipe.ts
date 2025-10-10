import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

// Type guard helpers for runtime type checking of Zod issue data
type ZodIssueData = Record<string, unknown>;

/**
 * Custom Zod validation pipe for NestJS
 * Provides comprehensive input validation with detailed error messages
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      // Parse and validate the input using Zod schema
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors into user-friendly validation messages
        const validationErrors = this.formatZodErrors(error);
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: validationErrors,
          timestamp: new Date().toISOString(),
        });
      }

      // Re-throw unexpected errors
      throw error;
    }
  }

  private formatZodErrors(error: ZodError): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    error.issues.forEach((err: ZodIssue) => {
      const path = err.path.join('.');
      const message = this.getCustomErrorMessage(err);

      // Using Object.prototype.hasOwnProperty is safe here - controlled input from Zod
      if (!Object.prototype.hasOwnProperty.call(formattedErrors, path)) {
        formattedErrors[path] = [];
      }
      const pathErrors = formattedErrors[path];
      if (pathErrors) {
        pathErrors.push(message);
      }
    });

    return formattedErrors;
  }

  private getCustomErrorMessage(error: ZodIssue): string {
    const errorData = error as unknown as ZodIssueData;

    switch (error.code) {
      case 'invalid_type':
        // Safe conversion of expected/received which could be symbols
        return `Expected ${String(errorData.expected)}, received ${String(errorData.received)}`;

      case 'unrecognized_keys':
        // Safe array access with type guard
        const keys =
          'keys' in errorData && Array.isArray(errorData.keys)
            ? errorData.keys.join(', ')
            : 'unknown';
        return `Unrecognized keys: ${keys}`;

      case 'invalid_union':
        return 'Invalid input format';

      case 'too_small': {
        const type = 'type' in errorData ? errorData.type : undefined;
        const minimum = 'minimum' in errorData ? errorData.minimum : undefined;

        if (type === 'string') {
          return `Must be at least ${minimum} characters long`;
        }
        if (type === 'number') {
          return `Must be at least ${minimum}`;
        }
        if (type === 'array') {
          return `Must contain at least ${minimum} items`;
        }
        return error.message ?? 'Value too small';
      }

      case 'too_big': {
        const type = 'type' in errorData ? errorData.type : undefined;
        const maximum = 'maximum' in errorData ? errorData.maximum : undefined;

        if (type === 'string') {
          return `Must be at most ${maximum} characters long`;
        }
        if (type === 'number') {
          return `Must be at most ${maximum}`;
        }
        if (type === 'array') {
          return `Must contain at most ${maximum} items`;
        }
        return error.message ?? 'Value too large';
      }

      case 'custom':
        return error.message ?? 'Custom validation failed';

      default: {
        // Handle other Zod error types that may not be in the strict type
        // Use runtime type guards for safe property access
        if ('code' in errorData && errorData.code === 'invalid_enum_value') {
          const options =
            'options' in errorData && Array.isArray(errorData.options)
              ? errorData.options.join(', ')
              : 'valid option';
          return `Invalid value. Expected: ${options}`;
        }

        if ('code' in errorData && errorData.code === 'invalid_string') {
          const validation =
            'validation' in errorData ? errorData.validation : undefined;
          switch (validation) {
            case 'email':
              return 'Invalid email address format';
            case 'uuid':
              return 'Invalid UUID format';
            case 'url':
              return 'Invalid URL format';
            case 'regex':
              return error.message ?? 'Invalid format';
            default:
              return error.message ?? 'Invalid string format';
          }
        }

        return error.message ?? 'Validation failed';
      }
    }
  }
}

/**
 * Decorator factory for easy Zod validation pipe usage
 * @param schema - Zod schema to validate against
 * @returns Validation pipe instance
 *
 * @example
 * ```typescript
 * @Post('/authenticate')
 * async authenticate(
 *   @Body(UsePipes(authenticateUserSchema)) data: AuthenticateUserDto
 * ) {
 *   // data is now validated and typed
 * }
 * ```
 */
export function UsePipes(schema: ZodSchema): ZodValidationPipe {
  return new ZodValidationPipe(schema);
}
