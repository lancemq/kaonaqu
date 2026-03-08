const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { sendJson } = require('./_utils');
const { mergeDataStore } = require('../shared/data-store');
const { hasSupabaseConfig } = require('../shared/supabase-store');
const { hasBlobToken } = require('../shared/blob-data');

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return false;
  }

  return req.headers.authorization === `Bearer ${expected}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  if (!hasSupabaseConfig() && !hasBlobToken()) {
    sendJson(res, 500, { error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 或 BLOB_READ_WRITE_TOKEN 至少需要配置一组' });
    return;
  }

  const runId = Date.now().toString(36);
  const runtimeRoot = path.join(os.tmpdir(), `kaonaqu-${runId}`);
  const runtimeRawDir = path.join(runtimeRoot, 'crawler-data', 'raw');
  const runtimeProcessedDir = path.join(runtimeRoot, 'crawler-data', 'processed');
  const runtimeSiteDataDir = path.join(runtimeRoot, 'site-data');

  process.env.KAONAQU_RUNTIME_RAW_DIR = runtimeRawDir;
  process.env.KAONAQU_RUNTIME_PROCESSED_DIR = runtimeProcessedDir;
  process.env.KAONAQU_RUNTIME_ROOT_DATA_DIR = runtimeSiteDataDir;

  try {
    await fs.mkdir(runtimeRawDir, { recursive: true });
    await fs.mkdir(runtimeProcessedDir, { recursive: true });
    await fs.mkdir(runtimeSiteDataDir, { recursive: true });

    const { main: runCrawlerPipeline } = require('../crawler/src/index');
    const result = await runCrawlerPipeline();
    const merged = await mergeDataStore(result.processed);

    sendJson(res, 200, {
      ok: true,
      ranAt: new Date().toISOString(),
      counts: {
        districts: merged.districts.length,
        schools: merged.schools.length,
        policies: merged.policies.length,
        news: merged.news.length
      },
      imported: {
        schools: result.processed.schools.length,
        policies: result.processed.policies.length,
        news: result.processed.news.length
      },
      storage: hasSupabaseConfig() ? 'supabase' : 'blob',
      mode: 'incremental'
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message
    });
  }
};
