// 2026-07-31 批量补齐 60 所高中 2026 中考线：按年去重合并 + 招生代码 + notes
// 读取 tmp/spotcheck-research-[0-9]*.json，按 id 匹配（回退 name）
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
const { loadSchoolsList, getSchoolById, updateSchoolInSupabase } = require('../shared/data-store');
const EXEC = process.argv.includes('--exec');

function sanitizeCode(raw) { const m = String(raw || '').match(/\d{6}/); return m ? m[0] : ''; }
function pickDistrict(text) { const m = String(text || '').match(/([一-龥]{2,4}(?:新区|区))/); return m ? m[1] : ''; }
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
function cleanNotes(text) {
  return String(text || '').split(/(?<=。)/).filter((s) => !/库内/.test(s)).join('').trim();
}
// 同年保留首条（净化：平行志愿口径取先入的较低值），再让新数据按年覆盖
function mergeByYear(curLines, newLines) {
  const map = new Map();
  for (const l of curLines) if (!map.has(l.year)) map.set(l.year, l);
  for (const l of newLines) map.set(l.year, l);
  return [...map.values()].sort((a, b) => a.year - b.year);
}

(async () => {
  const files = fs.readdirSync(__dirname).filter(f => /^spotcheck-research-[0-9]+\.json$/.test(f));
  let research = [];
  for (const f of files) research = research.concat(JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')));
  console.log(`读取研究文件 ${files.length} 个，记录 ${research.length} 条`);
  const all = await loadSchoolsList();
  const byId = new Map(all.map((s) => [s.id, s]));
  const byName = new Map(all.map((s) => [s.name, s]));

  let ok = 0, fail = 0, noLine = 0;
  const doneIds = [];
  for (const r of research) {
    const listed = (r.id && byId.get(r.id)) || byName.get(r.dbName);
    if (!listed) { console.error(`SKIP 未找到: ${r.dbName}`); fail++; continue; }
    const cur = await getSchoolById(listed.id);
    const next = { ...cur };
    const newLines = normLines(r.scoreLines);
    const curLines = (cur.scoreLines || []).map((l) => ({
      year: Number(l.year), score: Number(l.score), plan: l.plan || '', note: l.note || ''
    })).filter((l) => Number.isFinite(l.year) && Number.isFinite(l.score) && l.score > 0);
    next.scoreLines = newLines.length ? mergeByYear(curLines, newLines) : curLines;
    if (!newLines.length) noLine++;

    const code = sanitizeCode(r.admissionCode);
    const adm = { ...(cur.admissionInfo || {}) };
    if (code) adm.code = code;
    const cleanNote = cleanNotes(r.notes);
    if (cleanNote && !String(adm.notes || '').includes(cleanNote.slice(0, 20))) {
      adm.notes = adm.notes ? `${adm.notes}\n【2026-07补线】${cleanNote}` : `【2026-07补线】${cleanNote}`;
    }
    next.admissionInfo = adm;
    next.infoVerified = true;

    if (!EXEC) {
      const has26 = next.scoreLines.some(l => l.year === 2026);
      console.log(`[DRY] ${r.dbName}: lines ${curLines.length}->${next.scoreLines.length} [${next.scoreLines.map((l) => l.year + ':' + l.score).join(',')}] 2026=${has26} code=${adm.code || '-'}`);
      continue;
    }
    try {
      await updateSchoolInSupabase(listed.id, next);
      const back = await getSchoolById(listed.id);
      const lineOk = JSON.stringify(back.scoreLines.map((l) => [l.year, l.score])) === JSON.stringify(next.scoreLines.map((l) => [l.year, l.score]));
      const has26 = back.scoreLines.some(l => l.year === 2026);
      console.log(`${lineOk ? 'OK' : 'VERIFY-DIFF'} ${r.dbName}: [${back.scoreLines.map((l) => l.year + ':' + l.score).join(',')}] 2026=${has26} code=${(back.admissionInfo || {}).code || '-'}`);
      doneIds.push(listed.id); ok++;
    } catch (e) { console.error(`FAIL ${r.dbName}: ${e.message}`); fail++; }
  }
  if (EXEC && doneIds.length) {
    const dp = path.join(__dirname, 'spotcheck-done.json');
    const set = new Set(JSON.parse(fs.readFileSync(dp, 'utf8')));
    doneIds.forEach((i) => set.add(i));
    fs.writeFileSync(dp, JSON.stringify([...set].sort(), null, 2));
    console.log(`spotcheck-done.json 已更新至 ${set.size} 条`);
  }
  console.log(`\n${EXEC ? '写库' : 'DRY-RUN'} 完成: 成功 ${ok} / 失败 ${fail} / 无统招线 ${noLine} / 总 ${research.length}`);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
