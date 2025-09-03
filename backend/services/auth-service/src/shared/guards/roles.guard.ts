import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, AllowedRole } from '../decorators/roles.decorator';

/**
 * RolesGuard
 *
 * Enforces RBAC by checking the authenticated user's role against the
 * @Roles() decorator metadata. Follows least-privilege principle.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AllowedRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string; email: string; role?: AllowedRole } | undefined;
    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}

