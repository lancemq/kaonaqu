const { buildDistricts, DISTRICT_NAME_TO_ID } = require('./data-schema');
const { isSupabaseConfigured, getServiceClient, SCHOOLS_TABLE, NEWS_TABLE } = require('./supabase-client');



// === Supabase 读取 ===

// 从 school_stage_label 推断 school_stage（数据库已删 school_stage 列）
function inferSchoolStage(stageLabel) {
  if (!stageLabel) return '';
  if (stageLabel.includes('初中')) return 'junior';
  if (stageLabel.includes('完全')) return 'complete';
  return 'senior_high';
}

// rowToSchool：完全从数据库行映射，仅返回 DB 列对应的字段 + 运行时派生字段
function rowToSchool(row) {
  if (!row) return null;
  const slug = row.slug || '';
  return {
    id: slug,
    dbId: row.id,
    name: row.name,
    districtId: DISTRICT_NAME_TO_ID[row.district_name] || '',
    districtName: row.district_name,
    schoolStage: inferSchoolStage(row.school_stage_label),
    schoolStageLabel: row.school_stage_label,
    schoolPropertyLabel: row.school_property_label,
    schoolKeyLevel: row.school_key_level,
    eliteCohort: row.elite_cohort,
    group: row.group,
    address: row.address,
    phone: row.phone,
    website: row.website,
    foundingYear: row.founding_year,
    isBoarding: row.is_boarding,
    isInternational: row.is_international,
    image: row.image,
    // 统一招生信息源：所有招生字段都来自 admission_info
    admissionInfo: {
      code: row.admission_info?.code || '',
      methods: Array.isArray(row.admission_info?.methods) ? row.admission_info.methods : [],
      routes: Array.isArray(row.admission_info?.routes) ? row.admission_info.routes : [],
      notes: row.admission_info?.notes || ''
    },
    // 兼容别名（全部派生自 admission_info）
    admissionCode: row.admission_info?.code || '',
    admissionMethods: Array.isArray(row.admission_info?.methods) ? row.admission_info.methods : [],
    admissionRoutes: Array.isArray(row.admission_info?.routes) ? row.admission_info.routes : [],
    contentFile: slug ? `content/schools/${slug}.md` : '',
    profileDepth: row.profile_depth || 'enhanced',
    features: row.features || [],
    scoreLines: Array.isArray(row.score_lines) ? row.score_lines : [],
    content: Array.isArray(row.content) ? row.content : []
  };
}

// === 本地 JSON 与数据库表对齐 ===

// 学校排序：eliteCohort 非空优先 + schoolKeyLevel 重点优先
const KEY_LEVEL_PRIORITY = {
  '市重点': 100,
  '三公': 95,
  '区重点': 80,
  '顶级民办': 70,
  '优质公办': 65,
  '一般高中': 60,
  '一般初中': 40
};

