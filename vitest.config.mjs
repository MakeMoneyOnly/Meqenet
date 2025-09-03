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
