import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const CorsEnvSchema = z.object({
  CORS_ORIGINS: z
    .string()
    .optional()
    .default('https://nbe.gov.et,https://cbe.com.et,https://meqenet.et'),
  CORS_CREDENTIALS: z.string().optional().default('true'),
});

export type CorsConfig = {
  origins: string[];
  credentials: boolean;
};

export default registerAs('cors', (): CorsConfig => {
  const parsed = CorsEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`CORS configuration validation failed: ${issues}`);
  }
  const env = parsed.data;
  return {
    origins: env.CORS_ORIGINS.split(',')
      .map(o => o.trim())
      .filter(Boolean),
    credentials: env.CORS_CREDENTIALS.toLowerCase() === 'true',
  };
});
