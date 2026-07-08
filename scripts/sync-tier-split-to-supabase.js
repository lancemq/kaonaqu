require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { getServiceClient, SCHOOLS_TABLE } = require('../shared/supabase-client');

async function main() {
  const arr = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/schools.json'), 'utf8'));
  const client = getServiceClient();

  // 分批查 name→id 映射（in 过滤器单次不超过 50 项）
  const map = {};
  for (let i = 0; i < arr.length; i += 50) {
    const names = arr.slice(i, i + 50).map(s => s.name);
    const { data } = await client.from(SCHOOLS_TABLE).select('id, name').in('name', names);
    if (data) data.forEach(r => { map[r.name] = r.id; });
  }

  console.log(`匹配到 ${Object.keys(map).length} 个 id`);

  let ok = 0, fail = 0;
  for (let i = 0; i < arr.length; i += 100) {
    const batch = arr.slice(i, i + 100);
    const updates = [];
    for (const s of batch) {
      const id = map[s.name];
      if (!id) { fail++; continue; }
      updates.push({ id, keyLevel: s.schoolKeyLevel, cohort: s.eliteCohort });
    }
    for (const u of updates) {
      const { error } = await client.from(SCHOOLS_TABLE)
        .update({ school_key_level: u.keyLevel || '', elite_cohort: u.cohort || '' })
        .eq('id', u.id);
      if (error) { fail++; } else { ok++; }
    }
  }

  console.log(`更新成功: ${ok} / 失败: ${fail}`);
}

main().catch(e => console.error(e));
