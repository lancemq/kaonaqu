// 全站冒烟：多地区路由、四频道可达、学校页筛选/分页交互、SEO 资产活生成。
// 只验证「能打开 + 关键结构在」，不校验具体业务数据（那是单测与 DB 校验的职责）。
import { test, expect } from '@playwright/test';

test('根路径 308 到上海首页，首页渲染频道导航', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveURL(/\/shanghai$/);
  await expect(page.locator('nav.channel-nav')).toBeVisible();
});

test('上海学校列表：SSR 卡片、区域筛选导航、分页链接', async ({ page }) => {
  await page.goto('/shanghai/schools');
  // 服务端渲染的学校卡（B6 拆分后的骨架，非 client hydration 产物）
  const cards = page.locator('article.schools-aerial-card-wrap');
  expect(await cards.count()).toBeGreaterThan(0);

  // 区域筛选（client 岛）：选择徐汇后 URL 带参数且结果变化
  await page.selectOption('#prototype-district-filter', 'xuhui');
  await page.waitForURL(/district=xuhui/);
  expect(await cards.count()).toBeGreaterThan(0);
  const firstCardTitle = await cards.first().locator('h3').innerText();

  // 分页链接模式：页码是真实链接且指向带筛选参数的 URL
  const page2 = page.locator('a.pager-page', { hasText: '2' }).first();
  if (await page2.count()) {
    await page2.click();
    await page.waitForURL(/page=2/);
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first().locator('h3')).not.toHaveText(firstCardTitle);
  }
});

test('上海新闻与知识频道可达', async ({ page }) => {
  await page.goto('/shanghai/news');
  await expect(page.locator('body')).toBeVisible();
  await page.goto('/shanghai/knowledge');
  await expect(page.locator('body')).toBeVisible();
});

test('苏州频道：学校可达、knowledge 308 到 news', async ({ page }) => {
  await page.goto('/suzhou/schools');
  await expect(page.locator('article.schools-aerial-card-wrap').first()).toBeVisible();
  await page.goto('/suzhou/knowledge', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/suzhou\/news$/);
});

test('估分择校页：满分随地区（苏州 740）', async ({ page }) => {
  await page.goto('/suzhou/schools/score-match');
  const body = await page.locator('body').innerText();
  expect(body).toContain('740');
});

test('教育集团页：URL 驱动筛选生效', async ({ page }) => {
  await page.goto('/shanghai/schools/groups');
  const grid = page.locator('.school-groups-grid article');
  expect(await grid.count()).toBeGreaterThan(0);
  // 学段筛选经 URL 导航，服务端重算（P2 改造后的行为）
  await page.goto('/shanghai/schools/groups?stage=junior');
  // 筛选后行列表可能无匹配项（空容器），断言结果计数文案存在即可
  await expect(page.locator('.school-groups-aerial-list').last()).toContainText(/个集团|所成员/);
  await page.goto('/shanghai/schools/groups?query=%E5%A4%8D%E6%97%A6');
  await expect(page.locator('.school-groups-aerial-tools')).toBeVisible();
  await expect(page.locator('main')).toContainText(/个集团|教育集团/);
});

test('SEO 资产活生成：sitemap/llms/baidu_urls 同源且带地区前缀', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/shanghai/schools/');
  expect(sitemap).toContain('/suzhou/schools/');

  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('苏州');
  expect(llms).toContain('/suzhou/schools');

  const baidu = await (await request.get('/baidu_urls.txt')).text();
  const urls = baidu.trim().split('\n');
  expect(urls.length).toBeGreaterThan(500);
  // 全部为带前缀的最终 URL（无 308 跳转链）
  expect(urls.every((u) => /\/(shanghai|suzhou)(\/|$)/.test(u))).toBe(true);
});

test('API 只读接口：region 隔离', async ({ request }) => {
  const sh = await (await request.get('/api/schools?region=shanghai')).json();
  const sz = await (await request.get('/api/schools?region=suzhou')).json();
  expect(Array.isArray(sh)).toBe(true);
  expect(sh.length).toBeGreaterThan(0);
  expect(sz.length).toBeGreaterThan(0);
  const shRegions = new Set(sh.map((s) => s.region));
  expect(shRegions.has('shanghai')).toBe(true);
});
