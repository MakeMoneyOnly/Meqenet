import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': resolve(__dirname, './test/mocks/react-native.ts'),
      'react-native-svg': resolve(
        __dirname,
        './test/mocks/react-native-svg.ts',
      ),
      '@sentry/react-native': resolve(
        __dirname,
        './test/mocks/sentry-react-native.ts',
      ),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [resolve(__dirname, './src/test-setup.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/*.config.*',
    ],
    typecheck: {
      tsconfig: resolve(__dirname, './tsconfig.spec.json'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: resolve(__dirname, '../../coverage/apps/app'),
      exclude: ['**/node_modules/**', '**/*.d.ts', '**/*.config.*'],
    },
  },
});
