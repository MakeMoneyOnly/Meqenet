/**
 * Bilingual Error Messages for Ethiopian FinTech Compliance
 *
 * This module provides error messages in both English and Amharic (አማርኛ)
 * as required by Ethiopian financial regulations and NBE consumer protection directives.
 *
 * All financial error messages must be provided in both languages to ensure
 * consumer understanding and regulatory compliance.
 */

export interface BilingualErrorMessage {
  readonly en: string;
  readonly am: string;
  readonly code: string;
  readonly category:
    | 'FINANCIAL'
    | 'SECURITY'
    | 'VALIDATION'
    | 'SYSTEM'
    | 'COMPLIANCE';
}

// Using a Map is safer than a plain object for lookups with external input.
export const ErrorMessagesMap = new Map<string, BilingualErrorMessage>([
  // Financial Errors (NBE Compliance)
  [
    'INSUFFICIENT_FUNDS',
    {
      en: 'Insufficient funds in your account to complete this transaction.',
      am: 'ይህንን ግብይት ለመጨረስ በሒሳብዎ ውስጥ በቂ ገንዘብ የለም።',
      code: 'ERR_INSUFFICIENT_FUNDS',
      category: 'FINANCIAL',
    },
  ],
  [
    'CREDIT_LIMIT_EXCEEDED',
    {
      en: 'Credit limit exceeded. Please make a payment or contact customer service.',
      am: 'የብድር ገደብ ተሻሽቷል። እባክዎ ክፍያ ያድርጉ ወይም የደንበኞች አገልግሎት ያነጋግሩ።',
      code: 'ERR_CREDIT_LIMIT_EXCEEDED',
      category: 'FINANCIAL',
    },
  ],
  [
    'INVALID_INTEREST_RATE',
    {
      en: 'Interest rate exceeds NBE maximum limit of 22% per annum.',
      am: 'የወለድ መጠን ከኤን.ቢ.ኢ የከፍተኛ ገደብ 22% በዓመት ተሻሽቷል።',
      code: 'ERR_INVALID_INTEREST_RATE',
      category: 'FINANCIAL',
    },
  ],
  [
    'TRANSACTION_LIMIT_EXCEEDED',
    {
      en: 'Transaction amount exceeds daily limit. Please try a smaller amount.',
      am: 'የግብይት መጠን ከቀናዊ ገደብ ይበልጣል። እባክዎ ያነሰ መጠን ይሞክሩ።',
      code: 'ERR_TRANSACTION_LIMIT_EXCEEDED',
      category: 'FINANCIAL',
    },
  ],

  // KYC/Identity Verification Errors
  [
    'INVALID_FAYDA_ID',
    {
      en: 'Invalid Fayda National ID format. Please check and try again.',
      am: 'ልክ ያልሆነ የፋይዳ ብሔራዊ መታወቂያ ቅርጸት። እባክዎ ይመልከቱና እንደገና ይሞክሩ።',
      code: 'ERR_INVALID_FAYDA_ID',
      category: 'VALIDATION',
    },
  ],
  [
    'FAYDA_ID_NOT_VERIFIED',
    {
      en: 'Fayda National ID could not be verified. Please contact customer service.',
      am: 'የፋይዳ ብሔራዊ መታወቂያ ማረጋገጥ አልተቻለም። እባክዎ የደንበኞች አገልግሎት ያነጋግሩ።',
      code: 'ERR_FAYDA_ID_NOT_VERIFIED',
      category: 'VALIDATION',
    },
  ],
  [
    'KYC_INCOMPLETE',
    {
      en: 'KYC verification incomplete. Please complete your profile verification.',
      am: 'የKYC ማረጋገጫ ያልተጠናቀቀ። እባክዎ የፕሮፋይልዎን ማረጋገጫ ያጠናቅቁ።',
      code: 'ERR_KYC_INCOMPLETE',
      category: 'COMPLIANCE',
    },
  ],

  // Payment Provider Errors
  [
    'TELEBIRR_PAYMENT_FAILED',
    {
      en: 'TeleBirr payment failed. Please try again or use a different payment method.',
      am: 'የቴሌብር ክፍያ አልተሳካም። እባክዎ እንደገና ይሞክሩ ወይም የተለየ የክፍያ መንገድ ይጠቀሙ።',
      code: 'ERR_TELEBIRR_PAYMENT_FAILED',
      category: 'FINANCIAL',
    },
  ],
  [
    'MPESA_PAYMENT_FAILED',
    {
      en: 'M-Pesa payment failed. Please check your M-Pesa balance and try again.',
      am: 'የM-Pesa ክፍያ አልተሳካም። እባክዎ የM-Pesa ሂሳብዎን ይመልከቱና እንደገና ይሞክሩ።',
      code: 'ERR_MPESA_PAYMENT_FAILED',
      category: 'FINANCIAL',
    },
  ],
  [
    'CBE_BIRR_PAYMENT_FAILED',
    {
      en: 'CBE Birr payment failed. Please contact CBE customer service.',
      am: 'የCBE ብር ክፍያ አልተሳካም። እባክዎ የCBE የደንበኞች አገልግሎት ያነጋግሩ።',
      code: 'ERR_CBE_BIRR_PAYMENT_FAILED',
      category: 'FINANCIAL',
    },
  ],

  // Security Errors
  [
    'UNAUTHORIZED_ACCESS',
    {
      en: 'Unauthorized access attempt. Please log in again.',
      am: 'ያልተፈቀደ የመዳረሻ ሙከራ። እባክዎ እንደገና ይግቡ።',
      code: 'ERR_UNAUTHORIZED_ACCESS',
      category: 'SECURITY',
    },
  ],
  [
    'SESSION_EXPIRED',
    {
      en: 'Your session has expired. Please log in again.',
      am: 'የእርስዎ ክፍለ-ጊዜ አብቅቷል። እባክዎ እንደገና ይግቡ።',
      code: 'ERR_SESSION_EXPIRED',
      category: 'SECURITY',
    },
  ],
  [
    'ACCOUNT_SUSPENDED',
    {
      en: 'Your account has been suspended due to security concerns. Please contact customer service.',
      am: 'በደህንነት ስጋቶች ምክንያት መለያዎ ታግዷል። እባክዎ የደንበኞች አገልግሎት ያነጋግሩ።',
      code: 'ERR_ACCOUNT_SUSPENDED',
      category: 'SECURITY',
    },
  ],

  // NBE Compliance Errors
  [
    'NBE_REPORTING_FAILED',
    {
      en: 'Failed to report transaction to NBE. Transaction may be delayed.',
      am: 'ግብይቱን ለኤን.ቢ.ኢ ሪፖርት ማድረግ አልተሳካም። ግብይቱ ሊዘገይ ይችላል።',
      code: 'ERR_NBE_REPORTING_FAILED',
      category: 'COMPLIANCE',
    },
  ],
  [
    'DATA_RESIDENCY_VIOLATION',
    {
      en: 'Data residency requirements violated. Data must remain in Ethiopia.',
      am: 'የመረጃ ነዋሪነት መስፈርቶች ተጥሰዋል። መረጃው በኢትዮጵያ ውስጥ መቆየት አለበት።',
      code: 'ERR_DATA_RESIDENCY_VIOLATION',
      category: 'COMPLIANCE',
    },
  ],

  // System Errors
  [
    'SERVICE_UNAVAILABLE',
    {
      en: 'Service temporarily unavailable. Please try again later.',
      am: 'አገልግሎቱ ለጊዜው አይገኝም። እባክዎ ቆየት ገምተው እንደገና ይሞክሩ።',
      code: 'ERR_SERVICE_UNAVAILABLE',
      category: 'SYSTEM',
    },
  ],
  [
    'DATABASE_CONNECTION_FAILED',
    {
      en: 'Database connection failed. Please try again later.',
      am: 'የመረጃ ቋት ግንኙነት አልተሳካም። እባክዎ ቆየት ገምተው እንደገና ይሞክሩ።',
      code: 'ERR_DATABASE_CONNECTION_FAILED',
      category: 'SYSTEM',
    },
  ],

  // Validation Errors
  [
    'INVALID_PHONE_NUMBER',
    {
      en: 'Invalid Ethiopian phone number format. Please use format: +251XXXXXXXXX',
      am: 'ልክ ያልሆነ የኢትዮጵያ ስልክ ቁጥር ቅርጸት። እባክዎ ይህንን ቅርጸት ይጠቀሙ: +251XXXXXXXXX',
      code: 'ERR_INVALID_PHONE_NUMBER',
      category: 'VALIDATION',
    },
  ],
  [
    'INVALID_ETB_AMOUNT',
    {
      en: 'Invalid Ethiopian Birr amount. Must be positive with maximum 2 decimal places.',
      am: 'ልክ ያልሆነ የኢትዮጵያ ብር መጠን። አዎንታዊ እና ከ2 ዴሲማል ስፍራዎች ዝቅተኛ መሆን አለበት።',
      code: 'ERR_INVALID_ETB_AMOUNT',
      category: 'VALIDATION',
    },
  ],
]);

