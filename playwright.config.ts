import { defineConfig, devices } from '@playwright/test';
import { getEnvConfig } from './src/config/env';

const env = getEnvConfig();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['./src/reporters/ai-triage-reporter.ts'],
  ],
  use: {
    baseURL: env.baseURL,
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: env.useLocalWebServer
    ? {
        command: 'npx tsx src/sandbox/server.ts',
        url: 'http://127.0.0.1:4201/api/products',
        reuseExistingServer: !process.env.CI,
        timeout: 15000,
      }
    : undefined,
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/customer.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
        storageState: '.auth/customer.json',
      },
      dependencies: ['setup'],
    },
  ],
});
