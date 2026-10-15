// 通用抽查写库（region 参数化，P3-11）
// 合并自 apply-nanjing-spotcheck.cjs 与 apply-spotcheck-round.cjs 的合并策略：
//   scoreLines   : 复合键 year|plan|note 合并（保留跨区校同年多条线），绝不覆盖已有年份主键
//   outcomeStats : exam+kind+year 去重追加
//   content      : 「办学成就」list 追加（去重），content 为空则新建区块
//   admissionInfo: code 补齐（sanitize 6 位数字），notes 追加（剔除"库内"句，去重）
//   infoVerified : true
// done 文件按 region 分文件：tmp/spotcheck-done-{region}.json
// 用法: node tmp/apply-spotcheck-generic.cjs --region=nanjing            # DRY（研究稿默认 tmp/spotcheck-research-{region}.json）
//       node tmp/apply-spotcheck-generic.cjs --region=nanjing --exec     # 写入
//       node tmp/apply-spotcheck-generic.cjs --region=nanjing --research=path/to/research.json
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
const EXEC = process.argv.includes('--exec');
const args = process.argv.slice(2);
const getArg = (name) => {
  const m = args.find((a) => a.startsWith(`--${name}=`));
  return m ? m.split('=').slice(1).join('=') : null;
};
const REGION = getArg('region') || 'shanghai';
if (!['shanghai', 'suzhou', 'nanjing', 'wuxi'].includes(REGION)) {
  console.error(`未知 region: ${REGION}`);
  process.exit(1);
}
const DONE_FILE = path.join(__dirname, `spotcheck-done-${REGION}.json`);
const RESEARCH = getArg('research')
  ? path.resolve(getArg('research'))
  : path.join(__dirname, `spotcheck-research-${REGION}.json`);
// 兼容旧文件名：南京旧研究稿 nanjing-spotcheck-research.json
const LEGACY_RESEARCH = REGION === 'nanjing' ? path.join(__dirname, 'nanjing-spotcheck-research.json') : null;

const { getSchoolById, updateSchoolInSupabase } = require('../shared/data-store');

async function withRetry(fn, n = 5, base = 700) {
  let lastErr;
  for (let i = 0; i < n; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; if (i < n - 1) await new Promise((r) => setTimeout(r, base * (i + 1))); }
  }
  throw lastErr;
}
function dedupeOutcome(arr) {
  const seen = new Set(); const out = [];
  for (const o of arr) {
    const k = `${o.exam}|${o.kind}|${Number(o.year)}`;
    if (seen.has(k)) continue; seen.add(k); out.push(o);
  }
  return out;
}
function mergeScoreLines(curLines, newLines) {
  const map = new Map();
  const key = (l) => `${Number(l.year)}|${l.plan || ''}|${l.note || ''}`;
  for (const l of (curLines || [])) {
    if (!Number(l.year)) continue;
    map.set(key(l), { year: Number(l.year), score: Number(l.score) || 0, plan: l.plan || '', note: l.note || '' });
  }
  for (const l of (newLines || [])) {
    const y = Number(l.year);
    if (!y) continue;
    const k = key(l);
    if (!map.has(k)) map.set(k, { year: y, score: Number(l.score) || 0, plan: l.plan || '', note: l.note || '' });
  }
  return [...map.values()].sort((a, b) => a.year - b.year || (a.plan || '').localeCompare(b.plan || ''));
}
// 生成带日期戳的审计行并追加到 audit 文本（与库内历史【YYYYMMDD抽查】格式一致）
function appendAuditLine(auditText, note) {
  const stamp = '\u3010' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '抽查\u3011';
  const line = stamp + note;
  return auditText ? auditText + '\n' + line : line;
}
function sanitizeCode(raw) {
  // 兼容 6 位（沪/苏/宁）与 4 位片区码（无锡宜兴 8001-8008、洛社 7002 等按片区编制）
  const m = String(raw || '').match(/\d{6}|\d{4}/);
  return m ? m[0] : '';
}
function cleanNotes(text) {
  return String(text || '').split(/(?<=。)/).filter((s) => !/库内/.test(s)).join('').trim();
}
function appendAchievements(content, items) {
  if (!items || !items.length) return { content: Array.isArray(content) ? content : [], added: 0 };
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
    const dup = listBlock.items.some((x) => String(x).slice(0, 20) === String(it).slice(0, 20));
    if (!dup) { listBlock.items.push(it); added++; }
  }
  return { content: blocks, added };
}

