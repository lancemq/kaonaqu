import fs from 'node:fs/promises';
import path from 'node:path';
import { knowledgeStructuredPages } from './knowledge-structured-data.mjs';
import { SUBJECT_LABELS, GRADE_LABELS } from './knowledge-labels.mjs';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'content', 'knowledge');

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
  'science-grade7': '七年级科学与综合'
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

export { SUBJECT_LABELS, GRADE_LABELS };

// Intended subject x grade matrix. Any combination NOT present in the manifest
// is rendered as a "筹备中" placeholder so coverage gaps are visible and consistent.
const SUBJECT_ORDER = ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'history', 'politics', 'science', 'geography'];
const GRADE_ORDER = ['grade6', 'grade7', 'grade8', 'grade9', 'senior1', 'senior2', 'senior3'];

const GRADE_NAV = {
  grade6: { label: '六年级', desc: '小升初衔接 · 基础巩固', disabled: true },
  grade7: { label: '七年级', desc: '能力提升 · 拓展思维' },
  grade8: { label: '八年级', desc: '关键学年 · 备战中考' },
  grade9: { label: '九年级', desc: '中考冲刺 · 全面复习' },
  senior1: { label: '高一', desc: '选科规划 · 打好基础' },
  senior2: { label: '高二', desc: '深化学习 · 备战等级考' },
  senior3: { label: '高三', desc: '高考冲刺 · 志愿指导' }
};

// Single source of truth for grade quick-links (used by the knowledge detail
// sidebar fallback). Replaces the duplicated GRADE_RIBBON constant that used to
// live in the page component.
export function getGradeQuickLinks() {
  return GRADE_ORDER.map((g) => ({
    label: GRADE_NAV[g].label,
    href: gradeHref(g),
    disabled: Boolean(GRADE_NAV[g].disabled)
  }));
}

// Curated one-line blurbs per subject+grade (ported from the old hardcoded
// explorer). Missing combos fall back to a generic label.
const SUBJECT_BLURBS = {
  'chinese-grade7': '记叙文 · 古诗文启蒙 · 写作训练',
  'math-grade7': '有理数 · 一元一次方程 · 几何基础',
  'english-grade7': '词汇积累 · 语法基础 · 听力口语',
  'physics-grade7': '科学探究 · 声光热入门 · 实验基础',
  'history-grade7': '中国古代史 · 朝代脉络 · 文明演进',
  'politics-grade7': '少年生活 · 规则意识 · 社会认知',
  'chinese-grade8': '文言文 · 现代文阅读 · 作文',
  'math-grade8': '一次函数 · 全等三角形 · 分式',
  'english-grade8': '完形填空 · 阅读理解 · 写作',
  'physics-grade8': '声光热 · 力学基础 · 实验探究',
  'chemistry-grade8': '物质变化 · 化学实验基础 · 分子原子',
  'history-grade8': '中国近现代史 · 材料分析',
  'politics-grade8': '宪法 · 权利义务 · 社会规则',
  'chinese-grade9': '中考阅读 · 作文 · 古诗文精讲',
  'math-grade9': '二次函数 · 圆 · 综合压轴',
  'english-grade9': '中考听力 · 阅读写作 · 真题',
  'physics-grade9': '电学 · 力学综合 · 实验探究',
  'chemistry-grade9': '方程式配平 · 物质推断 · 计算',
  'history-grade9': '中考专题 · 材料分析',
  'politics-grade9': '中考时政 · 答题模板',
  'chinese-senior1': '必修篇目 · 文言文 · 写作',
  'math-senior1': '函数 · 立体几何 · 集合逻辑',
  'english-senior1': '语法体系 · 阅读理解 · 写作',
  'physics-senior1': '运动 · 力 · 牛顿定律',
  'chemistry-senior1': '物质的量 · 氧化还原 · 实验',
  'biology-senior1': '细胞 · 遗传基础 · 生态',
  'chinese-senior2': '选择性必修 · 古诗文 · 写作',
  'math-senior2': '导数 · 数列 · 圆锥曲线',
  'english-senior2': '概要写作 · 翻译 · 阅读',
  'physics-senior2': '电磁学 · 光学 · 近代物理',
  'chemistry-senior2': '反应原理 · 有机化学 · 实验',
  'biology-senior2': '遗传变异 · 稳态调节 · 生态',
  'chinese-senior3': '高考专题 · 作文 · 古诗文',
  'math-senior3': '高考综合 · 压轴突破 · 真题',
  'english-senior3': '高考听力 · 阅读 · 写作',
  'physics-senior3': '高考综合 · 实验 · 压轴',
  'chemistry-senior3': '高考综合 · 有机推断 · 实验',
  'biology-senior3': '高考综合 · 遗传 · 实验'
};

function gradeHref(grade) {
  if (grade.startsWith('grade') && !grade.includes('-')) return `/knowledge/grade-${grade.slice(5)}`;
  if (grade.startsWith('senior')) return `/knowledge/senior-${grade.slice(6)}`;
  return `/knowledge/${grade}`;
}

// Build the grade x subject navigation entirely from the manifest + curated
// blurbs. Real pages become links; gaps become "筹备中" placeholders. This is
// the single source of truth for the channel explorer (replaces hardcoded data).
export async function buildKnowledgeNav() {
  const manifest = await getPagesManifest();
  const keys = Object.keys(manifest);
  const grades = GRADE_ORDER.map((g) => ({
    key: g,
    label: GRADE_NAV[g].label,
    desc: GRADE_NAV[g].desc,
    href: gradeHref(g),
    disabled: Boolean(GRADE_NAV[g].disabled)
  }));
  const subjectsByGrade = {};
  for (const grade of GRADE_ORDER) {
    subjectsByGrade[grade] = SUBJECT_ORDER.map((subject) => {
      const slug = `${subject}-${grade}`;
      const exists = keys.includes(slug);
      return {
        title: SUBJECT_LABELS[subject],
        desc: SUBJECT_BLURBS[slug] || `${SUBJECT_LABELS[subject]}核心知识点`,
        href: `/knowledge/${slug}`,
        slug,
        exists
      };
    });
  }
  return { grades, subjectsByGrade };
}

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

// Discover pages by scanning the knowledge directory instead of relying on a
// hand-maintained manifest (_index.json). New pages become available
// automatically; the manifest file no longer needs to be kept in sync.
async function getPagesManifest() {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      const files = await fs.readdir(KNOWLEDGE_DIR);
      const manifest = {};
      for (const filename of files) {
        if (!filename.endsWith('.json') || filename === '_index.json') continue;
        const slug = filename.slice(0, -'.json'.length);
        manifest[slug] = filename;
      }
      return manifest;
    })();
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
      subject: sourcePage.subject || parseSubjectGrade(normalizedSlug).subject || null,
      grade: sourcePage.grade || parseSubjectGrade(normalizedSlug).grade || null,
      category: sourcePage.category || (isStructured ? 'channel' : '学科知识点'),
      tags: sourcePage.tags || buildKeywords(normalizedSlug),
      summary: sourcePage.summary || description,
      updatedAt: sourcePage.updatedAt || null,
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
