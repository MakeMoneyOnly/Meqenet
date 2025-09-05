import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['backend/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    testTimeout: 10000,
    // Maximum silence for clean test output
    silent: true,
    // Use the recommended default reporter with summary disabled for clean output
    reporters: [
      [
        'default',
        {
          summary: false
        }
      ]
    ],
    // Suppress all console output noise
    logLevel: 'silent',
    typecheck: {
      tsconfig: './tsconfig.json',
    },
    // Enterprise-grade test coverage thresholds for FinTech compliance
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/*.d.ts',
        '**/*.config.{js,ts,mjs}',
        '**/test/**',
        '**/mocks/**',
        '**/types/**',
        // Exclude generated files
        '**/generated/**',
        '**/*.generated.ts',
        // Exclude Python virtual environment
        '**/.venv/**',
        '**/.pip-audit-deps-temp/**',
        // Exclude Python files and external dependencies
        '**/*.py',
        '**/site-packages/**',
        '**/Lib/**',
        // Exclude files with problematic characters in names
        '**/external window */**',
      ],
      // FinTech-grade coverage thresholds
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        // Stricter thresholds for critical financial modules
        './backend/services/auth-service/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        './backend/services/api-gateway/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Payment and financial logic require 95% coverage
        './backend/services/payment-service/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        './backend/src/features/payments/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        './backend/src/features/auth/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
      // Fail CI if coverage drops below thresholds
      all: true, // Include uncovered files in report
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './backend/src'),
      '@auth': resolve(__dirname, './backend/services/auth-service/src'),
      '@api-gateway': resolve(__dirname, './backend/services/api-gateway/src'),
      '@shared': resolve(__dirname, './backend/src/shared'),
      '@features': resolve(__dirname, './backend/src/features'),
      '@infrastructure': resolve(__dirname, './backend/src/infrastructure'),
    },
  },
});
