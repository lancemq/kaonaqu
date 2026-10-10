// 通用每日抽查选校（region 参数化，P3-11）
// 合并自 select-nanjing-spotcheck.cjs（南京专项）与 select-spotcheck-outcome.cjs（上海专项），
// 权重口径与南京版一致：缺2026线+40 / 缺2025线+50 / 空+60 / 年份<3+20 / 缺平均考试成绩+15 /
// 市重点+12 / 区重点+8 / 四星+6 / 三星+3。
// done 文件按 region 分文件：tmp/spotcheck-done-{region}.json（旧 nanjing-spotcheck-done.json 首跑自动迁移）。
// 用法: node tmp/select-spotcheck-generic.cjs --region=nanjing            # 选 20 所写 tmp/spotcheck-batch-{region}.json
//       node tmp/select-spotcheck-generic.cjs --region=nanjing --peek    # 仅预览全部待补清单
//       node tmp/select-spotcheck-generic.cjs --region=nanjing --batch=30
//       兼容: 不带 --region 时默认 shanghai（原 outcome 专项口径：高中+完中 outcome 为空优先）
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
const { getRegionConfig } = require('../shared/region-config');

// ---- 参数解析 ----
const args = process.argv.slice(2);
const getArg = (name) => {
  const m = args.find((a) => a.startsWith(`--${name}=`));
  return m ? m.split('=').slice(1).join('=') : null;
};
const REGION = getArg('region') || 'shanghai';
const BATCH = Number(getArg('batch') || 20);
const PEEK = args.includes('--peek');
// mode=lines（南京口径：分数线+成绩缺口加权）| mode=outcome（上海口径：outcome 为空优先）
const MODE = getArg('mode') || (REGION === 'shanghai' ? 'outcome' : 'lines');

if (!['shanghai', 'suzhou', 'nanjing'].includes(REGION)) {
  console.error(`未知 region: ${REGION}（合法: shanghai/suzhou/nanjing）`);
  process.exit(1);
}

const DONE_FILE = path.join(__dirname, `spotcheck-done-${REGION}.json`);
// 旧 done 文件迁移（南京专项历史 186 条）
const LEGACY_DONE = { nanjing: path.join(__dirname, 'nanjing-spotcheck-done.json') }[REGION];

function hasYear(lines, y) {
  return (Array.isArray(lines) ? lines : []).some((l) => l && Number(l.year) === y);
}
function avgExamPresent(s) {
  const o = Array.isArray(s.outcomeStats) ? s.outcomeStats : [];
  if (o.length) return true;
  const c = Array.isArray(s.content) ? s.content : [];
  const txt = c.map((b) => b.text || (Array.isArray(b.items) ? b.items.join('') : '')).join('');
  return /高考|均分|600分|最高分|升学/.test(txt);
}

(async () => {
  // done 迁移 + 读取
  if (LEGACY_DONE && fs.existsSync(LEGACY_DONE) && !fs.existsSync(DONE_FILE)) {
    fs.copyFileSync(LEGACY_DONE, DONE_FILE);
    console.log(`已迁移旧 done 文件: ${path.basename(LEGACY_DONE)} → ${path.basename(DONE_FILE)}`);
  }
  const done = new Set(fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')) : []);

  const all = await loadSchoolsList(REGION);
  const INTL = /(外籍|国际学校|国际课程|美国高中|台商子女|哈罗|国际部)/;
  const isPinyinSlug = (id) => typeof id === 'string' && /^[\x00-\x7F]+$/.test(id) && /[a-z]/i.test(id);

  const pool = all.filter((s) => {
    if (!['高中', '完全中学'].includes(s.schoolStageLabel)) return false;
    if (s.schoolPropertyLabel === '外籍' || INTL.test(s.name || '')) return false;
    if (done.has(s.id)) return false;
    if (isPinyinSlug(s.id)) return false;
    if (MODE === 'lines') {
      return ['市重点(高中)', '区重点(高中)', '一般高中'].includes(s.schoolKeyLevel);
    }
    // outcome 模式：不限 keyLevel（补代码/补 notes 也有价值）
    return true;
  });

  const scored = pool.map((s) => {
    const lines = Array.isArray(s.scoreLines) ? s.scoreLines : [];
    const reasons = [];
    let prio = 0;
    if (MODE === 'lines') {
      if (lines.length === 0) { prio += 60; reasons.push('分数线为空'); }
      else {
        if (!hasYear(lines, 2025)) { prio += 50; reasons.push('缺2025线'); }
        if (!hasYear(lines, 2026)) { prio += 40; reasons.push('缺2026线'); }
        if (lines.length < 3) { prio += 20; reasons.push('年份<3'); }
      }
      if (!avgExamPresent(s)) { prio += 15; reasons.push('缺平均考试成绩'); }
      if (s.schoolKeyLevel === '市重点(高中)') prio += 12;
      else if (s.schoolKeyLevel === '区重点(高中)') prio += 8;
      const f = Array.isArray(s.features) ? s.features.join(' ') : '';
      if (f.includes('四星')) prio += 6;
      else if (f.includes('三星')) prio += 3;
    } else {
      // outcome 模式：缺高考成绩保底 100
      prio += 100;
      reasons.push('缺高考成绩(outcome_stats)');
      if (s.schoolKeyLevel === '市重点(高中)') prio += 30;
      else if (s.schoolKeyLevel === '区重点(高中)') prio += 20;
      else if (s.schoolKeyLevel === '一般高中') prio += 10;
      if (lines.length === 0) prio += 5;
    }
    return { s, prio, reasons, lines };
  }).filter((x) => x.prio > (MODE === 'lines' ? 12 : 0));

  scored.sort((a, b) => b.prio - a.prio ||
    String(a.s.districtName).localeCompare(String(b.s.districtName)) ||
    String(a.s.name).localeCompare(String(b.s.name)));

  console.log(`[${REGION}/${MODE}] 高中+完中候选 ${pool.length} | 有缺口 ${scored.length} | 本次取 ${Math.min(BATCH, scored.length)}`);
  if (PEEK) {
    scored.forEach((x, i) => {
      const idx = String(i + 1).padStart(3);
      console.log(`${idx}. [${x.s.schoolKeyLevel}] ${x.s.name} (${x.s.districtName}) p=${x.prio} ${x.reasons.join('/')}`);
    });
    return;
  }

  const batch = scored.slice(0, BATCH);
  const out = batch.map((x) => ({
    slug: x.s.id,
    dbName: x.s.name,
    keyLevel: x.s.schoolKeyLevel,
    stageLabel: x.s.schoolStageLabel,
    districtName: x.s.districtName,
    address: x.s.address,
    features: Array.isArray(x.s.features) ? x.s.features : [],
    issues: x.reasons,
    currentScoreLines: x.lines,
    currentOutcomeStats: Array.isArray(x.s.outcomeStats) ? x.s.outcomeStats : [],
    currentAdmCode: x.s.admissionCode || '',
    website: x.s.website
  }));
  const outFile = path.join(__dirname, `spotcheck-batch-${REGION}.json`);
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`\n已保存 ${path.basename(outFile)}:`);
  batch.forEach((x, i) => {
    const idx = String(i + 1).padStart(2);
    console.log(`${idx}. [${x.s.schoolKeyLevel}] ${x.s.name} (${x.s.districtName}) p=${x.prio} ${x.reasons.join('/')}`);
  });
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
