import { defineConfig } from 'vitest';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'coverage'],
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
