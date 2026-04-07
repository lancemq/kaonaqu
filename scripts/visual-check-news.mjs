import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const OUTPUT_DIR = path.join(process.cwd(), 'tmp', 'visual-news');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const routes = [
  { name: 'news', path: '/news' },
  { name: 'news-detail-school', path: '/news/school-2026-shs-cross-disciplinary-teaching' },
  { name: 'news-detail-admission-school', path: '/news/admission-2026-hsefz-sports-students-plan' }
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 2200 },
  colorScheme: 'light'
});

const report = [];
const failures = [];

for (const route of routes) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(String(err));
  });

  const url = `http://127.0.0.1:3003${route.path}`;
  const response = await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const screenshotPath = path.join(OUTPUT_DIR, `${route.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  report.push({
    name: route.name,
    path: route.path,
    status: response?.status() || null,
    title: await page.title(),
    screenshotPath,
    consoleErrors,
    pageErrors
  });

  const status = response?.status() || null;
  if (!status || status < 200 || status >= 300 || consoleErrors.length || pageErrors.length) {
    failures.push({
      name: route.name,
      path: route.path,
      status,
      consoleErrors,
      pageErrors
    });
  }

  await page.close();
}

await browser.close();

const reportPath = path.join(OUTPUT_DIR, 'report.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(reportPath);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
