// 无锡重复扫描（与 scan-nanjing-duplicates.cjs 同口径）
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
function loadEnv() {
  const env = {};
  const txt = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}
const env = loadEnv();
let url = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
url = url.replace(/[?&]sslmode=[^&]+/g, '');
const norm = (n) => (n || '').replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')').toLowerCase();
async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, channelBinding: 'disable', keepAlive: true });
  await c.connect();
  const { rows } = await c.query(
    `SELECT slug, name, school_stage_label, admission_info->>'code' AS code
       FROM schools WHERE region='wuxi'`);
  const byCode = new Map(), byNorm = new Map();
  for (const r of rows) {
    if (r.code) { if (!byCode.has(r.code)) byCode.set(r.code, []); byCode.get(r.code).push(r); }
    const k = norm(r.name); if (!byNorm.has(k)) byNorm.set(k, []); byNorm.get(k).push(r);
  }
  // 无锡合法拆分：同名+（初中部）后缀对 / 同名校区对
  const legal = (a, b) => {
    const stagePair = a.name === b.name + '（初中部）' || b.name === a.name + '（初中部）';
    const campus = /（.+校区）/.test(a.name) && /（.+校区）/.test(b.name) && a.name.replace(/（.+校区）/, '') === b.name.replace(/（.+校区）/, '');
    return stagePair || campus;
  };
  let illegal = 0;
  const seen = new Set();
  const check = (a, b) => {
    if (a.slug === b.slug) return;
    const key = [a.slug, b.slug].sort().join('|');
    if (seen.has(key)) return; seen.add(key);
    if (!legal(a, b)) { illegal++; console.log(`非法: ${a.slug} <-> ${b.slug}`); }
  };
  for (const g of byCode.values()) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) check(g[i], g[j]);
  for (const g of byNorm.values()) if (norm(g[0].name)) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) check(g[i], g[j]);
  console.log(`无锡 ${rows.length} 行 | 非法重复对: ${illegal}`);
  await c.end();
  if (illegal > 0) process.exit(2);
}
main().catch(e => { console.error(e.message); process.exit(1); });
