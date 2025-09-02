import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './src/test-setup.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/*.config.*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: resolve(__dirname, '../../coverage/libs/shared-ui'),
      exclude: [
        '**/node_modules/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.stories.tsx',
        '**/test-setup.ts',
      ],
    },
    typecheck: {
      tsconfig: resolve(__dirname, './tsconfig.json'),
    },
  },
});