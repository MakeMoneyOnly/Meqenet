import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';

// Configuration constants
const CI_RETRIES = 2;
const CI_WORKERS = 1;
const NO_RETRIES = 0;

const baseConfig = nxE2EPreset(__dirname, { testDir: './e2e' });

export default defineConfig({
  ...baseConfig,

  testDir: './e2e/accessibility',
  testMatch: '**/*.accessibility.spec.ts',

  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'accessibility-chromium',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'none',
        },
      },
    },
    {
      name: 'accessibility-firefox',
      use: {
        ...devices['Desktop Firefox'],
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'none',
        },
      },
    },
    {
      name: 'accessibility-webkit',
      use: {
        ...devices['Desktop Safari'],
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'none',
        },
      },
    },
    {
      name: 'accessibility-mobile',
      use: {
        ...devices['iPhone 12'],
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'none',
        },
      },
    },
  ],

  reporter: [
    ['html', { outputFolder: 'reports/playwright-accessibility' }],
    ['json', { outputFile: 'reports/accessibility-results.json' }],
    ['junit', { outputFile: 'reports/accessibility-junit.xml' }],
  ],

  expect: {
    timeout: 10000,
  },

  retries: process.env.CI ? CI_RETRIES : NO_RETRIES,
  workers: process.env.CI ? CI_WORKERS : undefined,
});
