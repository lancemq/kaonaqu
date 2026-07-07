#!/usr/bin/env node
/**
 * 从备份 JSON 导入 schools 数据到目标库
 *   node scripts/import-schools-to-target.js --dry-run  # 预览
 *   node scripts/import-schools-to-target.js             # 正式导入
 *
 * 环境变量（目标库 supabase-knq-）：
 *   TARGET_SUPABASE_URL
 *   TARGET_SUPABASE_SERVICE_ROLE_KEY
 *
 * 数据来源：data/backups/ 下最新的 schools-*.json
 *
 * 前置条件：目标库已执行 003_target_schools_schema.sql 建表
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TARGET_URL = process.env.TARGET_SUPABASE_URL || '';
const TARGET_KEY = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || '';
const isDryRun = process.argv.includes('--dry-run');

function getLatestBackup() {
  const dir = path.join(process.cwd(), 'data', 'backups');
  const files = fs.readdirSync(dir).filter((f) => /^schools-.*\.json$/.test(f)).sort();
  if (!files.length) throw new Error('未找到备份文件，先运行 node scripts/export-schools-backup.js');
  return path.join(dir, files[files.length - 1]);
}

async function main() {
  if (!TARGET_URL || !TARGET_KEY) {
    console.error('缺少目标库配置：需设置 TARGET_SUPABASE_URL 和 TARGET_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const backupFile = getLatestBackup();
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`备份文件: ${path.basename(backupFile)}`);
  console.log(`待导入: ${backup.count} 条\n`);

  if (isDryRun) {
    console.log('━━━ DRY-RUN 样本（前 3 条）━━━');
    backup.schools.slice(0, 3).forEach((s) => {
      console.log(`  ${s.name} (${s.slug}) — features: ${(s.features || []).length} 项, admission_info: ${JSON.stringify(s.admission_info || {}).slice(0, 60)}`);
    });
    console.log(`\n[dry-run] 将向目标库导入 ${backup.count} 条。`);
    return;
  }

  const client = createClient(TARGET_URL, TARGET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 批量插入，每批 50 条
  const BATCH = 50;
  let inserted = 0;
  let failed = 0;
  const failedList = [];

  for (let i = 0; i < backup.schools.length; i += BATCH) {
    const batch = backup.schools.slice(i, i + BATCH);
    const rows = batch.map(({ id, ...rest }) => ({ id, ...rest })); // 保留原 id
    const { data, error } = await client.from('schools').insert(rows).select('id');
    if (error) {
      console.error(`批次 ${i / BATCH + 1} 失败:`, error.message);
      failed += batch.length;
      batch.forEach((r) => failedList.push(r.name));
    } else {
      inserted += data.length;
    }
    if ((i / BATCH + 1) % 5 === 0) {
      console.log(`  进度: ${Math.min(i + BATCH, backup.schools.length)}/${backup.schools.length}`);
    }
  }

  console.log(`\n导入完成: ${inserted} 条成功${failed ? `，${failed} 条失败` : ''}`);
  if (failedList.length) {
    console.log('失败列表（前 10）:', failedList.slice(0, 10));
  }

  if (inserted > 0) {
    console.log('\n⚠️  导入后请在目标库 SQL Editor 执行以下语句重置序列：');
    console.log("    SELECT setval('schools_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.schools));");
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
