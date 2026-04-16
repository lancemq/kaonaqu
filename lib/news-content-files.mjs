import fs from 'fs';
import path from 'path';

const NEWS_CONTENT_DIR = path.join(process.cwd(), 'content', 'news');
const NEWS_CONTENT_TYPES = new Set(['policy', 'guide', 'admission', 'exam', 'school']);

function getNewsContentType(itemOrId) {
  if (typeof itemOrId === 'object' && itemOrId?.newsType && NEWS_CONTENT_TYPES.has(itemOrId.newsType)) {
    return itemOrId.newsType;
  }

  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
  const prefix = String(id || '').split('-')[0];
  return NEWS_CONTENT_TYPES.has(prefix) ? prefix : 'uncategorized';
}

export function getNewsContentRelativePath(itemOrId) {
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
  const type = getNewsContentType(itemOrId);
  return `content/news/${type}/${String(id || '').trim()}.md`;
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
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    expected.add(path.relative(NEWS_CONTENT_DIR, filePath));
    fs.writeFileSync(filePath, `${markdown}\n`, 'utf8');
  }

  for (const dirent of fs.readdirSync(NEWS_CONTENT_DIR, { withFileTypes: true })) {
    if (dirent.isFile() && dirent.name.endsWith('.md') && !expected.has(dirent.name)) {
      fs.unlinkSync(path.join(NEWS_CONTENT_DIR, dirent.name));
      continue;
    }
    if (!dirent.isDirectory()) continue;
    for (const fileName of fs.readdirSync(path.join(NEWS_CONTENT_DIR, dirent.name))) {
      if (!fileName.endsWith('.md')) continue;
      const relativePath = path.join(dirent.name, fileName);
      if (!expected.has(relativePath)) {
        fs.unlinkSync(path.join(NEWS_CONTENT_DIR, relativePath));
      }
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
