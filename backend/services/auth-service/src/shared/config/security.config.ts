import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const SecurityEnvSchema = z.object({
  HSTS_MAX_AGE: z.string().optional().default('31536000'),
  CSP_DEFAULT_SRC: z.string().optional().default("'self'"),
  CSP_SCRIPT_SRC: z.string().optional().default("'self'"),
  CSP_STYLE_SRC: z.string().optional().default("'self' 'unsafe-inline'"),
  PERMISSIONS_POLICY: z.string().optional(),
  RATE_LIMIT_TTL: z.string().optional().default('60'),
  RATE_LIMIT_LIMIT: z.string().optional().default('100'),
});

export type SecurityConfig = {
  hstsMaxAge: number;
  csp: { defaultSrc: string; scriptSrc: string; styleSrc: string };
  permissionsPolicy?: string;
  rateLimit: { ttlSeconds: number; limit: number };
};

export default registerAs('security', (): SecurityConfig => {
  const parsed = SecurityEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Security configuration validation failed: ${issues}`);
  }
  const env = parsed.data;
  return {
    hstsMaxAge: parseInt(env.HSTS_MAX_AGE, 10),
    csp: {
      defaultSrc: env.CSP_DEFAULT_SRC,
      scriptSrc: env.CSP_SCRIPT_SRC,
      styleSrc: env.CSP_STYLE_SRC,
    },
    permissionsPolicy: env.PERMISSIONS_POLICY,
    rateLimit: {
      ttlSeconds: parseInt(env.RATE_LIMIT_TTL, 10),
      limit: parseInt(env.RATE_LIMIT_LIMIT, 10),
    },
  };
});
