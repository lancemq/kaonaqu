// 2026-07-31 抽查批写库：分数线（按年去重合并）+ 高考成绩(outcome_stats) + 成就 + notes
const fs = require('fs');
const path = require('path');
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnvLocal();
const { loadSchoolsList, getSchoolById, updateSchoolInSupabase } = require('../shared/data-store');
const EXEC = process.argv.includes('--exec');

// ===== 高考成绩结构化补录（outcome_stats，2026-07-31 批）=====
// metrics 可用键：qingbei / fuJiaoQB / score600plus / topScore / zongpingTotal / fuJiao
const OUTCOME_APPEND = {
  '上海中学': [
    { exam: '高考', kind: '喜报', year: 2026, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { qingbei: 65, score600plus: 201, topScore: 626 },
      note: '清华19人、北大46人；616分及以上屏蔽生15人（占全市58人的25.8%）；580分以上436人，特控率99.6%，本科率100%' }
  ],
  '上海中学东校': [
    { exam: '高考', kind: '喜报', year: 2026, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { score600plus: 9, topScore: 611 },
      note: '1人经强基计划录取北京大学；特控率90%以上、本科率100%；等级考化学A率42.5%、物理A率33.5%' },
    { exam: '高考', kind: '喜报', year: 2025, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: {}, note: '特控率90.7%，综评录取率80%，985高校录取率28%' }
  ],
  '上海交通大学附属中学': [
    { exam: '高考', kind: '喜报', year: 2026, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { score600plus: 96, topScore: 621 },
      note: '616分及以上屏蔽生7人，580分以上321人' },
    { exam: '高考', kind: '喜报', year: 2025, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { qingbei: 22, fuJiaoQB: 211 },
      note: '复旦54人、上海交大157人，清北复交合计233人；特控率98.9%' }
  ],
  '上海交通大学附属中学嘉定分校': [
    { exam: '高考', kind: '喜报', year: 2026, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { topScore: 614 }, note: '已知校内最高分614分' },
    { exam: '高考', kind: '喜报', year: 2025, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { qingbei: 1, fuJiaoQB: 82 },
      note: '清北复交合计83人，其中复旦、上海交大综合评价批录取57人（列全市第6）；特控率98.6%' }
  ],
  '上海交通大学附属中学闵行分校': [
    { exam: '高考', kind: '喜报', year: 2026, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { score600plus: 19, topScore: 624 }, note: '' },
    { exam: '高考', kind: '喜报', year: 2025, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { qingbei: 4 },
      note: '综合评价批录取59人（复旦14、上海交大34、同济5）；强基班40人中清北复交32人；特控率98.5%' }
  ],
  '上海南汇中学': [
    { exam: '高考', kind: '喜报', year: 2026, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { topScore: 588 }, note: '' },
    { exam: '高考', kind: '喜报', year: 2025, verified: false, source: '升学自媒体汇总(各校喜报)',
      metrics: { topScore: 611 },
      note: '985高校录取32人（上届31人），590分以上12人、580分以上35人以上；特控率58.6%' }
  ]
};

// 成就白名单：已结构化进 outcome_stats 的高考数据不再重复写入成就列表
const ACH_SKIP = new Set(Object.keys(OUTCOME_APPEND));

function sanitizeCode(raw) {
  const m = String(raw || '').match(/\d{6}/);
  return m ? m[0] : '';
}
function pickDistrict(text) {
  const m = String(text || '').match(/([\u4e00-\u9fa5]{2,4}(?:新区|区))/);
  return m ? m[1] : '';
}
// 分数线口径规范化：plan 精简为可读标签，明细归入 note
function normLines(lines) {
  return (lines || []).map((l) => {
    const rawPlan = String(l.plan || '');
    const district = pickDistrict(rawPlan) || pickDistrict(l.note);
    const notFull = /未录满/.test(rawPlan) || /未录满/.test(String(l.note || ''));
    const plan = '统一招生平行志愿' + (district ? `（${district}）` : '') + (notFull ? '·未录满' : '');
    const note = district
      ? `${district}本区线，来源：${l.year}年上海市高中学校“1至15志愿”统一招生录取最低分数线（${district}）`
      : String(l.note || '').replace(/^来源：/, '来源：');
    return { year: Number(l.year), score: Number(l.score), plan, note };
  }).filter((l) => Number.isFinite(l.year) && Number.isFinite(l.score) && l.score > 0);
}
// 按年份去重：新数据覆盖同年旧数据
function mergeByYear(curLines, newLines) {
  const map = new Map();
  for (const l of curLines) map.set(l.year, l);
  for (const l of newLines) map.set(l.year, l);
  return [...map.values()].sort((a, b) => a.year - b.year);
}
// notes 清洗：剔除含“库内”的内部口径句
function cleanNotes(text) {
  return String(text || '').split(/(?<=。)/)
    .filter((s) => !/库内/.test(s))
    .join('').trim();
}
// 成就来源标注规范化
function cleanAch(item) {
  return String(item).replace(/（来源：[^）]*）/g, (m) => (
    /官网|官微|官方|招生简章|学校发布|学校2\d{3}/.test(m) ? '（来源：学校官方发布）' : '（据公开升学喜报汇总整理，非学校官方发布）'
  )).trim();
}
function appendAchievements(content, items) {
  if (!items.length) return { content: Array.isArray(content) ? content : [], added: 0 };
  const blocks = Array.isArray(content) ? JSON.parse(JSON.stringify(content)) : [];
  let hIdx = blocks.findIndex((b) => b.type === 'heading' && /办学成就/.test(b.text || ''));
  if (hIdx === -1) {
    blocks.push({ type: 'heading', text: '办学成就' });
    blocks.push({ type: 'list', items: [] });
    hIdx = blocks.length - 2;
  }
  let listBlock = null;
  for (let i = hIdx + 1; i < blocks.length; i++) {
    if (blocks[i].type === 'heading') break;
    if (blocks[i].type === 'list') { listBlock = blocks[i]; break; }
  }
  if (!listBlock) { listBlock = { type: 'list', items: [] }; blocks.splice(hIdx + 1, 0, listBlock); }
  let added = 0;
  for (const it of items) {
    const dup = listBlock.items.some((x) => String(x).slice(0, 20) === it.slice(0, 20));
    if (!dup) { listBlock.items.push(it); added++; }
  }
  return { content: blocks, added };
}
function mergeOutcome(cur, add) {
  const list = Array.isArray(cur) ? JSON.parse(JSON.stringify(cur)) : [];
  let n = 0;
  for (const e of add) {
    const dup = list.some((x) => x.exam === e.exam && x.kind === e.kind && Number(x.year) === Number(e.year));
    if (!dup) { list.push(e); n++; }
  }
  return { list, added: n };
}

