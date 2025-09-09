/**
 * Frontend Configuration Gateway
 * Centralized access to environment variables for the website application
 * Following enterprise FinTech governance for environment variable management
 */

/**
 * Get environment variable with type safety
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || defaultValue!;
}

/**
 * Security configuration
 */
export const SecurityConfig = {
  get encryptionKey(): string {
    return getEnvVar('ENCRYPTION_KEY', 'default-encryption-key-change-in-production');
  },

  get jwtSecret(): string {
    return getEnvVar('JWT_SECRET', 'default-jwt-secret-change-in-production');
  },

  get apiUrl(): string {
    return getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api/v1');
  },

  get nodeEnv(): string {
    return getEnvVar('NODE_ENV', 'development');
  },

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
} as const;

/**
 * Application configuration
 */
export const AppConfig = {
  get port(): number {
    return parseInt(getEnvVar('PORT', '3000'), 10);
  },

  get globalPrefix(): string {
    return getEnvVar('GLOBAL_PREFIX', 'api');
  }
} as const;
