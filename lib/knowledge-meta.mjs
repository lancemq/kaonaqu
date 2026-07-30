// 知识点难度 / 考频元数据（轻量、可维护、零后端）
//
// 采用「学科 × 年级」启发式生成，再叠加专题覆盖。目标是给知识页提供一致的
// 难度与考频标注（用于页面徽章），而不是逐页手工维护。若后续需要更精细的
// 逐知识点标注，可在此扩展为完整映射表。
//
// difficulty: 1(易) ~ 5(难)；examFrequency: 'high' | 'mid' | 'low'

const GRADE_TOKENS = [
  'senior3', 'senior-3',
  'senior2', 'senior-2',
  'senior1', 'senior-1',
  'grade9', 'grade-9',
  'grade8', 'grade-8',
  'grade7', 'grade-7',
  'grade6', 'grade-6'
];

const GRADE_DIFF = {
  grade6: 1,
  grade7: 2,
  grade8: 3,
  grade9: 4,
  senior1: 3,
  senior2: 4,
  senior3: 5
};

const GRADE_FREQ = {
  grade6: 'low',
  grade7: 'low',
  grade8: 'mid',
  grade9: 'high',
  senior1: 'mid',
  senior2: 'mid',
  senior3: 'high'
};

const SUBJECT_HARD = new Set(['math', 'physics', 'chemistry']);
const SUBJECT_SOFT = new Set(['chinese', 'english']);

// 专题页覆盖（不走年级启发式）
const OVERRIDES = {
  index: null,
  'zhongkao-zhenti': { difficulty: 4, examFrequency: 'high' },
  'kuaxueke-anli': { difficulty: 3, examFrequency: 'high' },
  'tiyu-zhongkao': { difficulty: 2, examFrequency: 'mid' },
  'xuanke-zhidao': { difficulty: 3, examFrequency: 'high' }
};

function parseSubjectGrade(slug) {
  for (const g of GRADE_TOKENS) {
    if (slug.includes(`-${g}`) || slug === g || slug.startsWith(`${g}-`)) {
      const subject = slug
        .replace(`-${g}`, '')
        .replace(g, '')
        .replace(/-+$/g, '')
        .replace(/^-+/g, '');
      return { subject: subject || null, grade: g };
    }
  }
  return { subject: null, grade: null };
}

export function getKnowledgeMeta(slug) {
  if (!slug || slug === 'index') return null;
  if (Object.prototype.hasOwnProperty.call(OVERRIDES, slug)) return OVERRIDES[slug];

  const { subject, grade } = parseSubjectGrade(slug);
  if (!grade) return { difficulty: 3, examFrequency: 'mid' };

  // 归一化连字符写法（grade-9 / senior-3）为无连字符 token，便于查表
  const g = grade.replace('grade-', 'grade').replace('senior-', 'senior');

  let difficulty = GRADE_DIFF[g] ?? 3;
  if (SUBJECT_HARD.has(subject)) difficulty = Math.min(5, difficulty + 1);
  if (SUBJECT_SOFT.has(subject)) difficulty = Math.max(1, difficulty - 1);

  const examFrequency = GRADE_FREQ[g] ?? 'mid';
  return { difficulty, examFrequency };
}

export const FREQ_LABELS = {
  high: '高频',
  mid: '中频',
  low: '低频'
};
