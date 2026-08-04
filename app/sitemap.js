import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

// shared/ 是 CommonJS，app/ 下 ESM 通过 createRequire 桥接（见 CLAUDE.md）。
const require = createRequire(import.meta.url);
const { loadNewsIds } = require('../shared/data-store');
const { getDistrictCatalog } = require('../shared/region-config');

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz';
// sitemap 当前只生成上海地区 URL；新增地区后需按区域生成多套 URL。
// 与 shared/region-list.mjs DEFAULT_REGION 同步。
const REGION = 'shanghai';
const BASE_WITH_REGION = `${BASE}/${REGION}`;
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
function districtUrls() {
  const catalog = getDistrictCatalog(REGION);
  const urls = [
    {
      url: `${BASE_WITH_REGION}/schools/district`,
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: 'weekly',
      priority: 0.6
    }
  ];
  for (const d of catalog) {
    urls.push({
      url: `${BASE_WITH_REGION}/schools/district/${d.id}`,
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: 'weekly',
      priority: 0.6
    });
  }
  return urls;
}

function knowledgeUrls() {
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
      url: slug === 'index' ? `${BASE_WITH_REGION}/knowledge` : `${BASE_WITH_REGION}/knowledge/${slug}`,
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
function parseExtraUrls() {
  const xml = readFileSync(join(process.cwd(), 'data/sitemap-extra.xml'), 'utf8');
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  return blocks
    .map((b) => {
      const rawLoc = (b.match(/<loc>([\s\S]*?)<\/loc>/) || [])[1]?.trim();
      if (!rawLoc || rawLoc.startsWith(`${BASE}/knowledge`)) return null;
      // 旧无前缀 URL 加 /shanghai/ 前缀（统一带前缀）
      const loc = rawLoc.replace(`${BASE}/`, `${BASE_WITH_REGION}/`);
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
  const newsIds = await loadNewsIds();
  const today = new Date().toISOString().slice(0, 10);

  const newsUrls = [...newsIds, ...SPECIAL_PAGES].map((id) => ({
    url: `${BASE_WITH_REGION}/news/${encodeURIComponent(id)}`,
    lastmod: today,
    changefreq: 'daily',
    priority: 0.8
  }));

  const extraUrls = parseExtraUrls();
  const knowledgeSet = knowledgeUrls();
  // 静态工具页：compare/groups/district 已在 sitemap-extra.xml，仅补 score-match
  const toolUrls = [
    { url: `${BASE_WITH_REGION}/schools/score-match`, lastmod: today, changefreq: 'weekly', priority: 0.6 }
  ];

  return [...newsUrls, ...extraUrls, ...knowledgeSet, ...toolUrls, ...districtUrls()];
};
