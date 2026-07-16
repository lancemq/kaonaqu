const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { buildDistricts, DISTRICT_NAME_TO_ID } = require('./data-schema');
const { isSupabaseConfigured, getServiceClient, SCHOOLS_TABLE, NEWS_TABLE } = require('./supabase-client');

function resolveDataDir() {
  const candidates = [
    process.env.KAONAQU_RUNTIME_ROOT_DATA_DIR,
    path.join(process.cwd(), 'data'),
    path.join(__dirname, '..', 'data'),
    path.join(process.cwd(), '..', 'data'),
    path.join(process.cwd(), '..', '..', 'data')
  ].filter(Boolean);

  return candidates.find((candidate) => fsSync.existsSync(candidate)) || candidates[0];
}

const DATA_DIR = resolveDataDir();
const DATASET_FILES = {
  districts: 'districts.json',
  schools: 'schools.json',
  news: 'news.json'
};

// 打包兜底：惰性、容错加载。
// 注意：schools.json 与 news.json 现均视为运行时缓存（由数据库生成、已 gitignore，不在仓库中），
// 因此刻意不在这里 require 它们——文件缺失时模块加载也不应崩溃。
function safeRequire(p) {
  try {
    return require(p);
  } catch (e) {
    return undefined;
  }
}

const BUNDLED_DATASETS = {
  districts: safeRequire('../data/districts.json')
};

function getDatasetKeyByFilename(filename) {
  return Object.entries(DATASET_FILES).find(([, value]) => value === filename)?.[0] || null;
}

async function readLocalJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    const datasetKey = getDatasetKeyByFilename(filename);
    if (!datasetKey) {
      throw error;
    }
    const fallback = BUNDLED_DATASETS[datasetKey];
    if (Array.isArray(fallback)) {
      return fallback;
    }
    // 缓存/源文件均不可用（如 schools.json 尚未由数据库生成）：
    // 返回空集合，避免整站因缺数据而崩溃（数据库不可用时优雅降级）。
    console.warn(`[data-store] 无法读取 ${filename} 且无打包兜底，返回空集合`);
    return [];
  }
}

