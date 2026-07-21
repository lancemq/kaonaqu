// 估分择校匹配引擎
// 输入"分数 + 区域 + 考试类型"，按参考区间给出冲刺/匹配/保底三档可填报高中建议。
//
// 数据来源说明（精度优先级）：
// - 有真实录取线（schools.score_lines）的学校：用最新一年录取线 ± 带宽精确匹配（source='real_line'）
// - 无真实线的学校：回退到同 tier 参考区间（source='tier_reference'）
// - 国际课程方向：优先真实线，回退到国际课程默认参考区间

'use client';

export type ExamType = 'zhongkao' | 'international';
export type MatchCategory = 'reach' | 'match' | 'safety';
type MatchSource = 'tier_reference' | 'real_line' | 'rich_profile';

// 历年录取分数线（与 schools 表 score_lines 列、详情页"历年分数线"对齐）
export interface ScoreLine {
  year?: string | number;
  score?: string | number;
  plan?: string;
  batch?: string;
  note?: string;
}

// 学校数据结构（与 rowToSchool / 本地缓存字段对齐）
export interface SchoolRecord {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  schoolStage: 'junior' | 'senior_high' | 'complete';
  tier?: string;
  eliteCohort?: string;
  schoolKeyLevel?: string;
  group?: string;
  isInternational?: boolean;
  scoreLines?: ScoreLine[];
}

interface ScoreMatchInput {
  score: number;
  districtId?: string;
  examType: ExamType;
}

export interface ScoreMatchResult {
  school: SchoolRecord;
  category: MatchCategory;
  estimatedRange: { min: number; max: number };
  reason: string;
  source: MatchSource;
}

// 学校数据由调用方（服务端 loadSchoolsMinimal）传入，不再静态打包 schools.json。

// 从新字段 eliteCohort / schoolKeyLevel 获取匹配键（兼容旧 tier）
function getMatchKey(s: SchoolRecord): string {
  return s.eliteCohort || s.schoolKeyLevel || '';
}

// tier 参考录取区间（同 tier 学校录取参考，非精确线）
// 键同时兼容旧词（市重点/区重点/八大）与 DB 8 值词表（市重点(高中)/区重点(高中)）及富集值（八大金刚/新五虎）。
// 实际匹配走 normalizeTierKey 归一化，避免"市重点(高中)"等带后缀词查不到而被静默跳过。
const TIER_SCORE_RANGE: Record<string, { min: number; max: number }> = {
  四校: { min: 705, max: 712 },
  四校分校: { min: 690, max: 705 },
  八大: { min: 685, max: 700 },
  八大分校: { min: 670, max: 690 },
  新五虎: { min: 680, max: 695 },
  新五虎分校: { min: 665, max: 685 },
  '市实验性示范性高中': { min: 620, max: 680 },
  市重点: { min: 620, max: 680 },
  '市重点(高中)': { min: 620, max: 680 },
  区重点: { min: 580, max: 640 },
  '区重点(高中)': { min: 580, max: 640 },
  一般高中: { min: 560, max: 620 },
  民办高中: { min: 520, max: 600 },
  国际课程: { min: 500, max: 580 }
};

// tier prestige 排序权重（与 TIER_SCORE_RANGE 同键集合）
const TIER_PRESTIGE: Record<string, number> = {
  四校: 100,
  八大: 90,
  四校分校: 80,
  八大分校: 75,
  新五虎: 88,
  新五虎分校: 80,
  '市实验性示范性高中': 70,
  市重点: 70,
  '市重点(高中)': 70,
  区重点: 60,
  '区重点(高中)': 60,
  一般高中: 50,
  民办高中: 40,
  国际课程: 35
};

// 富集别名 → 规范 tier 键（用于八大金刚/新五虎等）
const TIER_ALIAS: Record<string, string> = {
  八大金刚: '八大',
  八大金刚分校: '八大分校',
  新五虎: '新五虎',
  新五虎分校: '新五虎',
  '市实验性示范性高中(高中)': '市重点'
};

// 国际课程默认参考区间（isInternational 学校且无更精确 tier 时使用）
const INTERNATIONAL_DEFAULT_RANGE = { min: 500, max: 580 };

