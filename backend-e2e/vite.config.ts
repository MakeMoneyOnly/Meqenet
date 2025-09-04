/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/backend-e2e',

  plugins: [nxViteTsPaths()],

  test: {
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/backend-e2e',
      provider: 'v8',
    },
    globals: true,
    environment: 'node',
    setupFiles: ['src/support/test-setup.ts'],
    globalSetup: ['src/support/global-setup.ts'],
    globalTeardown: ['src/support/global-teardown.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
