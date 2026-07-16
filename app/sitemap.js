const { readFileSync } = require('fs');
const { join } = require('path');
const { loadDataStore } = require('../shared/data-store');

const BASE = 'https://kaonaqu.xyz';
const SPECIAL_PAGES = [
  'admission-timeline',
  'gaokao-special',
  'zhongkao-special',
  'policy-faq',
  'policy-glossary',
  'sports-reform'
];

// News URLs are generated live from the data store so the sitemap never
// drifts when news is added/renamed. Everything else (schools, knowledge,
// static routes) is preserved verbatim from data/sitemap-extra.xml, which is
// kept in sync with the curated URL set.
function parseExtraUrls() {
  const xml = readFileSync(join(process.cwd(), 'data/sitemap-extra.xml'), 'utf8');
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  return blocks
    .map((b) => {
      const loc = (b.match(/<loc>([\s\S]*?)<\/loc>/) || [])[1]?.trim();
      if (!loc) return null;
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
  const { news } = await loadDataStore();
  const today = new Date().toISOString().slice(0, 10);

  const newsUrls = [...news, ...SPECIAL_PAGES.map((id) => ({ id }))].map((item) => ({
    url: `${BASE}/news/${encodeURIComponent(item.id)}`,
    lastmod: today,
    changefreq: 'daily',
    priority: 0.8
  }));

  const extraUrls = parseExtraUrls();

  return [...newsUrls, ...extraUrls];
};
