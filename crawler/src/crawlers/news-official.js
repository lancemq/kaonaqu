const path = require('path');
const registry = require('../sources/registry.json');
const { fetchWithRetry } = require('../utils/fetch');
const { collectLinks, extractArticle, cleanText } = require('../utils/html');
const { readJson, writeJson } = require('../utils/io');
const { RAW_DIR } = require('../utils/paths');

const OUTPUT_FILE = path.join(RAW_DIR, 'official-news.json');

function inferExamType(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  if (text.includes('高考') || text.includes('春考') || text.includes('专科') || text.includes('志愿')) {
    return 'gaokao';
  }
  return 'zhongkao';
}

function inferCategory(examType) {
  return examType === 'gaokao' ? '高考' : '中考';
}

async function crawlOfficialNews() {
  const sources = registry.filter((item) => item.type === 'news' && item.authority === 'official');
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
        // Keep seed URLs as fallback when runtime network is unavailable.
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
        const examType = inferExamType(title, article.content);
        results.push({
          id: `news-${title}`.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
          title,
          category: inferCategory(examType),
          examType,
          summary: article.summary,
          content: article.content,
          publishedAt: article.publishedAt || link.publishedAt,
          source: source.name,
          sourceUrl: link.url,
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
  crawlOfficialNews()
    .then((items) => {
      console.log(`official-news=${items.length}`);
    })
    .catch((error) => {
      console.error('crawl official news failed:', error.message);
      process.exit(1);
    });
}

module.exports = crawlOfficialNews;
