// P0 修复：3 所高校 tags 事实错误 + audit_notes 落戳段
// 985 工程名单固定 39 所（军校国防科大不在普通高校库），211 名单 112 所（军校除外）。
// 南大/华师大 均为 985+211+双一流；电子科大 为 985+211+双一流（第二轮新增）。
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


const FIXES = [
  { name: '南京大学', tags: ['双一流', '985', '211'] },
  { name: '华东师范大学', tags: ['双一流', '985', '211'] },
  { name: '电子科技大学', tags: ['双一流', '985', '211'] }
];
const STAMP = '【20261030tags修复】tags 补齐：985 均属 211、双一流（第二轮新增电子科大）';

(async () => {
  for (const f of FIXES) {
    const { data: rows, error } = await client.from('universities').select('id,slug,name,tags,audit_notes').eq('name', f.name);
    if (error || !rows || rows.length !== 1) { console.error(`定位失败: ${f.name}`, error?.message || rows?.length); process.exit(1); }
    const r = rows[0];
    const before = [...(r.tags || [])];
    if (EXEC) {
      const audit = (r.audit_notes ? r.audit_notes + '\n' : '') + STAMP;
      const { error: upErr } = await client.from('universities').update({ tags: f.tags, audit_notes: audit }).eq('id', r.id);
      if (upErr) { console.error(`FAIL ${f.name}: ${upErr.message}`); process.exit(1); }
      const { data: back } = await client.from('universities').select('tags,audit_notes').eq('id', r.id).single();
      const ok = JSON.stringify([...(back.tags || [])].sort()) === JSON.stringify([...f.tags].sort());
      console.log(`${ok ? 'OK' : 'VERIFY-DIFF'} ${r.slug}: ${JSON.stringify(before)} -> ${JSON.stringify(back.tags)}`);
    } else {
      console.log(`[DRY] ${r.slug}: ${JSON.stringify(before)} -> ${JSON.stringify(f.tags)}`);
    }
  }
  console.log(EXEC ? 'EXEC 完成' : 'DRY 完成（--exec 写库）');
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
