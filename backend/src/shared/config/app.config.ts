import { registerAs } from '@nestjs/config';

/**
 * Centralized application configuration
 * This is the ONLY authorized location for process.env access in the main backend
 * Following enterprise FinTech governance for centralized environment variable management
 */
export default registerAs('app', () => {
  const DEFAULT_PORT = 3000;

  // Centralized environment variable access - ONLY location allowed
  const rawConfig = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    GLOBAL_PREFIX: process.env.GLOBAL_PREFIX,
  };

  // Parse and validate configuration
  const port = Number(rawConfig.PORT ?? DEFAULT_PORT);
  const globalPrefix = rawConfig.GLOBAL_PREFIX ?? 'api';
  const nodeEnv = rawConfig.NODE_ENV ?? 'development';

  return {
    port,
    globalPrefix,
    nodeEnv,
  } as const;
});
