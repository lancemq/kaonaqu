const {
  cleanString,
  normalizeNews,
  normalizeSchool,
  slugify,
  validateRequired
} = require('./data-schema');
const { loadDataStore, updateDataStore, sortBySchoolPriority } = require('./data-store');

// 旧 code 过滤值 -> 规范 label（school_property_label），用于兼容历史调用
const CODE_TO_TYPE_LABEL = {
  public: '公办',
  private: '民办',
  foreign: '外籍',
  cooperative: '中外合作',
  international: '国际化 / 双语'
};

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

function stripSchoolDetailFields(record = {}) {
  const cleaned = { ...record };
  for (const field of ['schoolDescription', 'admissionRequirements', 'schoolHighlights', 'suitableStudents', 'applicationTips']) {
    delete cleaned[field];
  }
  return cleaned;
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

  return sortBySchoolPriority(schools.filter((school) => {
    if (districtId && districtId !== 'all' && school.districtId !== districtId) {
      return false;
    }
    if (stage && school.schoolStage !== stage) {
      return false;
    }
    if (schoolType) {
      const labelMatch = school.schoolPropertyLabel === schoolType;
      const codeMatch = CODE_TO_TYPE_LABEL[schoolType] === school.schoolPropertyLabel;
      if (!labelMatch && !codeMatch) {
        return false;
      }
    }

    return matchesQuery([
      school.name,
      school.districtName,
      school.schoolStageLabel,
      school.schoolPropertyLabel,
      school.schoolKeyLevel,
      school.eliteCohort,
      school.address,
      school.admissionNotes,
      school.features
    ], q);
  }));
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

    const indexedDraft = stripSchoolDetailFields(draft);
    return {
      ...state,
      schools: sortBySchoolPriority([
        {
          ...indexedDraft,
          features: uniqueStrings(indexedDraft.features),
          tags: uniqueStrings(indexedDraft.tags),
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
    const indexedMerged = stripSchoolDetailFields(merged);

    requireFields(indexedMerged, ['id', 'name', 'districtId', 'districtName']);

    return {
      ...state,
      schools: state.schools.map((school) => (
        school.id === id
          ? {
            ...indexedMerged,
            features: uniqueStrings(indexedMerged.features),
            tags: uniqueStrings(indexedMerged.tags),
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

async function listNews(filters = {}) {
  const { news } = await loadDataStore();
  const q = cleanString(filters.q).toLowerCase();
  const districtId = cleanString(filters.district || filters.districtId);
  const examType = cleanString(filters.examType || filters.exam_type);
  const newsType = cleanString(filters.newsType || filters.news_type);
  const category = cleanString(filters.category);
  const sourceType = cleanString(filters.sourceType);

  return sortByTimeDesc(news.filter((item) => {
    if (districtId && districtId !== 'all' && item.districtId !== districtId) {
      return false;
    }
    if (examType && item.examType !== examType) {
      return false;
    }
    if (newsType && item.newsType !== newsType) {
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
  createSchool,
  deleteNews,
  deleteSchool,
  getNewsById,
  getSchoolById,
  listDistricts,
  listNews,
  listSchools,
  searchSchools,
  updateNews,
  updateSchool
};
