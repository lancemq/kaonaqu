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

function ensureDatasets(data = {}) {
  const schools = Array.isArray(data.schools) ? data.schools : [];
  const policies = Array.isArray(data.policies) ? data.policies : [];
  const news = Array.isArray(data.news) ? data.news : [];
  const districts = buildDistricts(schools, policies);

  return { districts, schools, policies, news };
}

async function loadDataStore() {
  if (hasSupabaseConfig()) {
    try {
      const [schools, policies, news] = await Promise.all([
        listRecords('schools'),
        listRecords('policies'),
        listRecords('news')
      ]);

      if (schools.length || policies.length || news.length) {
        return ensureDatasets({ schools, policies, news });
      }
    } catch (error) {
      // Fall back when database is empty or temporarily unavailable.
    }
  }

  if (hasBlobToken()) {
    try {
      const remote = await loadDataFromBlob();
      if (remote) {
        return ensureDatasets(remote);
      }
    } catch (error) {
      // Fall back to local bundled data when Blob is empty or temporarily unavailable.
    }
  }

  return ensureDatasets(await loadLocalData());
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
  mergeDataStore,
  saveDataStore,
  updateDataStore
};
