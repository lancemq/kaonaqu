#!/usr/bin/env node
/**
 * 批量清空模板化 description（方案 A）
 *   node scripts/clear-template-descriptions.js --dry-run  # 预览
 *   node scripts/clear-template-descriptions.js            # 正式执行
 *
 * 清空条件：description 命中模板占位文字（与 validate-schools-data.js 一致）
 */
require('dotenv').config({ path: '.env.local' });
const { getServiceClient, SCHOOLS_TABLE } = require('../shared/supabase-client');

const isDryRun = process.argv.includes('--dry-run');

function hasTemplateResidue(text) {
  if (!text) return false;
  return /后续可继续补充|当前先完成官方名单收录|待补充|待完善|TODO|占位/.test(text);
}

async function main() {
  const c = getServiceClient();
  const { data, error } = await c.from(SCHOOLS_TABLE).select('id, name, slug, district_name, description');
  if (error) { console.error('查询失败:', error.message); process.exit(1); }

  const targets = data.filter((r) => hasTemplateResidue(r.description));
  console.log(`总记录: ${data.length}，命中模板 description: ${targets.length}\n`);

  if (isDryRun) {
    console.log('━━━ DRY-RUN 样本（前 8 条）━━━');
    targets.slice(0, 8).forEach((r) => {
      console.log(`  ${r.name} (${r.slug})`);
      console.log(`    ${String(r.description).slice(0, 70)}...`);
    });
    console.log(`\n[dry-run] 将清空 ${targets.length} 条 description 为空字符串。`);
    return;
  }

  let updated = 0;
  let failed = 0;
  for (const r of targets) {
    const { error: upErr } = await c.from(SCHOOLS_TABLE)
      .update({ description: '' })
      .eq('id', r.id);
    if (upErr) {
      console.error(`更新失败 [${r.name}]:`, upErr.message);
      failed++;
    } else {
      updated++;
    }
  }
  console.log(`清空完成: ${updated} 条成功${failed ? `，${failed} 条失败` : ''}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
