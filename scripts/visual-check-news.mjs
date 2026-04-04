import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const OUTPUT_DIR = path.join(process.cwd(), 'tmp', 'visual-news');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const routes = [
  { name: 'news', path: '/news' },
  { name: 'policy-glossary', path: '/news/policy-glossary' },
  { name: 'policy-deep-dive', path: '/news/policy-deep-dive' },
  { name: 'policy-faq', path: '/news/policy-faq' },
  { name: 'admission-timeline', path: '/news/admission-timeline' },
  { name: 'zhongkao-special', path: '/news/zhongkao-special' },
  { name: 'gaokao-special', path: '/news/gaokao-special' },
  { name: 'news-detail', path: '/news/school-2026-shs-cross-disciplinary-teaching' }
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 2200 },
  colorScheme: 'light'
});

const report = [];

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

  await page.close();
}

await browser.close();

const reportPath = path.join(OUTPUT_DIR, 'report.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(reportPath);
