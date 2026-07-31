// 本轮（分数线+升学成绩专项）选校：在原有缺陷基础上加入「缺2026线」权重
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
  const donePath = path.join(__dirname, 'spotcheck-done.json');
  const done = new Set(JSON.parse(fs.readFileSync(donePath, 'utf8')));
  const INTL = /(外籍|国际学校|剑桥|国际课程|美国高中|台商子女|哈罗)/;
  const pool = all.filter((s) => ['高中', '完全中学'].includes(s.schoolStageLabel)
    && ['市重点(高中)', '区重点(高中)', '一般高中'].includes(s.schoolKeyLevel)
    && s.schoolPropertyLabel !== '外籍' && !INTL.test(s.name || '') && !done.has(s.id));

  const scored = pool.map((s) => {
    const lines = Array.isArray(s.scoreLines) ? s.scoreLines : [];
    const yrs = new Set(lines.map((l) => l && Number(l.year)));
    const reasons = [];
    let prio = 0;
    if (lines.length === 0) { prio += 60; reasons.push('分数线为空'); }
    else {
      if (!yrs.has(2025)) { prio += 50; reasons.push('缺2025线'); }
      if (!yrs.has(2026)) { prio += 40; reasons.push('缺2026线'); }
      if (lines.length < 3) { prio += 20; reasons.push('年份<3'); }
    }
    if (s.schoolKeyLevel === '市重点(高中)') prio += 12;
    else if (s.schoolKeyLevel === '区重点(高中)') prio += 8;
    return { s, prio, reasons, lines };
  }).filter((x) => x.prio > 12);

  scored.sort((a, b) => b.prio - a.prio || (a.s.name < b.s.name ? -1 : 1));
  const batch = scored.slice(0, 20);
  console.log('候选 ' + pool.length + ' | 有问题 ' + scored.length + ' | 本批 ' + batch.length + ':');
  batch.forEach((x, i) => {
    const idx = String(i + 1).padStart(2);
    console.log(idx + '. [' + x.s.schoolKeyLevel + '] ' + x.s.name + ' (' + x.s.districtName + ') p=' + x.prio + ' ' + x.reasons.join('/') + ' lines=' + JSON.stringify(x.lines.map((l) => l.year + ':' + l.score)));
  });
  fs.writeFileSync(path.join(__dirname, 'spotcheck-batch-20.json'), JSON.stringify(batch.map((x) => ({
    slug: x.s.id,
    dbName: x.s.name,
    keyLevel: x.s.schoolKeyLevel,
    stageLabel: x.s.schoolStageLabel,
    districtName: x.s.districtName,
    address: x.s.address,
    issues: x.reasons,
    currentScoreLines: x.lines,
    currentAdmCode: x.s.admissionCode || '',
    website: x.s.website
  })), null, 2));
  console.log('\n已保存 tmp/spotcheck-batch-20.json');
})().catch((e) => { console.error(e); process.exit(1); });
