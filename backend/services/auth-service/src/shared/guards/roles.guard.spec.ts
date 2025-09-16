import { vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { AllowedRole } from '../decorators/roles.decorator';

// Mock ExecutionContext for tests
const createMockExecutionContext = (
  user: any,
  requiredRoles?: AllowedRole[]
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => (requiredRoles ? { requiredRoles } : {}),
    getClass: () => (requiredRoles ? { requiredRoles } : {}),
  }) as any;

// Mock Reflector for tests
const createMockReflector = (requiredRoles?: AllowedRole[]): Reflector => ({
  getAllAndOverride: vi.fn().mockReturnValue(requiredRoles),
});

describe('RolesGuard', () => {
  it('should allow access if user has the required role', () => {
    const reflector = createMockReflector(['ADMIN']);
    const guard = new RolesGuard(reflector);
    const context = createMockExecutionContext({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user does not have the required role', () => {
    const reflector = createMockReflector(['ADMIN']);
    const guard = new RolesGuard(reflector);
    const context = createMockExecutionContext({
      id: '2',
      email: 'user@test.com',
      role: 'CUSTOMER',
    });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if user has no role', () => {
    const reflector = createMockReflector(['ADMIN']);
    const guard = new RolesGuard(reflector);
    const context = createMockExecutionContext({
      id: '3',
      email: 'user@test.com',
    });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if there is no user object', () => {
    const reflector = createMockReflector(['ADMIN']);
    const guard = new RolesGuard(reflector);
    const context = createMockExecutionContext(null);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access if no roles are required', () => {
    const reflector = createMockReflector([]);
    const guard = new RolesGuard(reflector);
    const context = createMockExecutionContext({
      id: '4',
      email: 'user@test.com',
      role: 'CUSTOMER',
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should handle multiple required roles', () => {
    const reflector = createMockReflector(['ADMIN', 'SUPPORT']);
    const guard = new RolesGuard(reflector);
    const adminContext = createMockExecutionContext({
      id: '1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });
    const supportContext = createMockExecutionContext({
      id: '5',
      email: 'support@test.com',
      role: 'SUPPORT',
    });
    const customerContext = createMockExecutionContext({
      id: '2',
      email: 'user@test.com',
      role: 'CUSTOMER',
    });

    expect(guard.canActivate(adminContext)).toBe(true);
    expect(guard.canActivate(supportContext)).toBe(true);
    expect(guard.canActivate(customerContext)).toBe(false);
  });
});
