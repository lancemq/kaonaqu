// 高校数据质量审计（只读）：分维度统计 + 抽样异常检测
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

const { getPool } = require('../shared/pg-client');
// supabase-js → pg 最小适配器：只实现本脚本用到的查询子集。
function makeClient() {
  const q = (sql, params) => getPool().query(sql, params).then((r) => r.rows);
  function builder(table) {
    const state = { table, cols: '*', where: [], params: [], updateSet: null, insertRow: null, single: false, limit: null, rangeFrom: null, rangeLimit: null, deleteFlag: false };
    const b = {
      select(cols) { state.cols = cols; return b; },
      eq(col, val) { state.params.push(val); state.where.push(`${col} = $${state.params.length}`); return b; },
      in(col, vals) { state.params.push(vals); state.where.push(`${col} = ANY($${state.params.length})`); return b; },
      neq(col, val) { state.params.push(val); state.where.push(`${col} <> $${state.params.length}`); return b; },
      update(row) { state.updateSet = row; return b; },
      insert(row) { state.insertRow = row; return b; },
      delete() { state.deleteFlag = true; return b; },
      limit(n) { state.limit = n; return b; },
      range(from, to) { state.rangeFrom = from; state.rangeLimit = to - from + 1; return b; },
      single() { state.single = true; return b; },
      maybeSingle() { state.single = true; return b; },
      order() { return b; },
      async then(resolve, reject) {
        try {
          let rows;
          if (state.insertRow) {
            const cols = Object.keys(state.insertRow);
            const params = cols.map((c) => {
              const v = state.insertRow[c];
              return (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
            });
            const sql = `INSERT INTO ${state.table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
            rows = await q(sql, params);
          } else if (state.updateSet) {
            const cols = Object.keys(state.updateSet);
            const params = cols.map((c) => {
              const v = state.updateSet[c];
              return (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
            });
            const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
            const whereSql = state.where.length ? ` WHERE ${state.where.join(' AND ')}` : '';
            rows = await q(`UPDATE ${state.table} SET ${sets}${whereSql} RETURNING *`, [...params, ...state.params]);
          } else if (state.deleteFlag) {
            const whereSql = state.where.length ? ` WHERE ${state.where.join(' AND ')}` : '';
            await q(`DELETE FROM ${state.table}${whereSql}`, state.params);
            rows = [];
          } else {
            const colsSql = state.cols === '*' ? '*' : state.cols.split(',').map((c) => c.trim()).filter(Boolean).map((c) => (c === 'group' ? '"group"' : c)).join(', ');
            const whereSql = state.where.length ? ` WHERE ${state.where.join(' AND ')}` : '';
            const lim = state.rangeLimit != null ? ` LIMIT ${state.rangeLimit}` : (state.limit != null ? ` LIMIT ${state.limit}` : '');
            const off = state.rangeFrom != null ? ` OFFSET ${state.rangeFrom}` : '';
            rows = await q(`SELECT ${colsSql} FROM ${state.table}${whereSql}${lim}${off}`, state.params);
          }
          const data = state.single ? (rows[0] || null) : rows;
          resolve({ data, error: null });
        } catch (e) {
          resolve({ data: null, error: { message: e.message, code: e.code } });
        }
      }
    };
    return b;
  }
  return { from: builder };
}

const client = makeClient();



const UFFFD = '\uFFFD';
function hasBad(s) { return typeof s === 'string' && s.indexOf(UFFFD) >= 0; }

(async () => {
  const COLS = 'slug,moe_code,name,aliases,province,city,is_undergrad,nature,affiliation,tags,disciplines,founding_year,address,website,content,score_lines,outcome_stats,profile_depth,info_verified,audit_notes,updated_at';
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from('universities').select(COLS).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const N = rows.length;
  const pct = (n) => (100 * n / N).toFixed(1) + '%';
  console.log(`\n===== 总量 ${N} 所（本科 ${rows.filter(r=>r.is_undergrad).length} / 专科 ${rows.filter(r=>!r.is_undergrad).length}）=====\n`);

  // 1. 结构完整性
  console.log('--- 1. 结构完整性 ---');
  const missMoe = rows.filter(r => !r.moe_code);
  console.log(`moe_code 缺失: ${missMoe.length} ${missMoe.length ? '(' + missMoe.slice(0,5).map(r=>r.slug).join(', ') + ')' : '✓'}`);
  const missProv = rows.filter(r => !r.province);
  const missCity = rows.filter(r => !r.city);
  const missNature = rows.filter(r => !r.nature);
  const missAffil = rows.filter(r => !r.affiliation);
  console.log(`province 缺失: ${missProv.length} | city 缺失: ${missCity.length} | nature 缺失: ${missNature.length} | affiliation 缺失: ${missAffil.length}`);

  // moe_code 重复
  const byCode = {};
  rows.forEach(r => { if (r.moe_code) (byCode[r.moe_code] = byCode[r.moe_code] || []).push(r.slug); });
  const dupCodes = Object.entries(byCode).filter(([,v]) => v.length > 1);
  console.log(`moe_code 重复: ${dupCodes.length} ${dupCodes.length ? JSON.stringify(dupCodes.slice(0,5)) : '✓'}`);

  // 2. 内容深度
  console.log('\n--- 2. 内容深度 ---');
  const hasContent = rows.filter(r => Array.isArray(r.content) && r.content.length > 0);
  console.log(`content 非空: ${hasContent.length} (${pct(hasContent.length)})`);
  const blocksDist = {};
  hasContent.forEach(r => { const k = r.content.length; blocksDist[k] = (blocksDist[k]||0)+1; });
  console.log(`content 块数分布: ${JSON.stringify(blocksDist)}`);
  // content 结构合法性
  const VALID = new Set(['heading','paragraph','list','quote','divider','markdown']);
  let badBlocks = 0;
  hasContent.forEach(r => r.content.forEach(b => { if (!b || !VALID.has(b.type)) badBlocks++; }));
  console.log(`非法 block 类型: ${badBlocks} ${badBlocks ? '⚠️' : '✓'}`);
  // heading text 检查
  const headingTexts = {};
  hasContent.forEach(r => r.content.filter(b=>b.type==='heading').forEach(b => headingTexts[b.text] = (headingTexts[b.text]||0)+1));
  console.log(`heading 词表: ${JSON.stringify(headingTexts)}`);
  // profile_depth 分布
  const pd = {}; rows.forEach(r => pd[r.profile_depth] = (pd[r.profile_depth]||0)+1);
  console.log(`profile_depth: ${JSON.stringify(pd)}`);
  console.log(`info_verified true: ${rows.filter(r=>r.info_verified).length} (${pct(rows.filter(r=>r.info_verified).length)})`);

  // 3. 标签体系
  console.log('\n--- 3. 标签体系 ---');
  const tagDist = {};
  rows.forEach(r => (r.tags||[]).forEach(t => tagDist[t] = (tagDist[t]||0)+1));
  console.log(`tags 分布: ${JSON.stringify(tagDist)}`);
  const VALID_TAGS = new Set(['双一流','985','211','强基计划']);
  const badTags = rows.filter(r => (r.tags||[]).some(t => !VALID_TAGS.has(t)));
  console.log(`词表外 tag: ${badTags.length} ${badTags.length ? badTags.slice(0,5).map(r=>r.slug+':'+(r.tags||[]).join('|')).join('; ') : '✓'}`);
  // 985 ⊆ 211 ⊆ 双一流 逻辑
  const logicBad = rows.filter(r => (r.tags||[]).includes('985') && !(r.tags||[]).includes('211'));
  const logicBad2 = rows.filter(r => (r.tags||[]).includes('211') && !(r.tags||[]).includes('双一流'));
  console.log(`985∉211: ${logicBad.length} | 211∉双一流: ${logicBad2.length}（985 均属 211、211 均属双一流为正常口径）`);

  // 4. 学科评估
  console.log('\n--- 4. 学科评估 disciplines ---');
  const hasDisc = rows.filter(r => Array.isArray(r.disciplines) && r.disciplines.length > 0);
  console.log(`有 disciplines: ${hasDisc.length} (${pct(hasDisc.length)})`);
  const ratingDist = {};
  let discNoName = 0, discNoRating = 0, discBadRating = 0;
  hasDisc.forEach(r => r.disciplines.forEach(d => {
    if (!d.name) discNoName++;
    if (!d.rating) discNoRating++;
    else if (!/^[A-C][+-]?$/.test(d.rating)) discBadRating++;
    ratingDist[d.rating] = (ratingDist[d.rating]||0)+1;
  }));
  console.log(`学科条目总数: ${hasDisc.reduce((s,r)=>s+r.disciplines.length,0)} | 缺 name: ${discNoName} | 缺 rating: ${discNoRating} | rating 非法: ${discBadRating}`);
  console.log(`rating 分布: ${JSON.stringify(ratingDist)}`);
  const VALID_RATING = new Set(['A+','A','A-','B+','B','B-','C+','C','C-']);
  const badTagDisc = hasDisc.filter(r => r.disciplines.some(d => d.rating && !VALID_RATING.has(d.rating)));
  console.log(`词表外 rating: ${badTagDisc.length} ${badTagDisc.length ? badTagDisc.slice(0,5).map(r=>r.slug).join(', ') : '✓'}`);

  // 5. 分数线
  console.log('\n--- 5. 分数线 score_lines ---');
  const hasScore = rows.filter(r => Array.isArray(r.score_lines) && r.score_lines.length > 0);
  console.log(`有 score_lines: ${hasScore.length} (${pct(hasScore.length)})`);
  let slTotal = 0, slNoYear = 0, slNoMin = 0, slYearBad = 0;
  const yearDist = {}, provDist = {}, trackDist = {};
  hasScore.forEach(r => r.score_lines.forEach(l => {
    slTotal++;
    if (l.year == null) slNoYear++;
    else if (typeof l.year !== 'number' || l.year < 2000 || l.year > 2027) slYearBad++;
    else yearDist[l.year] = (yearDist[l.year]||0)+1;
    if (l.min == null) slNoMin++;
    provDist[l.province] = (provDist[l.province]||0)+1;
    trackDist[l.track] = (trackDist[l.track]||0)+1;
  }));
  console.log(`score_lines 条目: ${slTotal} | 缺 year: ${slNoYear} | 缺 min: ${slNoMin} | year 越界: ${slYearBad}`);
  console.log(`年份分布: ${JSON.stringify(yearDist)}`);
  console.log(`track 分布: ${JSON.stringify(trackDist)}`);
  console.log(`覆盖省份(按条目): 前 8 = ${JSON.stringify(Object.entries(provDist).sort((a,b)=>b[1]-a[1]).slice(0,8))}`);

  // 6. 联系方式与事实字段
  console.log('\n--- 6. 事实字段 ---');
  const hasWeb = rows.filter(r => r.website);
  console.log(`website 非空: ${hasWeb.length} (${pct(hasWeb.length)})`);
  const badWeb = hasWeb.filter(r => !/^https?:\/\//.test(r.website));
  console.log(`website 非 http(s) 开头: ${badWeb.length} ${badWeb.length ? badWeb.slice(0,5).map(r=>r.slug+':'+r.website).join('; ') : '✓'}`);
  const hasFY = rows.filter(r => r.founding_year != null);
  console.log(`founding_year 非空: ${hasFY.length} (${pct(hasFY.length)})`);
  const badFY = hasFY.filter(r => r.founding_year < 1850 || r.founding_year > 2026);
  console.log(`founding_year 越界(<1850 或 >2026): ${badFY.length} ${badFY.length ? badFY.slice(0,8).map(r=>r.slug+':'+r.founding_year).join('; ') : '✓'}`);
  const hasAddr = rows.filter(r => r.address);
  console.log(`address 非空: ${hasAddr.length} (${pct(hasAddr.length)})`);
  const hasAlias = rows.filter(r => Array.isArray(r.aliases) && r.aliases.length);
  console.log(`aliases 非空: ${hasAlias.length} (${pct(hasAlias.length)})`);

  // 7. 文本卫生
  console.log('\n--- 7. 文本卫生 ---');
  const bad = rows.filter(r => hasBad(r.name) || hasBad(r.address) || hasBad(r.website)
    || (r.content||[]).some(b => hasBad(b.text) || (b.items||[]).some(i=>hasBad(i))));
  console.log(`U+FFFD 乱码: ${bad.length} ${bad.length ? bad.slice(0,5).map(r=>r.slug).join(', ') : '✓'}`);
  const badSlug = rows.filter(r => !/^[^-]+-[^-]+$/.test(r.slug) || /[A-Z]/.test(r.slug));
  console.log(`slug 非「{省}-{名}」形或含大写: ${badSlug.length} ${badSlug.length ? badSlug.slice(0,5).map(r=>r.slug).join('; ') : '✓'}`);
  const slugDup = {};
  rows.forEach(r => slugDup[r.slug] = (slugDup[r.slug]||0)+1);
  console.log(`slug 重复: ${Object.values(slugDup).filter(v=>v>1).length}`);

  // 8. audit_notes
  console.log('\n--- 8. audit_notes（内部审计链）---');
  const hasAudit = rows.filter(r => r.audit_notes);
  console.log(`audit_notes 非空: ${hasAudit.length}`);
  const srcDist = {};
  hasAudit.forEach(r => (r.audit_notes.match(/【[^】]+】/g) || []).forEach(s => srcDist[s] = (srcDist[s]||0)+1));
  console.log(`戳段分布: ${JSON.stringify(srcDist)}`);

  // 9. 高价值子集画像
  console.log('\n--- 9. 高价值子集画像 ---');
  for (const [label, pred] of [
    ['双一流(145)', r => (r.tags||[]).includes('双一流')],
    ['985(39)', r => (r.tags||[]).includes('985')],
    ['top100 slug 抽查', r => ['北京-北京大学','北京-清华大学','上海-复旦大学','上海-上海交通大学','江苏-南京大学','广东-中山大学'].includes(r.slug)]
  ]) {
    const sub = rows.filter(pred);
    const c = sub.filter(r => Array.isArray(r.content) && r.content.length);
    const d = sub.filter(r => Array.isArray(r.disciplines) && r.disciplines.length);
    const w = sub.filter(r => r.website);
    const f = sub.filter(r => r.founding_year != null);
    const v = sub.filter(r => r.info_verified);
    console.log(`${label}: n=${sub.length} | content ${c.length} | disciplines ${d.length} | website ${w.length} | founding ${f.length} | verified ${v.length}`);
  }

  // 10. 抽样展示一条 content
  const sample = rows.find(r => r.slug === '北京-北京大学');
  if (sample) {
    console.log('\n--- 10. 样例（北京大学）---');
    console.log(`content 块: ${(sample.content||[]).map(b=>b.type).join(',')} | disciplines ${(sample.disciplines||[]).length} | website ${sample.website} | founding ${sample.founding_year} | aliases ${JSON.stringify(sample.aliases)} | verified ${sample.info_verified}`);
  }
})().catch(e => { console.error('AUDIT FAIL:', e.message); process.exit(1); });
