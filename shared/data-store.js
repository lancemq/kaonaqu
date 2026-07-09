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
// 注意：schools.json 现在视为运行时缓存（由数据库生成、已 gitignore，不在仓库中），
// 因此刻意不在这里 require 它——文件缺失时模块加载也不应崩溃。
function safeRequire(p) {
  try {
    return require(p);
  } catch (e) {
    return undefined;
  }
}

const BUNDLED_DATASETS = {
  districts: safeRequire('../data/districts.json'),
  news: safeRequire('../data/news.json')
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
  const [districts, schoolsRaw, news] = await Promise.all([
    readLocalJson(DATASET_FILES.districts),
    readLocalJson(DATASET_FILES.schools),
    readLocalJson(DATASET_FILES.news)
  ]);
  const schools = (Array.isArray(schoolsRaw) ? schoolsRaw : []).map(deriveLocalSchoolFields);

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
    description: row.description,
    achievements: row.achievements,
    admissionNotes: row.admission_notes,
    admissionCode: row.admission_info?.code || '',
    admissionMethods: row.admission_info?.methods || [],
    admissionRoutes: row.admission_info?.routes || [],
    contentFile: slug ? `content/schools/${slug}.md` : '',
    profileDepth: row.profile_depth || 'enhanced',
    features: row.features || []
  };
}

// === 本地 JSON 与数据库表对齐 ===
// data/schools.json 只应保留线上 schools 表存在的字段（camelCase 映射）。
// 共 24 个：线上 22 列 + admission_info(jsonb) 拆出的 admissionCode/Methods/Routes。
// 派生字段 districtId / schoolStage / contentFile 不是 DB 列，读取时补回、写回时剥离，
// 以保证本地文件始终与数据库 schema 对齐，同时本地回退模式仍可用。
const LOCAL_SCHOOL_DB_FIELDS = new Set([
  'id', 'dbId', 'name', 'districtName', 'schoolStageLabel', 'schoolPropertyLabel',
  'schoolKeyLevel', 'eliteCohort', 'group', 'address', 'phone', 'website', 'foundingYear',
  'isBoarding', 'isInternational', 'image', 'description', 'achievements', 'admissionNotes',
  'profileDepth', 'features', 'admissionCode', 'admissionMethods', 'admissionRoutes'
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
    content: row.content || '',
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

function toTimestamp(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function getRecordCompleteness(record = {}) {
  return Object.values(record).reduce((count, value) => {
    if (Array.isArray(value)) {
      return count + (value.length ? 1 : 0);
    }
    if (value && typeof value === 'object') {
      return count + getRecordCompleteness(value);
    }
    return count + (value !== undefined && value !== null && value !== '' ? 1 : 0);
  }, 0);
}

function mergeRecordPair(base = {}, incoming = {}) {
  const merged = { ...base };

  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) {
      const current = Array.isArray(merged[key]) ? merged[key] : [];
      merged[key] = Array.from(new Set([...current, ...value].filter(Boolean)));
      continue;
    }

    if (value && typeof value === 'object') {
      const current = merged[key] && typeof merged[key] === 'object' ? merged[key] : {};
      merged[key] = mergeRecordPair(current, value);
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      merged[key] = value;
    }
  }

  return merged;
}

function pickPreferredRecord(current, next) {
  if (!current) {
    return next;
  }

  const currentTime = toTimestamp(current.updatedAt || current.publishedAt);
  const nextTime = toTimestamp(next.updatedAt || next.publishedAt);
  if (nextTime > currentTime) {
    return mergeRecordPair(current, next);
  }
  if (nextTime < currentTime) {
    return mergeRecordPair(next, current);
  }

  const currentCompleteness = getRecordCompleteness(current);
  const nextCompleteness = getRecordCompleteness(next);
  return nextCompleteness >= currentCompleteness
    ? mergeRecordPair(current, next)
    : mergeRecordPair(next, current);
}

function mergeRecords(...collections) {
  const recordMap = new Map();

  for (const collection of collections) {
    for (const item of Array.isArray(collection) ? collection : []) {
      if (!item || !item.id) {
        continue;
      }
      recordMap.set(item.id, pickPreferredRecord(recordMap.get(item.id), item));
    }
  }

  return Array.from(recordMap.values()).sort((left, right) => {
    const timeDiff = toTimestamp(right.updatedAt || right.publishedAt) - toTimestamp(left.updatedAt || left.publishedAt);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return String(left.id).localeCompare(String(right.id));
  });
}

function ensureDatasets(data = {}) {
  const schools = Array.isArray(data.schools) ? data.schools : [];
  const news = Array.isArray(data.news) ? data.news : [];
  const districts = buildDistricts(schools, news);

  return { districts, schools, news };
}

// 将数据库数据 best-effort 写回本地缓存（schools.json）。
// 目的：保证 data/schools.json 始终与线上数据库对齐（数据库变化时即同步）。
// 在只读文件系统（部分 serverless 环境）下静默失败，不影响主流程。
async function writeSchoolCache(schools) {
  try {
    await writeLocalJson(DATASET_FILES.schools, schools.map(stripLocalSchoolFields));
  } catch (e) {
    console.warn('[data-store] 写 schools 缓存失败（忽略）:', e?.message || e);
  }
}

// 数据来源始终是线上数据库；schools.json 仅作为运行时缓存。
// DB 可读时：取数并刷新本地缓存；DB 不可读时：降级到本地缓存文件。
async function loadDataStore() {
  if (isSupabaseConfigured()) {
    try {
      const [schools, news] = await Promise.all([
        loadSchoolsFromSupabase(),
        loadNewsFromSupabase()
      ]);
      const state = ensureDatasets({ schools, news });
      // 数据库数据写回本地缓存，使 schools.json 始终与线上一致
      await writeSchoolCache(state.schools);
      return state;
    } catch (err) {
      console.warn('[data-store] Supabase 读取失败，降级到本地缓存:', err?.message || err);
    }
  }

  // 降级：读本地缓存（运行时由数据库生成的 schools.json 等）
  return loadLocalData();
}

async function saveDataStore(nextState) {
  const payload = ensureDatasets(nextState);

  await Promise.all([
    writeLocalJson(DATASET_FILES.districts, payload.districts),
    writeLocalJson(DATASET_FILES.schools, payload.schools.map(stripLocalSchoolFields)),
    writeLocalJson(DATASET_FILES.news, payload.news)
  ]);

  return payload;
}

async function mergeDataStore(nextState) {
  const payload = ensureDatasets(nextState);

  return saveDataStore(payload);
}

async function updateDataStore(updater) {
  const current = await loadDataStore();
  const nextState = await updater(current);
  return saveDataStore(nextState);
}

module.exports = {
  ensureDatasets,
  loadDataStore,
  loadLocalData,
  mergeRecords,
  mergeDataStore,
  saveDataStore,
  updateDataStore,
  rowToSchool,
  rowToNews,
  loadNewsFromSupabase,
  sortBySchoolPriority
};
