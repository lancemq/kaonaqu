#!/usr/bin/env node
/**
 * 将审计得到的纠错计划写回 Supabase schools 表（按 slug 定位行）
 *   node scripts/apply-supabase-tier-type-corrections.js --dry-run  # 预览
 *   node scripts/apply-supabase-tier-type-corrections.js            # 正式写回
 *
 * 仅更新 tier 与 school_property_label 两列。每行更新后校验影响行数=1。
 */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { getServiceClient, SCHOOLS_TABLE, isSupabaseConfigured } = require('../shared/supabase-client');

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  if (!isSupabaseConfigured()) {
    console.error('Supabase 未配置，请检查 .env.local');
    process.exit(1);
  }
  const planPath = path.join(process.cwd(), 'reports', 'supabase-tier-type-corrections.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

  const changes = plan.corrections.filter(
    (c) => c.proposed_tier !== c.current_tier || c.proposed_school_property_label !== c.current_school_property_label
  );
  console.log(`纠错计划共 ${plan.corrections.length} 条，需实际变更 ${changes.length} 条\n`);

  if (isDryRun) {
    changes.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} (${c.slug})`);
      if (c.proposed_tier !== c.current_tier) console.log(`     tier: ${c.current_tier || '(空)'} → ${c.proposed_tier}`);
      if (c.proposed_school_property_label !== c.current_school_property_label) console.log(`     type: ${c.current_school_property_label || '(空)'} → ${c.proposed_school_property_label}`);
    });
    console.log('\n[dry-run] 未写入。去掉 --dry-run 正式写回。');
    return;
  }

  const c = getServiceClient();
  let ok = 0;
  let fail = 0;
  const failed = [];

  for (const ch of changes) {
    const patch = {};
    if (ch.proposed_tier !== ch.current_tier) patch.tier = ch.proposed_tier;
    if (ch.proposed_school_property_label !== ch.current_school_property_label) patch.school_property_label = ch.proposed_school_property_label;

    const { data, error } = await c
      .from(SCHOOLS_TABLE)
      .update(patch)
      .eq('slug', ch.slug)
      .select('slug, tier, school_property_label');

    if (error) {
      console.error(`✗ ${ch.name}: ${error.message}`);
      fail++;
      failed.push(ch.name);
    } else if (!data || data.length !== 1) {
      console.error(`✗ ${ch.name}: 影响行数异常 (${data ? data.length : 0})，可能 slug 不唯一`);
      fail++;
      failed.push(ch.name);
    } else {
      ok++;
      console.log(`✓ ${ch.name}: tier=${data[0].tier} type=${data[0].school_property_label}`);
    }
  }

  console.log(`\n完成: ${ok} 成功, ${fail} 失败`);
  if (failed.length) console.log('失败:', failed.join(', '));
  process.exit(fail ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
