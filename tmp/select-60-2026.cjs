// 选 60 所缺 2026 线的公办/民办高中（不含外籍/国际），按区分组，优先市/区重点
const fs = require('fs');
const path = require('path');
function loadEnvLocal() {
  const p = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnvLocal();
const { loadSchoolsList } = require('../shared/data-store');
(async () => {
  const all = await loadSchoolsList();
  const done = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'spotcheck-done.json'), 'utf8')));
  const INTL = /(外籍|国际学校|剑桥|国际课程|美国高中|台商子女|哈罗)/;
  const pool = all.filter(s =>
    ['高中', '完全中学'].includes(s.schoolStageLabel) &&
    s.schoolPropertyLabel !== '外籍' && !INTL.test(s.name || '') &&
    !done.has(s.id)
  );
  const missing2026 = pool.filter(s => {
    const lines = Array.isArray(s.scoreLines) ? s.scoreLines : [];
    return !lines.some(l => Number(l.year) === 2026);
  });
  const KEYP = { '市重点(高中)': 30, '区重点(高中)': 18, '一般高中': 5 };
  const scored = missing2026.map(s => {
    const lines = Array.isArray(s.scoreLines) ? s.scoreLines : [];
    const yrs = new Set(lines.map(l => Number(l.year)));
    let prio = KEYP[s.schoolKeyLevel] || 5;
    if (!yrs.has(2025)) prio += 12;
    if (!yrs.has(2024)) prio += 8;
    if (lines.length === 0) prio += 20;
    return { s, prio, lines };
  }).sort((a, b) => b.prio - a.prio || (a.s.name < b.s.name ? -1 : 1));
  const batch = scored.slice(0, 60);
  console.log(`候选缺2026 ${missing2026.length} | 本批 ${batch.length}`);
  // 按区分组
  const byDist = {};
  batch.forEach(x => {
    const d = x.s.districtName || '未知';
    (byDist[d] = byDist[d] || []).push(x);
  });
  console.log('\n各区学校数:');
  Object.entries(byDist).sort((a, b) => b[1].length - a[1].length)
    .forEach(([d, arr]) => console.log(`  ${d}: ${arr.length}`));
  const out = batch.map(x => ({
    dbName: x.s.name, id: x.s.id, districtName: x.s.districtName,
    keyLevel: x.s.schoolKeyLevel, stageLabel: x.s.schoolStageLabel,
    address: x.s.address, currentScoreLines: x.lines.map(l => ({ year: Number(l.year), score: Number(l.score) })),
    currentAdmCode: x.s.admissionCode || ''
  }));
  fs.writeFileSync(path.join(__dirname, 'spotcheck-batch-60.json'), JSON.stringify(out, null, 2));
  // 同时写出按区分组的派工表，便于拆分到各研究代理
  const distList = Object.entries(byDist).map(([d, arr]) => ({
    district: d, schools: arr.map(x => ({
      dbName: x.s.name, id: x.s.id, keyLevel: x.s.schoolKeyLevel,
      currentScoreLines: x.lines.map(l => ({ year: Number(l.year), score: Number(l.score) })),
      currentAdmCode: x.s.admissionCode || ''
    }))
  }));
  fs.writeFileSync(path.join(__dirname, 'spotcheck-batch-60-districts.json'), JSON.stringify(distList, null, 2));
  console.log('\n已写 tmp/spotcheck-batch-60.json 与 tmp/spotcheck-batch-60-districts.json');
})().catch(e => { console.error(e); process.exit(1); });
