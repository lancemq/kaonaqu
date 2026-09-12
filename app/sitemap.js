import { readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { KNOWN_REGIONS } from '../shared/region-list.mjs';

// shared/ 是 CommonJS，app/ 下 ESM 通过 createRequire 桥接（见 CLAUDE.md）。
const require = createRequire(import.meta.url);
const { loadNewsIds, loadSchoolIds } = require('../shared/data-store');
const { getDistrictCatalog, getRegionFeatures } = require('../shared/region-config');

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz';
// 遍历 KNOWN_REGIONS 为每个地区生成一套 URL；新增地区后自动扩展。
const SPECIAL_PAGES = [
  'admission-timeline',
  'gaokao-special',
  'zhongkao-special',
  'policy-faq',
  'policy-glossary',
  'sports-reform'
];

// 苏州专题：schools 关闭但新闻专题可访问（路径不在 proxy NEWS_SPECIAL_PATHS，不重定向）
const SUZHOU_SPECIAL_PAGES = [
  'suzhou-zhongkao',
  'suzhou-pathways',
  'suzhou-gaokao'
];

// Knowledge URLs are generated live by scanning content/knowledge (the same
// directory the route reads via fs.readdir), so the sitemap never drifts when a
// slug is added, renamed, or removed. District (区域) URLs are generated live
// from the region catalog so the sitemap never drifts when a district is
// added/renamed. School detail URLs are generated live from the DB (by region),
// replacing the hand-maintained data/sitemap-extra.xml whose Shanghai slugs
// leaked into /suzhou/schools/... prefixed URLs.
function districtUrls(region, baseWithRegion) {
  if (getRegionFeatures(region).district === false) return [];
  const catalog = getDistrictCatalog(region);
  const urls = [
    {
      url: `${baseWithRegion}/schools/district`,
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: 'weekly',
      priority: 0.6
    }
  ];
  for (const d of catalog) {
    urls.push({
      url: `${baseWithRegion}/schools/district/${d.id}`,
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: 'weekly',
      priority: 0.6
    });
  }
  return urls;
}

function knowledgeUrls(region, baseWithRegion) {
  if (getRegionFeatures(region).knowledge === false) return [];
  const dir = join(process.cwd(), 'content', 'knowledge');
  let files;
  try {
    files = readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => f.endsWith('.json') && f !== '_index.json')
    .map((f) => f.slice(0, -'.json'.length))
    .map((slug) => ({
      url: slug === 'index' ? `${baseWithRegion}/knowledge` : `${baseWithRegion}/knowledge/${slug}`,
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: 'weekly',
      priority: 0.6
    }));
}

// 频道根页与工具页（原 data/sitemap-extra.xml 中除学校详情外的部分，显式枚举）。
function staticChannelUrls(region, baseWithRegion) {
  const features = getRegionFeatures(region);
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { url: baseWithRegion, lastmod: today, changefreq: 'daily', priority: 1 },
    { url: `${baseWithRegion}/news`, lastmod: today, changefreq: 'daily', priority: 0.9 }
  ];
  if (features.schools) {
    urls.push({ url: `${baseWithRegion}/schools`, lastmod: today, changefreq: 'weekly', priority: 0.8 });
  }
  if (features.compare) {
    urls.push({ url: `${baseWithRegion}/compare`, lastmod: today, changefreq: 'weekly', priority: 0.6 });
  }
  if (features.groups) {
    urls.push({ url: `${baseWithRegion}/groups`, lastmod: today, changefreq: 'weekly', priority: 0.6 });
  }
  return urls;
}

// 学校详情页：按 region 活生成（slug = 详情路由 id），替代 sitemap-extra.xml。
function schoolUrls(region, baseWithRegion, slugs) {
  if (getRegionFeatures(region).schools === false) return [];
  return slugs.map((slug) => ({
    url: `${baseWithRegion}/schools/${encodeURIComponent(slug)}`,
    lastmod: new Date().toISOString().slice(0, 10),
    changefreq: 'weekly',
    priority: 0.7
  }));
}

export default async function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const allUrls = [];

  for (const region of KNOWN_REGIONS) {
    const baseWithRegion = `${BASE}/${region}`;
    const features = getRegionFeatures(region);
    const [newsIds, schoolIds] = await Promise.all([loadNewsIds(region), loadSchoolIds(region)]);

    // 新闻专题：苏州用苏州专属专题；其余地区 schools 关闭时跳过（专题重定向了，sitemap 不含）
    const specialPages = region === 'suzhou' ? SUZHOU_SPECIAL_PAGES : (features.schools ? SPECIAL_PAGES : []);
    const newsUrls = [...newsIds, ...specialPages].map((id) => ({
      url: `${baseWithRegion}/news/${encodeURIComponent(id)}`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    }));

    // 静态工具页：score-match（features.scoreMatch 关闭时跳过）
    const toolUrls = features.scoreMatch === false
      ? []
      : [{ url: `${baseWithRegion}/schools/score-match`, lastmod: today, changefreq: 'weekly', priority: 0.6 }];

    allUrls.push(
      ...newsUrls,
      ...staticChannelUrls(region, baseWithRegion),
      ...schoolUrls(region, baseWithRegion, schoolIds),
      ...knowledgeUrls(region, baseWithRegion),
      ...toolUrls,
      ...districtUrls(region, baseWithRegion)
    );
  }

  return allUrls;
}
