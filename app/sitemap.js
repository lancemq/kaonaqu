import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { KNOWN_REGIONS } from '../shared/region-list.mjs';

// shared/ 是 CommonJS，app/ 下 ESM 通过 createRequire 桥接（见 CLAUDE.md）。
const require = createRequire(import.meta.url);
const { loadNewsIds } = require('../shared/data-store');
const { getDistrictCatalog } = require('../shared/region-config');

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

// Knowledge URLs are generated live by scanning content/knowledge (the same
// directory the route reads via fs.readdir), so the sitemap never drifts when a
// slug is added, renamed, or removed. The hand-maintained knowledge entries in
// data/sitemap-extra.xml are therefore ignored below.
// District (区域) URLs are generated live from the region catalog so the
// sitemap never drifts when a district is added/renamed. Previously omitted,
// leaving the /schools/district/* pages uncrawled.
function districtUrls(region, baseWithRegion) {
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

function knowledgeUrls(baseWithRegion) {
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
function parseExtraUrls(baseWithRegion) {
  const xml = readFileSync(join(process.cwd(), 'data/sitemap-extra.xml'), 'utf8');
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  return blocks
    .map((b) => {
      const rawLoc = (b.match(/<loc>([\s\S]*?)<\/loc>/) || [])[1]?.trim();
      if (!rawLoc || rawLoc.startsWith(`${BASE}/knowledge`)) return null;
      // 旧无前缀 URL 加 /{region}/ 前缀（统一带前缀）
      const loc = rawLoc.replace(`${BASE}/`, `${baseWithRegion}/`);
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
    const newsIds = await loadNewsIds(region);

    const newsUrls = [...newsIds, ...SPECIAL_PAGES].map((id) => ({
      url: `${baseWithRegion}/news/${encodeURIComponent(id)}`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    }));

    const extraUrls = parseExtraUrls(baseWithRegion);
    const knowledgeSet = knowledgeUrls(baseWithRegion);
    // 静态工具页：compare/groups/district 已在 sitemap-extra.xml，仅补 score-match
    const toolUrls = [
      { url: `${baseWithRegion}/schools/score-match`, lastmod: today, changefreq: 'weekly', priority: 0.6 }
    ];

    allUrls.push(...newsUrls, ...extraUrls, ...knowledgeSet, ...toolUrls, ...districtUrls(region, baseWithRegion));
  }

  return allUrls;
};