function sortBySchoolPriority(items) {
  return items.slice().sort((a, b) => {
    const aCohort = String(a?.eliteCohort || '').trim() ? 1 : 0;
    const bCohort = String(b?.eliteCohort || '').trim() ? 1 : 0;
    if (aCohort !== bCohort) return bCohort - aCohort;
    const aLevel = KEY_LEVEL_PRIORITY[String(a?.schoolKeyLevel || '').trim()] || 0;
    const bLevel = KEY_LEVEL_PRIORITY[String(b?.schoolKeyLevel || '').trim()] || 0;
    if (bLevel !== aLevel) return bLevel - aLevel;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

async function loadSchoolsFromSupabase() {
  const client = getServiceClient();
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || [])
    .map((row) => rowToSchool(row))
    .filter(Boolean);
}

// news content 支持 JSON block 数组（新）与 Markdown 字符串（旧）两种格式。
// JSON 字符串解析为数组；旧 Markdown 包装为 [{type:'markdown', text}] 由渲染器兼容。
function parseNewsContent(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [{ type: 'markdown', text: raw }];
  }
  return [];
}

// rowToNews：DB snake_case 列 -> 应用 camelCase 字段
function rowToNews(row) {
  if (!row) return null;
  const source = row.source || {};
  return {
    id: row.id,
    title: row.title || '',
    newsType: row.news_type || '',
    category: row.category || '',
    examType: row.exam_type || '',
    summary: row.summary || '',
    content: parseNewsContent(row.content),
    publishedAt: row.published_at || '',
    updatedAt: row.updated_at || '',
    source: {
      type: source.type || '',
      name: source.name || '',
      url: source.url || '',
      crawledAt: source.crawledAt || null,
      confidence: source.confidence !== undefined ? source.confidence : null
    },
    districtId: row.district_id || '',
    districtName: row.district_name || '',
    primarySchoolId: row.primary_school_id || '',
    relatedSchoolIds: Array.isArray(row.related_school_ids) ? row.related_school_ids : [],
    schoolLinkReason: row.school_link_reason || '',
    schoolLinkConfidence: row.school_link_confidence !== undefined && row.school_link_confidence !== null
      ? Number(row.school_link_confidence)
      : null
  };
}

async function loadNewsFromSupabase() {
  const client = getServiceClient();
  const { data, error } = await client
    .from(NEWS_TABLE)
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .map((row) => rowToNews(row))
    .filter(Boolean);
}

// === Supabase 写入 ===
// 应用层 camelCase -> DB snake_case 行（与 rowToSchool/rowToNews 严格对称）。
// schools 表 id 为 BIGSERIAL 自增主键，应用 id 即 DB slug（UNIQUE）；写入不带 id 列。
function schoolToRow(school = {}) {
  return {
    slug: school.id || '',
    name: school.name || '',
    district_name: school.districtName || '',
    school_stage_label: school.schoolStageLabel || '',
    school_property_label: school.schoolPropertyLabel || '',
    school_key_level: school.schoolKeyLevel || '',
    elite_cohort: school.eliteCohort || '',
    group: school.group || '',
    address: school.address || '',
    phone: school.phone || '',
    website: school.website || '',
    founding_year: school.foundingYear ? Number(school.foundingYear) || null : null,
    is_boarding: !!school.isBoarding,
    is_international: !!school.isInternational,
    image: school.image || '',
    profile_depth: school.profileDepth || 'enhanced',
    features: Array.isArray(school.features) ? school.features : [],
    score_lines: Array.isArray(school.scoreLines) ? school.scoreLines : [],
    content: Array.isArray(school.content) ? school.content : [],
    admission_info: {
      code: school.admissionInfo?.code || school.admissionCode || '',
      methods: Array.isArray(school.admissionInfo?.methods) ? school.admissionInfo.methods
        : (Array.isArray(school.admissionMethods) ? school.admissionMethods : []),
      routes: Array.isArray(school.admissionInfo?.routes) ? school.admissionInfo.routes
        : (Array.isArray(school.admissionRoutes) ? school.admissionRoutes : []),
      notes: school.admissionInfo?.notes || ''
    }
  };
}

// news 表 id 为 TEXT 主键，直接写入。
function newsToRow(news = {}) {
  const source = news.source || {};
  return {
    id: news.id || '',
    title: news.title || '',
    news_type: news.newsType || '',
    category: news.category || '',
    exam_type: news.examType || '',
    summary: news.summary || '',
    content: typeof news.content === 'string' ? news.content : JSON.stringify(news.content || []),
    published_at: news.publishedAt || '',
    updated_at: news.updatedAt || '',
    source: {
      type: source.type || '',
      name: source.name || '',
      url: source.url || '',
      crawledAt: source.crawledAt || null,
      confidence: source.confidence !== undefined ? source.confidence : null
    },
    district_id: news.districtId || '',
    district_name: news.districtName || '',
    primary_school_id: news.primarySchoolId || '',
    related_school_ids: Array.isArray(news.relatedSchoolIds) ? news.relatedSchoolIds : [],
    school_link_reason: news.schoolLinkReason || '',
    school_link_confidence: news.schoolLinkConfidence !== undefined && news.schoolLinkConfidence !== null
      ? Number(news.schoolLinkConfidence)
      : null
  };
}

// CRUD 写入：操作 DB，不写本地缓存（本地缓存只读，由 loadDataStore 读 DB 时刷新）。
// DB 不可用时抛错（写操作不降级到本地）。

async function createSchoolInSupabase(school) {
  const client = getServiceClient();
  const row = schoolToRow(school);

  const { data: existing } = await client
    .from(SCHOOLS_TABLE)
    .select('slug')
    .eq('slug', row.slug)
    .maybeSingle();
  if (existing) {
    const error = new Error('学校已存在');
    error.statusCode = 409;
    throw error;
  }

  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .insert(row)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return rowToSchool(data);
}

async function updateSchoolInSupabase(slug, school) {
  const client = getServiceClient();
  const row = schoolToRow({ ...school, id: slug });

  const { data: existing } = await client
    .from(SCHOOLS_TABLE)
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();
  if (!existing) {
    const error = new Error('学校不存在');
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .update(row)
    .eq('slug', slug)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return rowToSchool(data);
}

async function deleteSchoolFromSupabase(slug) {
  const client = getServiceClient();

  const { data: existing } = await client
    .from(SCHOOLS_TABLE)
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();
  if (!existing) {
    const error = new Error('学校不存在');
    error.statusCode = 404;
    throw error;
  }

  const { error } = await client
    .from(SCHOOLS_TABLE)
    .delete()
    .eq('slug', slug);
  if (error) {
    throw error;
  }
  return { ok: true, id: slug };
}

async function createNewsInSupabase(news) {
  const client = getServiceClient();
  const row = newsToRow(news);

  const { data: existing } = await client
    .from(NEWS_TABLE)
    .select('id')
    .eq('id', row.id)
    .maybeSingle();
  if (existing) {
    const error = new Error('新闻已存在');
    error.statusCode = 409;
    throw error;
  }

  const { data, error } = await client
    .from(NEWS_TABLE)
    .insert(row)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return rowToNews(data);
}

async function updateNewsInSupabase(id, news) {
  const client = getServiceClient();
  const row = newsToRow({ ...news, id });

  const { data: existing } = await client
    .from(NEWS_TABLE)
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) {
    const error = new Error('新闻不存在');
    error.statusCode = 404;
    throw error;
  }

  const { data, error } = await client
    .from(NEWS_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return rowToNews(data);
}

async function deleteNewsFromSupabase(id) {
  const client = getServiceClient();

  const { data: existing } = await client
    .from(NEWS_TABLE)
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) {
    const error = new Error('新闻不存在');
    error.statusCode = 404;
    throw error;
  }

  const { error } = await client
    .from(NEWS_TABLE)
    .delete()
    .eq('id', id);
  if (error) {
    throw error;
  }
  return { ok: true, id };
}

function ensureDatasets(data = {}) {
  const schools = Array.isArray(data.schools) ? data.schools : [];
  const news = Array.isArray(data.news) ? data.news : [];
  const districts = buildDistricts(schools, news);

  return { districts, schools, news };
}

// 数据来源始终是线上数据库（Supabase 为唯一权威源）。
// schools.json / news.json 不再作为文件系统缓存——serverless 上写不进、读不到、跨实例不共享，已于 2026-07-17 移除。
// Vercel 上的跨实例缓存改由 Supabase 查询层的 Next.js Data Cache 承担（见 shared/supabase-client.js）。
// 进程内 memo 缓存：学校数据极少变动，避免每次请求都打 Supabase 查询 888 行。
// 缓存命中时仍返回同一份不可变 state；调用方均只读不修改，安全共享。
let _storeCache = null;
let _storeCacheAt = 0;
const STORE_CACHE_TTL_MS = 60 * 1000;

async function loadDataStoreFresh() {
  if (!isSupabaseConfigured()) {
    console.warn('[data-store] Supabase 未配置，返回空数据集（schools/news 无文件系统缓存）');
    return ensureDatasets({ schools: [], news: [] });
  }
  const [schools, news] = await Promise.all([
    loadSchoolsFromSupabase(),
    loadNewsFromSupabase()
  ]);
  return ensureDatasets({ schools, news });
}

async function loadDataStore() {
  const now = Date.now();
  if (_storeCache && now - _storeCacheAt < STORE_CACHE_TTL_MS) {
    return _storeCache;
  }
  _storeCache = await loadDataStoreFresh();
  _storeCacheAt = now;
  return _storeCache;
}

module.exports = {
  ensureDatasets,
  loadDataStore,
  rowToSchool,
  rowToNews,
  schoolToRow,
  newsToRow,
  loadNewsFromSupabase,
  createSchoolInSupabase,
  updateSchoolInSupabase,
  deleteSchoolFromSupabase,
  createNewsInSupabase,
  updateNewsInSupabase,
  deleteNewsFromSupabase,
  sortBySchoolPriority
};
