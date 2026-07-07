#!/usr/bin/env node
/**
 * 清理 description 列里的"梯队标签 + 说明"块
 *   去除开头：**梯队标签：** XXX\n\n该校属于/是...说明...\n\n
 *
 * 用法：
 *   node scripts/clean-description-tier-tag.js --dry-run  # 预览
 *   node scripts/clean-description-tier-tag.js            # 正式执行
 */
require('dotenv').config({ path: '.env.local' });
const { getServiceClient, SCHOOLS_TABLE } = require('../shared/supabase-client');

const isDryRun = process.argv.includes('--dry-run');

function cleanTierTag(text) {
  if (!text) return '';
  return text.replace(/^(?:\*\*梯队标签：\*\*[^\n]*\n\s*)?该校(?:属于|是)[^\n]*\n\s*/u, '');
}

async function main() {
  const c = getServiceClient();
  const { data, error } = await c.from(SCHOOLS_TABLE).select('id, name, description');
  if (error) { console.error('查询失败:', error.message); process.exit(1); }

  console.log(`总学校数: ${data.length}`);

  const toUpdate = [];
  for (const r of data) {
    const original = r.description || '';
    const cleaned = cleanTierTag(original);
    if (cleaned !== original) {
      toUpdate.push({ id: r.id, name: r.name, original, cleaned });
    }
  }
  console.log(`需清理: ${toUpdate.length} 条\n`);

  if (isDryRun) {
    for (const item of toUpdate.slice(0, 5)) {
      console.log(`--- ${item.name} ---`);
      console.log('前:', item.original.slice(0, 80).replace(/\n/g, '\\n'));
      console.log('后:', item.cleaned.slice(0, 80).replace(/\n/g, '\\n'));
      console.log();
    }
    console.log('[dry-run] 未写入。正式执行去掉 --dry-run');
    return;
  }

  let updated = 0;
  for (const item of toUpdate) {
    const { error: upErr } = await c.from(SCHOOLS_TABLE)
      .update({ description: item.cleaned })
      .eq('id', item.id);
    if (upErr) {
      console.error(`更新失败 [${item.name}]:`, upErr.message);
    } else {
      updated++;
    }
  }
  console.log(`清理完成: ${updated} 条成功`);
}

main().catch((err) => { console.error(err); process.exit(1); });
