import fs from 'fs';
import path from 'path';

const NEWS_CONTENT_DIR = path.join(process.cwd(), 'content', 'news');

export function getNewsContentRelativePath(id) {
  return `content/news/${String(id || '').trim()}.md`;
}

export function getNewsContentAbsolutePath(itemOrId) {
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
  const explicitPath = typeof itemOrId === 'object' && itemOrId?.contentFile ? itemOrId.contentFile : getNewsContentRelativePath(id);
  return path.join(process.cwd(), explicitPath);
}

export function writeNewsMarkdownFiles(news = []) {
  fs.mkdirSync(NEWS_CONTENT_DIR, { recursive: true });
  const expected = new Set();

  for (const item of news) {
    const markdown = String(item?.contentMd || '').trim();
    if (!item?.id || !markdown) continue;
    const filePath = getNewsContentAbsolutePath(item);
    expected.add(path.basename(filePath));
    fs.writeFileSync(filePath, `${markdown}\n`, 'utf8');
  }

  for (const fileName of fs.readdirSync(NEWS_CONTENT_DIR)) {
    if (!fileName.endsWith('.md')) continue;
    if (!expected.has(fileName)) {
      fs.unlinkSync(path.join(NEWS_CONTENT_DIR, fileName));
    }
  }
}

export function readNewsMarkdownFile(itemOrId) {
  const filePath = getNewsContentAbsolutePath(itemOrId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

export function validateNewsMarkdownFiles(news = []) {
  const missing = [];

  for (const item of news) {
    if (!item?.id) continue;
    const filePath = getNewsContentAbsolutePath(item);
    if (!fs.existsSync(filePath)) {
      missing.push({
        id: item.id,
        filePath
      });
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
      missing.push({
        id: item.id,
        filePath
      });
    }
  }

  if (missing.length) {
    const details = missing.map((item) => `${item.id} -> ${item.filePath}`).join('\n');
    throw new Error(`Missing news markdown files:\n${details}`);
  }

  return true;
}