const MIN_HTTP_STATUS_CODE = 100;
const MAX_HTTP_STATUS_CODE = 599;

/**
 * Validates error code to prevent injection attacks
 * @param errorCode - The error code to validate
 * @returns True if valid, throws error if invalid
 */
function validateErrorCode(errorCode: unknown): errorCode is string {
  if (typeof errorCode !== 'string') {
    throw new Error('Error code must be a string');
  }

  // Check for potential injection patterns
  if (
    errorCode.includes('..') ||
    errorCode.includes('/') ||
    errorCode.includes('\\')
  ) {
    throw new Error('Invalid error code: contains unsafe characters');
  }

  // Limit length to prevent buffer overflow attacks
  if (errorCode.length > 100) {
    throw new Error('Error code too long');
  }

  return true;
}

/**
 * Gets a bilingual error message by code
 * @param errorCode - The error code to lookup
 * @param language - The preferred language (defaults to 'en')
 * @returns The error message in the specified language
 */
export function getErrorMessage(
  errorCode: unknown,
  language: 'en' | 'am' = 'en'
): string {
  // Validate inputs to prevent injection attacks
  validateErrorCode(errorCode);

  if (language !== 'en' && language !== 'am') {
    throw new Error('Invalid language: must be "en" or "am"');
  }

  const error = ErrorMessagesMap.get(errorCode as string);
  if (!error) {
    // Fallback error message - no user input is used here
    return language === 'am'
      ? 'ያልታወቀ ስህተት ተፈጥሯል።'
      : 'An unknown error occurred.';
  }
  // Access properties directly to avoid injection warnings
  return language === 'am' ? error.am : error.en;
}

