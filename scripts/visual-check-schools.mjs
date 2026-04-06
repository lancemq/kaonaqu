import { chromium } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const outputDir = path.resolve('tmp/visual-schools');

const pages = [
  ['schools', 'http://127.0.0.1:3002/schools', 2600],
  ['school-detail', 'http://127.0.0.1:3002/schools/xuhui-%E4%B8%8A%E6%B5%B7%E4%B8%AD%E5%AD%A6', 2600],
  ['school-district', 'http://127.0.0.1:3002/schools/district/xuhui', 2400],
  ['school-compare', 'http://127.0.0.1:3002/schools/compare?ids=xuhui-%E4%B8%8A%E6%B5%B7%E4%B8%AD%E5%AD%A6,pudong-%E5%8D%8E%E4%B8%9C%E5%B8%88%E8%8C%83%E5%A4%A7%E5%AD%A6%E7%AC%AC%E4%BA%8C%E9%99%84%E5%B1%9E%E4%B8%AD%E5%AD%A6', 2600]
];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = [];

for (const [name, url, height] of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true });

  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  const mainBox = await page.locator('main').boundingBox().catch(() => null);
  const heroBox = await page.locator('header.hero').boundingBox().catch(() => null);

  report.push({ name, url, title, h1, mainBox, heroBox, errors });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
