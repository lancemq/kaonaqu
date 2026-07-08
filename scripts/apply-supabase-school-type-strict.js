#!/usr/bin/env node
/**
 * 按四值「办学性质」清洗 school_property_label，并同步 is_international（按 slug 定位行）
 *   node scripts/apply-supabase-school-type-strict.js --dry-run  # 预览
 *   node scripts/apply-supabase-school-type-strict.js            # 正式写回
 *
 * 同时更新两列：school_property_label（四值之一）与 is_international（国际课程/外籍/合作办学 → true）。
 */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { getServiceClient, SCHOOLS_TABLE, isSupabaseConfigured } = require('../shared/supabase-client');

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  if (!isSupabaseConfigured()) { console.error('Supabase 未配置'); process.exit(1); }
  const planPath = path.join(process.cwd(), 'reports', 'supabase-school-type-strict-corrections.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const changes = plan.corrections;
  console.log(`纠错计划 ${changes.length} 条（school_property_label + is_international）\n`);

  if (isDryRun) {
    changes.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} (${c.slug})`);
      console.log(`     type: ${c.current_school_property_label} → ${c.proposed_school_property_label}`);
      console.log(`     is_international: ${c.current_is_international} → ${c.proposed_is_international}`);
    });
    console.log('\n[dry-run] 未写入。去掉 --dry-run 正式写回。');
    return;
  }

  const c = getServiceClient();
  let ok = 0, fail = 0;
  const failed = [];
  for (const ch of changes) {
    const patch = { school_property_label: ch.proposed_school_property_label, is_international: ch.proposed_is_international === true };
    const { data, error } = await c.from(SCHOOLS_TABLE).update(patch).eq('slug', ch.slug).select('slug, school_property_label, is_international');
    if (error) { console.error(`✗ ${ch.name}: ${error.message}`); fail++; failed.push(ch.name); }
    else if (!data || data.length !== 1) { console.error(`✗ ${ch.name}: 影响行数异常 (${data ? data.length : 0})`); fail++; failed.push(ch.name); }
    else { ok++; console.log(`✓ ${ch.name}: type=${data[0].school_property_label} intl=${data[0].is_international}`); }
  }
  console.log(`\n完成: ${ok} 成功, ${fail} 失败`);
  if (failed.length) console.log('失败:', failed.join(', '));
  process.exit(fail ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
