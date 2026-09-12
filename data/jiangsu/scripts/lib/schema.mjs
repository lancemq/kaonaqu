// 江苏资料库共享 schema 常量与校验（ESM，零依赖）。
// 词表与 shared/data-store.js 的 rowToSchool/schoolToRow、shared/region-config.js 严格对齐；
// slug 规则与 shared/data-schema.js 的 slugify 对齐（createSchool 用 slugify(`${districtId}-${name}`)）。

export const STAGE_LABELS = ['初中', '完全中学', '高中'];
export const PROPERTY_LABELS = ['公办', '民办', '外籍', '中外合作'];
export const KEY_LEVELS = [
  '市重点(高中)',
  '区重点(高中)',
  '顶级公办(初中)',
  '顶级民办(初中)',
  '强公办(初中)',
  '强民办(初中)',
  '一般高中',
  '一般初中'
];
export const STAR_LEVELS = ['四星级', '三星级', '二星级', '一星级'];
// features 数组中的星级完整词形（与 lib/school-taxonomy.js:deriveSchoolStar 的派生口径一致）
export const STAR_FEATURES = [
  '江苏省四星级普通高中',
  '江苏省三星级普通高中',
  '江苏省二星级普通高中',
  '江苏省一星级普通高中'
];
export const PROFILE_DEPTHS = ['foundation', 'enhanced'];
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'];

export const CITY_SLUGS = [
  'nanjing', 'wuxi', 'xuzhou', 'changzhou', 'suzhou',
  'nantong', 'lianyungang', 'huaian', 'yancheng', 'yangzhou',
  'zhenjiang', 'taizhou', 'suqian'
];

