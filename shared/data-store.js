const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { buildDistricts, DISTRICT_NAME_TO_ID } = require('./data-schema');
const { isSupabaseConfigured, getServiceClient, SCHOOLS_TABLE } = require('./supabase-client');

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
  policies: 'policies.json',
  news: 'news.json'
};

// Bundled JSON fallback for serverless environments where runtime fs paths may differ.
const BUNDLED_DATASETS = {
  districts: require('../data/districts.json'),
  schools: require('../data/schools.json'),
  policies: require('../data/policies.json'),
  news: require('../data/news.json')
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
    if (!Array.isArray(fallback)) {
      throw error;
    }
    return fallback;
  }
}

async function writeLocalJson(filename, payload) {
  await fs.writeFile(path.join(DATA_DIR, filename), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function loadLocalData() {
  const [districts, schools, policies, news] = await Promise.all([
    readLocalJson(DATASET_FILES.districts),
    readLocalJson(DATASET_FILES.schools),
    readLocalJson(DATASET_FILES.policies),
    readLocalJson(DATASET_FILES.news)
  ]);

  return { districts, schools, policies, news };
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
    tier: row.tier,
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
    profileDepth: row.profile_depth,
    features: row.features || []
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
  const policies = Array.isArray(data.policies) ? data.policies : [];
  const news = Array.isArray(data.news) ? data.news : [];
  const districts = buildDistricts(schools, policies);

  return { districts, schools, policies, news };
}

async function loadDataStore() {
  const local = await loadLocalData();

  let schools = local.schools;

  if (isSupabaseConfigured()) {
    try {
      schools = await loadSchoolsFromSupabase();
    } catch (err) {
      console.warn('[data-store] Supabase 读取失败，降级到本地文件:', err.message);
      schools = local.schools;
    }
  }

  return ensureDatasets({ ...local, schools });
}

async function saveDataStore(nextState) {
  const payload = ensureDatasets(nextState);

  await Promise.all([
    writeLocalJson(DATASET_FILES.districts, payload.districts),
    writeLocalJson(DATASET_FILES.schools, payload.schools),
    writeLocalJson(DATASET_FILES.policies, payload.policies),
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
  sortBySchoolPriority
};
