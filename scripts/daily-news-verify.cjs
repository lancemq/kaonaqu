// 每日新闻读回验证（通用，pg 直连）：region/title/blocks/乱码 + 当配额数。
// 用法：node scripts/daily-news-verify.cjs [--date=YYYY-MM-DD]
const {
  parseDate, loadMaterials, loadEnvLocal
} = require('./daily-news-common.cjs');

loadEnvLocal();
const { Client } = require('pg');
const ALLOWED_BLOCK_TYPES = new Set(['heading', 'paragraph', 'list', 'quote', 'divider', 'markdown']);

const date = parseDate(process.argv);
const materials = loadMaterials(date);
const allItems = materials.flatMap(m => (m.items || []).map(it => ({ ...it, _region: m.region })));
console.log(`读回验证日期 ${date} | 期望 ${allItems.length} 篇`);

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  await client.connect();
  let ok = 0, fail = 0;
  for (const it of allItems) {
    const { rows } = await client.query('SELECT id,region,title,content FROM news WHERE id=$1', [it.id]);
    const row = rows[0];
    if (!row) { fail++; console.log(`[MISS] (${it._region}) ${it.id} 未找到`); continue; }
    const errs = [];
    if (row.region !== it._region) errs.push('region 不匹配: ' + row.region);
    if ((row.title || '') !== it.title) errs.push('title 不匹配');
    let blocks = row.content || [];
    if (typeof blocks === 'string') { try { blocks = JSON.parse(blocks); } catch { blocks = []; } }
    if (!Array.isArray(blocks) || blocks.length < 6) errs.push('blocks<6: ' + blocks.length);
    let bad = 0;
    for (const b of blocks) {
      if (!ALLOWED_BLOCK_TYPES.has(b.type)) bad++;
      if (b.type === 'heading' && b.level !== 3) bad++;
    }
    if (bad) errs.push('非法/坏 block x' + bad);
    if (JSON.stringify(row).indexOf('\uFFFD') !== -1) errs.push('乱码 U+FFFD');
    if (errs.length) { fail++; console.log(`[FAIL] (${it._region}) ${it.id}`); errs.forEach(e => console.log('   - ' + e)); }
    else { ok++; console.log(`[VERIFY OK] (${it._region}) ${it.id} region=${row.region} blocks=${blocks.length}`); }
  }
  // 分城计数核对
  const counts = await client.query('SELECT region,count(*)::int n FROM news WHERE id LIKE $1 GROUP BY region', [`%${'-' + date.slice(5).replace('-', '')}`]);
  const cnt = Object.fromEntries(counts.rows.map(r => [r.region, r.n]));
  console.log('\n库内当日各城篇数:', JSON.stringify(cnt));
  console.log(`读回验证: ${ok}/${allItems.length} 通过, ${fail} 失败`);
  await client.end();
  if (fail) process.exit(1);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
