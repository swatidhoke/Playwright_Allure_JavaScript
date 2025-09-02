// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

/**
 * Allure reporter options:
 *  - outputFolder: where raw results go
 *  - detail: include steps
 *  - suiteTitle: use file name as suite
 *  - environmentInfo: add env metadata to report
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? undefined : 4,
  reporter: [
    ['line'],
    ['allure-playwright', {
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: false,
      environmentInfo: {
        NODE_VERSION: process.version,
        BASE_URL: process.env.BASE_URL || 'not-set',
      }
    }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://mptestui.missionpeak.us',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 0,
    navigationTimeout: 15_000,
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'WebKit',   use: { ...devices['Desktop Safari'] } },
  ],
});