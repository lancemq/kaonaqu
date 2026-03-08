const {
  cleanString,
  normalizeNews,
  normalizePolicy,
  normalizeSchool,
  slugify,
  validateRequired
} = require('./data-schema');
const { loadDataStore, updateDataStore } = require('./data-store');

function sortByTimeDesc(items, field = 'updatedAt') {
  return items
    .slice()
    .sort((left, right) => String(right[field] || '').localeCompare(String(left[field] || '')));
}

function uniqueStrings(values) {
  return Array.from(new Set((values || []).map(cleanString).filter(Boolean)));
}

function matchesQuery(fields, query) {
  const normalizedQuery = cleanString(query).toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystack = fields
    .flat()
    .map((value) => cleanString(value).toLowerCase())
    .join(' ');

  return haystack.includes(normalizedQuery);
}

function pickDefined(raw = {}) {
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== undefined)
  );
}

function requireFields(record, requiredFields) {
  const issues = validateRequired(record, requiredFields);
  if (issues.length) {
    const error = new Error(`参数不完整: ${issues.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}

async function listDistricts() {
  const { districts } = await loadDataStore();
  return districts;
}

async function listSchools(filters = {}) {
  const { schools } = await loadDataStore();
  const q = cleanString(filters.q).toLowerCase();
  const districtId = cleanString(filters.district || filters.districtId);
  const stage = cleanString(filters.stage || filters.schoolStage);
  const schoolType = cleanString(filters.schoolType || filters.type);
  const feature = cleanString(filters.feature || filters.tag);
  const sourceType = cleanString(filters.sourceType);

  return sortByTimeDesc(schools.filter((school) => {
    if (districtId && districtId !== 'all' && school.districtId !== districtId) {
      return false;
    }
    if (stage && school.schoolStage !== stage) {
      return false;
    }
    if (schoolType && school.schoolType !== schoolType && school.schoolTypeLabel !== schoolType) {
      return false;
    }
    if (feature && ![...(school.features || []), ...(school.tags || [])].some((item) => item.includes(feature))) {
      return false;
    }
    if (sourceType && school.source?.type !== sourceType) {
      return false;
    }

    return matchesQuery([
      school.name,
      school.districtName,
      school.schoolStageLabel,
      school.schoolTypeLabel,
      school.tier,
      school.address,
      school.admissionNotes,
      school.features,
      school.tags
    ], q);
  }), 'updatedAt');
}

async function getSchoolById(id) {
  const schools = await listSchools({});
  return schools.find((item) => item.id === id) || null;
}

async function createSchool(input) {
  const draft = normalizeSchool({
    ...pickDefined(input),
    id: input.id || slugify(`${input.districtId || input.district}-${input.name}`)
  });

  requireFields(draft, ['id', 'name', 'districtId', 'districtName']);

  return updateDataStore(async (state) => {
    if (state.schools.some((school) => school.id === draft.id)) {
      const error = new Error('学校已存在');
      error.statusCode = 409;
      throw error;
    }

    return {
      ...state,
      schools: sortByTimeDesc([
        {
          ...draft,
          features: uniqueStrings(draft.features),
          tags: uniqueStrings(draft.tags),
          updatedAt: new Date().toISOString()
        },
        ...state.schools
      ])
    };
  }).then((state) => state.schools.find((school) => school.id === draft.id));
}

async function updateSchool(id, input) {
  return updateDataStore(async (state) => {
    const current = state.schools.find((school) => school.id === id);
    if (!current) {
      const error = new Error('学校不存在');
      error.statusCode = 404;
      throw error;
    }

    const merged = normalizeSchool({
      ...current,
      ...pickDefined(input),
      id
    });

    requireFields(merged, ['id', 'name', 'districtId', 'districtName']);

    return {
      ...state,
      schools: state.schools.map((school) => (
        school.id === id
          ? {
            ...merged,
            features: uniqueStrings(merged.features),
            tags: uniqueStrings(merged.tags),
            updatedAt: new Date().toISOString()
          }
          : school
      ))
    };
  }).then((state) => state.schools.find((school) => school.id === id));
}

async function deleteSchool(id) {
  return updateDataStore(async (state) => {
    const current = state.schools.find((school) => school.id === id);
    if (!current) {
      const error = new Error('学校不存在');
      error.statusCode = 404;
      throw error;
    }

    return {
      ...state,
      schools: state.schools.filter((school) => school.id !== id)
    };
  });
}

async function listPolicies(filters = {}) {
  const { policies } = await loadDataStore();
  const districtId = cleanString(filters.district || filters.districtId);
  const year = cleanString(filters.year);
  const q = cleanString(filters.q);
  const sourceType = cleanString(filters.sourceType);

  return sortByTimeDesc(policies.filter((policy) => {
    if (districtId && districtId !== 'all' && policy.districtId !== 'all' && policy.districtId !== districtId) {
      return false;
    }
    if (year && String(policy.year) !== year) {
      return false;
    }
    if (sourceType && policy.source?.type !== sourceType) {
      return false;
    }

    return matchesQuery([policy.title, policy.summary, policy.content, policy.districtName], q);
  }), 'publishedAt');
}

async function getPolicyById(id) {
  const { policies } = await loadDataStore();
  return policies.find((item) => item.id === id) || null;
}

async function createPolicy(input) {
  const draft = normalizePolicy({
    ...pickDefined(input),
    id: input.id || slugify(`${input.year || new Date().getUTCFullYear()}-${input.districtId || input.district || 'all'}-${input.title}`)
  });

  requireFields(draft, ['id', 'title']);

  return updateDataStore(async (state) => {
    if (state.policies.some((policy) => policy.id === draft.id)) {
      const error = new Error('政策已存在');
      error.statusCode = 409;
      throw error;
    }

    return {
      ...state,
      policies: sortByTimeDesc([
        {
          ...draft,
          updatedAt: new Date().toISOString()
        },
        ...state.policies
      ], 'publishedAt')
    };
  }).then((state) => state.policies.find((item) => item.id === draft.id));
}

async function updatePolicy(id, input) {
  return updateDataStore(async (state) => {
    const current = state.policies.find((item) => item.id === id);
    if (!current) {
      const error = new Error('政策不存在');
      error.statusCode = 404;
      throw error;
    }

    const merged = normalizePolicy({
      ...current,
      ...pickDefined(input),
      id
    });

    requireFields(merged, ['id', 'title']);

    return {
      ...state,
      policies: state.policies.map((item) => (
        item.id === id
          ? {
            ...merged,
            updatedAt: new Date().toISOString()
          }
          : item
      ))
    };
  }).then((state) => state.policies.find((item) => item.id === id));
}

async function deletePolicy(id) {
  return updateDataStore(async (state) => {
    const current = state.policies.find((item) => item.id === id);
    if (!current) {
      const error = new Error('政策不存在');
      error.statusCode = 404;
      throw error;
    }

    return {
      ...state,
      policies: state.policies.filter((item) => item.id !== id)
    };
  });
}

async function listNews(filters = {}) {
  const { news } = await loadDataStore();
  const examType = cleanString(filters.examType || filters.exam_type);
  const category = cleanString(filters.category);
  const q = cleanString(filters.q);
  const sourceType = cleanString(filters.sourceType);

  return sortByTimeDesc(news.filter((item) => {
    if (examType && item.examType !== examType) {
      return false;
    }
    if (category && item.category !== category) {
      return false;
    }
    if (sourceType && item.source?.type !== sourceType) {
      return false;
    }

    return matchesQuery([item.title, item.summary, item.content, item.category], q);
  }), 'publishedAt');
}

async function getNewsById(id) {
  const { news } = await loadDataStore();
  return news.find((item) => item.id === id) || null;
}

async function createNews(input) {
  const draft = normalizeNews({
    ...pickDefined(input),
    id: input.id || slugify(`${input.category || input.examType || 'news'}-${input.title}`)
  });

  requireFields(draft, ['id', 'title']);

  return updateDataStore(async (state) => {
    if (state.news.some((item) => item.id === draft.id)) {
      const error = new Error('新闻已存在');
      error.statusCode = 409;
      throw error;
    }

    return {
      ...state,
      news: sortByTimeDesc([
        {
          ...draft,
          updatedAt: new Date().toISOString()
        },
        ...state.news
      ], 'publishedAt')
    };
  }).then((state) => state.news.find((item) => item.id === draft.id));
}

async function updateNews(id, input) {
  return updateDataStore(async (state) => {
    const current = state.news.find((item) => item.id === id);
    if (!current) {
      const error = new Error('新闻不存在');
      error.statusCode = 404;
      throw error;
    }

    const merged = normalizeNews({
      ...current,
      ...pickDefined(input),
      id
    });

    requireFields(merged, ['id', 'title']);

    return {
      ...state,
      news: state.news.map((item) => (
        item.id === id
          ? {
            ...merged,
            updatedAt: new Date().toISOString()
          }
          : item
      ))
    };
  }).then((state) => state.news.find((item) => item.id === id));
}

async function deleteNews(id) {
  return updateDataStore(async (state) => {
    const current = state.news.find((item) => item.id === id);
    if (!current) {
      const error = new Error('新闻不存在');
      error.statusCode = 404;
      throw error;
    }

    return {
      ...state,
      news: state.news.filter((item) => item.id !== id)
    };
  });
}

async function searchSchools(query, filters = {}) {
  return listSchools({ ...filters, q: query });
}

module.exports = {
  createNews,
  createPolicy,
  createSchool,
  deleteNews,
  deletePolicy,
  deleteSchool,
  getNewsById,
  getPolicyById,
  getSchoolById,
  listDistricts,
  listNews,
  listPolicies,
  listSchools,
  searchSchools,
  updateNews,
  updatePolicy,
  updateSchool
};
