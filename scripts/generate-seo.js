const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://kaonaqu.xyz';
const ROOT = path.join(__dirname, '..');

const ROUTES = [
  { url: '/', file: 'index.html', changefreq: 'daily', priority: '1.0' },
  { url: '/news', file: 'news.html', changefreq: 'daily', priority: '0.9' },
  { url: '/schools', file: 'schools.html', changefreq: 'daily', priority: '0.9' },
  { url: '/knowledge', file: 'knowledge/index.html', changefreq: 'weekly', priority: '0.9' },
  { url: '/knowledge/grade-7', file: 'knowledge/grade-7.html', changefreq: 'weekly', priority: '0.8' },
  { url: '/knowledge/grade-8', file: 'knowledge/grade-8.html', changefreq: 'weekly', priority: '0.9' },
  { url: '/knowledge/grade-9', file: 'knowledge/grade-9.html', changefreq: 'weekly', priority: '0.8' },
  { url: '/knowledge/senior-1', file: 'knowledge/senior-1.html', changefreq: 'weekly', priority: '0.8' },
  { url: '/knowledge/senior-2', file: 'knowledge/senior-2.html', changefreq: 'weekly', priority: '0.8' },
  { url: '/knowledge/senior-3', file: 'knowledge/senior-3.html', changefreq: 'weekly', priority: '0.8' },
  { url: '/knowledge/chinese-grade8', file: 'knowledge/chinese-grade8.html', changefreq: 'weekly', priority: '0.7' },
  { url: '/knowledge/math-grade8', file: 'knowledge/math-grade8.html', changefreq: 'weekly', priority: '0.7' },
  { url: '/knowledge/english-grade8', file: 'knowledge/english-grade8.html', changefreq: 'weekly', priority: '0.7' },
  { url: '/knowledge/physics-grade8', file: 'knowledge/physics-grade8.html', changefreq: 'weekly', priority: '0.8' },
  { url: '/knowledge/chemistry-grade8', file: 'knowledge/chemistry-grade8.html', changefreq: 'weekly', priority: '0.7' },
  { url: '/knowledge/history-grade8', file: 'knowledge/history-grade8.html', changefreq: 'weekly', priority: '0.7' },
  { url: '/knowledge/politics-grade8', file: 'knowledge/politics-grade8.html', changefreq: 'weekly', priority: '0.7' }
];

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

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(), 'utf8');
fs.writeFileSync(path.join(ROOT, 'baidu_urls.txt'), buildBaiduUrlList(), 'utf8');

console.log(`Generated sitemap.xml and baidu_urls.txt for ${ROUTES.length} URLs.`);
