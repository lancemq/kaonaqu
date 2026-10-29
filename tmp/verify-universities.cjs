// 高校名录读回验证：对照 seed 核对总数/省份分布/标签命中/moe_code 唯一。
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
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async () => {
  const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'universities-seed.json'), 'utf8'));
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from('universities')
      .select('slug,moe_code,name,province,is_undergrad,nature,affiliation,tags')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  console.log(`库内 ${rows.length} / seed ${seed.length} ${rows.length === seed.length ? '✓' : '⚠️ 不一致'}`);

  // moe_code 唯一
  const codes = rows.map((r) => r.moe_code).filter(Boolean);
  console.log(`moe_code 唯一: ${new Set(codes).size === codes.length ? '✓' : '⚠️ 有重复'}`);

  // 省份分布对照
  const dbProv = rows.reduce((m, r) => { m[r.province] = (m[r.province] || 0) + 1; return m; }, {});
  const seedProv = seed.reduce((m, r) => { m[r.province] = (m[r.province] || 0) + 1; return m; }, {});
  const diff = Object.keys({ ...dbProv, ...seedProv }).filter((k) => dbProv[k] !== seedProv[k]);
  console.log(`省份分布: ${diff.length === 0 ? '✓ 31 省全对' : '⚠️ 差异 ' + diff.join(',')}`);

  // 标签命中
  const tagCount = rows.reduce((m, r) => { for (const t of r.tags || []) m[t] = (m[t] || 0) + 1; return m; }, {});
  console.log(`tags: 双一流=${tagCount['双一流'] || 0}(期望145) 985=${tagCount['985'] || 0}(期望38) 211=${tagCount['211'] || 0}(期望109)`);

  // 抽样 5 所（含清华、苏大、地方专科）
  const picks = ['北京-清华大学', '江苏-苏州大学', '河南-黄河水利职业技术学院', '上海-上海体育大学', '云南-滇西应用技术大学'];
  for (const s of picks) {
    const hit = rows.find((r) => r.slug === s);
    console.log(hit ? `✓ ${hit.slug} | ${hit.nature} | ${hit.affiliation} | tags=${(hit.tags || []).join('/') || '-'}` : `⚠️ 未找到 ${s}`);
  }
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
