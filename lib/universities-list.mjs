// 高校列表数据组织（纯函数，server 专用）：筛选/排序/卡片投影。
// 对标 lib/schools-list-url.mjs + schools page.js 内联逻辑，但无 region 概念。

// 排序权重：双一流 > 985 > 211 > 强基 > 普通本科 > 专科
const TAG_WEIGHT = { '双一流': 100, '985': 90, '211': 80, '强基计划': 70 };

export const UNIVERSITIES_SORT_OPTIONS = [
  { value: 'priority', label: '综合排序' },
  { value: 'founding', label: '建校最早' },
  { value: 'name', label: '校名拼音' }
];

export function universityTagWeight(u) {
  let w = 0;
  for (const t of u.tags || []) w = Math.max(w, TAG_WEIGHT[t] || 0);
  if (w === 0) w = u.isUndergrad ? 30 : 10;
  return w;
}

export function filterUniversities(list, filters) {
  const q = (filters.query || '').trim().toLowerCase();
  return list.filter((u) => {
    if (filters.level !== 'all') {
      if (filters.level === 'undergrad' && !u.isUndergrad) return false;
      if (filters.level === 'juniorCollege' && u.isUndergrad) return false;
    }
    if (Array.isArray(filters.tags) && filters.tags.length) {
      // 多选 OR 语义（双一流/985/211 是交叉关系，AND 会互相排除）
      if (!filters.tags.some((t) => (u.tags || []).includes(t))) return false;
    }
    if (filters.province !== 'all' && u.province !== filters.province) return false;
    if (filters.nature !== 'all' && u.nature !== filters.nature) return false;
    if (filters.affiliation !== 'all' && u.affiliation !== filters.affiliation) return false;
    if (q) {
      const hay = [u.name, ...(u.aliases || []), u.province, u.city].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortUniversities(list, sort) {
  const arr = list.slice();
  switch (sort) {
    case 'founding':
      return arr.sort((a, b) => (Number(a.foundingYear) || 9999) - (Number(b.foundingYear) || 9999));
    case 'name':
      return arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh'));
    case 'priority':
    default:
      return arr.sort((a, b) => {
        const w = universityTagWeight(b) - universityTagWeight(a);
        if (w !== 0) return w;
        return String(a.name || '').localeCompare(String(b.name || ''), 'zh');
      });
  }
}

export function parseUniversityFilters(params) {
  return {
    level: typeof params?.level === 'string' ? params.level : 'all',
    tags: typeof params?.tags === 'string' ? params.tags.split(',').filter(Boolean) : [],
    province: typeof params?.province === 'string' ? params.province : 'all',
    nature: typeof params?.nature === 'string' ? params.nature : 'all',
    affiliation: typeof params?.affiliation === 'string' ? params.affiliation : 'all',
    sort: typeof params?.sort === 'string' ? params.sort : 'priority',
    query: typeof params?.query === 'string' ? params.query : ''
  };
}

// ============ 卡片投影（与 lib/school-content.js getSchoolOverview 同口径） ============
const OVERVIEW_HEADING = '学校概览';

function blockText(block) {
  if (!block) return '';
  if (typeof block.text === 'string') return block.text;
  if (Array.isArray(block.items)) return block.items.join(' ');
  return '';
}

// 概览文本：优先「学校概览」标题后的第一块，兜底任意 paragraph
export function getUniversityOverview(university) {
  const blocks = Array.isArray(university?.content) ? university.content : [];
  const idx = blocks.findIndex((b) => b?.type === 'heading' && String(b.text || '').trim() === OVERVIEW_HEADING);
  if (idx >= 0) {
    const text = blockText(blocks[idx + 1]).trim();
    if (text) return text;
  }
  const p = blocks.find((b) => b?.type === 'paragraph');
  return p ? blockText(p).trim() : '';
}

export function clipText(text, maxLength = 84) {
  const value = String(text || '').trim();
  if (!value || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

// 列表卡片所需字段（不含 content/audit 字段）
export function toUniversityCard(university) {
  const u = university || {};
  const overview = clipText(getUniversityOverview(u), 84);
  const aliasText = Array.isArray(u.aliases) && u.aliases.length
    ? `简称 ${u.aliases.slice(0, 3).join(' / ')}`
    : '';
  return {
    slug: u.slug,
    name: u.name,
    province: u.province || '',
    city: u.city || '',
    nature: u.nature || '',
    affiliation: u.affiliation || '',
    isUndergrad: u.isUndergrad !== false,
    tags: Array.isArray(u.tags) ? u.tags : [],
    foundingYear: u.foundingYear || null,
    positioning: overview || aliasText
  };
}

export function buildUniversitiesHref(path, filters, page) {
  const qs = new URLSearchParams();
  if (filters.level && filters.level !== 'all') qs.set('level', filters.level);
  if (Array.isArray(filters.tags) && filters.tags.length) qs.set('tags', filters.tags.join(','));
  if (filters.province && filters.province !== 'all') qs.set('province', filters.province);
  if (filters.nature && filters.nature !== 'all') qs.set('nature', filters.nature);
  if (filters.affiliation && filters.affiliation !== 'all') qs.set('affiliation', filters.affiliation);
  if (filters.query) qs.set('query', filters.query);
  if (filters.sort && filters.sort !== 'priority') qs.set('sort', filters.sort);
  if (page && page > 1) qs.set('page', String(page));
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}
