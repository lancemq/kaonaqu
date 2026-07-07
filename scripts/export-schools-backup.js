#!/usr/bin/env node
/**
 * 导出 Supabase schools 表数据到 JSON 备份文件
 *   node scripts/export-schools-backup.js
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { getServiceClient, SCHOOLS_TABLE, SUPABASE_URL } = require('../shared/supabase-client');

const KEY = process.env.KNQ_SUPABASE_SERVICE_ROLE_KEY || process.env.KNQ_SUPABASE_SECRET_KEY || '';

async function main() {
  const c = getServiceClient();
  const { data, error } = await c.from(SCHOOLS_TABLE).select('*').order('id');
  if (error) { console.error('查询失败:', error.message); process.exit(1); }

  // 获取列结构
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: KEY, Accept: 'application/openapi+json' }
  });
  const spec = await resp.json();
  const columns = Object.keys(spec?.definitions?.schools?.properties || {});

  const backup = {
    exportedAt: new Date().toISOString(),
    table: SCHOOLS_TABLE,
    columnCount: columns.length,
    columns,
    count: data.length,
    schools: data
  };

  const dir = path.join(process.cwd(), 'data', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(dir, `schools-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 2) + '\n', 'utf8');
  console.log(`已导出 ${data.length} 条 (${columns.length} 列) 到 ${file}`);
  console.log('列:', columns.join(', '));
}

main().catch((err) => { console.error(err); process.exit(1); });