const REACH_GAP = 20; // 低于区间下限 20 分内仍算冲刺

// 归一化 tier 键：优先精确匹配；去掉 (高中)/(初中) 后缀再试；最后走别名映射。
// 这样 "市重点(高中)" → "市重点"、"八大金刚" → "八大" 都能命中 TIER_SCORE_RANGE。
function normalizeTierKey(key: string | undefined): string {
  if (!key) return '';
  if (TIER_SCORE_RANGE[key]) return key;
  const stripped = key.replace(/[（(].*$/, '');
  if (TIER_SCORE_RANGE[stripped]) return stripped;
  if (TIER_ALIAS[key] && TIER_SCORE_RANGE[TIER_ALIAS[key]]) return TIER_ALIAS[key];
  return '';
}

function resolveTierRange(key: string | undefined): { min: number; max: number } | null {
  const nk = normalizeTierKey(key);
  return nk ? TIER_SCORE_RANGE[nk] : null;
}

function tierPrestige(key: string | undefined): number {
  const nk = normalizeTierKey(key);
  return nk ? (TIER_PRESTIGE[nk] || 0) : 0;
}

// 各考试类型满分（上海中考满分 750；国际课程班同样参考中考成绩，故同为 750）
export const MAX_SCORE_PER_EXAM: Record<ExamType, number> = {
  zhongkao: 750,
  international: 750
};

// 兼容旧导入（如仍被引用，退化为中考满分）
export const MAX_SCORE = 750;

export function getAllDistricts(schools: SchoolRecord[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  (schools || []).forEach((s) => map.set(s.districtId, s.districtName));
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}

/**
 * 根据 tier 参考区间判定档位
 */
function categorizeByTier(score: number, range: { min: number; max: number }): MatchCategory | null {
  if (score >= range.max) return 'safety';
  if (score >= range.min) return 'match';
  if (score >= range.min - REACH_GAP) return 'reach';
  return null;
}

/**
 * 中考分支：有真实录取线的学校用真实线精确匹配，其余回退 tier 参考区间
 */
function matchZhongkao(score: number, districtId: string | undefined, schools: SchoolRecord[]): ScoreMatchResult[] {
  const results: ScoreMatchResult[] = [];
  const seniorHighs = (schools || []).filter(
    (s) => s.schoolStage === 'senior_high' || s.schoolStage === 'complete'
  );

  for (const school of seniorHighs) {
    // 无回退默认区间（高中必须能落到真实线或 tier 区间，否则本就无可靠参考）
    const r = buildMatchResult(school, score, null, '');
    if (r) results.push(r);
  }

  return applyDistrictAndSort(results, districtId);
}

/**
 * 国际课程 / 海外方向分支：平台仅覆盖上海高中，无大学录取数据，
 * 原"高考分匹配高中录取线"语义错位，重定位为面向 isInternational 学校的国际课程参考。
 * 国际课程班通常综合中考成绩、校测与简历录取，优先真实线，回退国际课程默认参考区间。
 */
function matchInternational(score: number, districtId: string | undefined, schools: SchoolRecord[]): ScoreMatchResult[] {
  const results: ScoreMatchResult[] = [];
  const intlSchools = (schools || []).filter((s) => s.isInternational);

  for (const school of intlSchools) {
    // 回退区间：国际课程默认参考区间
    const r = buildMatchResult(school, score, INTERNATIONAL_DEFAULT_RANGE, '国际课程');
    if (r) results.push(r);
  }

  return applyDistrictAndSort(results, districtId);
}

// 真实录取线的判定带宽（同一校历年录取线通常在 ±10 内波动，±此值内判为"匹配"）
const REAL_LINE_MATCH_BAND = 10;

/**
 * 提取某校真实录取线信息：取数值有效、年份最新的线作为参考点，
 * 并给出近年分数区间（min/max）用于展示。无有效数值线（如"无/摇号"占位）返回 null。
 */
function getRealLineInfo(school: SchoolRecord): { year: number; score: number; min: number; max: number; count: number } | null {
  const lines = (school.scoreLines || []).filter(
    (l) => Number.isFinite(Number(l.year)) && Number.isFinite(Number(l.score))
  );
  if (!lines.length) return null;

  const sorted = lines.slice().sort((a, b) => Number(a.year) - Number(b.year));
  const latest = sorted[sorted.length - 1];
  const scores = sorted.map((l) => Number(l.score));
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return { year: Number(latest.year), score: Number(latest.score), min, max, count: lines.length };
}

/**
 * 真实线判定档位（围绕最新录取线 ref）
 */
function categorizeByRealLine(score: number, ref: number): MatchCategory | null {
  if (score >= ref + REAL_LINE_MATCH_BAND) return 'safety';
  if (score >= ref - REAL_LINE_MATCH_BAND) return 'match';
  if (score >= ref - REAL_LINE_MATCH_BAND - REACH_GAP) return 'reach';
  return null;
}

/**
 * 真实录取线优先、tier 参考区间回退的统一匹配构造。
 * 有真实线 → source='real_line'，区间用近年 min/max；
 * 无真实线 → 用 normalizeTierKey 归一后的 tier 区间（fallbackRange 作为最终兜底）。
 */
function buildMatchResult(
  school: SchoolRecord,
  score: number,
  fallbackRange: { min: number; max: number } | null,
  fallbackLabel: string
): ScoreMatchResult | null {
  const real = getRealLineInfo(school);
  if (real) {
    const category = categorizeByRealLine(score, real.score);
    if (!category) return null;
    const trend = real.count > 1 ? `（近年 ${real.min}-${real.max}）` : '';
    return {
      school,
      category,
      estimatedRange: { min: real.min, max: real.max },
      reason: `${real.year}年录取线 ${real.score}${trend}`,
      source: 'real_line'
    };
  }

  const key = getMatchKey(school);
  const range = resolveTierRange(key) || fallbackRange;
  if (!range) return null;
  const label = resolveTierRange(key) ? key : fallbackLabel;
  const category = categorizeByTier(score, range);
  if (!category) return null;
  return {
    school,
    category,
    estimatedRange: range,
    reason: `${label}参考区间 ${range.min}-${range.max}`,
    source: 'tier_reference'
  };
}

/**
 * 区域过滤 + 排序：本区校优先，组内按 tier prestige 降序
 */
function applyDistrictAndSort(results: ScoreMatchResult[], districtId?: string): ScoreMatchResult[] {
  if (!districtId) {
    return results.sort(
      (a, b) =>
        categoryOrder(a.category) - categoryOrder(b.category) ||
        tierPrestige(getMatchKey(b.school)) - tierPrestige(getMatchKey(a.school))
    );
  }

  const inDistrict = results.filter((r) => r.school.districtId === districtId);
  const outDistrict = results.filter((r) => r.school.districtId !== districtId);

  const sortFn = (a: ScoreMatchResult, b: ScoreMatchResult) =>
    categoryOrder(a.category) - categoryOrder(b.category) ||
    tierPrestige(getMatchKey(b.school)) - tierPrestige(getMatchKey(a.school));

  inDistrict.sort(sortFn);
  outDistrict.sort(sortFn);

  // 本区优先，不足时补全市
  return [...inDistrict, ...outDistrict];
}

function categoryOrder(c: MatchCategory): number {
  // 排序优先级：匹配 > 冲刺 > 保底（让最相关的排在最前）
  if (c === 'match') return 0;
  if (c === 'reach') return 1;
  return 2;
}

export function matchSchoolsByScore(input: ScoreMatchInput, schools: SchoolRecord[]): ScoreMatchResult[] {
  const { score, districtId, examType } = input;
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return [];

  const all = examType === 'international' ? matchInternational(score, districtId, schools) : matchZhongkao(score, districtId, schools);

  // 每档 limit 8 所
  const limited: ScoreMatchResult[] = [];
  const counts: Record<MatchCategory, number> = { reach: 0, match: 0, safety: 0 };
  for (const r of all) {
    if (counts[r.category] >= 8) continue;
    counts[r.category] += 1;
    limited.push(r);
  }
  return limited;
}

export function groupResultsByCategory(
  results: ScoreMatchResult[]
): Record<MatchCategory, ScoreMatchResult[]> {
  return {
    reach: results.filter((r) => r.category === 'reach'),
    match: results.filter((r) => r.category === 'match'),
    safety: results.filter((r) => r.category === 'safety')
  };
}
