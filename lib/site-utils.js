import { getDistrictTopicIntro, getSchoolRelationMetaByName, inferTrainingDirections } from './school-curation.js';
import { getNewsSection as getNewsSectionBase } from './news-section-utils.mjs';
import {
  SCHOOL_CATEGORIES,
  getCategoryById,
  getSpecializationById,
  inferSchoolCategory,
  inferSpecializations
} from './school-taxonomy.js';

export function getSchoolDistrictName(school) {
  return school.district || school.districtName || '未知区域';
}

export function getSchoolType(school) {
  return school.schoolTypeLabel || '未分类';
}

export function getSchoolStage(school) {
  if (school.schoolStageLabel) {
    return school.schoolStageLabel;
  }
  if (school.schoolStage === 'junior') {
    return '初中';
  }
  if (school.schoolStage === 'complete') {
    return '完全中学';
  }
  return '高中';
}

export function getSchoolFeatures(school) {
  const value = school.keyFeatures || school.features || [];
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function getSchoolTags(school) {
  const value = school.tags || [];
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function getSchoolAdmissionInfo(school) {
  const raw = school.admissionInfo || school.admissionNotes || '';
  if (!raw) return '';
  // 剥离对所有学校套同一句的模板建议（"建议重点关注…"），
  // 只保留事实部分（录取/招生方式列举）+ "以官方为准"声明。
  return raw
    .replace(/建议重点关注[^。]*。/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getSchoolHighlights(school) {
  const value = school.schoolHighlights || [];
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function getSchoolSuitableStudents(school) {
  return school.suitableStudents || '';
}

export function getSchoolApplicationTips(school) {
  return school.applicationTips || '';
}

export function getSchoolTrainingDirections(school) {
  const preset = school.trainingDirections || school.trainingDirectionLabels;
  if (Array.isArray(preset) && preset.length) {
    return preset.filter(Boolean);
  }
  return inferTrainingDirections(school);
}

export function getDistrictSchoolTopic(district) {
  return getDistrictTopicIntro(district?.id || district?.districtId || district);
}

function getSchoolOwnershipGroup(school) {
  const label = String(getSchoolType(school) || '').toLowerCase();
  const tags = getSchoolTags(school).join(' ').toLowerCase();

  if (label.includes('外籍')) {
    return 'foreign';
  }
  if (label.includes('国际') || label.includes('双语') || tags.includes('国际化') || tags.includes('国际课程')) {
    return 'international';
  }
  if (label.includes('民办') || tags.includes('民办')) {
    return 'private';
  }
  if (label.includes('公办') || tags.includes('公办')) {
    return 'public';
  }
  return 'other';
}

export function getSchoolOwnershipLabel(school) {
  const group = getSchoolOwnershipGroup(school);
  if (group === 'public') {
    return '公办';
  }
  if (group === 'private') {
    return '民办';
  }
  if (group === 'international') {
    return '国际化 / 双语';
  }
  if (group === 'foreign') {
    return '外籍学校';
  }
  return '其他';
}

// ==== 标准化分类（category + specializations）====

function getSchoolCategoryId(school) {
  return school?.category || inferSchoolCategory(school);
}

export function getSchoolCategory(school) {
  const id = getSchoolCategoryId(school);
  return getCategoryById(id);
}

export function getSchoolCategoryLabel(school) {
  return getSchoolCategory(school)?.label || '未分类';
}

function getSchoolSpecializations(school) {
  if (Array.isArray(school?.specializations) && school.specializations.length) {
    return school.specializations;
  }
  return inferSpecializations(school);
}

export function getSchoolSpecializationLabels(school) {
  return getSchoolSpecializations(school)
    .map((id) => getSpecializationById(id)?.label || id)
    .filter(Boolean);
}

export const SCHOOL_CATEGORY_LIST = SCHOOL_CATEGORIES;

export function getNewsSection(item) {
  return getNewsSectionBase(item);
}

export function clipText(text, maxLength = 84) {
  const value = String(text || '').trim();
  if (!value || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength).trim()}...`;
}

export function formatSchoolUpdate(value, options = {}) {
  const { defaultText = '—' } = options;
  const text = String(value || '').trim();
  if (!text) {
    return defaultText;
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!match) {
    return text;
  }
  const [, year, month, day, hour, minute] = match;
  if (hour && minute) {
    return `${year}.${month}.${day} ${hour}:${minute}`;
  }
  return `${year}.${month}.${day}`;
}

export function getUpdateSortValue(value) {
  const text = String(value || '').trim();
  if (!text) {
    return 0;
  }
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) {
    return 0;
  }
  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
  return Number(`${year}${month}${day}${hour}${minute}${second}`);
}

export function getNewsCategoryLabel(item) {
  const section = getNewsSection(item);
  if (item.category) return item.category;
  if (section === 'exam') return '考试新闻';
  if (section === 'admission') return '招生新闻';
  if (section === 'school') return '学校动态';
  if (section === 'policy') return '政策解读';
  if (section === 'guide') return '升学指南';
  return '新闻';
}

export function getPolicyExamType(policy) {
  const haystack = [policy.title, policy.summary].join(' ').toLowerCase();
  if (haystack.includes('高考') || haystack.includes('高校') || haystack.includes('春考')) {
    return 'gaokao';
  }
  return 'zhongkao';
}

const NEWS_PRIORITY_KEYWORDS = [
  { score: 18, patterns: ['实施细则', '工作实施意见'] },
  { score: 16, patterns: ['若干意见', '政策出台', '问答'] },
  { score: 14, patterns: ['报名工作', '报名', '志愿填报', '录取'] },
  { score: 12, patterns: ['成绩', '准考证', '确认', '缴费'] },
  { score: 10, patterns: ['一览表', '时间节点', '考试安排'] }
];

export function getNewsPriorityScore(item) {
  const title = String(item?.title || '');
  const summary = String(item?.summary || '');
  const publishedAt = String(item?.publishedAt || '');
  const section = getNewsSection(item);
  let score = 0;

  if (section === 'admission') score += 20;
  if (section === 'exam') score += 18;
  if (section === 'policy') score += 16;
  if (section === 'guide') score += 14;
  if (section === 'school') score += 8;

  if (item?.source?.type === 'official') score += 8;
  if (item?.examType === 'zhongkao' || item?.examType === 'gaokao') score += 4;

  for (const rule of NEWS_PRIORITY_KEYWORDS) {
    if (rule.patterns.some((pattern) => title.includes(pattern) || summary.includes(pattern))) {
      score += rule.score;
      break;
    }
  }

  if (publishedAt.startsWith('2026-03')) score += 4;
  if (publishedAt.startsWith('2026-02')) score += 2;

  return score;
}

export function filterSchools(schools, filters = {}) {
  const {
    district = 'all',
    query = '',
    stage = 'all',
    ownership = 'all',
    tag = 'all',
    direction = 'all'
  } = filters;
  const q = String(query || '').trim().toLowerCase();

  return schools.filter((school) => {
    const districtMatched = district === 'all' || !district || school.districtId === district;
    if (!districtMatched) {
      return false;
    }

    const stageMatched = stage === 'all' || !stage || school.schoolStage === stage;
    if (!stageMatched) {
      return false;
    }

    const ownershipMatched = ownership === 'all' || !ownership || getSchoolOwnershipGroup(school) === ownership;
    if (!ownershipMatched) {
      return false;
    }

    const tagMatched = tag === 'all' || !tag || [...getSchoolTags(school), ...getSchoolFeatures(school)].includes(tag);
    if (!tagMatched) {
      return false;
    }

    const directionMatched = direction === 'all' || !direction || getSchoolTrainingDirections(school).includes(direction);
    if (!directionMatched) {
      return false;
    }

    if (!q) {
      return true;
    }

    const profileSignals = school.profileSignals || {};
    const profileSignalText = [
      profileSignals.stage,
      profileSignals.ownership,
      profileSignals.relation,
      profileSignals.system,
      profileSignals.systemId,
      profileSignals.districtContext,
      profileSignals.comparePriority,
      ...(Array.isArray(profileSignals.routeFocus) ? profileSignals.routeFocus : [])
    ];
    const haystack = [
      school.name,
      getSchoolDistrictName(school),
      getSchoolStage(school),
      getSchoolType(school),
      school.tier,
      school.address,
      getSchoolAdmissionInfo(school),
      getSchoolSuitableStudents(school),
      getSchoolApplicationTips(school),
      ...getSchoolHighlights(school),
      ...getSchoolTrainingDirections(school),
      ...getSchoolFeatures(school),
      ...getSchoolTags(school),
      ...(Array.isArray(school.decisionTags) ? school.decisionTags : []),
      ...(Array.isArray(school.searchKeywords) ? school.searchKeywords : []),
      ...profileSignalText
    ].join(' ').toLowerCase();

    return haystack.includes(q);
  });
}

export function filterNews(news, newsFilter) {
  return news
    .filter((item) => newsFilter === 'all' || getNewsSection(item) === newsFilter)
    .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));
}
