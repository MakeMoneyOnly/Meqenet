import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { FieldEncryptionService } from '../services/field-encryption.service';

@Injectable()
export class FieldEncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FieldEncryptionInterceptor.name);

  constructor(
    private readonly fieldEncryptionService: FieldEncryptionService
  ) {}

  intercept(
    context: ExecutionContext,
    _next: CallHandler
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const _response = context.switchToHttp().getResponse();

    // Decrypt incoming request data
    return this.processRequest(request).pipe(
      // Handle the response
      map(async (data: unknown) => {
        // Encrypt outgoing response data
        return this.processResponse(data, request);
      })
    );
  }

  /**
   * Process incoming request data (decrypt sensitive fields)
   */
  private async processRequest(
    request: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      // Decrypt request body if it contains encrypted fields
      if (request.body && typeof request.body === 'object') {
        const decryptionResult =
          await this.fieldEncryptionService.decryptFromRequest(
            request.body,
            this.getSensitiveFieldsForEndpoint(request)
          );

        if (decryptionResult.encryptedFields.length > 0) {
          request.body = decryptionResult.data;
          this.logger.debug(
            `🔓 Decrypted ${decryptionResult.encryptedFields.length} fields in request body`
          );
        }
      }

      // Decrypt query parameters
      if (request.query && typeof request.query === 'object') {
        const decryptionResult =
          await this.fieldEncryptionService.decryptFromRequest(
            request.query,
            ['search', 'filter', 'q'] // Common query parameter fields that might contain sensitive data
          );

        if (decryptionResult.encryptedFields.length > 0) {
          request.query = decryptionResult.data;
          this.logger.debug(
            `🔓 Decrypted ${decryptionResult.encryptedFields.length} fields in query parameters`
          );
        }
      }

      return request;
    } catch (error) {
      this.logger.error('❌ Request decryption failed:', error);
      // Continue with original request if decryption fails
      return request;
    }
  }

  /**
   * Process outgoing response data (encrypt sensitive fields)
   */
  private async processResponse(
    data: unknown,
    request: Record<string, unknown>
  ): Promise<unknown> {
    try {
      if (!data || typeof data !== 'object') {
        return data;
      }

      // Determine which fields to encrypt based on endpoint
      const sensitiveFields = this.getSensitiveFieldsForEndpoint(request);

      let processedData = data;

      // Handle array responses (e.g., list of users)
      if (Array.isArray(data)) {
        processedData = await Promise.all(
          data.map(async item => {
            if (typeof item === 'object' && item !== null) {
              const encryptionResult =
                await this.fieldEncryptionService.encryptForResponse(
                  item,
                  sensitiveFields
                );
              return encryptionResult.data;
            }
            return item;
          })
        );
      }
      // Handle single object responses
      else if (typeof data === 'object') {
        const encryptionResult =
          await this.fieldEncryptionService.encryptForResponse(
            data,
            sensitiveFields
          );

        if (encryptionResult.encryptedFields.length > 0) {
          processedData = encryptionResult.data;
          this.logger.debug(
            `🔐 Encrypted ${encryptionResult.encryptedFields.length} fields in response`
          );
        }
      }

      return processedData;
    } catch (error) {
      this.logger.error('❌ Response encryption failed:', error);
      // Return original data if encryption fails
      return data;
    }
  }

  /**
   * Determine which fields should be encrypted based on the endpoint
   */
  private getSensitiveFieldsForEndpoint(
    request: Record<string, unknown>
  ): string[] {
    const path = String(request.route?.path ?? request.url ?? '');
    const method = String(request.method ?? 'GET');

    // Define sensitive fields based on endpoint patterns
    const endpointRules: Array<{
      pattern: RegExp;
      methods: string[];
      fields: string[];
    }> = [
      {
        pattern: /\/users/,
        methods: ['GET', 'POST', 'PUT', 'PATCH'],
        fields: ['password', 'email', 'phoneNumber', 'dateOfBirth', 'ssn'],
      },
      {
        pattern: /\/payments/,
        methods: ['GET', 'POST', 'PUT', 'PATCH'],
        fields: ['cardNumber', 'cvv', 'expiryDate', 'cardholderName'],
      },
      {
        pattern: /\/bank-accounts/,
        methods: ['GET', 'POST', 'PUT', 'PATCH'],
        fields: ['accountNumber', 'routingNumber', 'iban', 'swift'],
      },
      {
        pattern: /\/identities/,
        methods: ['GET', 'POST', 'PUT', 'PATCH'],
        fields: ['passportNumber', 'driversLicense', 'taxId'],
      },
      {
        pattern: /\/addresses/,
        methods: ['GET', 'POST', 'PUT', 'PATCH'],
        fields: ['streetAddress', 'city', 'postalCode'],
      },
      {
        pattern: /\/auth\/login/,
        methods: ['POST'],
        fields: ['password'],
      },
      {
        pattern: /\/auth\/register/,
        methods: ['POST'],
        fields: ['password', 'email', 'phoneNumber'],
      },
    ];

    for (const rule of endpointRules) {
      if (rule.pattern.test(path) && rule.methods.includes(method)) {
        return rule.fields;
      }
    }

    // Default sensitive fields for unknown endpoints
    return ['password', 'email', 'phoneNumber', 'cardNumber', 'accountNumber'];
  }

  /**
   * Check if endpoint should skip encryption
   */
  private shouldSkipEncryption(request: Record<string, unknown>): boolean {
    const path = request.route?.path ?? request.url ?? '';

    // Skip encryption for these endpoints
    const skipPatterns = [
      /\/health/,
      /\/metrics/,
      /\/docs/,
      /\/jwks/,
      /\/credentials/,
    ];

    return skipPatterns.some(pattern => pattern.test(path));
  }
}
