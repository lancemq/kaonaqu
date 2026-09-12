// Playwright e2e 冒烟配置：只做「页面可达 + 关键元素存在」级别的守护，
// 不做视觉回归。运行：npm run test:e2e（自动起生产构建服务器）。
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3311',
    locale: 'zh-CN'
  },
  webServer: {
    command: 'npx next start -p 3311',
    port: 3311,
    timeout: 60_000,
    reuseExistingServer: false,
    env: process.env
  }
});
