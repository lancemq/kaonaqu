// P1-0 双一流名单纠偏：对照教育部《第二轮"双一流"建设高校及建设学科名单》（147 所）
// - 误标移除（非双一流）：上海海事大学 / 上海理工大学 / 四川师范大学 / 天津外国语大学 / 天津财经大学
// - 漏标补上：南方科技大学 / 宁波大学 / 西南石油大学（电子科技大学已在 tags 修复批补齐）
// 同步更新源名单文件 tmp/universities-double-first-class.json（145 → 143）
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

const EXEC = process.argv.includes('--exec');


const REMOVE = ['上海海事大学', '上海理工大学', '四川师范大学', '天津外国语大学', '天津财经大学'];
const ADD = ['南方科技大学', '宁波大学', '西南石油大学'];
const STAMP_REMOVE = '【20261030双一流纠偏】移除误标：非教育部第二轮双一流名单内（147 所逐校比对）';
const STAMP_ADD = '【20261030双一流纠偏】补标：教育部第二轮双一流名单内，seed 名单遗漏';

(async () => {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from('universities').select('id,slug,name,tags,audit_notes').range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const byName = new Map(rows.map((r) => [r.name, r]));
  let changed = 0;

  for (const name of REMOVE) {
    const r = byName.get(name);
    if (!r) { console.error(`未找到: ${name}`); continue; }
    const next = (r.tags || []).filter((t) => t !== '双一流');
    if (!EXEC) { console.log(`[DRY] ${r.slug}: ${JSON.stringify(r.tags)} -> ${JSON.stringify(next)}`); changed++; continue; }
    const audit = (r.audit_notes ? r.audit_notes + '\n' : '') + STAMP_REMOVE;
    const { error } = await client.from('universities').update({ tags: next, audit_notes: audit }).eq('id', r.id);
    if (error) { console.error(`FAIL ${name}: ${error.message}`); continue; }
    const { data: back } = await client.from('universities').select('tags').eq('id', r.id).single();
    console.log(`${JSON.stringify(back.tags) === JSON.stringify(next) ? 'OK' : 'VERIFY-DIFF'} ${r.slug}: ${JSON.stringify(r.tags)} -> ${JSON.stringify(back.tags)}`);
    changed++;
  }

  for (const name of ADD) {
    const r = byName.get(name);
    if (!r) { console.error(`未找到: ${name}`); continue; }
    const set = new Set(r.tags || []);
    if (set.has('双一流')) { console.log(`SKIP(已有) ${r.slug}`); continue; }
    set.add('双一流');
    const next = [...set];
    if (!EXEC) { console.log(`[DRY] ${r.slug}: ${JSON.stringify(r.tags)} -> ${JSON.stringify(next)}`); changed++; continue; }
    const audit = (r.audit_notes ? r.audit_notes + '\n' : '') + STAMP_ADD;
    const { error } = await client.from('universities').update({ tags: next, audit_notes: audit }).eq('id', r.id);
    if (error) { console.error(`FAIL ${name}: ${error.message}`); continue; }
    const { data: back } = await client.from('universities').select('tags').eq('id', r.id).single();
    console.log(`${JSON.stringify(back.tags) === JSON.stringify(next) ? 'OK' : 'VERIFY-DIFF'} ${r.slug}: ${JSON.stringify(r.tags)} -> ${JSON.stringify(back.tags)}`);
    changed++;
  }

  // 同步源名单文件
  if (EXEC) {
    const dfFile = path.resolve(__dirname, 'universities-double-first-class.json');
    const list = JSON.parse(fs.readFileSync(dfFile, 'utf8'));
    const next = list.filter((n) => !REMOVE.includes(n)).concat(ADD.filter((n) => !list.includes(n))).sort();
    fs.writeFileSync(dfFile, JSON.stringify(next, null, 1) + '\n');
    console.log(`源名单文件已同步: ${list.length} -> ${next.length}`);
  }
  console.log(`${EXEC ? 'EXEC' : 'DRY'} 完成，涉及 ${changed} 条`);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
