import fs from 'node:fs/promises';
import path from 'node:path';
import { knowledgeStructuredPages } from './knowledge-structured-data.mjs';

const KNOWLEDGE_DATA_PATH = path.join(process.cwd(), 'data', 'knowledge-pages.json');

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
  'chinese-grade9': '九年级语文知识点',
  'math-grade9': '九年级数学知识点',
  'english-grade9': '九年级英语知识点',
  'physics-grade9': '九年级物理知识点',
  'chemistry-grade9': '九年级化学知识点',
  'history-grade9': '九年级历史知识点',
  'politics-grade9': '九年级道德与法治知识点',
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

let knowledgeDataPromise;

function normalizeSlug(slug = []) {
  const segments = Array.isArray(slug) ? slug : [slug];
  if (!segments.length) return 'index';
  if (segments.some((segment) => segment === '..' || segment.includes('/') || segment.includes('\\'))) {
    return null;
  }
  const normalized = segments.join('/').replace(/\.html$/i, '');
  return normalized || 'index';
}

function fallbackLabel(slug) {
  return SLUG_LABELS[slug] || slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function fallbackBreadcrumbItems(slug) {
  if (slug === 'index') return [{ label: '知识体系' }];
  return [{ label: '知识体系', href: '/knowledge' }, { label: fallbackLabel(slug) }];
}

async function loadKnowledgeData() {
  if (!knowledgeDataPromise) {
    knowledgeDataPromise = fs.readFile(KNOWLEDGE_DATA_PATH, 'utf8').then((content) => JSON.parse(content));
  }
  return knowledgeDataPromise;
}

export async function getKnowledgePage(slug = []) {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return null;

  const data = await loadKnowledgeData();
  const sourcePage = data.pages?.[normalizedSlug];
  if (!sourcePage) return null;

  const structuredPage = knowledgeStructuredPages[normalizedSlug];
  const href = sourcePage.href || (normalizedSlug === 'index' ? '/knowledge' : `/knowledge/${normalizedSlug}`);
  const title = sourcePage.title || `${fallbackLabel(normalizedSlug)} | 考哪去`;
  const description = sourcePage.description || '考哪去知识体系频道，按学段、年级和学科整理学习内容。';

  return {
    slug: normalizedSlug,
    href,
    title,
    description,
    renderMode: structuredPage ? 'structured' : 'rich',
    contentHtml: '',
    richBlocks: structuredPage ? [] : (sourcePage.richBlocks || []),
    ...structuredPage,
    breadcrumbItems: sourcePage.breadcrumbItems?.length ? sourcePage.breadcrumbItems : fallbackBreadcrumbItems(normalizedSlug)
  };
}

export async function listKnowledgeSlugs() {
  const data = await loadKnowledgeData();
  return Object.keys(data.pages || {})
    .map((slug) => ({ slug: slug === 'index' ? [] : [slug] }))
    .sort((a, b) => a.slug.join('/').localeCompare(b.slug.join('/')));
}