/**
 * Gets the full bilingual error object
 * @param errorCode - The error code to lookup
 * @returns The complete bilingual error object
 */
export function getBilingualError(
  errorCode: unknown
): BilingualErrorMessage | null {
  validateErrorCode(errorCode);
  return ErrorMessagesMap.get(errorCode as string) ?? null;
}

/**
 * Creates a standardized error response with bilingual messages
 * @param errorCode - The error code
 * @param httpStatus - HTTP status code
 * @param requestId - Unique request identifier for tracking
 * @returns Standardized error response
 */
export function createBilingualErrorResponse(
  errorCode: unknown,
  httpStatus: number,
  requestId?: string
): {
  error: {
    code: string;
    category: string;
    message: {
      en: string;
      am: string;
    };
    httpStatus: number;
    timestamp: string;
    requestId?: string;
  };
} {
  validateErrorCode(errorCode);

  // Validate HTTP status code
  if (
    typeof httpStatus !== 'number' ||
    httpStatus < MIN_HTTP_STATUS_CODE ||
    httpStatus > MAX_HTTP_STATUS_CODE
  ) {
    throw new Error('Invalid HTTP status code');
  }

  // Validate request ID if provided
  if (requestId !== undefined && typeof requestId !== 'string') {
    throw new Error('Request ID must be a string');
  }

  const error = ErrorMessagesMap.get(errorCode as string);
  const fallbackError: BilingualErrorMessage = {
    en: 'An unknown error occurred.',
    am: 'ያልታወቀ ስህተት ተፈጥሯል።',
    code: 'ERR_UNKNOWN',
    category: 'SYSTEM',
  };

  const errorData = error ?? fallbackError;

  return {
    error: {
      code: errorData.code,
      category: errorData.category,
      message: {
        en: errorData.en,
        am: errorData.am,
      },
      httpStatus,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    },
  };
}

/**
 * Validates if an error code exists
 * @param errorCode - The error code to validate
 * @returns True if the error code exists
 */
export function isValidErrorCode(errorCode: unknown): boolean {
  try {
    validateErrorCode(errorCode);
    return ErrorMessagesMap.has(errorCode as string);
  } catch {
    return false;
  }
}
