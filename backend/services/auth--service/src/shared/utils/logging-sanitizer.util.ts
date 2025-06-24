/**
 * Logging Sanitizer Utility for Meqenet FinTech Platform
 *
 * This utility provides comprehensive data sanitization for logging purposes,
 * ensuring compliance with NBE regulations and Ethiopian data protection laws.
 *
 * Critical for:
 * - PII/Financial data protection
 * - NBE audit compliance
 * - Security incident response
 * - Fraud detection without data leakage
 */

// Constants for magic numbers
const MAX_RECURSION_DEPTH = 10;
const MIN_MASK_LENGTH = 2;
const SHORT_MASK_LENGTH = 4;
const MASK_PREFIX_LENGTH = 2;
const MASK_SUFFIX_LENGTH = 2;

/**
 * Type definitions for better type safety
 */
type LogValue = string | number | boolean | null | undefined;
type LogObject = Record<string, unknown>;
type SanitizableData = LogValue | LogObject | unknown[] | unknown;

/**
 * Sensitive field patterns that must be sanitized in logs
 * These patterns cover Ethiopian FinTech specific data requirements
 */
const SENSITIVE_PATTERNS = {
  // Financial Data - Safe patterns without exponential backtracking
  CARD_NUMBERS: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  BANK_ACCOUNTS: /\b\d{10,18}\b/g,
  // Simple amount pattern without complex quantifiers
  AMOUNTS: /\b(?:etb|birr|amount)\s*:?\s*\d+\b/gi,

  // Ethiopian Identity Data
  FAYDA_ID: /\b\d{10,12}\b/g, // Ethiopian Fayda National ID format
  PHONE_NUMBERS: /\b(?:\+251|0)?[79]\d{8}\b/g, // Ethiopian phone numbers

  // Authentication & Security - Safe patterns
  PASSWORDS: /(?:password|pwd|pass)\s*[:=]\s*[^\s,}]{1,100}/gi,
  TOKENS: /(?:token|jwt|bearer)\s*[:=]\s*[a-zA-Z0-9._-]{1,500}/gi,
  SECRETS: /(?:secret|key|api_key)\s*[:=]\s*[a-zA-Z0-9._-]{1,200}/gi,

  // PII
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
};

/**
 * Fields that should always be completely removed from logs
 */
const BLOCKED_FIELDS = [
  'password',
  'pwd',
  'secret',
  'token',
  'jwt',
  'api_key',
  'apiKey',
  'authorization',
  'auth_token',
  'refresh_token',
  'access_token',
  'credit_card',
  'creditCard',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
  'pin',
  'ssn',
  'fayda_id',
  'faydaId',
  'national_id',
  'nationalId',
  'bank_account',
  'bankAccount',
  'iban',
  'swift',
];

/**
 * Fields that should be partially masked (keep first/last chars)
 */
const MASKED_FIELDS = [
  'email',
  'phone',
  'mobile',
  'phoneNumber',
  'mobileNumber',
  'user_id',
  'userId',
  'customer_id',
  'customerId',
  'merchant_id',
  'merchantId',
];

/**
 * Sanitizes sensitive data from any object for safe logging
 *
 * @param data - The data object to sanitize
 * @param depth - Current recursion depth (prevent infinite loops)
 * @returns Sanitized object safe for logging
 */
export function sanitizeObject(
  data: SanitizableData,
  depth = 0
): SanitizableData {
  // Prevent infinite recursion and performance issues
  if (depth > MAX_RECURSION_DEPTH) {
    return '[MAX_DEPTH_REACHED]';
  }

  // Handle null, undefined, and primitive types
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle objects - safer implementation without object injection
  if (typeof data === 'object' && data !== null) {
    const sanitized: LogObject = {};

    // Use Object.entries for safe iteration
    const entries = Object.entries(data as LogObject);
    for (const [key, value] of entries) {
      const lowerKey = key.toLowerCase();

      // Check if field should be completely blocked
      const isBlocked = BLOCKED_FIELDS.some(blocked =>
        lowerKey.includes(blocked)
      );
      if (isBlocked) {
        Object.assign(sanitized, { [key]: '[REDACTED]' });
        continue;
      }

      // Check if field should be masked
      const isMasked = MASKED_FIELDS.some(masked => lowerKey.includes(masked));
      if (isMasked) {
        Object.assign(sanitized, { [key]: maskValue(String(value)) });
        continue;
      }

      // Recursively sanitize nested objects
      Object.assign(sanitized, { [key]: sanitizeObject(value, depth + 1) });
    }

    return sanitized;
  }

  return data;
}

/**
 * Sanitizes sensitive patterns from strings
 *
 * @param text - The string to sanitize
 * @returns Sanitized string
 */
function sanitizeString(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let sanitized = text;

  // Apply all sensitive pattern replacements
  const patterns = Object.values(SENSITIVE_PATTERNS);
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized;
}

/**
 * Masks a value by showing only first and last characters
 *
 * @param value - The value to mask
 * @returns Masked value
 */
function maskValue(value: string): string {
  if (!value || value.length <= MIN_MASK_LENGTH) {
    return '[REDACTED]';
  }

  if (value.length <= SHORT_MASK_LENGTH) {
    return (
      value[0] +
      '*'.repeat(value.length - MIN_MASK_LENGTH) +
      value[value.length - 1]
    );
  }

  return (
    value.substring(0, MASK_PREFIX_LENGTH) +
    '*'.repeat(value.length - MASK_SUFFIX_LENGTH - MASK_PREFIX_LENGTH) +
    value.substring(value.length - MASK_SUFFIX_LENGTH)
  );
}

/**
 * Sanitizes error objects for safe logging
 *
 * @param error - The error object to sanitize
 * @returns Sanitized error object
 */
export function sanitizeError(error: unknown): LogObject | SanitizableData {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeString(error.message),
      stack: error.stack ? sanitizeString(error.stack) : undefined,
    };
  }

  return sanitizeObject(error);
}

/**
 * Creates a safe log context with correlation ID and sanitized data
 *
 * @param correlationId - Request correlation ID
 * @param context - Additional context data
 * @returns Sanitized log context
 */
export function createLogContext(
  correlationId: string,
  context: LogObject = {}
): LogObject {
  return {
    correlationId,
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    ...(sanitizeObject(context) as LogObject),
  };
}
