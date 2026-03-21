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
  return school.schoolStageLabel || (school.schoolStage === 'junior' ? '初中' : '高中');
}

export function getSchoolFeatures(school) {
  return school.keyFeatures || school.features || [];
}

export function getSchoolTags(school) {
  return school.tags || [];
}

export function getSchoolAdmissionInfo(school) {
  return school.admissionInfo || school.admissionNotes || '暂无';
}

export function getSchoolFeatureTags(school) {
  return [...getSchoolTags(school), ...getSchoolFeatures(school)].slice(0, 4);
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
    tag = 'all'
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
      ...getSchoolFeatures(school),
      ...getSchoolTags(school)
    ].join(' ').toLowerCase();

    return haystack.includes(q);
  });
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
