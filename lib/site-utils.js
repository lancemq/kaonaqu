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

export function filterSchools(schools, district, query) {
  const q = String(query || '').trim().toLowerCase();
  return schools.filter((school) => {
    const districtMatched = district === 'all' || !district || school.districtId === district;
    if (!districtMatched) {
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
