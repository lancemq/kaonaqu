// 每日新闻写库（通用，幂等 upsert，region 按文件映射，pg 直连）。
// 用法：node scripts/daily-news-import.cjs [--date=YYYY-MM-DD] [--exec]
// 不带 --exec 为 DRY：只预览将写入的条目 + 查库去重检查，不写库。
// 写库前必须已完成隧道自愈与备份（由调用方在同一流程内保证）。
const fs = require('fs');
const {
  REGIONS, parseDate, mmdd, loadMaterials, loadEnvLocal
} = require('./daily-news-common.cjs');

loadEnvLocal();
const { Client } = require('pg');

const date = parseDate(process.argv);
const EXEC = process.argv.includes('--exec');
const materials = loadMaterials(date);
const allItems = materials.flatMap(m => (m.items || []).map(it => ({ ...it, _region: m.region })));
console.log(`日期 ${date} | 待写 ${allItems.length} 篇 (${materials.map(m => m.region + ':' + (m.items ? m.items.length : 'MISSING')).join(' ')})`);

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  await client.connect();

  // 前置去重：查库内当日同后缀 id，若已存在则拦截（防重复触发超标，参见 11-23 事故）
  const suffix = '-' + mmdd(date);
  const dup = await client.query(
    `SELECT id FROM news WHERE id LIKE $1`,
    [`%${suffix}`]
  );
  const existing = new Set(dup.rows.map(r => r.id));
  const conflicts = allItems.filter(it => existing.has(it.id));
  if (conflicts.length) {
    console.log(`\n[ABORT] 库内已存在 ${conflicts.length} 条同日 id，疑似重复触发：`);
    conflicts.forEach(it => console.log('   - ' + it.id));
    console.log('如需覆盖请人工确认后单独处理。未写库。');
    await client.end();
    process.exit(2);
  }

  if (!EXEC) {
    console.log('\n[DRY] 未写库。将写入：');
    allItems.forEach(it => console.log(`   [${it._region}] ${it.id} | ${it.title.slice(0, 36)}`));
    await client.end();
    return;
  }

  // 幂等写入：先 INSERT，冲突则整行 UPDATE（勿改成只传变更字段，否则 content 会被置空）
  const { createNewsInSupabase, updateNewsInSupabase } = require('../shared/data-store');
  let insert = 0, update = 0, fail = 0;
  for (const it of allItems) {
    const { _region, ...item } = it;
    const record = { ...item, region: _region, relatedSchoolIds: item.relatedSchoolIds || [], updatedAt: new Date().toISOString() };
    try {
      await createNewsInSupabase(record);
      insert++;
      console.log(`[INSERT] (${_region}) ${item.id}`);
    } catch (e) {
      if (String(e.message).includes('409') || String(e.message).includes('duplicate') || String(e.code) === '23505') {
        try {
          await updateNewsInSupabase(item.id, record);
          update++;
          console.log(`[UPDATE] (${_region}) ${item.id}`);
        } catch (e2) { fail++; console.log(`[FAIL-UPDATE] ${item.id} => ${e2.message}`); }
      } else { fail++; console.log(`[FAIL] ${item.id} => ${e.message}`); }
    }
  }
  console.log(`\n写库完成: INSERT ${insert} / UPDATE ${update} / FAIL ${fail} / 总 ${allItems.length}`);
  await client.end();
  if (fail) process.exit(1);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
