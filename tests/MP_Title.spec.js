const { test, expect } = require('@playwright/test');
const { allure } = require('allure-playwright');

// Optional hooks: attach trace on failure (Playwright already keeps it when configured)
test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const tracePath = testInfo.outputPath('trace.zip');
    // If trace exists, attach it to Allure
    try {
      await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' });
    } catch {}
  }
});

// Example suite
test.describe('Homepage smoke', () => {
  test('should load homepage and have title', async ({ page }) => {
    allure.owner('Swati');
    allure.feature('Smoke');
    allure.story('Homepage');
    allure.severity('critical');
    allure.tag('smoke', 'ui');
    allure.link('JIRA', 'https://jira.example.com/browse/PROJ-123');

    await test.step('Open home page', async () => {
      await page.goto('https://missionPeak.app');
    });

    await test.step('Verify title', async () => {
      await expect(page).toHaveTitle("Mission Peak");
    });

    const screenshot = await page.screenshot();
    await test.info().attach('homepage.png', { body: screenshot, contentType: 'image/png' });
  });
});