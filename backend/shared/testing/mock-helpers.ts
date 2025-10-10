/**
 * Typed Mock Helper Utilities for FinTech Testing
 *
 * Enterprise-grade mock utilities that maintain type safety across test suites.
 * Aligns with banking industry testing standards (SOC 2, PCI DSS).
 *
 * @module testing/mock-helpers
 */

/* eslint-disable no-undef */
// This file is intended for test environments where jest/vitest globals are available

import { PrismaClient } from '@prisma/client';

/**
 * Type-safe Prisma client mock with all standard methods
 * Prevents any types in test mocks for financial transaction testing
 */
export interface MockPrismaClient {
  $connect: jest.Mock<Promise<void>, []>;
  $disconnect: jest.Mock<Promise<void>, []>;
  $transaction: jest.Mock;
  $executeRaw: jest.Mock;
  $queryRaw: jest.Mock;
  $on: jest.Mock;
  $use: jest.Mock;
}

/**
 * Creates a fully typed Prisma client mock
 * Eliminates need for `any` types while maintaining type safety
 *
 * @example
 * ```typescript
 * const mockPrisma = createMockPrismaClient();
 * mockPrisma.$connect.mockResolvedValue(undefined);
 * ```
 */
export function createMockPrismaClient(): jest.Mocked<MockPrismaClient> {
  return {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    $on: jest.fn(),
    $use: jest.fn(),
  } as jest.Mocked<MockPrismaClient>;
}

/**
 * Generic service mock creator with type preservation
 * Maintains full type safety for any service interface
 *
 * @template T - The service interface to mock
 * @param methods - Partial implementation of service methods
 * @returns Fully typed mock service
 *
 * @example
 * ```typescript
 * interface PaymentService {
 *   processPayment(amount: number): Promise<boolean>;
 * }
 *
 * const mockService = createMockService<PaymentService>({
 *   processPayment: jest.fn().mockResolvedValue(true)
 * });
 * ```
 */
export function createMockService<T extends Record<string, unknown>>(
  methods: Partial<{
    [K in keyof T]: T[K] extends (...args: never[]) => unknown
      ? jest.Mock<
          ReturnType<T[K]> extends Promise<infer R>
            ? Promise<R>
            : ReturnType<T[K]>,
          Parameters<T[K]>
        >
      : T[K];
  }> = {}
): jest.Mocked<T> {
  return methods as jest.Mocked<T>;
}

/**
 * Fluent API builder for complex mock objects
 * Provides chainable interface for building test mocks
 *
 * @template T - The type to mock
 *
 * @example
 * ```typescript
 * const mockUser = new MockBuilder<User>()
 *   .with('id', '123')
 *   .with('email', 'test@example.com')
 *   .with('role', 'customer')
 *   .build();
 * ```
 */
export class MockBuilder<T extends Record<string, unknown>> {
  private data: Partial<T> = {};

  /**
   * Add a property to the mock object
   */
  with<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  /**
   * Add multiple properties at once
   */
  withMany(properties: Partial<T>): this {
    Object.assign(this.data, properties);
    return this;
  }

  /**
   * Build and return the mock object
   */
  build(): T {
    return this.data as T;
  }

  /**
   * Build and return a partial mock object
   */
  buildPartial(): Partial<T> {
    return this.data;
  }
}

/**
 * Type-safe mock for NestJS JWT Service
 */
export interface MockJwtService {
  sign: jest.Mock<string, [Record<string, unknown>]>;
  verify: jest.Mock<Record<string, unknown>, [string]>;
  verifyAsync: jest.Mock<Promise<Record<string, unknown>>, [string]>;
  decode: jest.Mock<Record<string, unknown> | null, [string]>;
}

/**
 * Creates a typed JWT service mock
 */
export function createMockJwtService(): jest.Mocked<MockJwtService> {
  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-id' }),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-id' }),
    decode: jest.fn().mockReturnValue({ sub: 'user-id' }),
  } as jest.Mocked<MockJwtService>;
}

/**
 * Type-safe mock for NestJS Config Service
 */
export interface MockConfigService {
  get: jest.Mock<string | undefined, [string]>;
  getOrThrow: jest.Mock<string, [string]>;
}

/**
 * Creates a typed Config service mock
 */
export function createMockConfigService(
  config: Record<string, string> = {}
): jest.Mocked<MockConfigService> {
  return {
    get: jest.fn((key: string) => config[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = config[key];
      if (!value) throw new Error(`Config key ${key} not found`);
      return value;
    }),
  } as jest.Mocked<MockConfigService>;
}

/**
 * Type-safe mock factory for Express Request objects
 */
export interface MockExpressRequest {
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
  params: Record<string, string>;
  query: Record<string, string>;
  ip: string;
  method: string;
  path: string;
}

/**
 * Creates a typed Express request mock
 */
export function createMockRequest(
  overrides: Partial<MockExpressRequest> = {}
): MockExpressRequest {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    ip: '127.0.0.1',
    method: 'GET',
    path: '/',
    ...overrides,
  };
}

/**
 * Type-safe mock factory for Express Response objects
 */
export interface MockExpressResponse {
  status: jest.Mock<MockExpressResponse, [number]>;
  json: jest.Mock<MockExpressResponse, [unknown]>;
  send: jest.Mock<MockExpressResponse, [unknown]>;
  setHeader: jest.Mock<MockExpressResponse, [string, string]>;
  getHeader: jest.Mock<string | undefined, [string]>;
}

/**
 * Creates a typed Express response mock
 */
export function createMockResponse(): jest.Mocked<MockExpressResponse> {
  const res = {} as jest.Mocked<MockExpressResponse>;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.getHeader = jest.fn().mockReturnValue(undefined);
  return res;
}

/**
 * Type-safe date mock utilities for financial timestamp testing
 */
export class DateMockHelper {
  private originalDate: DateConstructor;

  constructor() {
    this.originalDate = Date;
  }

  /**
   * Mock Date to return a fixed timestamp
   */
  mockDate(timestamp: number | string | Date): void {
    const fixedDate = new this.originalDate(timestamp);
    global.Date = class extends this.originalDate {
      constructor() {
        super();
        return fixedDate;
      }
      static now(): number {
        return fixedDate.getTime();
      }
    } as DateConstructor;
  }

  /**
   * Restore original Date implementation
   */
  restore(): void {
    global.Date = this.originalDate;
  }
}

/**
 * Vitest-compatible mock creators (for services using Vitest)
 */
export const vitestMockHelpers = {
  /**
   * Create a Vitest-compatible service mock
   */
  createMockService<T extends Record<string, unknown>>(
    methods: Partial<T> = {}
  ): T {
    return methods as T;
  },

  /**
   * Create a Vitest-compatible Prisma client mock
   */
  createMockPrismaClient(): Partial<PrismaClient> {
    return {
      $connect: undefined as unknown as () => Promise<void>,
      $disconnect: undefined as unknown as () => Promise<void>,
      $transaction: undefined as unknown as <T>(
        fn: (prisma: PrismaClient) => Promise<T>
      ) => Promise<T>,
    };
  },
};
