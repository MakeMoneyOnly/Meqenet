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
    include: [
      'backend/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend-e2e/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/main.ts'
      ]
    },
    typecheck: {
      tsconfig: './tsconfig.json'
    },
    // Explicitly prevent vitest from scanning node_modules
    watchExclude: [
      'node_modules/**',
      '**/node_modules/**'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './backend/src'),
      '@auth': resolve(__dirname, './backend/services/auth-service/src'),
      '@api-gateway': resolve(__dirname, './backend/services/api-gateway/src'),
      '@shared': resolve(__dirname, './backend/src/shared'),
      '@features': resolve(__dirname, './backend/src/features'),
      '@infrastructure': resolve(__dirname, './backend/src/infrastructure')
    }
  }
});
