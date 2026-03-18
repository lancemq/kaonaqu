import { NextResponse } from 'next/server';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const fs = require('fs').promises;
const path = require('path');
const ROOT = path.join(process.cwd(), 'knowledge');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

async function resolveFile(slug = []) {
  const relativeBase = slug.length ? slug.join('/') : 'index';
  const candidates = [relativeBase];

  if (!path.extname(relativeBase)) {
    candidates.push(`${relativeBase}.html`);
    candidates.push(path.join(relativeBase, 'index.html'));
  }

  for (const candidate of candidates) {
    const filePath = path.normalize(path.join(ROOT, candidate));
    if (!filePath.startsWith(ROOT)) {
      continue;
    }

    try {
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        return filePath;
      }
    } catch {}
  }

  return null;
}

export async function GET(request, { params }) {
  const filePath = await resolveFile((await params).slug || []);
  if (!filePath) {
    return new NextResponse('404 Not Found', { status: 404 });
  }

  const content = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
    }
  });
}
