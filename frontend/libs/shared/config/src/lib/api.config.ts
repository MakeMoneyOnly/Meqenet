/**
 * API Configuration Gateway
 * Centralized access to environment variables for API-related functionality
 * Following enterprise FinTech governance for environment variable management
 */

/**
 * Get environment variable with type safety
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key as keyof typeof process.env];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || (defaultValue ?? '');
}

/**
 * API Configuration
 * Centralized configuration for API clients and endpoints
 */
export const ApiConfig = {
  /**
   * Base API URL for backend services
   */
  get baseUrl(): string {
    return getEnvVar('EXPO_PUBLIC_API_URL', getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'));
  },

  /**
   * Next.js API URL for web application
   */
  get nextJsApiUrl(): string {
    return getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api/v1');
  },

  /**
   * BNPL API URL for BNPL services
   */
  get bnplApiUrl(): string {
    return getEnvVar('EXPO_PUBLIC_BNPL_API_URL', 'http://localhost:3001/api');
  },

  /**
   * Node environment
   */
  get nodeEnv(): string {
    return getEnvVar('NODE_ENV', 'development');
  },

  /**
   * Check if running in development mode
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  },

  /**
   * Check if running in production mode
   */
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },

  /**
   * API timeout configuration
   */
  get timeout(): number {
    return parseInt(getEnvVar('API_TIMEOUT', '10000'), 10);
  },

  /**
   * API retry configuration
   */
  get retries(): number {
    return parseInt(getEnvVar('API_RETRIES', '3'), 10);
  },
} as const;