(async () => {
  let research = [];
  for (const g of ['A', 'B', 'C', 'D']) {
    research = research.concat(JSON.parse(fs.readFileSync(path.join(__dirname, `spotcheck-research-${g}.json`), 'utf8')));
  }
  const all = await loadSchoolsList();
  const byName = new Map(all.map((s) => [s.name, s]));

  let ok = 0; let fail = 0;
  const doneIds = [];
  for (const r of research) {
    const listed = byName.get(r.dbName);
    if (!listed) { console.error(`SKIP 未找到: ${r.dbName}`); fail++; continue; }
    const cur = await getSchoolById(listed.id);
    const next = { ...cur };

    const newLines = normLines(r.scoreLines);
    const curLines = (cur.scoreLines || []).map((l) => ({
      year: Number(l.year), score: Number(l.score), plan: l.plan || '', note: l.note || ''
    })).filter((l) => Number.isFinite(l.year) && Number.isFinite(l.score) && l.score > 0);
    next.scoreLines = newLines.length ? mergeByYear(curLines, newLines) : curLines;

    const code = sanitizeCode(r.admissionCode);
    const adm = { ...(cur.admissionInfo || {}) };
    if (code) adm.code = code;
    const cleanNote = cleanNotes(r.notes);
    if (cleanNote && !String(adm.notes || '').includes(cleanNote.slice(0, 30))) {
      adm.notes = adm.notes ? `${adm.notes}\n【2026-08抽查】${cleanNote}` : `【2026-08抽查】${cleanNote}`;
    }
    next.admissionInfo = adm;

    const achItems = ACH_SKIP.has(r.dbName) ? [] : (r.achievementsAppend || []).map(cleanAch);
    const { content, added } = appendAchievements(cur.content, achItems);
    next.content = content;

    let outAdded = 0;
    if (OUTCOME_APPEND[r.dbName]) {
      const m = mergeOutcome(cur.outcomeStats, OUTCOME_APPEND[r.dbName]);
      next.outcomeStats = m.list; outAdded = m.added;
    }
    if (Array.isArray(r.outcomeStats) && r.outcomeStats.length) {
      const m = mergeOutcome(next.outcomeStats || cur.outcomeStats, r.outcomeStats);
      next.outcomeStats = m.list; outAdded += m.added;
    }
    next.infoVerified = true;

    if (!EXEC) {
      console.log(`[DRY] ${r.dbName}: lines ${curLines.length}->${next.scoreLines.length} [${next.scoreLines.map((l) => l.year + ':' + l.score).join(',')}] code=${adm.code || '-'} ach+${added} outcome+${outAdded}`);
      continue;
    }
    try {
      await updateSchoolInSupabase(listed.id, next);
      const back = await getSchoolById(listed.id);
      const lineOk = JSON.stringify(back.scoreLines.map((l) => [l.year, l.score])) === JSON.stringify(next.scoreLines.map((l) => [l.year, l.score]));
      console.log(`${lineOk ? 'OK' : 'VERIFY-DIFF'} ${r.dbName}: lines=[${back.scoreLines.map((l) => l.year + ':' + l.score).join(',')}] code=${(back.admissionInfo || {}).code || '-'} ach+${added} outcome=${(back.outcomeStats || []).length}`);
      doneIds.push(listed.id);
      ok++;
    } catch (e) { console.error(`FAIL ${r.dbName}: ${e.message}`); fail++; }
  }
  if (EXEC && doneIds.length) {
    const dp = path.join(__dirname, 'spotcheck-done.json');
    const set = new Set(JSON.parse(fs.readFileSync(dp, 'utf8')));
    doneIds.forEach((i) => set.add(i));
    fs.writeFileSync(dp, JSON.stringify([...set].sort(), null, 2));
    console.log(`spotcheck-done.json 已更新至 ${set.size} 条`);
  }
  console.log(`\n${EXEC ? '写库' : 'DRY-RUN'} 完成: 成功 ${ok} / 失败 ${fail} / 总 ${research.length}`);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
