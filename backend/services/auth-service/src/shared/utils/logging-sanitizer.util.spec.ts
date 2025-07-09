/// <reference types="vitest" />
import 'reflect-metadata'; // Required for NestJS dependency injection
import { describe, it, expect } from 'vitest';

import { sanitizeObject } from './logging-sanitizer.util';

/**
 * Logging Sanitizer Utility Security Tests
 *
 * Tests critical data protection for:
 * - Sensitive data redaction in logs
 * - PII (Personally Identifiable Information) protection
 * - Financial data sanitization
 * - Ethiopian Fayda ID protection
 * - NBE compliance requirements
 */
describe('LoggingSanitizer - Security Tests', () => {
  describe('Sensitive Key Detection', () => {
    it('should redact password fields', () => {
      const input = {
        username: 'user123',
        password: 'secret123',
        confirmPassword: 'secret123',
        oldPassword: 'oldSecret',
      };

      const result = sanitizeObject(input);

      expect(result.username).toBe('user123');
      expect(result.password).toBe('[REDACTED]');
      expect(result.confirmPassword).toBe('[REDACTED]');
      expect(result.oldPassword).toBe('[REDACTED]');
    });

    it('should redact token fields', () => {
      const input = {
        accessToken: 'jwt-access-token-123',
        refreshToken: 'jwt-refresh-token-456',
        token: 'generic-token-789',
        authToken: 'auth-token-abc',
        bearerToken: 'bearer-token-def',
      };

      const result = sanitizeObject(input);

      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.refreshToken).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.authToken).toBe('[REDACTED]');
      expect(result.bearerToken).toBe('[REDACTED]');
    });

    it('should redact authorization headers', () => {
      const input = {
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer jwt-token-123',
          'x-api-key': 'api-key-456',
        },
      };

      const result = sanitizeObject(input);

      expect(result.headers['content-type']).toBe('application/json');
      expect(result.headers.authorization).toBe('[REDACTED]');
      expect(result.headers['x-api-key']).toBe('api-key-456'); // Not in sensitive list
    });

    it('should redact Fayda ID fields (Ethiopian compliance)', () => {
      const input = {
        faydaId: 'FID1234567890123',
        userFaydaId: 'FID9876543210987',
        faydaIdNumber: 'FID5555555555555',
        nationalFaydaId: 'FID1111111111111',
      };

      const result = sanitizeObject(input);

      expect(result.faydaId).toBe('[REDACTED]');
      expect(result.userFaydaId).toBe('[REDACTED]');
      expect(result.faydaIdNumber).toBe('[REDACTED]');
      expect(result.nationalFaydaId).toBe('[REDACTED]');
    });

    it('should redact financial data fields', () => {
      const input = {
        creditCard: '4532-1234-5678-9012',
        creditCardNumber: '5555-4444-3333-2222',
        cvv: '123',
        cvvCode: '456',
        securityCode: '789',
        bankAccount: '123456789',
      };

      const result = sanitizeObject(input);

      expect(result.creditCard).toBe('[REDACTED]');
      expect(result.creditCardNumber).toBe('[REDACTED]');
      expect(result.cvv).toBe('[REDACTED]');
      expect(result.cvvCode).toBe('[REDACTED]');
      expect(result.securityCode).toBe('[REDACTED]');
      expect(result.bankAccount).toBe('123456789'); // Not in sensitive list currently
    });
  });

  describe('Case Insensitive Detection', () => {
    it('should detect sensitive keys regardless of case', () => {
      const input = {
        PASSWORD: 'secret',
        Password: 'secret',
        PassWord: 'secret',
        TOKEN: 'token-123',
        Token: 'token-456',
        FAYDAID: 'FID1234567890123',
        FaydaId: 'FID9876543210987',
        CREDITCARD: '4532-1234-5678-9012',
        CreditCard: '5555-4444-3333-2222',
      };

      const result = sanitizeObject(input);

      expect(result.PASSWORD).toBe('[REDACTED]');
      expect(result.Password).toBe('[REDACTED]');
      expect(result.PassWord).toBe('[REDACTED]');
      expect(result.TOKEN).toBe('[REDACTED]');
      expect(result.Token).toBe('[REDACTED]');
      expect(result.FAYDAID).toBe('[REDACTED]');
      expect(result.FaydaId).toBe('[REDACTED]');
      expect(result.CREDITCARD).toBe('[REDACTED]');
      expect(result.CreditCard).toBe('[REDACTED]');
    });

    it('should detect partial matches in key names', () => {
      const input = {
        userPassword: 'secret',
        apiToken: 'token-123',
        customerFaydaId: 'FID1234567890123',
        visaCreditCard: '4532-1234-5678-9012',
        securityCvv: '123',
      };

      const result = sanitizeObject(input);

      expect(result.userPassword).toBe('[REDACTED]');
      expect(result.apiToken).toBe('[REDACTED]');
      expect(result.customerFaydaId).toBe('[REDACTED]');
      expect(result.visaCreditCard).toBe('[REDACTED]');
      expect(result.securityCvv).toBe('[REDACTED]');
    });
  });

  describe('Deep Object Sanitization', () => {
    it('should sanitize nested objects', () => {
      const input = {
        user: {
          id: 'user123',
          password: 'secret',
          profile: {
            name: 'John Doe',
            faydaId: 'FID1234567890123',
            payment: {
              creditCard: '4532-1234-5678-9012',
              cvv: '123',
            },
          },
        },
        public: 'safe-data',
      };

      const result = sanitizeObject(input);

      expect(result.user.id).toBe('user123');
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user.profile.name).toBe('John Doe');
      expect(result.user.profile.faydaId).toBe('[REDACTED]');
      expect(result.user.profile.payment.creditCard).toBe('[REDACTED]');
      expect(result.user.profile.payment.cvv).toBe('[REDACTED]');
      expect(result.public).toBe('safe-data');
    });

    it('should sanitize arrays containing objects', () => {
      const input = {
        users: [
          { id: 1, password: 'secret1', faydaId: 'FID1111111111111' },
          { id: 2, password: 'secret2', faydaId: 'FID2222222222222' },
          { id: 3, token: 'token-123' },
        ],
        payments: [
          { amount: 100, creditCard: '4532-1234-5678-9012' },
          { amount: 200, creditCard: '5555-4444-3333-2222' },
        ],
      };

      const result = sanitizeObject(input);

      expect(result.users[0].id).toBe(1);
      expect(result.users[0].password).toBe('[REDACTED]');
      expect(result.users[0].faydaId).toBe('[REDACTED]');
      expect(result.users[1].password).toBe('[REDACTED]');
      expect(result.users[2].token).toBe('[REDACTED]');
      expect(result.payments[0].amount).toBe(100);
      expect(result.payments[0].creditCard).toBe('[REDACTED]');
      expect(result.payments[1].creditCard).toBe('[REDACTED]');
    });

    it('should handle mixed arrays with primitives and objects', () => {
      const input = {
        data: [
          'safe-string',
          { password: 'secret', name: 'John' },
          42,
          { faydaId: 'FID1234567890123' },
          null,
        ],
      };

      const result = sanitizeObject(input);

      expect(result.data[0]).toBe('safe-string');
      expect(result.data[1].password).toBe('[REDACTED]');
      expect(result.data[1].name).toBe('John');
      expect(result.data[2]).toBe(42);
      expect(result.data[3].faydaId).toBe('[REDACTED]');
      expect(result.data[4]).toBe(null);
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle null and undefined values', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);

      const input = {
        password: null,
        token: undefined,
        name: 'John',
      };

      const result = sanitizeObject(input);
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.name).toBe('John');
    });

    it('should handle primitive values', () => {
      expect(sanitizeObject('string')).toBe('string');
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(true)).toBe(true);
      expect(sanitizeObject(false)).toBe(false);
    });

    it('should handle empty objects and arrays', () => {
      expect(sanitizeObject({})).toEqual({});
      expect(sanitizeObject([])).toEqual([]);

      const input = {
        empty: {},
        emptyArray: [],
        password: 'secret',
      };

      const result = sanitizeObject(input);
      expect(result.empty).toEqual({});
      expect(result.emptyArray).toEqual([]);
      expect(result.password).toBe('[REDACTED]');
    });

    it('should handle circular references gracefully', () => {
      const input: any = {
        name: 'circular',
        password: 'secret',
      };
      input.self = input;

      // Should not throw on circular references
      expect(() => sanitizeObject(input)).not.toThrow();

      // Note: The exact behavior with circular references depends on implementation
      // but it should not crash or expose sensitive data
    });

    it('should handle objects with symbol keys', () => {
      const sym = Symbol('test');
      const input = {
        [sym]: 'symbol-value',
        password: 'secret',
        name: 'John',
      };

      const result = sanitizeObject(input);

      // Symbol keys might be ignored or handled differently
      expect(result.password).toBe('[REDACTED]');
      expect(result.name).toBe('John');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      const input = {
        createdAt: date,
        password: 'secret',
      };

      const result = sanitizeObject(input);

      expect(result.createdAt).toBe(date);
      expect(result.password).toBe('[REDACTED]');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large objects efficiently', () => {
      const largeInput: any = {};

      // Create large object with mix of safe and sensitive data
      for (let i = 0; i < 1000; i++) {
        largeInput[`field${i}`] = `value${i}`;
        if (i % 10 === 0) {
          largeInput[`password${i}`] = `secret${i}`;
        }
      }

      const startTime = process.hrtime.bigint();
      const result = sanitizeObject(largeInput);
      const endTime = process.hrtime.bigint();

      const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to ms

      // Should process in reasonable time (< 50ms for 1000 fields)
      expect(executionTime).toBeLessThan(50);

      // Verify sanitization worked
      expect(result.password0).toBe('[REDACTED]');
      expect(result.password10).toBe('[REDACTED]');
      expect(result.field1).toBe('value1');
    });

    it('should not modify original object', () => {
      const original = {
        password: 'secret',
        name: 'John',
        nested: {
          token: 'token-123',
          email: 'john@example.com',
        },
      };

      const originalCopy = JSON.parse(JSON.stringify(original));
      const result = sanitizeObject(original);

      // Original should remain unchanged
      expect(original).toEqual(originalCopy);
      expect(original.password).toBe('secret');
      expect(original.nested.token).toBe('token-123');

      // Result should be sanitized
      expect(result.password).toBe('[REDACTED]');
      expect(result.nested.token).toBe('[REDACTED]');
    });
  });

  describe('NBE and Ethiopian Compliance', () => {
    it('should protect Ethiopian financial identifiers', () => {
      const input = {
        faydaId: 'FID1234567890123',
        ethiopianBankAccount: 'ETH123456789',
        commercialBankAccount: 'CBE987654321',
        password: 'secret',
        publicInfo: 'safe-data',
      };

      const result = sanitizeObject(input);

      expect(result.faydaId).toBe('[REDACTED]');
      expect(result.password).toBe('[REDACTED]');
      expect(result.ethiopianBankAccount).toBe('ETH123456789'); // Not in current list
      expect(result.commercialBankAccount).toBe('CBE987654321'); // Not in current list
      expect(result.publicInfo).toBe('safe-data');
    });

    it('should handle BNPL-specific sensitive data', () => {
      const input = {
        creditLimit: 50000,
        creditScore: 750,
        faydaId: 'FID1234567890123',
        password: 'secret',
        paymentToken: 'pay-token-123',
        merchantId: 'merchant-456',
      };

      const result = sanitizeObject(input);

      expect(result.creditLimit).toBe(50000); // Financial amounts might be OK in logs
      expect(result.creditScore).toBe(750);
      expect(result.faydaId).toBe('[REDACTED]');
      expect(result.password).toBe('[REDACTED]');
      expect(result.paymentToken).toBe('[REDACTED]'); // Contains 'token'
      expect(result.merchantId).toBe('merchant-456');
    });

    it('should maintain audit trail requirements', () => {
      const auditLog = {
        timestamp: '2024-01-01T00:00:00Z',
        userId: 'user123',
        action: 'login',
        faydaId: 'FID1234567890123',
        password: 'secret',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: true,
      };

      const result = sanitizeObject(auditLog);

      // Audit fields should be preserved
      expect(result.timestamp).toBe('2024-01-01T00:00:00Z');
      expect(result.userId).toBe('user123');
      expect(result.action).toBe('login');
      expect(result.ipAddress).toBe('192.168.1.1');
      expect(result.userAgent).toBe('Mozilla/5.0');
      expect(result.success).toBe(true);

      // Sensitive fields should be redacted
      expect(result.faydaId).toBe('[REDACTED]');
      expect(result.password).toBe('[REDACTED]');
    });
  });
});
