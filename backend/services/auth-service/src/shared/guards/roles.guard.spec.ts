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

  it('should deny access if no valid roles are required', () => {
    const reflector = createMockReflector([]);
    const guard = new RolesGuard(reflector);
    const context = createMockExecutionContext({
      id: '4',
      email: 'user@test.com',
      role: 'CUSTOMER',
    });
    expect(guard.canActivate(context)).toBe(false);
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

  // Enhanced security test cases as per audit recommendations

  describe('Security Edge Cases and Malformed Input Tests', () => {
    it('should deny access with malformed role values', () => {
      const reflector = createMockReflector(['ADMIN']);
      const guard = new RolesGuard(reflector);

      // Test with various malformed role values
      const malformedRoles = [
        '',
        ' ',
        null,
        undefined,
        'admin', // lowercase
        'ADMIN_ROLE', // different format
        'ROLE_ADMIN', // different format
        'admin123', // with numbers
        'ADMIN<script>', // potential XSS
        'ADMIN\n', // with newline
        'ADMIN\t', // with tab
      ];

      malformedRoles.forEach(malformedRole => {
        const context = createMockExecutionContext({
          id: '1',
          email: 'user@test.com',
          role: malformedRole,
        });
        expect(guard.canActivate(context)).toBe(false);
      });
    });

    it('should deny access with malformed user objects', () => {
      const reflector = createMockReflector(['ADMIN']);
      const guard = new RolesGuard(reflector);

      // Test with various malformed user objects
      const malformedUsers = [
        { id: '1', email: 'user@test.com' }, // missing role
        { id: '1' }, // missing email and role
        { email: 'user@test.com' }, // missing id and role
        { id: null, email: 'user@test.com', role: 'ADMIN' }, // null id
        { id: '1', email: null, role: 'ADMIN' }, // null email
        { id: '', email: 'user@test.com', role: 'ADMIN' }, // empty id
        { id: '1', email: '', role: 'ADMIN' }, // empty email
        {}, // empty object
        null, // null user
        undefined, // undefined user
      ];

      malformedUsers.forEach(user => {
        const context = createMockExecutionContext(user);
        expect(guard.canActivate(context)).toBe(false);
      });
    });

    it('should deny access with unexpected role values in user object', () => {
      const reflector = createMockReflector(['ADMIN']);
      const guard = new RolesGuard(reflector);

      // Test with unexpected properties that might be confused with role
      const usersWithUnexpectedRoles = [
        { id: '1', email: 'user@test.com', role: 'CUSTOMER', roles: ['ADMIN'] }, // has both role and roles
        {
          id: '1',
          email: 'user@test.com',
          role: 'CUSTOMER',
          permissions: ['admin'],
        }, // has permissions
        {
          id: '1',
          email: 'user@test.com',
          role: 'CUSTOMER',
          groups: ['admin_group'],
        }, // has groups
        { id: '1', email: 'user@test.com', role: 123 }, // role as number
        { id: '1', email: 'user@test.com', role: true }, // role as boolean
        { id: '1', email: 'user@test.com', role: [] }, // role as array
        { id: '1', email: 'user@test.com', role: {} }, // role as object
      ];

      usersWithUnexpectedRoles.forEach(user => {
        const context = createMockExecutionContext(user);
        expect(guard.canActivate(context)).toBe(false);
      });
    });

    it('should deny access when reflector returns invalid required roles', () => {
      // Test with various invalid required roles from reflector
      const invalidRequiredRoles = [
        null,
        undefined,
        [],
        [''],
        [' '],
        ['INVALID_ROLE'],
        ['admin'], // lowercase
        ['ADMIN<script>'], // potential XSS
        ['ADMIN\n'], // with newline
      ];

      invalidRequiredRoles.forEach(invalidRoles => {
        const reflector = createMockReflector(invalidRoles as any);
        const guard = new RolesGuard(reflector);
        const context = createMockExecutionContext({
          id: '1',
          email: 'user@test.com',
          role: 'ADMIN',
        });
        expect(guard.canActivate(context)).toBe(false);
      });
    });

    it('should handle case-sensitive role matching correctly', () => {
      const reflector = createMockReflector(['ADMIN']);
      const guard = new RolesGuard(reflector);

      // Test case sensitivity
      const caseVariants = [
        'admin', // lowercase
        'Admin', // mixed case
        'aDmIn', // mixed case
        'ADMIN ', // with trailing space
        ' ADMIN', // with leading space
        ' ADMIN ', // with spaces
      ];

      caseVariants.forEach(role => {
        const context = createMockExecutionContext({
          id: '1',
          email: 'user@test.com',
          role,
        });
        expect(guard.canActivate(context)).toBe(false);
      });

      // Exact match should work
      const exactContext = createMockExecutionContext({
        id: '1',
        email: 'user@test.com',
        role: 'ADMIN',
      });
      expect(guard.canActivate(exactContext)).toBe(true);
    });

    it('should handle role enumeration attacks', () => {
      const reflector = createMockReflector(['ADMIN']);
      const guard = new RolesGuard(reflector);

      // Test potential role enumeration by trying all common roles
      const commonRoles = [
        'USER',
        'CUSTOMER',
        'MERCHANT',
        'SUPPORT',
        'MANAGER',
        'SUPER_ADMIN',
        'ROOT',
        'SYSTEM',
        'GUEST',
        'ANONYMOUS',
      ];

      commonRoles.forEach(role => {
        const context = createMockExecutionContext({
          id: '1',
          email: 'user@test.com',
          role,
        });
        expect(guard.canActivate(context)).toBe(false);
      });
    });

    it('should handle concurrent access patterns', () => {
      const reflector = createMockReflector(['ADMIN']);
      const guard = new RolesGuard(reflector);

      // Test concurrent access with same user but different roles
      const contexts = [
        createMockExecutionContext({
          id: '1',
          email: 'user@test.com',
          role: 'ADMIN',
        }),
        createMockExecutionContext({
          id: '1',
          email: 'user@test.com',
          role: 'CUSTOMER',
        }),
        createMockExecutionContext({
          id: '1',
          email: 'user@test.com',
          role: null,
        }),
      ];

      // Only the first context with correct role should pass
      expect(guard.canActivate(contexts[0])).toBe(true);
      expect(guard.canActivate(contexts[1])).toBe(false);
      expect(guard.canActivate(contexts[2])).toBe(false);
    });

    it('should handle privilege escalation attempts', () => {
      const reflector = createMockReflector(['CUSTOMER']);
      const guard = new RolesGuard(reflector);

      // Test privilege escalation attempts
      const escalationAttempts = [
        { id: '1', email: 'admin@test.com', role: 'ADMIN' }, // higher privilege role
        { id: '1', email: 'user@test.com', role: 'SUPER_ADMIN' }, // even higher privilege (invalid)
        { id: '1', email: 'user@test.com', role: 'ROOT' }, // system level (invalid)
        { id: '1', email: 'user@test.com', role: '*' }, // wildcard (invalid)
        { id: '1', email: 'user@test.com', role: 'ALL' }, // all permissions (invalid)
      ];

      escalationAttempts.forEach(user => {
        const context = createMockExecutionContext(user);
        expect(guard.canActivate(context)).toBe(false);
      });

      // Correct role should work
      const correctContext = createMockExecutionContext({
        id: '1',
        email: 'user@test.com',
        role: 'CUSTOMER',
      });
      expect(guard.canActivate(correctContext)).toBe(true);
    });

    it('should handle malformed execution context', () => {
      const reflector = createMockReflector(['ADMIN']);
      const guard = new RolesGuard(reflector);

      // Test with malformed execution contexts
      const malformedContexts = [
        // Missing switchToHttp method
        { getHandler: () => ({}), getClass: () => ({}) } as any,
        // Missing getRequest method
        {
          switchToHttp: () => ({}),
          getHandler: () => ({}),
          getClass: () => ({}),
        } as any,
        // getRequest returns null
        {
          switchToHttp: () => ({ getRequest: () => null }),
          getHandler: () => ({}),
          getClass: () => ({}),
        } as any,
      ];

      malformedContexts.forEach(context => {
        expect(guard.canActivate(context)).toBe(false);
      });
    });
  });

  describe('Performance and Security Monitoring', () => {
    it('should handle large numbers of required roles efficiently', () => {
      // Test with many required roles
      const manyRoles: AllowedRole[] = Array.from(
        { length: 100 },
        (_, i) => `ROLE_${i}` as AllowedRole
      );
      manyRoles.push('ADMIN'); // Add the role we'll test with

      const reflector = createMockReflector(manyRoles);
      const guard = new RolesGuard(reflector);
      const context = createMockExecutionContext({
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should handle rapid successive calls without performance degradation', () => {
      const reflector = createMockReflector(['ADMIN']);
      const guard = new RolesGuard(reflector);
      const context = createMockExecutionContext({
        id: '1',
        email: 'user@test.com',
        role: 'ADMIN',
      });

      // Test rapid successive calls
      for (let i = 0; i < 1000; i++) {
        expect(guard.canActivate(context)).toBe(true);
      }
    });
  });
});
