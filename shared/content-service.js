const {
  cleanString,
  slugify,
  validateRequired,
  buildDistricts
} = require('./data-schema');
const { isSupabaseConfigured } = require('./supabase-client');
const { DEFAULT_REGION } = require('./region-config');
const {
  loadSchoolsList,
  loadNewsList,
  querySchoolsList,
  queryNewsList,
  getSchoolById: getSchoolByIdFull,
  getNewsById: getNewsByIdFull,
  sortBySchoolPriority,
  createSchoolInSupabase,
  updateSchoolInSupabase,
  deleteSchoolFromSupabase,
  createNewsInSupabase,
  updateNewsInSupabase,
  deleteNewsFromSupabase
} = require('./data-store');

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

// 写操作不降级到本地缓存：DB 未配置时直接拒绝。
function requireSupabase() {
  if (!isSupabaseConfigured()) {
    const error = new Error('数据库未配置，写操作不可用');
    error.statusCode = 503;
    throw error;
  }
}

// 轻量归一化：直接基于 input 的 camelCase 字段构造应用层对象（与 DB schema 对齐）。
// 取代已移除的 normalizeSchool/normalizeNews（它们与 DB schema 脱节：normalizeSchool 仍产已删的 tier、
// 非 DB 字段 tags/schoolDescription；normalizeNews 不产 districtId/districtName）。
// schoolToRow/newsToRow 只取 DB 需要的字段，多余字段自动忽略。
function buildSchoolRecord(input = {}) {
  return {
    ...pickDefined(input),
    name: cleanString(input.name),
    districtName: cleanString(input.districtName || input.district),
    schoolPropertyLabel: cleanString(input.schoolPropertyLabel || input.type || '未知'),
    description: cleanString(input.description || input.schoolDescription),
    admissionMethods: uniqueStrings(input.admissionMethods),
    admissionRoutes: uniqueStrings(input.admissionRoutes),
    features: uniqueStrings(input.features),
    profileDepth: cleanString(input.profileDepth) || 'enhanced'
  };
}

function buildNewsRecord(input = {}) {
  return {
    ...pickDefined(input),
    title: cleanString(input.title),
    newsType: cleanString(input.newsType),
    category: cleanString(input.category),
    examType: cleanString(input.examType),
    summary: cleanString(input.summary),
    content: input.content,
    source: input.source || {},
    districtId: cleanString(input.districtId),
    districtName: cleanString(input.districtName),
    primarySchoolId: cleanString(input.primarySchoolId),
    relatedSchoolIds: uniqueStrings(input.relatedSchoolIds),
    schoolLinkReason: cleanString(input.schoolLinkReason),
    schoolLinkConfidence: input.schoolLinkConfidence
  };
}

async function listDistricts(region = DEFAULT_REGION) {
  const [schools, news] = await Promise.all([loadSchoolsList(region), loadNewsList(region)]);
  return buildDistricts(schools, news, region);
}

async function listSchools(filters = {}) {
  const region = cleanString(filters.region) || DEFAULT_REGION;
  const q = cleanString(filters.q).toLowerCase();
  const districtId = cleanString(filters.district || filters.districtId);
  const stage = cleanString(filters.stage || filters.schoolStage);
  const schoolType = cleanString(filters.schoolType || filters.type);

  // 属性筛选：兼容历史 code（public/private/...）与直接 label，统一解析成 DB 词表值再下推。
  const propertyLabel = schoolType
    ? (CODE_TO_TYPE_LABEL[schoolType] || schoolType)
    : '';

  // 过滤条件下推到 DB（region/district/stage/propertyLabel/q），避免多地区铺开后全量内存过滤。
  const schools = await querySchoolsList({
    region,
    districtId: districtId && districtId !== 'all' ? districtId : '',
    stage,
    propertyLabel,
    q
  });

  return sortBySchoolPriority(schools);
}

async function getSchoolById(id) {
  // 直接按 id 取完整记录（含 content/scoreLines/admissionInfo），
  // 而非全量列表查询（已瘦身去掉 content，且 2.66MB 不可缓存）。
  return getSchoolByIdFull(id);
}

async function createSchool(input) {
  requireSupabase();
  const id = cleanString(input.id) || slugify(`${cleanString(input.districtId || input.district)}-${cleanString(input.name)}`);
  const region = cleanString(input.region) || DEFAULT_REGION;
  const school = buildSchoolRecord({ ...input, id, region });
  requireFields(school, ['id', 'name', 'districtName']);
  return createSchoolInSupabase({ ...school, region, updatedAt: new Date().toISOString() });
}

async function updateSchool(id, input) {
  requireSupabase();
  // 取现有记录合并（getSchoolById 直接查 DB）
  const current = await getSchoolById(id);
  if (!current) {
    const error = new Error('学校不存在');
    error.statusCode = 404;
    throw error;
  }
  const merged = buildSchoolRecord({ ...current, ...input, id });
  requireFields(merged, ['id', 'name', 'districtName']);
  return updateSchoolInSupabase(id, { ...merged, updatedAt: new Date().toISOString() });
}

async function deleteSchool(id) {
  requireSupabase();
  // deleteSchoolFromSupabase 内部校验存在性（不存在抛 404）
  return deleteSchoolFromSupabase(id);
}

async function listNews(filters = {}) {
  const region = cleanString(filters.region) || DEFAULT_REGION;
  const q = cleanString(filters.q).toLowerCase();
  const districtId = cleanString(filters.district || filters.districtId);
  const examType = cleanString(filters.examType || filters.exam_type);
  const newsType = cleanString(filters.newsType || filters.news_type);
  const category = cleanString(filters.category);
  const sourceType = cleanString(filters.sourceType);

  // 结构化过滤下推到 DB；source.type（jsonb 内层键）留给内存过滤。
  const news = await queryNewsList({
    region,
    districtId: districtId && districtId !== 'all' ? districtId : '',
    examType,
    newsType,
    category,
    q
  });

  return sortByTimeDesc(
    sourceType ? news.filter((item) => item.source?.type === sourceType) : news,
    'publishedAt'
  );
}

async function getNewsById(id) {
  return getNewsByIdFull(id);
}

async function createNews(input) {
  requireSupabase();
  const id = cleanString(input.id) || slugify(`${cleanString(input.category || input.examType || 'news')}-${cleanString(input.title)}`);
  const region = cleanString(input.region) || DEFAULT_REGION;
  const news = buildNewsRecord({ ...input, id, region });
  requireFields(news, ['id', 'title']);
  return createNewsInSupabase({ ...news, region, updatedAt: new Date().toISOString() });
}

async function updateNews(id, input) {
  requireSupabase();
  // 取现有记录合并（getNewsById 直接查 DB）
  const current = await getNewsById(id);
  if (!current) {
    const error = new Error('新闻不存在');
    error.statusCode = 404;
    throw error;
  }
  const merged = buildNewsRecord({ ...current, ...input, id });
  requireFields(merged, ['id', 'title']);
  return updateNewsInSupabase(id, { ...merged, updatedAt: new Date().toISOString() });
}

async function deleteNews(id) {
  requireSupabase();
  // deleteNewsFromSupabase 内部校验存在性（不存在抛 404）
  return deleteNewsFromSupabase(id);
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
