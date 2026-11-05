// 高校数据债任务分配器：跑 universities 表总览 → 按优先级产出当日高校方向 → 写 tmp/university-task-today.json
// 由 automation-1784266942235 与初高中任务同日执行（高校为独立方向，不复用 schools 白名单）。
// 优先级规则（与高校质量审计 2026-10-30 对齐）：
//   P0  双一流 tags 事实纠偏（名单比对驱动，一次性脚本已跑完，此处只做漂移监测）
//   P1  双一流 content/disciplines/website/foundingYear 补齐（双一流 144 所必须 100% 深度）
//   P1  985/211 校 content 补齐（双一流之外的 211 校）
//   P2  top101-300（软科主榜）enrichment
//   P2  骨架抽查：slug/moe_code/乱码漂移检测（每 100 校抽 20）
//   P3  score_lines 录取线（上海/江苏 2026 起步）——默认关闭，用户开启后从白名单名单取
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



// score_lines 方向开关（P3，等数据源方案确定后打开）
const ENABLE_SCORE_LINES = process.env.UNI_SCORE_LINES === '1';

(async () => {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from('universities')
      .select('slug,name,province,tags,content,disciplines,website,founding_year,aliases,score_lines,moe_code,is_undergrad,audit_notes')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const N = rows.length;
  const has = (r, k) => Array.isArray(r[k]) && r[k].length > 0;
  const byTag = (t) => rows.filter((r) => (r.tags || []).includes(t));
  const df = byTag('双一流');
  const t985 = byTag('985');
  const t211 = byTag('211');

  const tasks = [];
  const push = (priority, direction, desc, list) => tasks.push({
    priority, direction, desc,
    count: list.length,
    sample: list.slice(0, 20).map((r) => r.name)
  });

  // P0 漂移监测：双一流 985 均应属 211
  const drift = t985.filter((r) => !(r.tags || []).includes('211'));
  push('P0', 'tags-drift', '985∉211 / 名单漂移监测（应恒为 0）', drift);

  // P1-a 双一流缺 content
  push('P1', 'df-content', '双一流缺 content（概览+成就 4 块）', df.filter((r) => !has(r, 'content')));
  // P1-b 双一流缺 disciplines
  // 2026-11-02：disciplines 为空但 audit_notes 含【查无B+】记账戳 = 已完成查证（官方确无 B+ 及以上），视为已处理不再派单
  const dfNoDisc = df.filter((r) => !has(r, 'disciplines') && !(r.audit_notes || '').includes('查无B+'));
  push('P1', 'df-disciplines', '双一流缺第四轮学科评估', dfNoDisc);
  // P1-c 双一流缺 website / foundingYear
  push('P1', 'df-facts', '双一流缺官网或建校年', df.filter((r) => !r.website || r.founding_year == null));
  // P1-d 211（非双一流）缺 content
  push('P1', 't211-content', '211 校（非双一流）缺 content', t211.filter((r) => !(r.tags || []).includes('双一流') && !has(r, 'content')));

  // P2 top101-300：用「已 enrich 但非双一流/211」为锚不可行，改为：非双一流且非 211 的本科校按省重点池
  // 口径：本科 + 无 content + （省名在头部省份优先：江苏/上海/北京/浙江/广东）
  const HEAD_PROVINCES = ['江苏', '上海', '北京', '浙江', '广东'];
  const pool = rows.filter((r) => r.is_undergrad && !has(r, 'content')
    && !(r.tags || []).includes('双一流') && !(r.tags || []).includes('211'));
  const head = pool.filter((r) => HEAD_PROVINCES.includes(r.province));
  push('P2', 'ug-content-head', '本科 enrich（头部省优先：苏沪京浙粤）', head);
  push('P2', 'ug-content-rest', '本科 enrich（其余省份）', pool.filter((r) => !HEAD_PROVINCES.includes(r.province)));

  // P2 抽查：info_verified 抽检候选（已 enrich 校随机 20 所复核）
  const enriched = rows.filter((r) => has(r, 'content'));
  push('P2', 'spot-check', '已 enrich 校质量抽检（20/百）', enriched);

  // P3 分数线（默认关闭）
  if (ENABLE_SCORE_LINES) {
    push('P3', 'score-lines', 'score_lines 录取线（沪/苏 2026 起步）', rows.filter((r) => !has(r, 'score_lines') && ['上海', '江苏'].includes(r.province)));
  }

  console.log(`===== 高校数据债任务分配（总量 ${N}：双一流 ${df.length} / 985 ${t985.length} / 211 ${t211.length}） =====\n`);
  for (const t of tasks) console.log(`  [${t.priority}] ${t.direction.padEnd(20)} ${String(t.count).padStart(5)} — ${t.desc}`);

  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const active = tasks.filter((t) => t.count > 0).sort((a, b) => order[a.priority] - order[b.priority])[0];

  const today = {
    generatedAt: new Date().toISOString(),
    total: N,
    tagStats: { 双一流: df.length, '985': t985.length, '211': t211.length },
    todayTask: active ? { priority: active.priority, direction: active.direction, desc: active.desc, remaining: active.count, sample: active.sample } : null,
    allDirections: tasks.map((t) => ({ priority: t.priority, direction: t.direction, desc: t.desc, remaining: t.count })),
    notes: [
      '研究稿格式：{name, overview(180-260字,含第二轮双一流建设学科), achievements(3条,首条固定"「双一流」建设高校（第二轮），建设学科：XX"), disciplines([{name,rating}],仅A+/A/A-/B+,最多10条), foundingYear, website(https://*.edu.cn), aliases(1-3个)}',
      '写库：node tmp/apply-universities-batch.cjs --research=tmp/universities-{direction}-{MMDD}.json DRY → --exec（合并语义：content 只填空、学科按 name 去重、年份/官网只填缺、别名并集）',
      '第四轮学科评估评级与双一流建设学科必须 WebSearch 核实官方名单；查无 B+ 以上学科给空数组，不虚构。',
      '写库后读回验证 + 在 automation memory.md 追加批次记录。',
    ],
  };
  const outFile = path.resolve(__dirname, 'university-task-today.json');
  fs.writeFileSync(outFile, JSON.stringify(today, null, 2));
  console.log(`\n今日高校主任务: ${today.todayTask ? `[${today.todayTask.priority}] ${today.todayTask.direction} 剩余 ${today.todayTask.remaining}` : '全部清零 → 维护模式'}`);
  console.log('已写 ' + outFile);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
