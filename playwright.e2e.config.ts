
// Note: This file legitimately uses process.env for CI detection
import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';

// Configuration constants
const CI_RETRIES = 2;
const CI_WORKERS = 1;
const NO_RETRIES = 0;

// Helper function to get environment variables for CI detection
const getEnvVar = (key: string): string | undefined => {
  return process.env[key];
};

const baseConfig = nxE2EPreset(__dirname, { testDir: './e2e' });

export default defineConfig({
  ...baseConfig,

  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:4200', // The website app runs on 4200
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'e2e-chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  reporter: [
    ['html', { outputFolder: 'reports/playwright-e2e' }],
    ['json', { outputFile: 'reports/e2e-results.json' }],
    ['junit', { outputFile: 'reports/e2e-junit.xml' }],
  ],

  expect: {
    timeout: 10000,
  },

  retries: getEnvVar('CI') === 'true' ? CI_RETRIES : NO_RETRIES,
  workers: getEnvVar('CI') === 'true' ? CI_WORKERS : undefined,
});
