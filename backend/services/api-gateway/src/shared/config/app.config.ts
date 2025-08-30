import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const DEFAULT_PORT = 3000;
const DEFAULT_AUTH_SERVICE_URL = 'http://localhost:3001';
const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;

const MAX_TCP_PORT = 65536;

const AppConfigSchema = z.object({
  port: z
    .string()
    .optional()
    .default(String(DEFAULT_PORT))
    .transform(val => parseInt(val, 10))
    .refine(num => Number.isFinite(num) && num > 0 && num < MAX_TCP_PORT, {
      message: 'PORT must be a valid TCP port number',
    }),
  authServiceUrl: z
    .string()
    .optional()
    .default(DEFAULT_AUTH_SERVICE_URL)
    .refine(val => {
      try {
        const u = new URL(val);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'AUTH_SERVICE_URL must be a valid http(s) URL'),
  redisHost: z.string().optional().default(DEFAULT_REDIS_HOST),
  redisPort: z
    .string()
    .optional()
    .default(String(DEFAULT_REDIS_PORT))
    .transform(val => parseInt(val, 10))
    .refine(num => Number.isFinite(num) && num > 0 && num < MAX_TCP_PORT, {
      message: 'REDIS_PORT must be a valid TCP port number',
    }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export default registerAs('app', (): AppConfig => {
  const cfg = {
    port: process.env.PORT,
    authServiceUrl: process.env.AUTH_SERVICE_URL,
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
  } as const;

  const parsed = AppConfigSchema.safeParse(cfg);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`API Gateway configuration validation failed: ${issues}`);
  }

  return parsed.data;
});
