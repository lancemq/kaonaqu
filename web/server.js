#!/usr/bin/env node

require('../shared/load-env');

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { handleApiRequest } = require('../shared/api-router');
const { loadDataStore } = require('../shared/data-store');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const SITE_DIR = path.join(__dirname, '..');
const SCHOOLS_DATA_FILE = path.join(SITE_DIR, 'data', 'schools.json');
const BLOCKED_PATH_PREFIXES = ['/api/', '/data/', '/crawler/', '/shared/', '/scripts/', '/web/', '/node_modules/'];
const BLOCKED_EXACT_PATHS = ['/api', '/data', '/crawler', '/shared', '/scripts', '/web', '/node_modules', '/package.json', '/vercel.json'];

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

let cachedSchoolsMtimeMs = 0;
let cachedSchools = [];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function loadSchoolsForMeta() {
  const stats = fs.statSync(SCHOOLS_DATA_FILE);
  if (stats.mtimeMs !== cachedSchoolsMtimeMs) {
    cachedSchools = JSON.parse(fs.readFileSync(SCHOOLS_DATA_FILE, 'utf8'));
    cachedSchoolsMtimeMs = stats.mtimeMs;
  }
  return cachedSchools;
}

function getSchoolMetaByPath(reqPath) {
  const match = reqPath.match(/^\/schools\/(.+)$/);
  if (!match) {
    return null;
  }

  const schoolId = decodeURIComponent(match[1]);
  const school = loadSchoolsForMeta().find((item) => item.id === schoolId);
  if (!school) {
    return null;
  }

  const title = `${school.name} | 上海学校档案 | 考哪去`;
  const description = (school.schoolDescription
    || school.admissionNotes
    || `查看${school.name}的学校档案、阶段、类型、特色、招生建议与来源信息。`).slice(0, 140);
  const url = `https://kaonaqu.xyz/schools/${encodeURIComponent(school.id)}`;
  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'School',
    name: school.name,
    url,
    description,
    address: school.address || undefined,
    telephone: school.phone || undefined
  };

  return {
    title,
    description,
    url,
    ldJson: JSON.stringify(ldJson)
  };
}

function injectSchoolDetailMeta(html, schoolMeta) {
  let output = html;

  output = output.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(schoolMeta.title)}</title>`);
  output = output.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(schoolMeta.description)}">`);
  output = output.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escapeHtml(schoolMeta.url)}">`);
  output = output.replace(/<link rel="alternate" hreflang="zh-CN" href="[^"]*">/, `<link rel="alternate" hreflang="zh-CN" href="${escapeHtml(schoolMeta.url)}">`);
  output = output.replace(/<meta name="mobile-agent" content="[^"]*">/, `<meta name="mobile-agent" content="format=html5; url=${escapeHtml(schoolMeta.url)}">`);
  output = output.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(schoolMeta.title)}">`);
  output = output.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(schoolMeta.description)}">`);
  output = output.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${escapeHtml(schoolMeta.url)}">`);

  if (output.includes('</head>')) {
    output = output.replace('</head>', `  <script type="application/ld+json">${schoolMeta.ldJson}</script>\n</head>`);
  }

  return output;
}

function injectHtmlEnhancements(html, reqPath) {
  let output = html;
  const schoolMeta = getSchoolMetaByPath(reqPath);
  if (schoolMeta) {
    output = injectSchoolDetailMeta(output, schoolMeta);
  }

  const analyticsTag = '<script type="module" src="/analytics-init.mjs"></script>';
  if (output.includes(analyticsTag)) {
    return output;
  }

  if (output.includes('</body>')) {
    return output.replace('</body>', `  ${analyticsTag}\n</body>`);
  }

  if (output.includes('</head>')) {
    return output.replace('</head>', `  ${analyticsTag}\n</head>`);
  }

  return `${output}\n${analyticsTag}`;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function isBlockedStaticPath(reqPath) {
  return BLOCKED_EXACT_PATHS.includes(reqPath)
    || BLOCKED_PATH_PREFIXES.some((prefix) => reqPath.startsWith(prefix))
    || path.basename(reqPath).startsWith('.');
}

function resolveStaticFile(reqPath) {
  if (reqPath.startsWith('/schools/') && !path.extname(reqPath)) {
    const schoolsPage = path.join(SITE_DIR, 'schools.html');
    if (fs.existsSync(schoolsPage) && fs.statSync(schoolsPage).isFile()) {
      return schoolsPage;
    }
  }

  const normalizedPath = reqPath === '/' ? '/index.html' : reqPath;
  const trimmedPath = normalizedPath.replace(/\/+$/, '');
  const relativeBase = trimmedPath.replace(/^\/+/, '');
  const candidates = [];

  if (!relativeBase) {
    candidates.push('index.html');
  } else {
    candidates.push(relativeBase);
    if (!path.extname(relativeBase)) {
      candidates.push(`${relativeBase}.html`);
      candidates.push(path.join(relativeBase, 'index.html'));
    }
  }

  for (const candidate of candidates) {
    const filePath = path.normalize(path.join(SITE_DIR, candidate));
    if (!filePath.startsWith(SITE_DIR)) {
      continue;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }

  return null;
}

function serveStatic(reqPath, res) {
  if (isBlockedStaticPath(reqPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  const filePath = resolveStaticFile(reqPath);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error.code === 'ENOENT' ? '404 Not Found' : '500 Internal Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });

    if (ext === '.html') {
      res.end(injectHtmlEnhancements(content.toString('utf8'), reqPath));
      return;
    }

    res.end(content);
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    const pathname = requestUrl.pathname;

    if (req.method === 'OPTIONS') {
      sendJson(res, 200, {});
      return;
    }

    if (pathname.startsWith('/api/')) {
      try {
        const query = Object.fromEntries(requestUrl.searchParams.entries());
        const body = req.method === 'GET' || req.method === 'DELETE' ? null : await readRequestBody(req);
        const result = await handleApiRequest({
          method: req.method,
          pathname,
          query,
          body
        });
        sendJson(res, result.statusCode, result.payload);
      } catch (error) {
        sendJson(res, error.statusCode || 500, { error: error.message });
      }
      return;
    }

    serveStatic(pathname, res);
  });
}

if (require.main === module) {
  const server = createServer();

  server.listen(PORT, HOST, async () => {
    const { districts, schools, policies, news } = await loadDataStore();
    console.log('考哪去后端服务已启动');
    console.log(`地址: http://${HOST}:${PORT}`);
    console.log(`数据: ${districts.length} 个区, ${schools.length} 所学校, ${policies.length} 条政策, ${news.length} 条新闻`);
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

module.exports = {
  createServer
};
