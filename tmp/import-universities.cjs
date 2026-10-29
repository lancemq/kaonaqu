// 高校名录导入：tmp/universities-seed.json → Supabase universities 表。
// 用法: node tmp/import-universities.cjs           # DRY
//       node tmp/import-universities.cjs --exec    # 写入
// 幂等：skip 已存在 slug / moe_code（duplicate 返回 skipped 不报错）。
// 限速：50 条/批 insert，批间歇 300ms，避免 pooler 掐线。
const fs = require('fs');
const path = require('path');
function loadEnvLocal() {
  const p = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return;
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnvLocal();
const EXEC = process.argv.includes('--exec');
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL || process.env.KNQ_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.KNQ_SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('缺 Supabase 环境变量'); process.exit(1); }
const client = createClient(URL, KEY, { auth: { persistSession: false } });

(async () => {
  const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'universities-seed.json'), 'utf8'));
  console.log(`seed ${seed.length} 条 · 模式 ${EXEC ? '⚠️ EXEC' : 'DRY'}`);

  // 库内已有 slug/moe_code（幂等 skip 依据）
  const existing = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from('universities').select('slug,moe_code').range(from, from + 999);
    if (error) throw new Error(error.message);
    data.forEach((r) => { existing.add(r.slug); if (r.moe_code) existing.add(r.moe_code); });
    if (data.length < 1000) break;
  }
  console.log(`库内已有 ${[...existing].filter((x) => x.includes('-')).length} 条 slug`);

  let created = 0, skipped = 0, failed = 0;
  const BATCH = 50;
  for (let i = 0; i < seed.length; i += BATCH) {
    const batch = seed.slice(i, i + BATCH);
    const fresh = batch.filter((u) => !existing.has(u.slug) && !existing.has(u.moeCode));
    skipped += batch.length - fresh.length;
    if (!fresh.length) continue;
    if (EXEC) {
      const rows = fresh.map((u) => ({
        slug: u.slug, moe_code: u.moeCode, name: u.name, aliases: u.aliases,
        province: u.province, city: u.city, is_undergrad: u.isUndergrad,
        nature: u.nature, affiliation: u.affiliation, tags: u.tags,
        disciplines: u.disciplines, founding_year: u.foundingYear,
        address: u.address, website: u.website, content: u.content,
        score_lines: u.scoreLines, outcome_stats: u.outcomeStats,
        profile_depth: u.profileDepth, info_verified: u.infoVerified, audit_notes: u.auditNotes
      }));
      const { error } = await client.from('universities').insert(rows);
      if (error) {
        console.error(`批次 ${i / BATCH + 1} 失败: ${error.message}`);
        failed += rows.length;
      } else {
        created += rows.length;
      }
      await new Promise((r) => setTimeout(r, 300));
    } else {
      created += fresh.length;
    }
    if ((i / BATCH) % 10 === 0) console.log(`  ...${i + batch.length}/${seed.length}（新 ${created} skip ${skipped}）`);
  }
  console.log(`\n${EXEC ? '写入' : 'DRY'} 完成: 新建 ${created} / 跳过 ${skipped} / 失败 ${failed}`);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
