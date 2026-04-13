import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { knowledgeStructuredPages } from './knowledge-structured-data.mjs';

const KNOWLEDGE_ROOT = path.join(process.cwd(), 'knowledge');

const SLUG_LABELS = {
  'index': '知识体系',
  'grade-7': '七年级',
  'grade-8': '八年级',
  'grade-9': '九年级',
  'senior-1': '高一',
  'senior-2': '高二',
  'senior-3': '高三',
  'chinese-grade8': '语文知识点',
  'math-grade8': '数学知识点',
  'english-grade8': '英语知识点',
  'physics-grade8': '物理知识点',
  'chemistry-grade8': '化学知识点',
  'history-grade8': '历史知识点',
  'politics-grade8': '道德与法治知识点',
  'physics-grade8-plan': '物理学习计划',
  'physics': '物理',
  'physics-plan': '物理学习计划',
  'chemistry': '化学',
  'chinese': '语文',
  'math': '数学',
  'english': '英语',
  'history': '历史',
  'politics': '道德与法治'
};

function normalizeSlug(slug = []) {
  const segments = Array.isArray(slug) ? slug : [slug];
  if (!segments.length) return 'index';
  if (segments.some((segment) => segment === '..' || segment.includes('/') || segment.includes('\\'))) {
    return null;
  }
  const normalized = segments.join('/').replace(/\.html$/i, '');
  return normalized || 'index';
}

function resolveKnowledgeFile(normalizedSlug) {
  if (!normalizedSlug) return null;
  const fileName = normalizedSlug === 'index' ? 'index.html' : `${normalizedSlug}.html`;
  const filePath = path.normalize(path.join(KNOWLEDGE_ROOT, fileName));
  if (!filePath.startsWith(KNOWLEDGE_ROOT + path.sep)) {
    return null;
  }
  return filePath;
}

function compactWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function fallbackLabel(slug) {
  return SLUG_LABELS[slug] || slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function buildBreadcrumbItems(slug, $) {
  if (slug === 'index') {
    return [{ label: '知识体系' }];
  }

  const legacyItems = [];
  $('main .breadcrumb a, main .breadcrumb span').each((_, node) => {
    const label = compactWhitespace($(node).text());
    const href = $(node).attr('href');
    if (!label || label === '/' || label === '首页') return;
    if (label === '知识体系') {
      legacyItems.push({ label, href: '/knowledge' });
      return;
    }
    legacyItems.push(href ? { label, href } : { label });
  });

  if (legacyItems.length) {
    return legacyItems;
  }

  return [
    { label: '知识体系', href: '/knowledge' },
    { label: fallbackLabel(slug) }
  ];
}

function extractMainContent($) {
  const main = $('main.container').first().length ? $('main.container').first() : $('main').first();
  if (!main.length) return '';
  main.find('nav.breadcrumb, script, style').remove();
  return main.html()?.trim() || '';
}

export async function getKnowledgePage(slug = []) {
  const normalizedSlug = normalizeSlug(slug);
  const filePath = resolveKnowledgeFile(normalizedSlug);
  if (!filePath) return null;

  let html;
  try {
    html = await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }

  const $ = load(html);
  const title = compactWhitespace($('title').first().text()) || `${fallbackLabel(normalizedSlug)} | 考哪去`;
  const description = compactWhitespace($('meta[name="description"]').attr('content')) || '考哪去知识体系频道，按学段、年级和学科整理学习内容。';
  const contentHtml = extractMainContent($);
  const structuredPage = knowledgeStructuredPages[normalizedSlug];

  return {
    slug: normalizedSlug,
    href: normalizedSlug === 'index' ? '/knowledge' : `/knowledge/${normalizedSlug}`,
    title,
    description,
    renderMode: structuredPage ? 'structured' : 'html',
    contentHtml: structuredPage ? '' : contentHtml,
    ...structuredPage,
    breadcrumbItems: buildBreadcrumbItems(normalizedSlug, $)
  };
}

export async function listKnowledgeSlugs() {
  const entries = await fs.readdir(KNOWLEDGE_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => {
      const slug = entry.name === 'index.html' ? [] : [entry.name.replace(/\.html$/i, '')];
      return { slug };
    })
    .sort((a, b) => a.slug.join('/').localeCompare(b.slug.join('/')));
}
