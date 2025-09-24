// Payment plan constants
export const PAYMENT_PLAN_TYPES = {
  PAY_NOW: 'pay_now',
  PAY_LATER: 'pay_later',
  PAY_IN_4: 'pay_in_4',
  PAY_OVER_TIME: 'pay_over_time',
} as const;

// Interest rates for Pay Over Time (15-22% APR as per NBE regulations)
export const INTEREST_RATES = {
  MIN_APR: 0.15,
  MAX_APR: 0.22,
  DEFAULT_APR: 0.18,
} as const;

// Payment gateway constants
export const PAYMENT_GATEWAYS = {
  TELEBIRR: 'telebirr',
  CHAPA: 'chapa',
  HELLOCASH: 'hellocash',
  BANK: 'bank',
} as const;

// KYC status constants
export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

// Transaction status constants
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Currency constants
export const CURRENCIES = {
  ETB: 'ETB',
} as const;

// Validation constants
export const VALIDATION_RULES = {
  MIN_TRANSACTION_AMOUNT: 50, // 50 ETB
  MAX_TRANSACTION_AMOUNT: 50000, // 50,000 ETB
  MIN_CREDIT_LIMIT: 500, // 500 ETB
  MAX_CREDIT_LIMIT: 100000, // 100,000 ETB
  PASSWORD_MIN_LENGTH: 8,
  PIN_LENGTH: 6,
} as const;

// Ethiopian specific constants
export const ETHIOPIA = {
  COUNTRY_CODE: 'ET',
  PHONE_PREFIX: '+251',
  CURRENCY: 'ETB',
  TIMEZONE: 'Africa/Addis_Ababa',
} as const;

// NBE compliance constants
export const NBE_COMPLIANCE = {
  MAX_DAILY_TRANSACTION_LIMIT: 50000, // 50,000 ETB
  MAX_MONTHLY_TRANSACTION_LIMIT: 200000, // 200,000 ETB
  KYC_REQUIRED_AMOUNT: 3000, // 3,000 ETB
  ENHANCED_KYC_REQUIRED_AMOUNT: 15000, // 15,000 ETB
} as const;

// Feature flags
export const FEATURES = {
  BIOMETRIC_LOGIN: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_MODE: false,
  BETA_FEATURES: false,
} as const; 