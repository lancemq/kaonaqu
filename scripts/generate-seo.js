const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://kaonaqu.xyz';
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const KNOWLEDGE_DATA_FILE = 'data/knowledge-pages.json';

const STATIC_ROUTES = [
  { url: '/', file: 'app/page.js', changefreq: 'daily', priority: '1.0' },
  { url: '/news', file: 'app/news/page.js', changefreq: 'daily', priority: '0.9' },
  { url: '/schools', file: 'app/schools/page.js', changefreq: 'daily', priority: '0.9' }
];

function getKnowledgeRoutes() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, KNOWLEDGE_DATA_FILE), 'utf8'));
  return Object.keys(data.pages || {})
    .sort((a, b) => a.localeCompare(b))
    .map((slug) => {
      const url = slug === 'index' ? '/knowledge' : `/knowledge/${slug}`;
      return {
        url,
        file: KNOWLEDGE_DATA_FILE,
        changefreq: 'weekly',
        priority: slug === 'index' || slug === 'grade-8' ? '0.9' : slug.includes('grade8') ? '0.8' : '0.7'
      };
    });
}

const ROUTES = [...STATIC_ROUTES, ...getKnowledgeRoutes()];

function getLastMod(file) {
  return fs.statSync(path.join(ROOT, file)).mtime.toISOString().slice(0, 10);
}

function buildSitemap() {
  const entries = ROUTES.map((route) => `  <url>
    <loc>${SITE_URL}${route.url}</loc>
    <lastmod>${getLastMod(route.file)}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function buildBaiduUrlList() {
  return ROUTES.map((route) => `${SITE_URL}${route.url}`).join('\n') + '\n';
}

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), buildSitemap(), 'utf8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'baidu_urls.txt'), buildBaiduUrlList(), 'utf8');

console.log(`Generated public/sitemap.xml and public/baidu_urls.txt for ${ROUTES.length} URLs.`);
