import { resolve } from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new globalThis.URL('.', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'backend/services/**/*.{test,spec}.{js,ts}',
      'backend-e2e/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules/**',
      '**/node_modules/**',
      'dist/**',
      'coverage/**',
      'build/**',
      'templates/**',
      'backend/services/*/node_modules/**',
      'backend-e2e/node_modules/**'
    ],
    setupFiles: [
      'backend/services/auth-service/test/setup.ts'
    ],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '**/node_modules/**',
        'dist/**',
        'coverage/**',
        'build/**',
        'templates/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**'
      ]
    },
    // Explicitly prevent vitest from scanning node_modules
    watchExclude: [
      'node_modules/**',
      '**/node_modules/**'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@auth': resolve(__dirname, './backend/services/auth-service/src'),
      '@api-gateway': resolve(__dirname, './backend/services/api-gateway/src'),
    }
  }
});