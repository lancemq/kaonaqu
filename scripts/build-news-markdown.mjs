import fs from 'fs';
import path from 'path';
import { buildNewsMarkdown } from '../lib/news-markdown.mjs';
import { getNewsContentRelativePath, validateNewsMarkdownFiles, writeNewsMarkdownFiles } from '../lib/news-content-files.mjs';

const filePath = path.join(process.cwd(), 'data', 'news.json');
const raw = fs.readFileSync(filePath, 'utf8');
const news = JSON.parse(raw);

const enriched = news.map((item) => ({
  ...item,
  contentMd: buildNewsMarkdown(item),
  contentFile: getNewsContentRelativePath(item)
}));

writeNewsMarkdownFiles(enriched);
validateNewsMarkdownFiles(enriched);
const stored = enriched.map(({ contentMd, ...item }) => item);

fs.writeFileSync(filePath, `${JSON.stringify(stored, null, 2)}\n`);
console.log(JSON.stringify({ count: stored.length, withFiles: stored.filter((item) => item.contentFile).length }, null, 2));