// 与 shared/data-schema.js:slugify 逐字符对齐
export function slugify(value) {
  return String(value === undefined || value === null ? '' : value)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// makeSlug(districtId, nameOrSlug)：nameOrSlug 传拼音/语义 slug（如 "nanjing-fls"）。
// 注意：shared slugify 不做中文转拼音，直接传中文校名会得到含中文的 slug；
// 资料库约定人工给语义 slug，validateSchool 只要求 slug === slugify(`${districtId}-${nameSlug}`) 形态。
export function makeSlug(districtId, nameSlug) {
  return slugify(`${districtId}-${nameSlug}`);
}

const STR = (v) => typeof v === 'string';

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

// validateSchool(obj, ctx)：ctx 可选 { citySlug, districtIds }，用于 region 与区县校验。
// 返回 issue 字符串数组（'字段: 问题'），空数组 = 通过。
export function validateSchool(obj, ctx = {}) {
  const issues = [];
  if (!isPlainObject(obj)) {
    return ['root: 记录必须是 JSON 对象'];
  }

  // --- 必填 ---
  for (const field of ['slug', 'name', 'region', 'districtName', 'schoolStageLabel', 'schoolPropertyLabel', 'schoolKeyLevel']) {
    if (!(field in obj) || !STR(obj[field]) || !obj[field].trim()) {
      issues.push(`${field}: 必填字符串缺失`);
    }
  }

  // --- slug 形态 ---
  if (STR(obj.slug)) {
    if (!/^[a-z0-9\u4e00-\u9fa5-]+$/.test(obj.slug)) {
      issues.push('slug: 只允许小写字母/数字/中文/连字符');
    }
    if (obj.slug.length > 80) issues.push('slug: 长度超过 80');
    if (ctx.districtIds && ctx.districtIds.length) {
      const prefix = ctx.districtIds.find((id) => obj.slug.startsWith(`${id}-`));
      if (!prefix) issues.push('slug: 未以任何 districtId 开头（${districtId}-...）');
    }
  }

  // --- region / 词表 ---
  if (obj.region && !CITY_SLUGS.includes(obj.region)) {
    issues.push(`region: "${obj.region}" 不在 13 市 slug 词表内`);
  }
  if (ctx.citySlug && obj.region !== ctx.citySlug) {
    issues.push(`region: 应等于所在市 slug "${ctx.citySlug}"`);
  }
  if (!STAGE_LABELS.includes(obj.schoolStageLabel)) {
    issues.push(`schoolStageLabel: 必须是 ${STAGE_LABELS.join('/')} 之一`);
  }
  if (!PROPERTY_LABELS.includes(obj.schoolPropertyLabel)) {
    issues.push(`schoolPropertyLabel: 必须是 ${PROPERTY_LABELS.join('/')} 之一`);
  }
  if (!KEY_LEVELS.includes(obj.schoolKeyLevel)) {
    issues.push(`schoolKeyLevel: 必须是 8 值词表之一（${KEY_LEVELS.join('/')}）`);
  }
  if (obj.eliteCohort !== undefined && obj.eliteCohort !== '') {
    issues.push('eliteCohort: 江苏不使用精英梯队，必须留空字符串');
  }
  if (obj.profileDepth !== undefined && !PROFILE_DEPTHS.includes(obj.profileDepth)) {
    issues.push(`profileDepth: 必须是 ${PROFILE_DEPTHS.join('/')} 之一`);
  }
  if (obj.foundingYear !== undefined && obj.foundingYear !== null && !Number.isInteger(obj.foundingYear)) {
    issues.push('foundingYear: 必须是整数或 null');
  }
  for (const field of ['isBoarding', 'isInternational', 'infoVerified']) {
    if (obj[field] !== undefined && typeof obj[field] !== 'boolean') {
      issues.push(`${field}: 必须是布尔值`);
    }
  }
  for (const field of ['group', 'address', 'phone', 'website', 'image']) {
    if (obj[field] !== undefined && !STR(obj[field])) {
      issues.push(`${field}: 必须是字符串（未知留空字符串）`);
    }
  }

  // --- districtName 在该市区目录内 ---
  if (ctx.districtNames && ctx.districtNames.length && !ctx.districtNames.includes(obj.districtName)) {
    issues.push(`districtName: "${obj.districtName}" 不在该市 districtCatalog 内`);
  }

  // --- 数组字段 ---
  for (const field of ['features', 'content']) {
    if (obj[field] !== undefined && !Array.isArray(obj[field])) {
      issues.push(`${field}: 必须是数组`);
    }
  }

  // --- admissionInfo ---
  if (obj.admissionInfo !== undefined) {
    const ai = obj.admissionInfo;
    if (!isPlainObject(ai)) {
      issues.push('admissionInfo: 必须是对象');
    } else {
      for (const key of ['code', 'methods', 'routes', 'notes']) {
        if (!(key in ai)) issues.push(`admissionInfo.${key}: 缺失`);
      }
      if (ai.code !== undefined && !STR(ai.code)) issues.push('admissionInfo.code: 必须是字符串');
      for (const key of ['methods', 'routes']) {
        if (ai[key] !== undefined && !Array.isArray(ai[key])) issues.push(`admissionInfo.${key}: 必须是数组`);
      }
      if (ai.notes !== undefined && !STR(ai.notes)) issues.push('admissionInfo.notes: 必须是字符串');
    }
  }

  // --- scoreLines：year 为字符串且不重复 ---
  if (obj.scoreLines !== undefined) {
    if (!Array.isArray(obj.scoreLines)) {
      issues.push('scoreLines: 必须是数组');
    } else {
      const seen = new Set();
      obj.scoreLines.forEach((line, i) => {
        const at = `scoreLines[${i}]`;
        if (!isPlainObject(line)) {
          issues.push(`${at}: 必须是对象`);
          return;
        }
        if (!STR(line.year) || !/^\d{4}$/.test(line.year)) issues.push(`${at}.year: 必须是 4 位年份字符串`);
        if (line.score === undefined || line.score === null || !STR(line.score)) issues.push(`${at}.score: 必须是非空字符串`);
        if (STR(line.year)) {
          if (seen.has(line.year)) issues.push(`${at}.year: 年份 ${line.year} 重复`);
          seen.add(line.year);
        }
        for (const key of ['plan', 'note']) {
          if (line[key] !== undefined && !STR(line[key])) issues.push(`${at}.${key}: 必须是字符串`);
        }
        const extra = Object.keys(line).filter((k) => !['year', 'score', 'plan', 'note'].includes(k));
        if (extra.length) issues.push(`${at}: 含未知字段 ${extra.join(',')}`);
      });
    }
  }

  // --- outcomeStats ---
  if (obj.outcomeStats !== undefined) {
    if (!Array.isArray(obj.outcomeStats)) {
      issues.push('outcomeStats: 必须是数组');
    } else {
      obj.outcomeStats.forEach((stat, i) => {
        const at = `outcomeStats[${i}]`;
        if (!isPlainObject(stat)) {
          issues.push(`${at}: 必须是对象`);
          return;
        }
        for (const key of ['year', 'exam', 'kind', 'verified', 'source']) {
          if (!(key in stat)) issues.push(`${at}.${key}: 缺失`);
        }
        if (!Number.isInteger(stat.year)) issues.push(`${at}.year: 必须是整数`);
        if (stat.exam !== undefined && !['中考', '高考'].includes(stat.exam)) issues.push(`${at}.exam: 只允许 中考/高考`);
        if (stat.kind !== undefined && !['综评', '喜报'].includes(stat.kind)) issues.push(`${at}.kind: 只允许 综评/喜报`);
        if (stat.verified !== undefined && typeof stat.verified !== 'boolean') issues.push(`${at}.verified: 必须是布尔值`);
        if (stat.source !== undefined && !STR(stat.source)) issues.push(`${at}.source: 必须是字符串`);
        if (stat.metrics !== undefined && !isPlainObject(stat.metrics)) issues.push(`${at}.metrics: 必须是对象`);
      });
    }
  }

  // --- source 溯源（资料库必备）---
  if (!isPlainObject(obj.source)) {
    issues.push('source: 必须包含 {url, crawledAt, confidence}');
  } else {
    if (!STR(obj.source.url) || !obj.source.url.trim()) issues.push('source.url: 必填');
    if (!STR(obj.source.crawledAt) || !/^\d{4}-\d{2}-\d{2}$/.test(obj.source.crawledAt)) {
      issues.push('source.crawledAt: 必须是 YYYY-MM-DD');
    }
    if (!CONFIDENCE_LEVELS.includes(obj.source.confidence)) {
      issues.push('source.confidence: 必须是 high/medium/low');
    }
  }

  return issues;
}

// 星级派生（与 features 词形对应，供列表展示用）
export function deriveStar(school) {
  const list = Array.isArray(school?.features) ? school.features : [];
  const hit = STAR_FEATURES.find((f) => list.includes(f));
  return hit ? hit.replace('江苏省', '').replace('普通高中', '') : '';
}
