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
test.describe('Homepage smoke Testcases', () => {

  test.skip('should load homepage and have title', async ({ page }) => {
    allure.owner('Swati');
    allure.feature('Smoke');
    allure.story('Homepage');
    allure.severity('critical');
    allure.tag('smoke', 'ui');
    allure.link('JIRA', 'https://jira.example.com/browse/PROJ-123');

    await test.step('Open home page', async () => {
      await page.goto('/');
      await page.waitForTimeout(20000);
    });
    await test.step('Verify title', async () => {
      await expect(page).toHaveTitle("Mission Peak");
    });
    const screenshot = await page.screenshot();
    await test.info().attach('homepage.png', { body: screenshot, contentType: 'image/png' });
  });
  
  test('Login Test', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.gotoLoginPage();
  await loginPage.login(process.env.TEST_USERNAME, process.env.TEST_PASSWORD);

  await page.waitForTimeout(10000);
  });
  
});

