// 全站 URL 清单构建（sitemap.xml / llms.txt / baidu_urls.txt 共用）。
// 全部活生成：regions + DB（新闻/学校 id）+ content/knowledge 扫描，
// 三份 SEO 资产永不因数据变化而漂移（替代原手工维护的 data/sitemap-extra.xml
// 与 public/llms.txt、public/baidu_urls.txt）。
import { readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { KNOWN_REGIONS } from '../shared/region-list.mjs';

const require = createRequire(import.meta.url);
const { loadNewsIds, loadSchoolIds } = require('../shared/data-store');
const { getDistrictCatalog, getRegionConfig, getRegionFeatures } = require('../shared/region-config');

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz';

export const SPECIAL_PAGES = [
  'admission-timeline',
  'gaokao-special',
  'zhongkao-special',
  'policy-faq',
  'policy-glossary',
  'sports-reform'
];

export const SUZHOU_SPECIAL_PAGES = [
  'suzhou-zhongkao',
  'suzhou-pathways',
  'suzhou-gaokao'
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function districtUrls(region, baseWithRegion) {
  if (getRegionFeatures(region).district === false) return [];
  const catalog = getDistrictCatalog(region);
  const urls = [
    { url: `${baseWithRegion}/schools/district`, changefreq: 'weekly', priority: 0.6 }
  ];
  for (const d of catalog) {
    urls.push({ url: `${baseWithRegion}/schools/district/${d.id}`, changefreq: 'weekly', priority: 0.6 });
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
      changefreq: 'weekly',
      priority: 0.6
    }));
}

// 频道根页与工具页
function staticChannelUrls(region, baseWithRegion) {
  const features = getRegionFeatures(region);
  const urls = [
    { url: baseWithRegion, changefreq: 'daily', priority: 1 },
    { url: `${baseWithRegion}/news`, changefreq: 'daily', priority: 0.9 }
  ];
  if (features.schools) {
    urls.push({ url: `${baseWithRegion}/schools`, changefreq: 'weekly', priority: 0.8 });
  }
  if (features.compare) {
    urls.push({ url: `${baseWithRegion}/schools/compare`, changefreq: 'weekly', priority: 0.6 });
  }
  if (features.groups) {
    urls.push({ url: `${baseWithRegion}/schools/groups`, changefreq: 'weekly', priority: 0.6 });
  }
  return urls;
}

function schoolUrls(region, baseWithRegion, slugs) {
  if (getRegionFeatures(region).schools === false) return [];
  return slugs.map((slug) => ({
    url: `${baseWithRegion}/schools/${encodeURIComponent(slug)}`,
    changefreq: 'weekly',
    priority: 0.7
  }));
}

function newsUrls(region, baseWithRegion, ids) {
  const features = getRegionFeatures(region);
  const specialPages = region === 'suzhou' ? SUZHOU_SPECIAL_PAGES : (features.schools ? SPECIAL_PAGES : []);
  return [...ids, ...specialPages].map((id) => ({
    url: `${baseWithRegion}/news/${encodeURIComponent(id)}`,
    changefreq: 'daily',
    priority: 0.8
  }));
}

// 构建单地区完整 URL 清单（含 counts 元数据，llms.txt 用）
export async function buildRegionUrls(region) {
  const baseWithRegion = `${BASE}/${region}`;
  const features = getRegionFeatures(region);
  const [newsIds, schoolIds] = await Promise.all([loadNewsIds(region), loadSchoolIds(region)]);

  const urls = [
    ...newsUrls(region, baseWithRegion, newsIds),
    ...staticChannelUrls(region, baseWithRegion),
    ...schoolUrls(region, baseWithRegion, schoolIds),
    ...knowledgeUrls(region, baseWithRegion),
    ...(features.scoreMatch === false ? [] : [{ url: `${baseWithRegion}/schools/score-match`, changefreq: 'weekly', priority: 0.6 }]),
    ...districtUrls(region, baseWithRegion)
  ];

  return {
    region,
    label: getRegionConfig(region).label,
    features,
    schoolCount: schoolIds.length,
    newsCount: newsIds.length,
    urls
  };
}

export async function buildAllUrls() {
  const regions = await Promise.all(KNOWN_REGIONS.map(buildRegionUrls));
  return {
    base: BASE,
    regions,
    urls: regions.flatMap((r) => r.urls.map((u) => ({ ...u, lastmod: today() })))
  };
}
