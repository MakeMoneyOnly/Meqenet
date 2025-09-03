/**
 * Bilingual Error Messages for Authentication Service
 *
 * This module provides error messages in both English and Amharic (አማርኛ)
 * as required by Ethiopian financial regulations and NBE consumer protection directives.
 */

export interface BilingualErrorMessage {
  en: string;
  am: string;
  code: string;
  category: 'AUTH' | 'VALIDATION' | 'SECURITY' | 'SYSTEM' | 'COMPLIANCE';
}

export const AuthErrorMessages: Record<string, BilingualErrorMessage> = {
  // Authentication Errors
  INVALID_CREDENTIALS: {
    en: 'Invalid email or password. Please check and try again.',
    am: 'ልክ ያልሆነ ኢሜይል ወይም የይለፍ ቃል። እባክዎ ይመልከቱና እንደገና ይሞክሩ።',
    code: 'ERR_INVALID_CREDENTIALS',
    category: 'AUTH',
  },
  USER_NOT_FOUND: {
    en: 'User account not found. Please register first.',
    am: 'የተጠቃሚ መለያ አልተገኘም። እባክዎ መጀመሪያ ይመዝገቡ።',
    code: 'ERR_USER_NOT_FOUND',
    category: 'AUTH',
  },
  USER_ALREADY_EXISTS: {
    en: 'User with this email already exists. Please login or use a different email.',
    am: 'በዚህ ኢሜይል ያለ ተጠቃሚ አስቀድሞ አለ። እባክዎ ይግቡ ወይም የተለየ ኢሜይል ይጠቀሙ።',
    code: 'ERR_USER_ALREADY_EXISTS',
    category: 'AUTH',
  },
  ACCOUNT_LOCKED: {
    en: 'Account has been locked due to multiple failed login attempts. Please reset your password.',
    am: 'በተደጋጋሚ ያልተሳካ የመግቢያ ሙከራ ምክንያት መለያው ተቆልፏል። እባክዎ የይለፍ ቃልዎን ያስተካክሉ።',
    code: 'ERR_ACCOUNT_LOCKED',
    category: 'SECURITY',
  },
  TOKEN_EXPIRED: {
    en: 'Your session has expired. Please login again.',
    am: 'የእርስዎ ክፍለ-ጊዜ አብቅቷል። እባክዎ እንደገና ይግቡ።',
    code: 'ERR_TOKEN_EXPIRED',
    category: 'AUTH',
  },
  INVALID_TOKEN: {
    en: 'Invalid authentication token. Please login again.',
    am: 'ልክ ያልሆነ የማረጋገጫ ቶከን። እባክዎ እንደገና ይግቡ።',
    code: 'ERR_INVALID_TOKEN',
    category: 'AUTH',
  },
  REFRESH_TOKEN_EXPIRED: {
    en: 'Refresh token has expired. Please login again.',
    am: 'የማደስ ቶከን አብቅቷል። እባክዎ እንደገና ይግቡ።',
    code: 'ERR_REFRESH_TOKEN_EXPIRED',
    category: 'AUTH',
  },
  
  // Validation Errors
  EMAIL_REQUIRED: {
    en: 'Email address is required.',
    am: 'የኢሜይል አድራሻ ያስፈልጋል።',
    code: 'ERR_EMAIL_REQUIRED',
    category: 'VALIDATION',
  },
  EMAIL_INVALID: {
    en: 'Please provide a valid email address.',
    am: 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያቅርቡ።',
    code: 'ERR_EMAIL_INVALID',
    category: 'VALIDATION',
  },
  PASSWORD_REQUIRED: {
    en: 'Password is required.',
    am: 'የይለፍ ቃል ያስፈልጋል።',
    code: 'ERR_PASSWORD_REQUIRED',
    category: 'VALIDATION',
  },
  PASSWORD_TOO_SHORT: {
    en: 'Password must be at least 12 characters long.',
    am: 'የይለፍ ቃል ቢያንስ 12 ቁምፊዎች መሆን አለበት።',
    code: 'ERR_PASSWORD_TOO_SHORT',
    category: 'VALIDATION',
  },
  PASSWORD_TOO_WEAK: {
    en: 'Password must contain uppercase, lowercase, numbers and special characters.',
    am: 'የይለፍ ቃል ካፒታል፣ ትንንሽ ፊደሎች፣ ቁጥሮች እና ልዩ ቁምፊዎች መያዝ አለበት።',
    code: 'ERR_PASSWORD_TOO_WEAK',
    category: 'VALIDATION',
  },
  PHONE_REQUIRED: {
    en: 'Phone number is required.',
    am: 'የስልክ ቁጥር ያስፈልጋል።',
    code: 'ERR_PHONE_REQUIRED',
    category: 'VALIDATION',
  },
  PHONE_INVALID: {
    en: 'Invalid Ethiopian phone number format. Please use format: +251XXXXXXXXX',
    am: 'ልክ ያልሆነ የኢትዮጵያ ስልክ ቁጥር ቅርጸት። እባክዎ ይህንን ቅርጸት ይጠቀሙ: +251XXXXXXXXX',
    code: 'ERR_PHONE_INVALID',
    category: 'VALIDATION',
  },
  FAYDA_ID_REQUIRED: {
    en: 'Fayda National ID is required for registration.',
    am: 'ለምዝገባ የፋይዳ ብሔራዊ መታወቂያ ያስፈልጋል።',
    code: 'ERR_FAYDA_ID_REQUIRED',
    category: 'VALIDATION',
  },
  FAYDA_ID_INVALID: {
    en: 'Invalid Fayda National ID format. Must be 12 digits.',
    am: 'ልክ ያልሆነ የፋይዳ ብሔራዊ መታወቂያ ቅርጸት። 12 አሃዞች መሆን አለበት።',
    code: 'ERR_FAYDA_ID_INVALID',
    category: 'VALIDATION',
  },
  
  // Password Reset Errors
  RESET_TOKEN_INVALID: {
    en: 'Invalid or expired password reset token.',
    am: 'ልክ ያልሆነ ወይም ያለፈ የይለፍ ቃል ማስተካከያ ቶከን።',
    code: 'ERR_RESET_TOKEN_INVALID',
    category: 'AUTH',
  },
  RESET_TOKEN_EXPIRED: {
    en: 'Password reset token has expired. Please request a new one.',
    am: 'የይለፍ ቃል ማስተካከያ ቶከን አብቅቷል። እባክዎ አዲስ ይጠይቁ።',
    code: 'ERR_RESET_TOKEN_EXPIRED',
    category: 'AUTH',
  },
  
  // Security Errors
  UNAUTHORIZED: {
    en: 'You are not authorized to access this resource.',
    am: 'ይህንን ሀብት ለመድረስ ፈቃድ የለዎትም።',
    code: 'ERR_UNAUTHORIZED',
    category: 'SECURITY',
  },
  FORBIDDEN: {
    en: 'Access to this resource is forbidden.',
    am: 'ወደዚህ ሀብት መድረስ ክልክል ነው።',
    code: 'ERR_FORBIDDEN',
    category: 'SECURITY',
  },
  INSUFFICIENT_PERMISSIONS: {
    en: 'You do not have sufficient permissions to perform this action.',
    am: 'ይህንን ተግባር ለማከናወን በቂ ፈቃድ የለዎትም።',
    code: 'ERR_INSUFFICIENT_PERMISSIONS',
    category: 'SECURITY',
  },
  
  // Rate Limiting
  TOO_MANY_REQUESTS: {
    en: 'Too many requests. Please try again later.',
    am: 'በጣም ብዙ ጥያቄዎች። እባክዎ ቆየት ብለው ይሞክሩ።',
    code: 'ERR_TOO_MANY_REQUESTS',
    category: 'SECURITY',
  },
  
  // System Errors
  INTERNAL_ERROR: {
    en: 'An internal error occurred. Please try again later.',
    am: 'የውስጥ ስህተት ተፈጥሯል። እባክዎ ቆየት ብለው ይሞክሩ።',
    code: 'ERR_INTERNAL_ERROR',
    category: 'SYSTEM',
  },
  SERVICE_UNAVAILABLE: {
    en: 'Authentication service is temporarily unavailable. Please try again later.',
    am: 'የማረጋገጫ አገልግሎት ለጊዜው አይገኝም። እባክዎ ቆየት ብለው ይሞክሩ።',
    code: 'ERR_SERVICE_UNAVAILABLE',
    category: 'SYSTEM',
  },
};

