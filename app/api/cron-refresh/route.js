import { NextResponse } from 'next/server';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { mergeDataStore } = require('../../../shared/data-store');
const { hasSupabaseConfig } = require('../../../shared/supabase-store');
const { hasBlobToken } = require('../../../shared/blob-data');

function isAuthorized(request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return false;
  }

  return request.headers.get('authorization') === `Bearer ${expected}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasSupabaseConfig() && !hasBlobToken()) {
    return NextResponse.json(
      { error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 或 BLOB_READ_WRITE_TOKEN 至少需要配置一组' },
      { status: 500 }
    );
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

    const { main: runCrawlerPipeline } = require('../../../crawler/src/index');
    const result = await runCrawlerPipeline();
    const merged = await mergeDataStore(result.processed);

    return NextResponse.json({
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
