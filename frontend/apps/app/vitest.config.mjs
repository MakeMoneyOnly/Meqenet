import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    conditions: ['browser', 'module', 'import', 'default'],
    // Prevent multiple React copies which can cause "Invalid hook call"
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
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
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './src/test-setup.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/*.config.*',
    ],
    deps: {
      optimizer: {
        web: {
          enabled: true,
          include: [
            '@testing-library/react',
            '@testing-library/dom',
            'react-dom',
            'react',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'scheduler',
          ],
        },
      },
    },
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
  esbuild: {
    target: 'es2020',
  },
});
