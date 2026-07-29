const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const { loadNewsIds } = require('../shared/data-store');

const BASE = 'https://kaonaqu.xyz';
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
      url: slug === 'index' ? `${BASE}/knowledge` : `${BASE}/knowledge/${slug}`,
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
      const loc = (b.match(/<loc>([\s\S]*?)<\/loc>/) || [])[1]?.trim();
      if (!loc || loc.startsWith(`${BASE}/knowledge`)) return null;
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

module.exports = async function sitemap() {
  const newsIds = await loadNewsIds();
  const today = new Date().toISOString().slice(0, 10);

  const newsUrls = [...newsIds, ...SPECIAL_PAGES].map((id) => ({
    url: `${BASE}/news/${encodeURIComponent(id)}`,
    lastmod: today,
    changefreq: 'daily',
    priority: 0.8
  }));

  const extraUrls = parseExtraUrls();
  const knowledgeSet = knowledgeUrls();

  return [...newsUrls, ...extraUrls, ...knowledgeSet];
};
