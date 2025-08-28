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