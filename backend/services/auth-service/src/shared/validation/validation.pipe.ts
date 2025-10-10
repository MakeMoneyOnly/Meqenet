import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

interface ZodIssueExtended extends ZodIssue {
  expected?: string | number | symbol;
  received?: string | number | symbol;
  keys?: string[];
  minimum?: number;
  maximum?: number;
  type?: string;
  message?: string;
}

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
    const errorData = error as ZodIssueExtended;

    switch (error.code) {
      case 'invalid_type':
        return `Expected ${errorData.expected}, received ${errorData.received}`;

      case 'unrecognized_keys':
        return `Unrecognized keys: ${errorData.keys?.join(', ') ?? 'unknown'}`;

      case 'invalid_union':
        return 'Invalid input format';

      case 'too_small': {
        if (errorData.type === 'string') {
          return `Must be at least ${errorData.minimum} characters long`;
        }
        if (errorData.type === 'number') {
          return `Must be at least ${errorData.minimum}`;
        }
        if (errorData.type === 'array') {
          return `Must contain at least ${errorData.minimum} items`;
        }
        return errorData.message ?? 'Value too small';
      }

      case 'too_big': {
        if (errorData.type === 'string') {
          return `Must be at most ${errorData.maximum} characters long`;
        }
        if (errorData.type === 'number') {
          return `Must be at most ${errorData.maximum}`;
        }
        if (errorData.type === 'array') {
          return `Must contain at most ${errorData.maximum} items`;
        }
        return errorData.message ?? 'Value too large';
      }

      case 'custom':
        return error.message ?? 'Custom validation failed';

      default: {
        // Handle other Zod error types that may not be in the strict type
        if (errorData.code === 'invalid_enum_value') {
          return `Invalid value. Expected: ${errorData.options?.join(', ') ?? 'valid option'}`;
        }
        if (errorData.code === 'invalid_string') {
          switch (errorData.validation) {
            case 'email':
              return 'Invalid email address format';
            case 'uuid':
              return 'Invalid UUID format';
            case 'url':
              return 'Invalid URL format';
            case 'regex':
              return errorData.message ?? 'Invalid format';
            default:
              return errorData.message ?? 'Invalid string format';
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
