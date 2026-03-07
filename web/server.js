#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const SITE_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, '..', 'data');
const BLOCKED_PATH_PREFIXES = ['/api/', '/data/', '/crawler/', '/shared/', '/scripts/', '/web/'];
const BLOCKED_EXACT_PATHS = ['/api', '/data', '/crawler', '/shared', '/scripts', '/web', '/package.json', '/vercel.json'];

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

function loadData() {
  return {
    districts: readJson('districts.json'),
    schools: readJson('schools.json'),
    policies: readJson('policies.json'),
    news: readJson('news.json')
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(payload));
}

function isBlockedStaticPath(reqPath) {
  return BLOCKED_EXACT_PATHS.includes(reqPath)
    || BLOCKED_PATH_PREFIXES.some((prefix) => reqPath.startsWith(prefix))
    || path.basename(reqPath).startsWith('.');
}

function resolveStaticFile(reqPath) {
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
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

function createServer() {
  return http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    const pathname = requestUrl.pathname;

    if (req.method === 'OPTIONS') {
      sendJson(res, 200, {});
      return;
    }

    if (pathname.startsWith('/api/')) {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }

      try {
        const { districts, schools, policies, news } = loadData();
        const districtId = requestUrl.searchParams.get('district');
        const query = (requestUrl.searchParams.get('q') || '').trim().toLowerCase();

        if (pathname === '/api/districts') {
          sendJson(res, 200, districts);
          return;
        }

        if (pathname === '/api/schools') {
          const results = districtId ? schools.filter((school) => school.districtId === districtId) : schools;
          sendJson(res, 200, results);
          return;
        }

        if (pathname === '/api/policies') {
          const results = districtId && districtId !== 'all'
            ? policies.filter((policy) => policy.districtId === 'all' || policy.districtId === districtId)
            : policies;
          sendJson(res, 200, results);
          return;
        }

        if (pathname === '/api/news') {
          sendJson(res, 200, news);
          return;
        }

        if (pathname === '/api/search') {
          const results = !query ? schools : schools.filter((school) => {
            const haystack = [
              school.name,
              school.districtName,
              school.schoolStageLabel,
              school.schoolTypeLabel,
              school.tier,
              school.address,
              school.admissionNotes,
              ...(school.features || []),
              ...(school.tags || [])
            ].join(' ').toLowerCase();
            return haystack.includes(query);
          });

          sendJson(res, 200, results);
          return;
        }

        sendJson(res, 404, { error: 'API endpoint not found' });
      } catch (error) {
        sendJson(res, 500, { error: error.message });
      }
      return;
    }

    serveStatic(pathname, res);
  });
}

if (require.main === module) {
  const server = createServer();

  server.listen(PORT, HOST, () => {
    const { districts, schools, policies, news } = loadData();
    console.log('考哪去 MVP 已启动');
    console.log(`地址: http://${HOST}:${PORT}`);
    console.log(`数据: ${districts.length} 个区, ${schools.length} 所学校, ${policies.length} 条政策, ${news.length} 条新闻`);
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

module.exports = {
  createServer,
  loadData
};
