// 事实性抽查：tags 逻辑修复候选 + top100 边界复核（排名口径软科2025）
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
  const rows=[]; for(let f=0;;f+=1000){const{data,error}=await client.from('universities').select('slug,name,tags,province,is_undergrad,content,aliases').range(f,f+999);if(error)throw new Error(error.message);rows.push(...data);if(data.length<1000)break;}

  console.log('--- A. tags 全量真值对照（985 名单应为 39 所，库内 38 → 差 1）---');
  const N985=['清华大学','北京大学','中国人民大学','北京航空航天大学','北京理工大学','北京师范大学','中国农业大学','中央民族大学','南开大学','天津大学','大连理工大学','东北大学','吉林大学','哈尔滨工业大学','复旦大学','同济大学','上海交通大学','华东师范大学','南京大学','东南大学','浙江大学','中国科学技术大学','厦门大学','山东大学','中国海洋大学','武汉大学','华中科技大学','湖南大学','中南大学','国防科技大学','中山大学','华南理工大学','四川大学','电子科技大学','重庆大学','西安交通大学','西北工业大学','兰州大学','西北农林科技大学'];
  const have985=new Set(rows.filter(r=>(r.tags||[]).includes('985')).map(r=>r.name));
  const missing=N985.filter(n=>!have985.has(n));
  console.log(`官方 985 清单缺失: ${missing.length ? missing.join('、') : '无'}`);
  // 国防科技大学是否在库（军校，seed 时被剔除）
  const guofang=rows.find(r=>r.name==='国防科技大学');
  console.log(`国防科技大学在库: ${guofang ? '是' : '否（军校，seed 已剔除）'}`);

  console.log('\n--- B. 211 库内 109 vs 官方 112/116 差集 ---');
  // 211 全名单（112 所，含 985 的 39 所）
  const N211_EXTRA=['北京交通大学','北京工业大学','北京科技大学','北京化工大学','北京邮电大学','北京林业大学','北京中医药大学','北京外国语大学','中国传媒大学','中央财经大学','对外经济贸易大学','北京体育大学','中央音乐学院','中国政法大学','华北电力大学','中国矿业大学','中国矿业大学（北京）','中国石油大学','中国石油大学（北京）','中国地质大学','中国地质大学（北京）','北京科技大学','天津医科大学','河北工业大学','太原理工大学','内蒙古大学','辽宁大学','大连海事大学','延边大学','东北师范大学','哈尔滨工程大学','东北农业大学','东北林业大学','华东理工大学','东华大学','上海外国语大学','上海财经大学','上海大学','第二军医大学','苏州大学','南京航空航天大学','南京理工大学','河海大学','江南大学','南京农业大学','中国药科大学','南京师范大学','安徽大学','合肥工业大学','福州大学','南昌大学','郑州大学','武汉理工大学','华中农业大学','华中师范大学','中南财经政法大学','湖南师范大学','暨南大学','华南师范大学','广西大学','海南大学','四川农业大学','西南交通大学','西南财经大学','贵州大学','云南大学','西藏大学','西北大学','西安电子科技大学','长安大学','陕西师范大学','第四军医大学','青海大学','宁夏大学','新疆大学','石河子大学','中央民族大学','中国政法大学'];
  const have211=new Set(rows.filter(r=>(r.tags||[]).includes('211')).map(r=>r.name));
  const miss211=N211_EXTRA.filter(n=>!have211.has(n));
  console.log(`常见 211 中库内未见 211 标签的: ${miss211.length} 所`);
  console.log(miss211.slice(0,30).join('、'));

  console.log('\n--- C. 同名异址校（分校区是否拆行）---');
  const byName={};
  rows.forEach(r=>{const base=r.name.replace(/（.*?）/g,'');(byName[base]=byName[base]||[]).push(r);});
  Object.entries(byName).filter(([,v])=>v.length>1).forEach(([k,v])=>{
    console.log(` ${k}: ${v.map(x=>x.slug+JSON.stringify(x.tags)).join(' | ')}`);
  });
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
