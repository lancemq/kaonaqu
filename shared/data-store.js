const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { loadDataFromBlob, uploadDataToBlob, hasBlobToken } = require('./blob-data');
const { buildDistricts } = require('./data-schema');
const { hasSupabaseConfig, listRecords, replaceRecords, upsertRecords } = require('./supabase-store');

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

async function readLocalJson(filename) {
  const content = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
  return JSON.parse(content);
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
  const local = await loadLocalData().catch(() => ({ districts: [], schools: [], policies: [], news: [] }));

  if (hasSupabaseConfig()) {
    try {
      const [schools, policies, news] = await Promise.all([
        listRecords('schools'),
        listRecords('policies'),
        listRecords('news')
      ]);

      if (schools.length || policies.length || news.length) {
        return ensureDatasets({
          schools: mergeRecords(local.schools, schools),
          policies: mergeRecords(local.policies, policies),
          news: mergeRecords(local.news, news)
        });
      }
    } catch (error) {
      // Fall back when database is empty or temporarily unavailable.
    }
  }

  if (hasBlobToken()) {
    try {
      const remote = await loadDataFromBlob();
      if (remote) {
        return ensureDatasets({
          schools: mergeRecords(local.schools, remote.schools),
          policies: mergeRecords(local.policies, remote.policies),
          news: mergeRecords(local.news, remote.news)
        });
      }
    } catch (error) {
      // Fall back to local bundled data when Blob is empty or temporarily unavailable.
    }
  }

  return ensureDatasets(local);
}

async function saveDataStore(nextState) {
  const payload = ensureDatasets(nextState);

  if (hasSupabaseConfig()) {
    await Promise.all([
      replaceRecords('schools', payload.schools),
      replaceRecords('policies', payload.policies),
      replaceRecords('news', payload.news)
    ]);
    return payload;
  }

  if (hasBlobToken()) {
    await uploadDataToBlob(payload);
    return payload;
  }

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

  if (hasSupabaseConfig()) {
    const current = await loadDataStore();
    const merged = ensureDatasets({
      schools: [...payload.schools, ...current.schools.filter((item) => !payload.schools.some((next) => next.id === item.id))],
      policies: [...payload.policies, ...current.policies.filter((item) => !payload.policies.some((next) => next.id === item.id))],
      news: [...payload.news, ...current.news.filter((item) => !payload.news.some((next) => next.id === item.id))]
    });

    await Promise.all([
      upsertRecords('schools', payload.schools),
      upsertRecords('policies', payload.policies),
      upsertRecords('news', payload.news)
    ]);

    return merged;
  }

  if (hasBlobToken()) {
    const current = await loadDataStore();
    const merged = ensureDatasets({
      schools: [...payload.schools, ...current.schools.filter((item) => !payload.schools.some((next) => next.id === item.id))],
      policies: [...payload.policies, ...current.policies.filter((item) => !payload.policies.some((next) => next.id === item.id))],
      news: [...payload.news, ...current.news.filter((item) => !payload.news.some((next) => next.id === item.id))]
    });
    await uploadDataToBlob(merged);
    return merged;
  }

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
  updateDataStore
};