(async () => {
  let researchPath = RESEARCH;
  if (!fs.existsSync(researchPath) && LEGACY_RESEARCH && fs.existsSync(LEGACY_RESEARCH)) {
    researchPath = LEGACY_RESEARCH;
    console.log(`使用旧研究稿: ${path.basename(LEGACY_RESEARCH)}`);
  }
  if (!fs.existsSync(researchPath)) { console.error(`研究稿不存在: ${researchPath}`); process.exit(1); }
  const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
  // 防追加污染：研究稿必须是数组且 dbName 唯一
  if (!Array.isArray(research)) { console.error('研究稿必须是数组'); process.exit(1); }
  const names = research.map((r) => r.dbName);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length) { console.error(`研究稿存在重复 dbName: ${[...new Set(dupes)].join('、')}`); process.exit(1); }

  console.log(`[${REGION}] 模式: ${EXEC ? '⚠️ EXEC' : 'DRY'}  研究稿: ${path.basename(researchPath)} (${research.length} 条)`);

  let ok = 0, fail = 0;
  const doneIds = [];
  for (const r of research) {
    let full;
    try { full = await withRetry(() => getSchoolById(r.slug || r.dbName)); } catch (e) { full = null; }
    // 兼容只传 dbName：用列表反查 slug
    if (!full && r.dbName) {
      const { loadSchoolsList } = require('../shared/data-store');
      const all = await withRetry(() => loadSchoolsList(REGION));
      const hit = all.find((s) => s.name === r.dbName);
      if (hit) full = await withRetry(() => getSchoolById(hit.id));
    }
    if (!full) { console.error(`SKIP 未找到: ${r.dbName}`); fail++; continue; }

    const cur = full;
    const curLines = cur.scoreLines || [];
    const curOutcome = cur.outcomeStats || [];

    const adm = { ...(cur.admissionInfo || {}) };
    const auditHay = String(adm.auditNotes || '') + '\n' + String(adm.notes || '');
    const code = sanitizeCode(r.admissionCode);
    if (code) adm.code = code;
    const cleanNote = cleanNotes(r.notes);
    if (cleanNote && !auditHay.includes(cleanNote.slice(0, 30))) {
      adm.auditNotes = appendAuditLine(adm.auditNotes, cleanNote);
    }

    const { content: nextContent, added: achAdded } = appendAchievements(cur.content, r.achievementsAppend || []);

    if (!EXEC) {
      console.log(`[DRY] ${r.dbName}: lines ${curLines.length}->${nextLines.length} code=${adm.code || '-'} ach+${achAdded} outcome ${curOutcome.length}->${nextOutcome.length}`);
      ok++;
      continue;
    }
    try {
      await withRetry(() => updateSchoolInSupabase(cur.id, {
        ...cur,
        scoreLines: nextLines,
        outcomeStats: nextOutcome,
        content: nextContent,
        admissionInfo: adm,
        infoVerified: true,
      }));
      const back = await withRetry(() => getSchoolById(cur.id));
      const lineOk = (back.scoreLines || []).length >= nextLines.length;
      const outcomeOk = (back.outcomeStats || []).length >= nextOutcome.length;
      const flag = lineOk && outcomeOk ? 'OK' : 'VERIFY-DIFF';
      console.log(`${flag} ${r.dbName}: lines=${(back.scoreLines || []).length}(exp ${nextLines.length}) outcome=${(back.outcomeStats || []).length}(exp ${nextOutcome.length}) ach+${achAdded} code=${(back.admissionInfo || {}).code || '-'}`);
      flag === 'OK' ? ok++ : fail++;
      doneIds.push(cur.id);
    } catch (e) { console.error(`FAIL ${r.dbName}: ${e.message}`); fail++; }
  }

  if (EXEC && doneIds.length) {
    const set = new Set(fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')) : []);
    doneIds.forEach((i) => set.add(i));
    fs.writeFileSync(DONE_FILE, JSON.stringify([...set].sort(), null, 2));
    console.log(`${path.basename(DONE_FILE)} 更新至 ${set.size} 条`);
  }
  console.log(`\n${EXEC ? '写库' : 'DRY'} 完成: 成功 ${ok} / 失败 ${fail} / 总 ${research.length}`);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
