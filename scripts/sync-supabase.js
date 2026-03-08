#!/usr/bin/env node

const { loadLocalData, saveDataStore } = require('../shared/data-store');
const { hasSupabaseConfig } = require('../shared/supabase-store');

async function main() {
  if (!hasSupabaseConfig()) {
    throw new Error('SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未配置');
  }

  const localData = await loadLocalData();
  const saved = await saveDataStore(localData);

  console.log(`Supabase 同步完成: ${saved.schools.length} 所学校, ${saved.policies.length} 条政策, ${saved.news.length} 条新闻`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
