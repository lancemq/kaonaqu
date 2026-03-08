#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { handleApiRequest } = require('../shared/api-router');
const { loadDataStore } = require('../shared/data-store');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const SITE_DIR = path.join(__dirname, '..');
const BLOCKED_PATH_PREFIXES = ['/api/', '/data/', '/crawler/', '/shared/', '/scripts/', '/web/'];
const BLOCKED_EXACT_PATHS = ['/api', '/data', '/crawler', '/shared', '/scripts', '/web', '/package.json', '/vercel.json'];

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

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
