import { getDistrictTopicIntro, getSchoolRelationMetaByName, inferTrainingDirections, matchSchoolSystem } from './school-curation';

export function formatConfidence(value) {
  const score = typeof value === 'number' ? value : 0;
  return `${Math.round(score * 100)}%`;
}

export function getSchoolDistrictName(school) {
  return school.district || school.districtName || '未知区域';
}

export function getSchoolType(school) {
  return school.type || school.schoolTypeLabel || '未分类';
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
  return school.admissionInfo || school.admissionNotes || '暂无';
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

export function getSchoolSystem(school) {
  if (school.systemId || school.systemName) {
    return {
      id: school.systemId || '',
      name: school.systemName || '',
      description: school.systemDescription || ''
    };
  }
  return matchSchoolSystem(school);
}

export function getSchoolRelationMeta(school) {
  return getSchoolRelationMetaByName(school?.name || '');
}

export function getDistrictSchoolTopic(district) {
  return getDistrictTopicIntro(district?.id || district?.districtId || district);
}

export function getSchoolDisplayTags(school) {
  return [...new Set(getSchoolTags(school))].slice(0, 4);
}

export function getSchoolOwnershipGroup(school) {
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

export function getNewsSection(item) {
  if (item.newsType) {
    return item.newsType;
  }
  if (item.examType === 'zhongkao' || item.examType === 'gaokao') {
    return 'exam';
  }
  return 'exam';
}

export function getNewsCategoryLabel(item) {
  return item.category || (getNewsSection(item) === 'exam' ? '考试新闻' : '新闻');
}

export function getPolicyExamType(policy) {
  const haystack = [policy.title, policy.summary, policy.content].join(' ').toLowerCase();
  if (haystack.includes('高考') || haystack.includes('高校') || haystack.includes('春考')) {
    return 'gaokao';
  }
  return 'zhongkao';
}

export function getLatestNewsByExamType(news, examType) {
  return news
    .filter((item) => item.examType === examType)
    .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')))[0] || null;
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
      ...getSchoolTags(school)
    ].join(' ').toLowerCase();

    return haystack.includes(q);
  });
}

export function buildSchoolSystems(schools) {
  const groups = new Map();

  for (const school of schools) {
    const system = getSchoolSystem(school);
    if (!system?.id) continue;
    if (!groups.has(system.id)) {
      groups.set(system.id, {
        id: system.id,
        name: system.name,
        description: system.description,
        schools: []
      });
    }
    groups.get(system.id).schools.push(school);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      schools: group.schools.sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))
    }))
    .sort((left, right) => right.schools.length - left.schools.length);
}

export function filterPolicies(policies, district) {
  return policies.filter((policy) => {
    const policyDistrict = policy.districtId || policy.district || 'all';
    return district === 'all' || !district || policyDistrict === 'all' || policyDistrict === district;
  });
}

export function filterNews(news, newsFilter) {
  return news
    .filter((item) => newsFilter === 'all' || getNewsSection(item) === newsFilter)
    .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));
}
