const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://kaonaqu.xyz';
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', filename), 'utf8'));
}

function getUrlLastMod(url) {
  if (url === '/') return '2026-04-13';
  if (url.startsWith('/news/')) return '2026-04-12';
  if (url.startsWith('/schools/')) return '2026-04-10';
  if (url.startsWith('/knowledge')) return '2026-04-13';
  return '2026-04-07';
}

function getUrlPriority(url) {
  if (url === '/') return '1.0';
  if (url === '/news') return '0.9';
  if (url === '/schools') return '0.9';
  if (url.startsWith('/schools/')) return '0.7';
  if (url.startsWith('/knowledge')) return '0.7';
  if (url.startsWith('/news/')) return '0.8';
  if (url.startsWith('/schools/district/')) return '0.7';
  return '0.6';
}

function getUrlChangefreq(url) {
  if (url === '/' || url === '/news' || url === '/schools') return 'daily';
  if (url.startsWith('/news/')) return 'daily';
  if (url.startsWith('/schools/')) return 'weekly';
  return 'weekly';
}

function buildSitemap(urls) {
  const entries = urls.map((url) => `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${getUrlLastMod(url)}</lastmod>
    <changefreq>${getUrlChangefreq(url)}</changefreq>
    <priority>${getUrlPriority(url)}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function buildBaiduUrlList(urls) {
  return urls.map((url) => `${SITE_URL}${url}`).join('\n') + '\n';
}

function main() {
  const urls = [];

  // Static top-level routes
  urls.push('/');
  urls.push('/news');
  urls.push('/schools');

  // Knowledge pages
  const knowledgeData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'knowledge-pages.json'), 'utf8'));
  const knowledgeSlugs = Object.keys(knowledgeData.pages || {});
  for (const slug of knowledgeSlugs) {
    urls.push(slug === 'index' ? '/knowledge' : `/knowledge/${slug}`);
  }

  // News detail pages
  const news = readJson('news.json');
  for (const item of news) {
    if (item && item.id) {
      urls.push(`/news/${encodeURIComponent(item.id)}`);
    }
  }

  // School detail pages
  const schools = readJson('schools.json');
  for (const school of schools) {
    if (school && school.id) {
      urls.push(`/schools/${encodeURIComponent(school.id)}`);
    }
  }

  // Policy detail pages
  const policies = readJson('policies.json');
  for (const policy of policies) {
    if (policy && policy.id) {
      urls.push(`/news/${encodeURIComponent(policy.id)}`);
    }
  }

  // District school listing pages
  const districts = readJson('districts.json');
  for (const district of districts) {
    if (district && district.id) {
      urls.push(`/schools/district/${district.id}`);
    }
  }

  // Special topic pages
  const specialRoutes = [
    '/news/admission-timeline',
    '/news/gaokao-special',
    '/news/zhongkao-special',
    '/news/policy-faq',
    '/news/policy-glossary',
    '/schools/compare',
    '/schools/groups',
    '/schools/district'
  ];
  for (const route of specialRoutes) {
    urls.push(route);
  }

  // Remove duplicates while preserving order
  const seen = new Set();
  const uniqueUrls = urls.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), buildSitemap(uniqueUrls), 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'baidu_urls.txt'), buildBaiduUrlList(uniqueUrls), 'utf8');

  console.log(`Generated sitemap.xml and baidu_urls.txt for ${uniqueUrls.length} URLs.`);
}

main();
