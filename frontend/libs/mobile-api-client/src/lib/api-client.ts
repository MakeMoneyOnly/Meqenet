/**
 * Mobile/Web API Client
 *
 * Axios-based HTTP client configured for both mobile and web environments
 * Includes retry logic, timeout handling, error interceptors, and platform-specific SSL handling
 *
 * Platform-specific behavior:
 * - Mobile (React Native): Uses certificate pinning via react-native-ssl-pinning
 * - Web: Uses browser-native HTTPS with additional security headers and domain validation
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiConfig } from '@meqenet/shared/config';

// Environment detection
const isReactNative =
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isDevelopment = ApiConfig.isDevelopment;

// Logger utility for proper logging
const logger = {
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    }
  },
  log: (message: string, ...args: unknown[]) => {
    if (isDevelopment && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error(message, ...args);
    }
  },
};

// Conditional imports for React Native SSL pinning (only available on mobile)
let addSSLPinningHosts:
  | ((hosts: Record<string, unknown>) => Promise<void>)
  | null = null;
let initializeSSLPinning:
  | ((config: Record<string, unknown>) => Promise<void>)
  | null = null;
let ReactNativeSSLPinningAdapter: unknown = null;

try {
  // Only import React Native SSL pinning on mobile platforms
  if (isReactNative) {
    const sslPinning = require('react-native-ssl-pinning');
    addSSLPinningHosts = sslPinning.addSSLPinningHosts;
    initializeSSLPinning = sslPinning.initializeSSLPinning;
    ReactNativeSSLPinningAdapter = sslPinning.default;
  }
} catch {
  // React Native SSL pinning not available (web environment)
  logger.warn(
    '⚠️ React Native SSL pinning not available - using standard HTTPS',
  );
}

// Types
interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  data?: unknown;
}

interface CertificatePinningConfig {
  [hostname: string]: {
    certificateHashes: string[];
    includeSubdomains?: boolean;
    enforcePinning?: boolean;
  };
}

// Certificate pinning configuration for Meqenet
const CERTIFICATE_PINNING_CONFIG: CertificatePinningConfig = {
  'api.meqenet.et': {
    certificateHashes: [
      // Production certificate hashes - replace with actual hashes
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    ],
    includeSubdomains: true,
    enforcePinning: true,
  },
  'staging-api.meqenet.et': {
    certificateHashes: [
      // Staging certificate hashes - replace with actual hashes
      'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
    ],
    includeSubdomains: false,
    enforcePinning: true,
  },
};

/**
 * Safely get certificate pinning configuration for a hostname
 * Prevents object injection attacks by validating hostname against known configs
 */
function getCertificatePinningConfig(
  hostname: string,
): CertificatePinningConfig[keyof CertificatePinningConfig] | null {
  // Whitelist of allowed hostnames to prevent injection attacks
  const allowedHostnames: (keyof CertificatePinningConfig)[] = [
    'api.meqenet.et',
    'staging-api.meqenet.et',
  ];

  if (!allowedHostnames.includes(hostname as keyof CertificatePinningConfig)) {
    return null;
  }

  return (
    CERTIFICATE_PINNING_CONFIG[hostname as keyof CertificatePinningConfig] ||
    null
  );
}

// Web-specific SSL configuration
const WEB_SSL_CONFIG = {
  // Strict SSL validation for web browsers
  rejectUnauthorized: true,
  // Additional security headers for web requests
  securityHeaders: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
  // Trusted certificate authorities for web
  trustedCAs: [
    // Add specific CA certificates if needed
  ],
};

// Default configuration
const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: ApiConfig.baseUrl,
  timeout: ApiConfig.timeout,
  retries: ApiConfig.retries,
  retryDelay: 1000, // 1 second
};

/**
 * Initialize SSL certificate pinning
 */
