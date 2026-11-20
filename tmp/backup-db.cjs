// 数据库备份（每日数据债第 0 步）：全表 JSON 导出 → gzip → 轮转保留。
// 不依赖 pg_dump 二进制（本机无 psql/pg_dump；服务器部署后可在服务器上跑同脚本，
// 或改用 pg_dump —— --dest=/home/ubuntu/databak）。
// 导出口径与 backups/20261029-*.json 人工备份一致：每表一个 JSON 数组。
// 用法：node tmp/backup-db.cjs [--dest=/path/to/dir] [--tables=schools,news,universities]
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Client } = require('pg');

function loadEnvLocal() {
  const p = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return;
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const arg = (n) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
};

const KEEP = Number(process.env.DB_BACKUP_KEEP || 14);
const TABLES = (arg('tables') || 'schools,news,universities,schools_backup_20261029,news_backup_20261029').split(',').filter(Boolean);

let url = (process.env.DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '').trim();
if (!url) { console.error('BACKUP FAIL: 无数据库连接串'); process.exit(1); }
// Supabase pooler：剥 sslmode + 显式 ssl 选项 + 关 channelBinding（backup-tables.cjs 同教训）
url = url.replace(/[?&]sslmode=[^&]+/g, '');

const dest = arg('dest') || path.resolve(__dirname, '..', 'backups', 'db');
fs.mkdirSync(dest, { recursive: true });

const d = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
const sqlTmp = path.join(dest, `kaonaqu-${stamp}.json`);
const outFile = `${sqlTmp}.gz`;

(async () => {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    channelBinding: 'disable',
    keepAlive: true,
    statement_timeout: 300000
  });
  // pooler 偶发掐线触发 error 事件，不捕获会让进程崩（导出不完整）
  client.on('error', (e) => console.error('  [pg warn]', e.message));
  await client.connect();

  const dump = { _meta: { generatedAt: new Date().toISOString(), tables: {} } };
  for (const t of TABLES) {
    try {
      const { rows } = await client.query(`SELECT * FROM ${t}`);
      dump[t] = rows;
      dump._meta.tables[t] = rows.length;
      console.log(`  ${t}: ${rows.length} 行`);
    } catch (e) {
      // 备份表可能不存在（如本地库未建 backup 表）——跳过不致命
      console.log(`  ${t}: SKIP（${e.message.split('\n')[0]}）`);
    }
  }
  await client.end();

  fs.writeFileSync(sqlTmp, JSON.stringify(dump));
  r = spawnSync('gzip', ['-f', sqlTmp], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('BACKUP FAIL: gzip 退出码 ' + r.status); process.exit(1); }

  const size = fs.statSync(outFile).size;
  console.log(`BACKUP OK ${outFile} (${(size / 1024 / 1024).toFixed(1)} MB)`);

  // 轮转
  const files = fs.readdirSync(dest)
    .filter((f) => /^kaonaqu-\d{12}\.json\.gz$/.test(f))
    .sort()
    .reverse();
  for (const f of files.slice(KEEP)) {
    fs.unlinkSync(path.join(dest, f));
    console.log(`PRUNED ${f}`);
  }
  console.log(`BACKUP DONE（保留 ${Math.min(files.length, KEEP)} 份）`);
})().catch((e) => { console.error('BACKUP FAIL:', e.message); process.exit(1); });
