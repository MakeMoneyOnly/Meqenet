import { registerAs } from '@nestjs/config';

/**
 * Application bootstrap configuration
 * NO direct environment variable access - uses centralized config service
 * Follows enterprise FinTech governance for environment variable management
 */
export default registerAs('bootstrap', () => {
  // Configuration values will be injected via ConfigService at runtime
  // This ensures no direct environment variable access outside of centralized config files
  return {
    // Default values - actual values injected via centralized config
    defaultPort: 3000,
    defaultGlobalPrefix: 'api',
  } as const;
});