async function initializeCertificatePinning(): Promise<void> {
  // Check if React Native SSL pinning is available
  if (!initializeSSLPinning) {
    logger.warn(
      '⚠️ SSL certificate pinning not available in this environment (web browser)',
    );
    logger.log('ℹ️ Using standard HTTPS without certificate pinning');
    return;
  }

  try {
    // Initialize SSL pinning with certificate hashes
    if (initializeSSLPinning) {
      await initializeSSLPinning({
        'api.meqenet.et': {
          certificateHashes:
            CERTIFICATE_PINNING_CONFIG['api.meqenet.et'].certificateHashes,
          includeSubdomains:
            CERTIFICATE_PINNING_CONFIG['api.meqenet.et'].includeSubdomains,
          enforcePinning:
            CERTIFICATE_PINNING_CONFIG['api.meqenet.et'].enforcePinning,
        },
        'staging-api.meqenet.et': {
          certificateHashes:
            CERTIFICATE_PINNING_CONFIG['staging-api.meqenet.et']
              .certificateHashes,
          includeSubdomains:
            CERTIFICATE_PINNING_CONFIG['staging-api.meqenet.et']
              .includeSubdomains,
          enforcePinning:
            CERTIFICATE_PINNING_CONFIG['staging-api.meqenet.et'].enforcePinning,
        },
      });
      logger.log('✅ SSL Certificate pinning initialized successfully');
    } else {
      logger.warn(
        '⚠️ SSL certificate pinning not available in this environment',
      );
    }
  } catch (error) {
    logger.error('❌ Failed to initialize SSL certificate pinning:', error);
    // In development, we might want to continue without pinning
    if (isDevelopment) {
      logger.warn(
        '⚠️ Continuing without certificate pinning in development mode',
      );
    } else {
      throw new Error('SSL certificate pinning initialization failed');
    }
  }
}

/**
 * Web-specific SSL validation
 * Performs additional security checks for web environments
 */
function validateWebSSL(url: string): void {
  if (typeof window === 'undefined') return;

  try {
    const urlObj = new URL(url);

    // Ensure HTTPS for production environments
    if (urlObj.protocol !== 'https:' && !isDevelopment) {
      logger.warn(`⚠️ Non-HTTPS URL detected in production: ${url}`);
    }

    // Validate against known trusted domains
    const trustedDomains = [
      'api.meqenet.et',
      'staging-api.meqenet.et',
      'localhost',
    ];
    const isTrusted = trustedDomains.some(
      (domain) =>
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain),
    );

    if (!isTrusted && !isDevelopment) {
      logger.warn(`⚠️ Request to untrusted domain: ${urlObj.hostname}`);
    }
  } catch (error) {
    logger.error('❌ Error validating web SSL configuration:', error);
  }
}

/**
 * Create API client with mobile-specific configuration
 */
async function createApiClient(
  config: ApiClientConfig = {},
): Promise<AxiosInstance> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate web SSL configuration
  validateWebSSL(finalConfig.baseURL);

  // Initialize certificate pinning first
  await initializeCertificatePinning();

  const client = axios.create({
    baseURL: finalConfig.baseURL,
    timeout: finalConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Add security headers for web requests
      ...(typeof window !== 'undefined' && WEB_SSL_CONFIG.securityHeaders),
    },
    // Use SSL pinning adapter for certificate validation (only on mobile)
    ...(ReactNativeSSLPinningAdapter && {
      adapter: ReactNativeSSLPinningAdapter,
    }),
    // Web-specific SSL configuration
    ...(typeof window !== 'undefined' && {
      httpsAgent: WEB_SSL_CONFIG.rejectUnauthorized ? undefined : undefined, // Let browser handle SSL
    }),
  });

  // Request interceptor for auth tokens
  client.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add correlation ID for tracing
      config.headers['X-Correlation-ID'] = generateCorrelationId();

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle certificate pinning errors
      if (
        error.code === 'CERTIFICATE_PINNING_ERROR' ||
        error.message?.includes('certificate')
      ) {
        logger.error('🚨 Certificate pinning validation failed:', error);
        // Log security event for monitoring
        // In production, this should trigger security alerts

        const certificateError: ApiError = {
          message: 'Security validation failed. Please update the app.',
          code: 'CERTIFICATE_PINNING_FAILED',
          status: 0,
          data: { type: 'certificate_validation_error' },
        };
        return Promise.reject(certificateError);
      }

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshAuthToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          }
        } catch {
          // Refresh failed, redirect to login
          handleAuthenticationFailure();
        }
      }

      // Transform error for consistent handling
      const apiError: ApiError = {
        message:
          error.response?.data?.message || error.message || 'Network error',
        code: error.response?.data?.code || error.code,
        status: error.response?.status,
        data: error.response?.data,
      };

      return Promise.reject(apiError);
    },
  );

  return client;
}

