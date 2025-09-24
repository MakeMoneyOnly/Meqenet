// Environment configuration
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  
  // Payment gateway configurations
  TELEBIRR_API_KEY: process.env.TELEBIRR_API_KEY || '',
  CHAPA_API_KEY: process.env.CHAPA_API_KEY || '',
  HELLOCASH_API_KEY: process.env.HELLOCASH_API_KEY || '',
  
  // Feature flags
  ENABLE_BIOMETRIC_LOGIN: process.env.ENABLE_BIOMETRIC_LOGIN === 'true',
  ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
  ENABLE_OFFLINE_MODE: process.env.ENABLE_OFFLINE_MODE === 'true',
} as const;

// API configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    USERS: {
      PROFILE: '/users/profile',
      UPDATE: '/users/update',
      DELETE: '/users/delete',
    },
    TRANSACTIONS: {
      CREATE: '/transactions',
      LIST: '/transactions',
      DETAILS: '/transactions/:id',
      CANCEL: '/transactions/:id/cancel',
    },
    KYC: {
      SUBMIT: '/kyc/submit',
      STATUS: '/kyc/status',
      DOCUMENTS: '/kyc/documents',
    },
    MERCHANTS: {
      LIST: '/merchants',
      DETAILS: '/merchants/:id',
      SEARCH: '/merchants/search',
    },
  },
} as const;

// App configuration
export const APP_CONFIG = {
  NAME: 'Meqenet.et',
  VERSION: '1.0.0',
  BUILD_NUMBER: process.env.BUILD_NUMBER || '1',
  
  // Security settings
  SECURITY: {
    PIN_ATTEMPTS: 3,
    BIOMETRIC_TIMEOUT: 30000, // 30 seconds
    SESSION_TIMEOUT: 900000, // 15 minutes
    ENCRYPTION_KEY_SIZE: 256,
  },
  
  // UI settings
  UI: {
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    LOADING_TIMEOUT: 10000,
  },
  
  // Business rules
  BUSINESS: {
    MIN_CREDIT_SCORE: 300,
    MAX_CREDIT_LIMIT: 100000, // 100,000 ETB
    DEFAULT_CREDIT_LIMIT: 5000, // 5,000 ETB
    CASHBACK_RATE: 0.02, // 2%
  },
} as const;

// Development configuration
export const DEV_CONFIG = {
  ENABLE_REDUX_DEVTOOLS: ENV.NODE_ENV === 'development',
  ENABLE_FLIPPER: ENV.NODE_ENV === 'development',
  ENABLE_MOCK_DATA: ENV.NODE_ENV === 'development',
  LOG_LEVEL: ENV.NODE_ENV === 'development' ? 'debug' : 'error',
} as const; 