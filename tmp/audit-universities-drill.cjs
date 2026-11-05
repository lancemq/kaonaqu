// 深挖：985∉211 是哪几所；湖南大学 976 的口径；top100 与双一流的差集； content 文案抽样查重
const fs = require('fs'); const path = require('path');
function loadEnvLocal(){const p=path.resolve(__dirname,'..','.env.local');if(!fs.existsSync(p))return;for(const l of fs.readFileSync(p,'utf8').split('\n')){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(process.env[m[1]]===undefined)process.env[m[1]]=v;}}
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


(async () => {
  const COLS='slug,name,tags,disciplines,founding_year,content,aliases,website,province';
  const rows=[]; for(let f=0;;f+=1000){const{data,error}=await client.from('universities').select(COLS).range(f,f+999);if(error)throw new Error(error.message);rows.push(...data);if(data.length<1000)break;}

  console.log('--- A. 985 但非 211 ---');
  rows.filter(r=>(r.tags||[]).includes('985')&&!(r.tags||[]).includes('211')).forEach(r=>console.log(` ${r.slug} tags=${JSON.stringify(r.tags)}`));

  console.log('\n--- B. 双一流 有 content(88) vs 无 content(57) 分布 ---');
  const df=rows.filter(r=>(r.tags||[]).includes('双一流'));
  const withC=df.filter(r=>(r.content||[]).length), withoutC=df.filter(r=>!(r.content||[]).length);
  console.log('无 content 的双一流:', withoutC.map(r=>r.province).join(',') .split(',').reduce((m,p)=>{m[p]=(m[p]||0)+1;return m;},{}));

  console.log('\n--- C. founding_year 976 复核（湖南大学官方口径）---');
  const hun=rows.find(r=>r.slug==='湖南-湖南大学');
  console.log(` 湖南大学 founding_year=${hun.founding_year}（岳麓书院 976 年为宣传口径，近代建制 1903/1926，官方校史溯源 976）`);

  console.log('\n--- D. content 模板化程度：paragraph 首句抽样 ---');
  const seen=new Set(); let dup=0;
  const firstParas={};
  rows.filter(r=>(r.content||[]).length).forEach(r=>{
    const p=(r.content.find(b=>b.type==='paragraph')||{}).text||'';
    const head=p.slice(0,18);
    firstParas[head]=(firstParas[head]||0)+1;
  });
  const dups=Object.entries(firstParas).filter(([,v])=>v>1);
  console.log(` 首句前 18 字重复模式: ${dups.length} 组`, dups.slice(0,6));

  console.log('\n--- E. list 块条目抽样（办学成就是否具体）---');
  for (const s of ['北京-北京大学','上海-复旦大学','江苏-南京大学']) {
    const r=rows.find(x=>x.slug===s);
    const lst=(r.content||[]).find(b=>b.type==='list');
    console.log(` ${s}: ${(lst?.items||[]).length} 条 | 首条: ${((lst?.items||[])[0]||'').slice(0,60)}`);
  }

  console.log('\n--- F. aliases 抽样与覆盖 ---');
  const withAlias=rows.filter(r=>(r.aliases||[]).length);
  console.log(` 有别名: ${withAlias.length}/2952 (全部来自 top100 批)`);
  const noAliasTop = rows.filter(r=>(r.tags||[]).includes('双一流')&&!(r.aliases||[]).length);
  console.log(` 双一流中无别名: ${noAliasTop.length} 所（如 ${noAliasTop.slice(0,4).map(r=>r.slug).join('、')}）`);

  console.log('\n--- G. disciplines 覆盖 vs 双一流 ---');
  const dfNoDisc=df.filter(r=>!(r.disciplines||[]).length);
  console.log(` 双一流无学科数据: ${dfNoDisc.length} 所：${dfNoDisc.slice(0,12).map(r=>r.slug).join('、')}${dfNoDisc.length>12?' …':''}`);

  console.log('\n--- H. updated_at 分布 ---');
  const COLS2='slug,updated_at';
  const rows2=[]; for(let f=0;;f+=1000){const{data,error}=await client.from('universities').select(COLS2).range(f,f+999);if(error)throw new Error(error.message);rows2.push(...data);if(data.length<1000)break;}
  const days={};
  rows2.forEach(r=>{const d=new Date(r.updated_at).toISOString().slice(0,10);days[d]=(days[d]||0)+1;});
  console.log(JSON.stringify(days));
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
