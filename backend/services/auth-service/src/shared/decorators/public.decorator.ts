import { SetMetadata } from '@nestjs/common';

/**
 * Public decorator to mark endpoints that don't require authentication
 * Used for health checks, public APIs, and authentication endpoints themselves
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(IS_PUBLIC_KEY, true);
