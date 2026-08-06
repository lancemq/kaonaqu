import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { KNOWN_REGIONS } from '../shared/region-list.mjs';

// shared/ 是 CommonJS，app/ 下 ESM 通过 createRequire 桥接（见 CLAUDE.md）。
const require = createRequire(import.meta.url);
const { loadNewsIds } = require('../shared/data-store');
const { getDistrictCatalog, getRegionFeatures } = require('../shared/region-config');

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz';
// 遍历 KNOWN_REGIONS 为每个地区生成一套 URL；当前只有 shanghai，新增地区后自动扩展。
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
// slug is added, renamed, or removed. The hand-maintained knowledge entries in
// data/sitemap-extra.xml are therefore ignored below.
// District (区域) URLs are generated live from the region catalog so the
// sitemap never drifts when a district is added/renamed. Previously omitted,
// leaving the /schools/district/* pages uncrawled.
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

// News URLs are generated live from the data store so the sitemap never
// drifts when news is added/renamed. Everything else (schools, static routes)
// is preserved verbatim from data/sitemap-extra.xml, which is kept in sync with
// the curated URL set. Knowledge URLs from that file are skipped (generated
// live above instead).
function parseExtraUrls(region, baseWithRegion) {
  const features = getRegionFeatures(region);
  const xml = readFileSync(join(process.cwd(), 'data/sitemap-extra.xml'), 'utf8');
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  return blocks
    .map((b) => {
      const rawLoc = (b.match(/<loc>([\s\S]*?)<\/loc>/) || [])[1]?.trim();
      if (!rawLoc || rawLoc.startsWith(`${BASE}/knowledge`)) return null;
      // 旧无前缀 URL 加 /{region}/ 前缀（统一带前缀）
      const loc = rawLoc.replace(`${BASE}/`, `${baseWithRegion}/`);
      // 关闭的频道 URL 不进 sitemap（如苏州仅新闻，排除 /schools /compare /groups /district）
      const pathAfterBase = loc.slice(baseWithRegion.length);
      if ((pathAfterBase === '/schools' || pathAfterBase.startsWith('/schools/')) && features.schools === false) return null;
      if ((pathAfterBase === '/compare' || pathAfterBase.startsWith('/compare/')) && features.compare === false) return null;
      if ((pathAfterBase === '/groups' || pathAfterBase.startsWith('/groups/')) && features.groups === false) return null;
      if ((pathAfterBase === '/district' || pathAfterBase.startsWith('/district/')) && features.district === false) return null;
      const lastmod = (b.match(/<lastmod>([\s\S]*?)<\/lastmod>/) || [])[1]?.trim();
      const changefreq = (b.match(/<changefreq>([\s\S]*?)<\/changefreq>/) || [])[1]?.trim();
      const priority = (b.match(/<priority>([\s\S]*?)<\/priority>/) || [])[1]?.trim();
      return {
        url: loc,
        ...(lastmod ? { lastmod } : {}),
        ...(changefreq ? { changefreq } : {}),
        ...(priority ? { priority: Number(priority) } : {})
      };
    })
    .filter(Boolean);
}

export default async function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const allUrls = [];

  for (const region of KNOWN_REGIONS) {
    const baseWithRegion = `${BASE}/${region}`;
    const features = getRegionFeatures(region);
    const newsIds = await loadNewsIds(region);

    // 新闻专题：苏州用苏州专属专题；其余地区 schools 关闭时跳过（专题重定向了，sitemap 不含）
    const specialPages = region === 'suzhou' ? SUZHOU_SPECIAL_PAGES : (features.schools ? SPECIAL_PAGES : []);
    const newsUrls = [...newsIds, ...specialPages].map((id) => ({
      url: `${baseWithRegion}/news/${encodeURIComponent(id)}`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    }));

    const extraUrls = parseExtraUrls(region, baseWithRegion);
    const knowledgeSet = knowledgeUrls(region, baseWithRegion);
    // 静态工具页：score-match（features.scoreMatch 关闭时跳过）
    const toolUrls = features.scoreMatch === false
      ? []
      : [{ url: `${baseWithRegion}/schools/score-match`, lastmod: today, changefreq: 'weekly', priority: 0.6 }];

    allUrls.push(...newsUrls, ...extraUrls, ...knowledgeSet, ...toolUrls, ...districtUrls(region, baseWithRegion));
  }

  return allUrls;
};
