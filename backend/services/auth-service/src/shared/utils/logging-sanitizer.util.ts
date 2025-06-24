/* eslint-disable @typescript-eslint/no-explicit-any */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'faydaId',
  'creditCard',
  'cvv',
];

const REDACTION_TEXT = '[REDACTED]';

/**
 * Deeply clones and sanitizes an object by redacting values of sensitive keys.
 * @param obj The object to sanitize.
 * @returns A new, sanitized object.
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (
        SENSITIVE_KEYS.some(sensitiveKey =>
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        )
      ) {
        return [key, REDACTION_TEXT];
      }
      return [key, sanitizeObject(value)];
    })
  );
}
