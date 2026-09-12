import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pageSource = await readFile(new URL('../app/page.js', import.meta.url), 'utf8');
const homeCss = await readFile(new URL('../styles/channels/home.css', import.meta.url), 'utf8');

test('home page uses the aerial redesign shell instead of the old SiteShell prototype', () => {
  assert.match(pageSource, /className="home-aerial-page"/);
  assert.doesNotMatch(pageSource, /<SiteShell/);
  assert.doesNotMatch(pageSource, /home-prototype/);
});

test('home theme css is scoped to the aerial redesign', () => {
  assert.match(homeCss, /body\[data-page="home"\] \.home-aerial-page/);
  assert.doesNotMatch(homeCss, /home-prototype/);
});

test('home page includes the news specials entry section, fed from region config', () => {
  // 布局结构仍在页面源码；专题卡内容已迁到 regions.data.json 的 home.newsSpecials
  assert.match(pageSource, /className="home-news-specials-slab"/);
  assert.match(pageSource, /TOPIC ENTRIES/);
  assert.match(pageSource, /新闻专题/);
  const regions = JSON.parse(readFileSync(new URL('../shared/regions.data.json', import.meta.url), 'utf8'));
  const shHrefs = regions.regions.shanghai.home.newsSpecials.map((c) => c.href);
  assert.deepEqual(shHrefs, ['/news/zhongkao-special', '/news/gaokao-special', '/news/sports-reform', '/news/policy-glossary']);
  assert.match(homeCss, /body\[data-page="home"\] \.home-news-specials-grid/);
});

test('首页地区专属内容配置化：不再堆积 region 特例分支', async () => {
  const source = await readFile(new URL('../app/page.js', import.meta.url), 'utf8');
  // 专题卡/快捷入口/特色校全部来自 regions.data.json 的 home 字段
  assert.match(source, /config\.home \|\| \{\}/);
  assert.match(source, /homeConfig\.newsSpecials/);
  assert.match(source, /homeConfig\.quickLinks/);
  assert.match(source, /homeConfig\.featuredSchoolNames/);
  // 不再有地区特例三元与硬编码名单/卡组
  assert.doesNotMatch(source, /region === 'suzhou'/);
  assert.doesNotMatch(source, /SUZHOU_NEWS_SPECIALS|const NEWS_SPECIALS|FEATURED_SCHOOL_NAMES = \[/);
  // 区目录 region 感知（修复苏州起区县高亮用上海目录的既有 bug）
  assert.match(source, /getDistrictCatalog\(region\)/);
  assert.doesNotMatch(source, /DISTRICT_CATALOG/);
  // 空专题卡配置时不渲染空区块
  assert.match(source, /newsSpecials\.length > 0/);
});

test('sitemap 专题页清单配置化', async () => {
  const source = await readFile(new URL('../lib/sitemap-urls.mjs', import.meta.url), 'utf8');
  assert.match(source, /home\?\.newsSpecialPages/);
  assert.doesNotMatch(source, /SPECIAL_PAGES = \[/);
});
