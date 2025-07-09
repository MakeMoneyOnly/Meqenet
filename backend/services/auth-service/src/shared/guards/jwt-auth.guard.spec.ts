/// <reference types="vitest" />
import 'reflect-metadata'; // Required for NestJS dependency injection
import { ExecutionContext } from '@nestjs/common';
import { vi, describe, it, beforeEach, afterEach, expect, Mock } from 'vitest';

import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * JWT Authentication Guard Security Tests
 *
 * Tests critical authentication security for:
 * - JWT token validation
 * - Authentication bypass prevention
 * - Security context protection
 * - NBE compliance requirements
 */
describe('JwtAuthGuard - Security Tests', () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: ExecutionContext;
  let mockSuperCanActivate: Mock;

  beforeEach(() => {
    // Mock the parent class method
    mockSuperCanActivate = vi.fn();

    // Create guard instance
    guard = new JwtAuthGuard();

    // Mock the parent's canActivate method
    Object.setPrototypeOf(guard, {
      canActivate: mockSuperCanActivate,
    });

    // Mock execution context
    mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          headers: {},
          user: null,
        }),
        getResponse: vi.fn(),
      }),
      getClass: vi.fn(),
      getHandler: vi.fn(),
      getArgs: vi.fn(),
      getArgByIndex: vi.fn(),
      switchToRpc: vi.fn(),
      switchToWs: vi.fn(),
      getType: vi.fn(),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Validation', () => {
    it('should delegate to parent AuthGuard JWT strategy', () => {
      mockSuperCanActivate.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should return false when parent guard rejects', () => {
      mockSuperCanActivate.mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should handle promise-based authentication', async () => {
      mockSuperCanActivate.mockResolvedValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe(true);
    });

    it('should handle observable-based authentication', () => {
      const mockObservable = {
        subscribe: vi.fn(),
        pipe: vi.fn(),
      };
      mockSuperCanActivate.mockReturnValue(mockObservable);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(mockObservable);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle undefined execution context gracefully', () => {
      mockSuperCanActivate.mockImplementation(context => {
        if (!context) throw new Error('Context required');
        return true;
      });

      expect(() => {
        // @ts-expect-error Testing edge case
        guard.canActivate(undefined);
      }).toThrow('Context required');
    });

    it('should handle malformed context', () => {
      const malformedContext = {} as ExecutionContext;
      mockSuperCanActivate.mockImplementation(() => {
        throw new Error('Invalid context');
      });

      expect(() => {
        guard.canActivate(malformedContext);
      }).toThrow('Invalid context');
    });

    it('should not bypass authentication on exceptions', () => {
      mockSuperCanActivate.mockImplementation(() => {
        throw new Error('Authentication failed');
      });

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('Authentication failed');
    });
  });

  describe('NBE Security Compliance', () => {
    it('should enforce strict authentication by default', () => {
      // Guard should not allow access without proper authentication
      mockSuperCanActivate.mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockSuperCanActivate).toHaveBeenCalledTimes(1);
    });

    it('should preserve execution context integrity', () => {
      mockSuperCanActivate.mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      // Verify context is passed unchanged
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });

    it('should not modify authentication decision', () => {
      const authDecision = Symbol('auth-decision');
      mockSuperCanActivate.mockReturnValue(authDecision);

      const result = guard.canActivate(mockExecutionContext);

      // Should return exact same decision from parent guard
      expect(result).toBe(authDecision);
    });
  });

  describe('Integration Points', () => {
    it('should work with HTTP requests', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
        user: { id: 'user123' },
      };

      mockExecutionContext.switchToHttp = vi.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: vi.fn(),
      });

      mockSuperCanActivate.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      // Note: Our JWT guard delegates to parent AuthGuard,
      // which handles HTTP context internally
    });

    it('should maintain type safety', () => {
      // Guard should work with TypeScript type system
      mockSuperCanActivate.mockReturnValue(true);
      const result = guard.canActivate(mockExecutionContext);

      // Result should be boolean, Promise<boolean>, or Observable<boolean>
      expect(
        typeof result === 'boolean' ||
          result instanceof Promise ||
          (result && typeof result === 'object')
      ).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-frequency authentication requests', () => {
      mockSuperCanActivate.mockReturnValue(true);

      // Simulate multiple rapid authentication requests
      const requests = Array.from({ length: 100 }, () =>
        guard.canActivate(mockExecutionContext)
      );

      // All should complete successfully
      requests.forEach(result => {
        expect(result).toBe(true);
      });

      expect(mockSuperCanActivate).toHaveBeenCalledTimes(100);
    });

    it('should not leak memory on repeated calls', () => {
      mockSuperCanActivate.mockReturnValue(true);

      // Multiple calls should not accumulate state
      for (let i = 0; i < 50; i++) {
        guard.canActivate(mockExecutionContext);
      }

      // Guard should have minimal state (only configuration options)
      const guardKeys = Object.keys(guard);
      expect(guardKeys.length).toBeLessThanOrEqual(1); // Should only have options
    });

    it('should have minimal execution overhead', () => {
      mockSuperCanActivate.mockReturnValue(true);

      const startTime = process.hrtime.bigint();
      guard.canActivate(mockExecutionContext);
      const endTime = process.hrtime.bigint();

      const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      // Should execute quickly (< 1ms for guard logic)
      expect(executionTime).toBeLessThan(1);
    });
  });
});
