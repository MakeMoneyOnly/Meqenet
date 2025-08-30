import { registerAs } from '@nestjs/config';

const DEFAULT_PORT = 3001;
const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;

const AppConfigSchema = {
  port: process.env.PORT ?? String(DEFAULT_PORT),
  redisHost: process.env.REDIS_HOST ?? DEFAULT_REDIS_HOST,
  redisPort: process.env.REDIS_PORT ?? String(DEFAULT_REDIS_PORT),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  otelServiceName: process.env.OTEL_SERVICE_NAME ?? 'auth-service',
  otelExporterJaegerEndpoint: process.env.OTEL_EXPORTER_JAEGER_ENDPOINT,
  otelExporterOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
};

export default registerAs('app', () => AppConfigSchema);

export type AppConfig = typeof AppConfigSchema;