async function writeLocalJson(filename, payload) {
  await fs.writeFile(path.join(DATA_DIR, filename), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function loadLocalData() {
  const [districts, schoolsRaw, newsRaw] = await Promise.all([
    readLocalJson(DATASET_FILES.districts),
    readLocalJson(DATASET_FILES.schools),
    readLocalJson(DATASET_FILES.news)
  ]);
  const schools = (Array.isArray(schoolsRaw) ? schoolsRaw : []).map(deriveLocalSchoolFields);
  // 本地降级路径也需 parseNewsContent，与 rowToNews（DB 路径）保持一致
  const news = (Array.isArray(newsRaw) ? newsRaw : []).map((item) => ({
    ...item,
    content: parseNewsContent(item.content)
  }));

  return { districts, schools, news };
}

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
// data/schools.json 只应保留线上 schools 表存在的字段（camelCase 映射）。
// 共 24 个：线上 22 列（含 score_lines / content jsonb 数组；学校概览/办学成就已迁入 content，不再单独存 description/achievements） + admission_info(jsonb) 拆出的 admissionCode/Methods/Routes。
// 派生字段 districtId / schoolStage / contentFile 不是 DB 列，读取时补回、写回时剥离，
// 以保证本地文件始终与数据库 schema 对齐，同时本地回退模式仍可用。
const LOCAL_SCHOOL_DB_FIELDS = new Set([
  'id', 'dbId', 'name', 'districtId', 'districtName', 'schoolStage', 'schoolStageLabel', 'schoolPropertyLabel',
  'schoolKeyLevel', 'eliteCohort', 'group', 'address', 'phone', 'website', 'foundingYear',
  'isBoarding', 'isInternational', 'image', 'admissionInfo', 'contentFile',
  'profileDepth', 'features', 'scoreLines', 'content', 'admissionCode', 'admissionMethods', 'admissionRoutes'
]);

// 仅保留线上表存在的字段（写回文件前调用）
function stripLocalSchoolFields(rec) {
  if (!rec || typeof rec !== 'object') return rec;
  const out = {};
  for (const k of Object.keys(rec)) {
    if (LOCAL_SCHOOL_DB_FIELDS.has(k)) out[k] = rec[k];
  }
  return out;
}

// 读取本地数据时补回派生字段（与 rowToSchool 对 DB 行的处理保持一致）
function deriveLocalSchoolFields(rec) {
  if (!rec || typeof rec !== 'object') return rec;
  const slug = rec.id || '';
  return {
    ...rec,
    districtId: DISTRICT_NAME_TO_ID[rec.districtName] || '',
    schoolStage: inferSchoolStage(rec.schoolStageLabel),
    contentFile: slug ? `content/schools/${slug}.md` : ''
  };
}

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

// 将数据库数据 best-effort 写回本地缓存（schools.json / news.json）。
// 目的：保证 data/schools.json 与 data/news.json 始终与线上数据库对齐（数据库变化时即同步）。
// 在只读文件系统（部分 serverless 环境）下静默失败，不影响主流程。
async function writeSchoolCache(schools) {
  try {
    await writeLocalJson(DATASET_FILES.schools, schools.map(stripLocalSchoolFields));
  } catch (e) {
    console.warn('[data-store] 写 schools 缓存失败（忽略）:', e?.message || e);
  }
}

// 用与线上写缓存完全一致的逻辑重建本地 schools 缓存：
// 读取现有 data/schools.json → deriveLocalSchoolFields 补齐派生字段 → stripLocalSchoolFields → 回写。
// 用途：① 纠正历史上被 LOCAL_SCHOOL_DB_FIELDS 剥离的有损缓存；
//       ② 在无 Supabase 的环境预生成一份自包含、字段完整的降级缓存（避免 Supabase 不可用时列表为空）。
async function regenerateSchoolCache() {
  const raw = await readLocalJson(DATASET_FILES.schools);
  const derived = (Array.isArray(raw) ? raw : []).map(deriveLocalSchoolFields);
  await writeSchoolCache(derived);
  return derived.length;
}

async function writeNewsCache(news) {
  try {
    await writeLocalJson(DATASET_FILES.news, news);
  } catch (e) {
    console.warn('[data-store] 写 news 缓存失败（忽略）:', e?.message || e);
  }
}

// 数据来源始终是线上数据库；schools.json / news.json 仅作为运行时缓存。
// DB 可读时：取数并刷新本地缓存；DB 不可读时：降级到本地缓存文件。
// 进程内 memo 缓存：学校数据极少变动，避免每次请求都打 Supabase 查询 888 行。
// 缓存命中时仍返回同一份不可变 state；调用方均只读不修改，安全共享。
let _storeCache = null;
let _storeCacheAt = 0;
const STORE_CACHE_TTL_MS = 60 * 1000;

async function loadDataStoreFresh() {
  if (isSupabaseConfigured()) {
    try {
      const [schools, news] = await Promise.all([
        loadSchoolsFromSupabase(),
        loadNewsFromSupabase()
      ]);
      const state = ensureDatasets({ schools, news });
      // 数据库数据写回本地缓存，使 schools.json / news.json 始终与线上一致
      await Promise.all([
        writeSchoolCache(state.schools),
        writeNewsCache(state.news)
      ]);
      return state;
    } catch (err) {
      console.warn('[data-store] Supabase 读取失败，降级到本地缓存:', err?.message || err);
    }
  }

  // 降级：读本地缓存（运行时由数据库生成的 schools.json / news.json 等）
  return loadLocalData();
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
  loadLocalData,
  rowToSchool,
  rowToNews,
  schoolToRow,
  newsToRow,
  loadNewsFromSupabase,
  regenerateSchoolCache,
  createSchoolInSupabase,
  updateSchoolInSupabase,
  deleteSchoolFromSupabase,
  createNewsInSupabase,
  updateNewsInSupabase,
  deleteNewsFromSupabase,
  sortBySchoolPriority
};
