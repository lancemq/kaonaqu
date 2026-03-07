const path = require('path');
const registry = require('../sources/registry.json');
const { fetchWithRetry } = require('../utils/fetch');
const { collectLinks, extractArticle, cleanText } = require('../utils/html');
const { readJson, writeJson } = require('../utils/io');

const RAW_DIR = path.join(__dirname, '../../data/raw');
const OUTPUT_FILE = path.join(RAW_DIR, 'official-policies.json');

async function crawlOfficialPolicies() {
  const sources = registry.filter((item) => item.type === 'policy' && item.authority === 'official');
  const existing = await readJson(OUTPUT_FILE, []);
  const existingByUrl = new Map(existing.map((item) => [item.sourceUrl || item.url, item]));
  const results = [];

  for (const source of sources) {
    let candidateLinks = source.seedUrls.map((url) => ({ url, title: '', publishedAt: null }));

    if (source.entryUrl) {
      try {
        const html = await fetchWithRetry(source.entryUrl);
        const links = collectLinks(html, source.entryUrl, source.listSelectors);
        candidateLinks = [...candidateLinks, ...links];
      } catch (error) {
        // Preserve seed-only fallback when network isn't available.
      }
    }

    const deduped = Array.from(new Map(candidateLinks.map((item) => [item.url, item])).values());

    for (const link of deduped) {
      try {
        const html = await fetchWithRetry(link.url);
        const article = extractArticle(html, link.url, source.detailSelectors);
        const title = cleanText(article.title || link.title);
        if (!title) {
          continue;
        }
        results.push({
          title,
          districtId: 'all',
          summary: article.summary,
          content: article.content,
          year: Number(String(article.publishedAt || '').slice(0, 4)) || new Date().getUTCFullYear(),
          source: source.name,
          sourceUrl: link.url,
          publishedAt: article.publishedAt || link.publishedAt,
          crawledAt: new Date().toISOString()
        });
      } catch (error) {
        const fallback = existingByUrl.get(link.url);
        if (fallback) {
          results.push(fallback);
        }
      }
    }
  }

  const dedupedResults = Array.from(new Map(results.map((item) => [item.sourceUrl, item])).values())
    .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));

  await writeJson(OUTPUT_FILE, dedupedResults);
  return dedupedResults;
}

if (require.main === module) {
  crawlOfficialPolicies()
    .then((items) => {
      console.log(`official-policies=${items.length}`);
    })
    .catch((error) => {
      console.error('crawl official policies failed:', error.message);
      process.exit(1);
    });
}

module.exports = crawlOfficialPolicies;
