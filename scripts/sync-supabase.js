#!/usr/bin/env node

require('../shared/load-env');

const { loadLocalData, mergeDataStore } = require('../shared/data-store');
const { hasSupabaseConfig } = require('../shared/supabase-store');

async function main() {
  if (!hasSupabaseConfig()) {
    throw new Error('SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未配置');
  }

  const localData = await loadLocalData();
  const saved = await mergeDataStore(localData);

  console.log(`Supabase 增量同步完成: ${saved.schools.length} 所学校, ${saved.policies.length} 条政策, ${saved.news.length} 条新闻`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
