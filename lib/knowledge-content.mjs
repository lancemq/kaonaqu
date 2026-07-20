import fs from 'node:fs/promises';
import path from 'node:path';
import { knowledgeStructuredPages } from './knowledge-structured-data.mjs';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'content', 'knowledge');
const INDEX_PATH = path.join(KNOWLEDGE_DIR, '_index.json');

const SLUG_LABELS = {
  'index': '知识体系',
  'grade-7': '七年级',
  'grade-8': '八年级',
  'grade-9': '九年级',
  'senior-1': '高一',
  'senior-2': '高二',
  'senior-3': '高三',
  'chinese-senior1': '高一语文知识点',
  'math-senior1': '高一数学知识点',
  'english-senior1': '高一英语知识点',
  'physics-senior1': '高一物理知识点',
  'chemistry-senior1': '高一化学知识点',
  'biology-senior1': '高一生物知识点',
  'chinese-senior2': '高二语文知识点',
  'math-senior2': '高二数学知识点',
  'english-senior2': '高二英语知识点',
  'physics-senior2': '高二物理知识点',
  'chemistry-senior2': '高二化学知识点',
  'biology-senior2': '高二生物知识点',
  'chinese-senior3': '高三语文知识点',
  'math-senior3': '高三数学知识点',
  'english-senior3': '高三英语知识点',
  'physics-senior3': '高三物理知识点',
  'chemistry-senior3': '高三化学知识点',
  'biology-senior3': '高三生物知识点',
  'chinese-grade7': '七年级语文知识点',
  'math-grade7': '七年级数学知识点',
  'english-grade7': '七年级英语知识点',
  'science-grade7': '七年级科学与综合',
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

let manifestPromise;

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

const GRADE_TOKENS = ['senior3', 'senior2', 'senior1', 'grade9', 'grade8', 'grade7'];

const GRADE_LABELS = {
  grade7: '七年级',
  grade8: '八年级',
  grade9: '九年级',
  senior1: '高一',
  senior2: '高二',
  senior3: '高三'
};

// Parse a subject-page slug like `math-grade8` / `physics-grade8-plan` into
// its subject + grade tokens. Grade pages (`grade-8`, `senior-1`) are excluded
// because their slug uses a hyphen and is handled as a different page kind.
function parseSubjectGrade(slug) {
  for (const g of GRADE_TOKENS) {
    if (slug.includes(`-${g}`) || slug === g || slug.startsWith(`${g}-`)) {
      const subject = slug
        .replace(`${g}-plan`, '')
        .replace(`-${g}`, '')
        .replace(g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return { subject: subject || null, grade: g };
    }
  }
  return { subject: null, grade: null };
}

// Compute real "related" pages from the manifest: same subject other grades
// first, then same grade other subjects. Returns slugs that actually exist.
function getRelatedSlugs(slug, keys) {
  const { subject, grade } = parseSubjectGrade(slug);
  if (!subject || !grade) return [];
  const isSubjectPage = (k) => {
    const p = parseSubjectGrade(k);
    return Boolean(p.subject && p.grade);
  };
  const sameSubject = keys.filter(
    (k) => k !== slug && isSubjectPage(k) && parseSubjectGrade(k).subject === subject && parseSubjectGrade(k).grade !== grade
  );
  const sameGrade = keys.filter(
    (k) => k !== slug && isSubjectPage(k) && parseSubjectGrade(k).grade === grade && parseSubjectGrade(k).subject !== subject
  );
  return [...sameSubject, ...sameGrade].slice(0, 6);
}

function buildRelatedPages(slug, manifest) {
  if (!slug || slug === 'index') return [];
  const keys = Object.keys(manifest || {});
  return getRelatedSlugs(slug, keys).map((k) => ({
    slug: k,
    href: k === 'index' ? '/knowledge' : `/knowledge/${k}`,
    label: SLUG_LABELS[k] || fallbackLabel(k)
  }));
}

function buildKeywords(slug) {
  const label = SLUG_LABELS[slug] || fallbackLabel(slug);
  const { grade } = parseSubjectGrade(slug);
  const gradeLabel = GRADE_LABELS[grade] || '';
  return [...new Set([label, gradeLabel, '上海', '知识点', '考哪去'].filter(Boolean))];
}

// Produce schema.org JSON-LD blocks for a knowledge page. Subject (detail)
// pages get an Article + BreadcrumbList; channel/grade pages get a WebPage +
// BreadcrumbList. Returns an array so the route can emit one <script> per block.
export function buildKnowledgeJsonLd(page) {
  const BASE = 'https://kaonaqu.xyz';
  const url = BASE + (page.href || `/knowledge/${page.slug}`);
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (page.breadcrumbItems || []).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.label,
      ...(b.href ? { item: BASE + b.href } : {})
    }))
  };

  if (page.renderMode === 'structured') {
    return [
      { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, url, breadcrumb },
      breadcrumb
    ];
  }

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.description,
    author: { '@type': 'Organization', name: '考哪去', url: BASE },
    publisher: { '@type': 'Organization', name: '考哪去', url: BASE },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    dateModified: new Date().toISOString()
  };
  return [article, breadcrumb];
}

async function getPagesManifest() {
  if (!manifestPromise) {
    manifestPromise = fs.readFile(INDEX_PATH, 'utf8').then(JSON.parse).catch(() => ({}));
  }
  return manifestPromise;
}

export async function getKnowledgePage(slug = []) {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return null;

  const manifest = await getPagesManifest();
  const filename = manifest[normalizedSlug];
  if (!filename) return null;

  try {
    const content = await fs.readFile(path.join(KNOWLEDGE_DIR, filename), 'utf8');
    const sourcePage = JSON.parse(content);
    if (!sourcePage) return null;

    const structuredPage = knowledgeStructuredPages[normalizedSlug];
    const href = sourcePage.href || (normalizedSlug === 'index' ? '/knowledge' : `/knowledge/${normalizedSlug}`);
    const title = sourcePage.title || `${fallbackLabel(normalizedSlug)} | 考哪去`;
    const description = sourcePage.description || '考哪去知识体系频道，按学段、年级和学科整理学习内容。';
    const isStructured = Boolean(structuredPage);

    return {
      slug: normalizedSlug,
      href,
      title,
      description,
      renderMode: isStructured ? 'structured' : 'rich',
      contentHtml: '',
      richBlocks: isStructured ? [] : (sourcePage.richBlocks || []),
      ...structuredPage,
      breadcrumbItems: sourcePage.breadcrumbItems?.length ? sourcePage.breadcrumbItems : fallbackBreadcrumbItems(normalizedSlug),
      relatedPages: isStructured ? [] : buildRelatedPages(normalizedSlug, manifest),
      keywords: buildKeywords(normalizedSlug)
    };
  } catch {
    return null;
  }
}

export async function listKnowledgeSlugs() {
  const manifest = await getPagesManifest();
  return Object.keys(manifest)
    .map((slug) => ({ slug: slug === 'index' ? [] : [slug] }))
    .sort((a, b) => a.slug.join('/').localeCompare(b.slug.join('/')));
}
