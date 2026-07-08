// 从 Supabase schools 表同步到本地 data/schools.json
// 用法：node scripts/sync-supabase-to-local.js
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { getServiceClient, SCHOOLS_TABLE } = require('../shared/supabase-client');
const { rowToSchool, sortBySchoolPriority } = require('../shared/data-store');

async function main() {
  const client = getServiceClient();

  console.log('从 Supabase 读取 schools 表...');
  const { data, error } = await client
    .from(SCHOOLS_TABLE)
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  console.log(`读取到 ${data.length} 行`);

  const schools = sortBySchoolPriority(data.map(rowToSchool).filter(Boolean));

  const outputPath = path.resolve(__dirname, '../data/schools.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(schools, null, 2)}\n`, 'utf8');

  console.log(`已写入 ${schools.length} 所学校到 ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
