import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.integration.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    testTimeout: 30000,
    reporters: ['default'],
    silent: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@auth': resolve(__dirname, '../src'),
      '@shared': resolve(__dirname, '../src/shared'),
    },
  },
});
