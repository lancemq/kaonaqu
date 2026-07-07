#!/usr/bin/env node
/**
 * 合并 admission_code + admission_methods + admission_routes 到 admission_info（JSONB）
 *   admission_info = { code, methods, routes }
 *
 * 用法：
 *   node scripts/merge-admission-info.js --dry-run  # 预览
 *   node scripts/merge-admission-info.js            # 正式执行
 */
require('dotenv').config({ path: '.env.local' });
const { getServiceClient, SCHOOLS_TABLE } = require('../shared/supabase-client');

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  const c = getServiceClient();
  const { data, error } = await c.from(SCHOOLS_TABLE)
    .select('id, name, admission_code, admission_methods, admission_routes');
  if (error) { console.error('查询失败:', error.message); process.exit(1); }

  console.log(`总学校数: ${data.length}`);

  const toUpdate = [];
  for (const r of data) {
    const info = {
      code: r.admission_code || '',
      methods: r.admission_methods || [],
      routes: r.admission_routes || []
    };
    toUpdate.push({ id: r.id, name: r.name, admission_info: info });
  }

  if (isDryRun) {
    for (const item of toUpdate.slice(0, 3)) {
      console.log(`--- ${item.name} ---`);
      console.log(JSON.stringify(item.admission_info));
    }
    console.log(`[dry-run] 将更新 ${toUpdate.length} 条`);
    return;
  }

  let updated = 0;
  for (const item of toUpdate) {
    const { error: upErr } = await c.from(SCHOOLS_TABLE)
      .update({ admission_info: item.admission_info })
      .eq('id', item.id);
    if (upErr) {
      console.error(`更新失败 [${item.name}]:`, upErr.message);
    } else {
      updated++;
    }
  }
  console.log(`合并完成: ${updated} 条成功`);
}

main().catch((err) => { console.error(err); process.exit(1); });
