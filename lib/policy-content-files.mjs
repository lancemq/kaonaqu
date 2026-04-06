import fs from 'fs';
import path from 'path';
import { readNewsMarkdownFile } from './news-content-files.mjs';
import { getPolicyMappedNewsId } from './policy-detail.js';

const POLICY_CONTENT_DIR = path.join(process.cwd(), 'content', 'policies');

function cleanPolicyText(text, title = '') {
  let value = String(text || '').trim();
  if (!value) return '';

  value = value
    .replace(/无障碍 首页[\s\S]*?内容概述\s*/g, '')
    .replace(/索取号：[^。]*?/g, '')
    .replace(/发布日期：\d{4}-\d{2}-\d{2}/g, '')
    .replace(/字体 \[ 大 中 小 ]/g, '')
    .replace(/查阅全文[\s\S]*$/g, '')
    .replace(/\[返回上一页][\s\S]*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (title && value.startsWith(title)) {
    value = value.slice(title.length).trim();
  }

  return value;
}

export function getPolicyContentRelativePath(id) {
  return `content/policies/${String(id || '').trim()}.md`;
}

export function getPolicyContentAbsolutePath(itemOrId) {
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
  const explicitPath = typeof itemOrId === 'object' && itemOrId?.contentFile
    ? itemOrId.contentFile
    : getPolicyContentRelativePath(id);
  return path.join(process.cwd(), explicitPath);
}

export function buildPolicyMarkdown(item, relatedNews = []) {
  const mappedNewsId = getPolicyMappedNewsId(item);
  const mappedNews = mappedNewsId ? relatedNews.find((entry) => entry.id === mappedNewsId) : null;
  const mappedMarkdown = mappedNews ? readNewsMarkdownFile(mappedNews) : null;

  if (mappedMarkdown) {
    return mappedMarkdown.trim();
  }

  const summary = cleanPolicyText(item?.summary, item?.title) || '这是一份与上海升学相关的政策文件，适合和对应阶段的通知、报名安排和时间线一起看。';
  const contentText = cleanPolicyText(item?.content, item?.title);
  const paragraphs = contentText
    .split(/(?<=。|；)/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 8);
  const sourceName = item?.source?.name || '官方来源';

  const blocks = [
    '## 政策概览',
    summary,
    '',
    '## 核心内容',
    ...(paragraphs.length ? paragraphs : ['当前只整理到摘要层，建议结合官方原文和对应专题页继续交叉阅读。']),
    '',
    '## 阅读提示',
    item?.title?.includes('招生')
      ? '先确认适用对象、资格条件和操作顺序，再去看学校方案或单条新闻提醒。'
      : '先确认这份文件处于哪一个阶段，再核对时间、资格、学校执行办法和后续通知。',
    '',
    '## 官方原文',
    item?.source?.url ? `[${sourceName}](${item.source.url})` : sourceName
  ];

  return blocks.join('\n').trim();
}

export function writePolicyMarkdownFiles(policies = [], relatedNews = []) {
  fs.mkdirSync(POLICY_CONTENT_DIR, { recursive: true });
  const expected = new Set();

  for (const item of policies) {
    if (!item?.id) continue;
    const markdown = buildPolicyMarkdown(item, relatedNews);
    if (!markdown) continue;
    const filePath = getPolicyContentAbsolutePath(item);
    expected.add(path.basename(filePath));
    fs.writeFileSync(filePath, `${markdown}\n`, 'utf8');
  }

  for (const fileName of fs.readdirSync(POLICY_CONTENT_DIR)) {
    if (!fileName.endsWith('.md')) continue;
    if (!expected.has(fileName)) {
      fs.unlinkSync(path.join(POLICY_CONTENT_DIR, fileName));
    }
  }
}

export function readPolicyMarkdownFile(itemOrId) {
  const filePath = getPolicyContentAbsolutePath(itemOrId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

export function validatePolicyMarkdownFiles(policies = []) {
  const missing = [];

  for (const item of policies) {
    if (!item?.id) continue;
    const filePath = getPolicyContentAbsolutePath(item);
    if (!fs.existsSync(filePath)) {
      missing.push({ id: item.id, filePath });
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
      missing.push({ id: item.id, filePath });
    }
  }

  if (missing.length) {
    const details = missing.map((item) => `${item.id} -> ${item.filePath}`).join('\n');
    throw new Error(`Missing policy markdown files:\n${details}`);
  }

  return true;
}