/**
 * Get bilingual error message by code
 * @param errorCode - The error code to lookup
 * @param language - The preferred language (defaults to 'en')
 * @returns The error message in the specified language
 */
export function getAuthErrorMessage(
  errorCode: string,
  language: 'en' | 'am' = 'en'
): string {
  const error = AuthErrorMessages[errorCode];
  if (!error) {
    return language === 'am' 
      ? 'ያልታወቀ ስህተት ተፈጥሯል።' 
      : 'An unknown error occurred.';
  }
  return error[language];
}

/**
 * Get the full bilingual error object
 * @param errorCode - The error code to lookup
 * @returns The complete bilingual error object
 */
export function getBilingualAuthError(
  errorCode: string
): BilingualErrorMessage | null {
  return AuthErrorMessages[errorCode] || null;
}

/**
 * Create a standardized bilingual error response
 * @param errorCode - The error code
 * @param httpStatus - HTTP status code
 * @param requestId - Unique request identifier for tracking
 * @returns Standardized error response
 */
export function createBilingualAuthErrorResponse(
  errorCode: string,
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
  const error = AuthErrorMessages[errorCode];
  const fallbackError: BilingualErrorMessage = {
    en: 'An unknown error occurred.',
    am: 'ያልታወቀ ስህተት ተፈጥሯል።',
    code: 'ERR_UNKNOWN',
    category: 'SYSTEM',
  };

  const errorData = error || fallbackError;

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
      requestId,
    },
  };
}

/**
 * Validate if an error code exists
 * @param errorCode - The error code to validate
 * @returns True if the error code exists
 */
export function isValidAuthErrorCode(errorCode: string): boolean {
  return errorCode in AuthErrorMessages;
}