/**
 * Get stored authentication token
 * In production, this should use secure storage
 */
function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

/**
 * Refresh authentication token
 * In production, this should call the refresh endpoint
 */
async function refreshAuthToken(): Promise<string | null> {
  try {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return null;
    }

    // This should be replaced with actual refresh API call
    // const response = await axios.post('/auth/refresh', { refreshToken });
    // return response.data.accessToken;

    // Placeholder: return null to force re-authentication
    return null;
  } catch {
    return null;
  }
}

/**
 * Get stored refresh token
 */
function getStoredRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
}

/**
 * Handle authentication failure
 */
function handleAuthenticationFailure(): void {
  // Clear stored tokens
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // In a real app, this would navigate to login screen
  // For now, we just clear tokens - navigation should be handled by the calling component
}

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create default client instance (async initialization)
export let apiClient: AxiosInstance;
export let apiClientInitialized = false;

// Initialize the default client
(async () => {
  try {
    apiClient = await createApiClient();
    apiClientInitialized = true;
    if (ReactNativeSSLPinningAdapter) {
      logger.log('✅ Mobile API client initialized with certificate pinning');
    } else {
      logger.log('✅ Web API client initialized (SSL pinning not available)');
    }
  } catch (error) {
    logger.error('❌ Failed to initialize API client:', error);
    // In development, create a fallback client without pinning
    if (isDevelopment) {
      logger.warn('⚠️ Creating fallback client without certificate pinning');
      apiClient = axios.create({
        baseURL: DEFAULT_CONFIG.baseURL,
        timeout: DEFAULT_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      apiClientInitialized = true;
    } else {
      throw error;
    }
  }
})();

// Export factory function for custom configurations
export { createApiClient };

// Export types
export type { ApiClientConfig, ApiError, CertificatePinningConfig };

// Export certificate pinning utilities
export { CERTIFICATE_PINNING_CONFIG };

/**
 * Utility function to update certificate hashes (for certificate rotation)
 * This should be called when certificates are renewed
 */
export async function updateCertificateHashes(
  hostname: string,
  newHashes: string[],
): Promise<void> {
  try {
    const config = getCertificatePinningConfig(hostname);
    if (!config) {
      throw new Error(
        `Hostname ${hostname} not found in certificate pinning config`,
      );
    }

    config.certificateHashes = newHashes;

    // Re-initialize SSL pinning with new hashes (only on mobile)
    if (addSSLPinningHosts) {
      await addSSLPinningHosts({
        [hostname]: {
          certificateHashes: newHashes,
          includeSubdomains: config.includeSubdomains,
          enforcePinning: config.enforcePinning,
        },
      });
    } else {
      logger.warn(
        `⚠️ Cannot update SSL pinning for ${hostname} - not available in web environment`,
      );
    }

    logger.log(`✅ Certificate hashes updated for ${hostname}`);
  } catch (error) {
    logger.error(
      `❌ Failed to update certificate hashes for ${hostname}:`,
      error,
    );
    throw error;
  }
}

/**
 * Utility function to temporarily disable certificate pinning (for debugging)
 * WARNING: This should only be used in development/testing environments
 */
export async function disableCertificatePinning(
  hostname: string,
): Promise<void> {
  if (!isDevelopment) {
    throw new Error('Certificate pinning cannot be disabled in production');
  }

  try {
    const config = getCertificatePinningConfig(hostname);
    if (!config) {
      throw new Error(
        `Hostname ${hostname} not found in certificate pinning config`,
      );
    }

    config.enforcePinning = false;
    logger.warn(
      `⚠️ Certificate pinning disabled for ${hostname} (development only)`,
    );
  } catch (error) {
    logger.error(
      `❌ Failed to disable certificate pinning for ${hostname}:`,
      error,
    );
    throw error;
  }
}

/**
 * Check if certificate pinning is active for a hostname
 */
export function isCertificatePinningActive(hostname: string): boolean {
  const config = getCertificatePinningConfig(hostname);
  return config?.enforcePinning ?? false;
}

/**
 * Get current certificate hashes for a hostname
 */
export function getCertificateHashes(hostname: string): string[] {
  const config = getCertificatePinningConfig(hostname);
  return config?.certificateHashes ?? [];
}
