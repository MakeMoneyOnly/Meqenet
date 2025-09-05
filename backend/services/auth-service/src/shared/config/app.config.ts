import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const DEFAULT_PORT = 3001;
const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;

const AppEnvSchema = z.object({
  PORT: z.string().optional().default(String(DEFAULT_PORT)),
  REDIS_HOST: z.string().optional().default(DEFAULT_REDIS_HOST),
  REDIS_PORT: z
    .string()
    .optional()
    .default(String(DEFAULT_REDIS_PORT))
    .refine(v => !Number.isNaN(parseInt(v, 10)), 'REDIS_PORT must be a number'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .optional()
    .default('development'),
  OTEL_SERVICE_NAME: z.string().optional().default('auth-service'),
  OTEL_EXPORTER_JAEGER_ENDPOINT: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  FAYDA_ENCRYPTION_KEY: z.string().optional().default('test-encryption-key-32-characters-long-key'),
  FAYDA_HASH_SALT: z.string().optional().default('test-hash-salt-for-fayda-id-hashing-32-chars'),
});

export type AppConfig = {
  port: number;
  redisHost: string;
  redisPort: number;
  nodeEnv: string;
  otelServiceName: string;
  otelExporterJaegerEndpoint?: string;
  otelExporterOtlpEndpoint?: string;
  faydaEncryptionKey: string;
  faydaHashSalt: string;
};

export default registerAs('app', (): AppConfig => {
  const parsed = AppEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`App configuration validation failed: ${issues}`);
  }
  const env = parsed.data;
  return {
    port: parseInt(env.PORT, 10),
    redisHost: env.REDIS_HOST,
    redisPort: parseInt(env.REDIS_PORT, 10),
    nodeEnv: env.NODE_ENV,
    otelServiceName: env.OTEL_SERVICE_NAME,
    faydaEncryptionKey: env.FAYDA_ENCRYPTION_KEY,
    faydaHashSalt: env.FAYDA_HASH_SALT,
    ...(env.OTEL_EXPORTER_JAEGER_ENDPOINT && {
      otelExporterJaegerEndpoint: env.OTEL_EXPORTER_JAEGER_ENDPOINT,
    }),
    ...(env.OTEL_EXPORTER_OTLP_ENDPOINT && {
      otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
  };
});
