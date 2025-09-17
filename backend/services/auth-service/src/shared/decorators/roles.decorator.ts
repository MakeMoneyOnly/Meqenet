import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AllowedRole =
  | 'ADMIN'
  | 'COMPLIANCE'
  | 'CUSTOMER'
  | 'MERCHANT'
  | 'SUPPORT'
  | 'DEVELOPER';

/**
 * Roles decorator to restrict handlers by user roles.
 */
export const Roles = (
  ...roles: AllowedRole[]
): ReturnType<typeof SetMetadata> => SetMetadata(ROLES_KEY, roles);
