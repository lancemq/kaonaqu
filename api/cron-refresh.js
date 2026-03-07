const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { sendJson } = require('./_utils');
const { uploadDataToBlob } = require('../shared/blob-data');

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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    sendJson(res, 500, { error: 'BLOB_READ_WRITE_TOKEN 未配置' });
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
    const uploaded = await uploadDataToBlob(result.processed);

    sendJson(res, 200, {
      ok: true,
      ranAt: new Date().toISOString(),
      counts: {
        districts: result.processed.districts.length,
        schools: result.processed.schools.length,
        policies: result.processed.policies.length,
        news: result.processed.news.length
      },
      uploaded
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message
    });
  }
};
