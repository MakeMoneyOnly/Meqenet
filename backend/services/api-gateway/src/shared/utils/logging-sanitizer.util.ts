/**
 * Sensitive keys that should be redacted in logs (PCI DSS compliance)
 */
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
  'securityCode',
] as const;

const REDACTION_TEXT = '[REDACTED]';

/**
 * Type-safe sanitization result
 * Preserves input type while allowing string replacements for sensitive values
 */
type SanitizedValue<T> = T extends Date
  ? Date
  : T extends Array<infer U>
    ? Array<SanitizedValue<U>>
    : T extends Record<string, unknown>
      ? { [K in keyof T]: SanitizedValue<T[K]> | string }
      : T;

/**
 * Deeply clones and sanitizes an object by redacting values of sensitive keys.
 * Handles circular references and optimizes performance for large objects.
 * Type-safe implementation that preserves input types (FinTech industry standard).
 *
 * @param obj The object to sanitize.
 * @param seen WeakSet to track visited objects for circular reference detection.
 * @returns A new, sanitized object with preserved type structure.
 */
export function sanitizeObject<T>(
  obj: T,
  seen = new WeakSet<object>()
): SanitizedValue<T> {
  // Primitive types pass through unchanged
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as SanitizedValue<T>;
  }

  // Handle Date objects specially
  if (obj instanceof Date) {
    return obj as SanitizedValue<T>;
  }

  // Circular reference detection
  if (seen.has(obj)) {
    return '[Circular Reference]' as SanitizedValue<T>;
  }
  seen.add(obj);

  // Handle arrays with type preservation
  if (Array.isArray(obj)) {
    const sanitizedArray = obj.map(item => sanitizeObject(item, seen));
    seen.delete(obj);
    return sanitizedArray as SanitizedValue<T>;
  }

  // Handle objects safely using Object.fromEntries with type checking
  const entries = Object.entries(obj).map(([key, value]) => {
    const safeKey = String(key);

    // Check if key matches sensitive patterns (case-insensitive)
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
      safeKey.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      return [safeKey, REDACTION_TEXT] as const;
    } else {
      return [safeKey, sanitizeObject(value, seen)] as const;
    }
  });

  const result = Object.fromEntries(entries);

  // Remove from seen set to allow the same object in different branches
  seen.delete(obj);

  return result as SanitizedValue<T>;
}
