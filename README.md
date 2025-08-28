# Playwright + JavaScript + Custom Allure Reports + CI/CD — Setup Guide

This guide gives you copy‑pasteable steps, configs, and examples to build a production‑ready Playwright framework with **custom Allure reporting**, runnable **locally** and in **CI/CD** (Jenkins, GitHub Actions, GitLab CI).

---

## 1) Prerequisites

* **Node.js 18+** (LTS recommended)
* **Git**
* Optional (native Allure):

  * macOS: `brew install allure`
  * Windows: `choco install allure` or `scoop install allure`
  * Linux: use the **npm** wrapper below

> If you don’t want a system installation, we’ll use the npm package **`allure-commandline`** so `npx allure` just works.

---

## 2) Project Structure

```text
playwright-allure-js/
├─ .github/workflows/ci.yml                 # GitHub Actions pipeline
├─ .gitlab-ci.yml                           # GitLab CI pipeline
├─ Jenkinsfile                              # Jenkins declarative pipeline
├─ package.json
├─ playwright.config.js
├─ .env.example
├─ tools/
│  └─ write-env.js                          # Writes Allure environment.properties
├─ tests/
│  ├─ example.spec.js
│  └─ helpers/
│     └─ test-hooks.js
└─ reporting/
   ├─ categories.json                        # Custom categories for Allure
   └─ allure.properties                      # (optional) global Allure props
```

---

## 3) Initialize Project & Install Dependencies

```bash
# 1) Init project
mkdir playwright-allure-js && cd playwright-allure-js
npm init -y

# 2) Install Playwright (JavaScript) + browsers
npm i -D @playwright/test
npx playwright install --with-deps

# 3) Allure integration + helpers
npm i -D allure-playwright allure-commandline rimraf cross-env dotenv
```

**What each does**

* `@playwright/test` – test runner + fixtures
* `allure-playwright` – reporter that writes Allure results
* `allure-commandline` – generates & opens HTML reports via `npx allure`
* `rimraf` – cross‑platform clean
* `cross-env` – cross‑platform env vars in npm scripts
* `dotenv` – load variables from `.env`

---

## 4) Environment Variables

Create **`.env.example`** (copy to `.env` for local runs):

```ini
# Base URL for tests
BASE_URL=https://missionPeak.app
# Any secrets you need in tests
API_TOKEN=changeme
```

---

## 5) Playwright Config (with Allure Reporter)

Create **`playwright.config.js`**:

```js
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
    baseURL: process.env.BASE_URL || 'https://missionPeak.app',
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
```

---

## 6) Allure Customization

### 6.1 `reporting/categories.json`

```json
[
  { "name": "Product bugs", "matchedStatuses": ["failed"], "messageRegex": ".*BUG:.*" },
  { "name": "Test defects",  "matchedStatuses": ["broken"] },
  { "name": "Known flaky",    "matchedStatuses": ["failed"], "traceRegex": ".*FlakyError.*" }
]
```

### 6.2 `reporting/allure.properties` (optional)

```properties
allure.results.directory=allure-results
allure.link.issue.pattern=https://jira.example.com/browse/%s
allure.link.tms.pattern=https://tms.example.com/tests/%s
```

> Copy `categories.json` to `allure-results/` before generate if you want custom categories. The script below does it automatically.

---

## 7) Helper Script to Enrich Allure Environment

Create **`tools/write-env.js`**:

```js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const resultsDir = path.join(process.cwd(), 'allure-results');
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

// Write environment.properties consumed by Allure
const envProps = [
  `BASE_URL=${process.env.BASE_URL || ''}`,
  `NODE_VERSION=${process.version}`,
  `CI=${process.env.CI || ''}`,
  `GIT_BRANCH=${process.env.GIT_BRANCH || process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_BRANCH || ''}`,
  `GIT_SHA=${process.env.GIT_COMMIT || process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || ''}`
].join('\n');
fs.writeFileSync(path.join(resultsDir, 'environment.properties'), envProps, 'utf8');

// Optionally copy custom categories
const srcCategories = path.join(process.cwd(), 'reporting', 'categories.json');
if (fs.existsSync(srcCategories)) {
  fs.copyFileSync(srcCategories, path.join(resultsDir, 'categories.json'));
}

// Optional global properties
const allureProps = path.join(process.cwd(), 'reporting', 'allure.properties');
if (fs.existsSync(allureProps)) {
  fs.copyFileSync(allureProps, path.join(resultsDir, 'allure.properties'));
}

console.log('Allure environment prepared.');
```

---

## 8) Example Test with Allure Annotations & Attachments

Create **`tests/example.spec.js`**:

```js
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
      await page.goto('/');
    });

    await test.step('Verify title', async () => {
      await expect(page).toHaveTitle(/Playwright|Example|Home/i);
    });

    const screenshot = await page.screenshot();
    await test.info().attach('homepage.png', { body: screenshot, contentType: 'image/png' });
  });
});
```

---

## 9) NPM Scripts (package.json)

Update **`package.json`**:

