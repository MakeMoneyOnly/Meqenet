/// <reference types="vitest" />
import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

/**
 * Root Vitest Configuration for Meqenet.et FinTech Platform
 *
 * This configuration ensures enterprise-grade testing standards with:
 * - Zero deprecated dependencies (fintech compliance requirement)
 * - Comprehensive coverage reporting
 * - Fast parallel execution
 * - Secure test environment isolation
 */
export default defineConfig({
  test: {
    // Multi-project configuration for microservices
    projects: [
      // Backend Services - Auth Service
      {
        root: './backend/services/auth-service',
        test: {
          globals: true, // Enable describe, test, expect globally
          environment: 'node',
          setupFiles: ['./test/setup.ts'], // NestJS setup with reflect-metadata
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules/**', 'dist/**'],
        },
      },

      // Backend Services - API Gateway
      {
        root: './backend/services/api-gateway',
        test: {
          globals: true, // Enable describe, test, expect globally
          environment: 'node',
          setupFiles: ['../auth-service/test/setup.ts'], // Share NestJS setup
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules/**', 'dist/**'],
        },
      },

      // E2E Testing Suite
      {
        root: './backend-e2e',
        test: {
          globals: true, // Enable describe, test, expect globally
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules/**', 'dist/**'],
          testTimeout: 30000, // Longer timeout for integration tests
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
        },
      },
    ],

    // Global test configuration
    globals: true,
    environment: 'node',

    // Coverage configuration for NBE audit compliance
    coverage: {
      provider: 'v8', // Modern V8 coverage (no deprecated dependencies)
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'templates/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.spec.*',
        '**/*.test.*',
      ],
      // Enforce high coverage for fintech compliance
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
      },
    },

    // Security: Prevent tests from accessing parent directories
    allowOnly: false,

    // Performance optimization for large codebase
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // Test discovery patterns
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'templates/**',
      '**/node_modules/**',
    ],

    // Timeout configuration for fintech operations
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter configuration for CI/CD compliance
    reporters: process.env.CI ? 'junit' : 'verbose',
    outputFile: process.env.CI ? './test-results.xml' : undefined,

    // Security: Isolate test environments
    isolate: true,
  },

  // Path resolution for workspace
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './backend/src/shared'),
      '@auth': resolve(__dirname, './backend/services/auth-service/src'),
      '@api-gateway': resolve(__dirname, './backend/services/api-gateway/src'),
    },
  },

  // Esbuild configuration for fast compilation
  esbuild: {
    target: 'node18',
  },
});
