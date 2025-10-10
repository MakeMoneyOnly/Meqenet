const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'faydaId',
  'creditCard',
  'cvv',
  'cvvCode',
  'securityCode', // Added missing security code
];

const REDACTION_TEXT = '[REDACTED]';

/**
 * Deeply clones and sanitizes an object by redacting values of sensitive keys.
 * Handles circular references and optimizes performance for large objects.
 * @param obj The object to sanitize.
 * @param seen WeakSet to track visited objects for circular reference detection.
 * @returns A new, sanitized object.
 */
export function sanitizeObject<T>(
  obj: T,
  seen: WeakSet<object> = new WeakSet()
): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects specially
  if (obj instanceof Date) {
    return obj;
  }

  // Circular reference detection
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, seen)) as unknown as T;
  }

  // Handle objects safely using Object.fromEntries
  const entries = Object.entries(obj as Record<string, unknown>).map(
    ([key, value]) => {
      const safeKey = String(key);

      if (
        SENSITIVE_KEYS.some(sensitiveKey =>
          safeKey.toLowerCase().includes(sensitiveKey.toLowerCase())
        )
      ) {
        return [safeKey, REDACTION_TEXT];
      } else {
        return [safeKey, sanitizeObject(value, seen)];
      }
    }
  );

  const result = Object.fromEntries(entries);

  // Remove from seen set to allow the same object in different branches
  seen.delete(obj);

  return result as T;
}
