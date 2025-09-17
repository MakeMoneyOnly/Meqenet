import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, AllowedRole } from '../decorators/roles.decorator';

/**
 * Valid allowed roles for validation
 */
const VALID_ROLES: AllowedRole[] = [
  'ADMIN',
  'COMPLIANCE',
  'CUSTOMER',
  'MERCHANT',
  'SUPPORT',
  'DEVELOPER',
];

/**
 * RolesGuard
 *
 * Enforces RBAC by checking the authenticated user's role against the
 * @Roles() decorator metadata. Follows least-privilege principle.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Validates if a role is a valid AllowedRole
   */
  private isValidRole(role: unknown): role is AllowedRole {
    return (
      typeof role === 'string' && VALID_ROLES.includes(role as AllowedRole)
    );
  }

  /**
   * Validates if required roles array contains only valid AllowedRole values
   */
  private areValidRequiredRoles(roles: unknown): boolean {
    return (
      Array.isArray(roles) &&
      roles.length > 0 &&
      roles.every(role => this.isValidRole(role))
    );
  }

  canActivate(context: ExecutionContext): boolean {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<AllowedRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()]
      );

      // Filter out invalid roles and get valid required roles
      const validRequiredRoles = Array.isArray(requiredRoles)
        ? requiredRoles.filter(role => this.isValidRole(role))
        : [];

      // If no valid roles remain after filtering, deny access
      if (validRequiredRoles.length === 0) {
        return false;
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user as
        | { id: string; email: string; role?: AllowedRole }
        | undefined;

      // Validate user object structure and role
      if (
        !user ||
        typeof user.id !== 'string' ||
        typeof user.email !== 'string' ||
        !user.id.trim() ||
        !user.email.trim() ||
        !this.isValidRole(user.role)
      ) {
        return false;
      }

      return validRequiredRoles.includes(user.role);
    } catch (error) {
      // If anything goes wrong (malformed context, etc.), deny access
      return false;
    }
  }
}
