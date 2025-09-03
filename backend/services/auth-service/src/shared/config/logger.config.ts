import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const LoggerEnvSchema = z.object({
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .optional()
    .default('info'),
  LOG_SAMPLING_RATE: z
    .string()
    .optional()
    .default('1.0')
    .refine(v => {
      const n = parseFloat(v);
      return !Number.isNaN(n) && n >= 0 && n <= 1;
    }, 'LOG_SAMPLING_RATE must be between 0 and 1'),
});

export type LoggerConfig = {
  level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  samplingRate: number;
};

export default registerAs('logger', (): LoggerConfig => {
  const parsed = LoggerEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Logger configuration validation failed: ${issues}`);
  }
  const env = parsed.data;
  return {
    level: env.LOG_LEVEL,
    samplingRate: parseFloat(env.LOG_SAMPLING_RATE),
  };
});