```json
{
  "name": "playwright-allure-js",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "clean": "rimraf allure-results allure-report",
    "pretest": "npm run clean",
    "test": "cross-env NODE_OPTIONS=--max-old-space-size=4096 playwright test",
    "posttest": "node tools/write-env.js",

    "report:allure:generate": "npx allure generate -c -o allure-report",
    "report:allure:open": "npx allure open allure-report",
    "report:allure:serve": "npx allure serve allure-results",

    "ci:test": "playwright test --reporter=line,allure-playwright",
    "ci:report": "node tools/write-env.js && npx allure generate -c -o allure-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.46.0",
    "allure-commandline": "^2.29.0",
    "allure-playwright": "^2.14.0",
    "cross-env": "^7.0.3",
    "dotenv": "^16.4.5",
    "rimraf": "^6.0.0"
  }
}
```

> Versions are examples; you can pin/update as you prefer.

---

## 10) Run Locally

```bash
# 1) Set environment
cp .env.example .env          # then edit as needed

# 2) Execute tests and build Allure results
npm test

# 3) Generate static HTML report
npm run report:allure:generate

# 4) Open the report locally
npm run report:allure:open

# (Alternative) serve directly from results
npm run report:allure:serve
```

---

## 11) CI/CD Pipelines

### 11.1 GitHub Actions — `.github/workflows/ci.yml`

```yaml
name: UI Tests

on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install deps
        run: |
          npm ci
          npx playwright install --with-deps

      - name: Run tests
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
        run: npm run ci:test

      - name: Generate Allure report
        run: npm run ci:report

      - name: Upload Allure artifacts
        uses: actions/upload-artifact@v4
        with:
          name: allure-report
          path: allure-report

      # Optional: publish to GitHub Pages
      # - name: Deploy report to Pages
      #   uses: peaceiris/actions-gh-pages@v3
      #   with:
      #     github_token: ${{ secrets.GITHUB_TOKEN }}
      #     publish_dir: ./allure-report
```

### 11.2 Jenkins — `Jenkinsfile`

```groovy
pipeline {
  agent any
  environment {
    NODEJS_VERSION = '18'
    BASE_URL = credentials('BASE_URL') // or use string param
  }
  tools {
    nodejs NODEJS_VERSION
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install') {
      steps {
        sh 'npm ci'
        sh 'npx playwright install --with-deps'
      }
    }
    stage('Test') {
      steps {
        sh 'npm run ci:test'
      }
      post {
        always {
          archiveArtifacts artifacts: 'allure-results/**', onlyIfSuccessful: false
        }
      }
    }
    stage('Allure Report') {
      steps {
        sh 'npm run ci:report'
      }
      post {
        always {
          archiveArtifacts artifacts: 'allure-report/**', onlyIfSuccessful: false
        }
      }
    }
  }
  post {
    always {
      // If you install the Allure Jenkins Plugin and configure the tool in Global Tools:
      // allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
      echo 'Pipeline finished.'
    }
  }
}
```

> **Note:** Install the **Allure Jenkins Plugin** and (optionally) configure **Global Tool** → *Allure Commandline* so you can use the `allure` step. Otherwise, the `npm run ci:report` approach generates static HTML you can archive.

### 11.3 GitLab CI — `.gitlab-ci.yml`

```yaml
stages: [install, test, report]

image: mcr.microsoft.com/playwright:v1.46.0-jammy

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/

variables:
  NODE_ENV: test

install:
  stage: install
  script:
    - npm ci
    - npx playwright install --with-deps
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 week

ui_tests:
  stage: test
  script:
    - npm run ci:test
  artifacts:
    when: always
    paths:
      - allure-results/
      - test-results/

allure_report:
  stage: report
  script:
    - npm run ci:report
  artifacts:
    when: always
    paths:
      - allure-report/
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event" || $CI_COMMIT_BRANCH

# Optional: publish via GitLab Pages
# pages:
#   stage: report
#   script:
#     - mkdir -p public
#     - cp -r allure-report/* public/
#   artifacts:
#     paths: [public]
#   only: [main]
```

---

## 12) Best Practices & Tips

* **Parallelism & Sharding**: use Playwright’s `--workers` and shard across CI jobs for large suites.
* **Retries**: keep retries small (1–2) and track flakiness; tag flaky tests and address root causes.
* **Tagging**: use `allure.tag('smoke')` / `test.describe.configure({ mode: 'parallel' })` to organize runs.
* **Trace/Video**: enable on retry/failure to keep artifacts lean but useful.
* **Idempotent Tests**: prefer API seeding/cleanup over UI for preconditions.
* **Environment Config**: drive `baseURL`, creds, and toggles via `.env` and CI secrets.
* **Artifacts**: always archive `allure-results` + `allure-report` in CI for debugging.
* **Code Organization**: page objects/components under `tests/page-objects/` if your app grows.

---

## 13) Troubleshooting

* **`npx allure` not found** → ensure `allure-commandline` is in devDependencies; run with `npx allure ...`.
* **Report empty** → confirm `allure-results` has files; ensure reporter is set to `allure-playwright`.
* **No screenshots/traces** → check `use: { screenshot, trace, video }` and attachments in tests.
* **CI headful issues** → stick to default headless; use official Playwright Docker image in CI.

---

## 14) Next Steps

* Add Page Objects, test data management, and tagging strategy (smoke/regression).
* Wire Allure links to your JIRA/TMS (see `allure.properties`).
* Add matrix jobs per browser or shard large test sets by directory.

