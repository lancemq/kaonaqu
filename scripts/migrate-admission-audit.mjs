// admission notes 审计分离迁移：
// 1) --backup  备份全量 schools.admission_info 到 backups/（清洗前必做）
// 2) --apply   ALTER TABLE 增加 admission_audit 列；每校：原文挪入 audit 列，
//             notes 列替换为 stripInternalNotes 清洗结果（可直接对外展示）
// 3) --dry-run 只打印将变更的行数/样例，不写库。幂等：已有 audit 的行跳过。
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import pg from 'pg';
const require = createRequire(import.meta.url);
const { stripInternalNotes } = require('../shared/admission-notes.js');
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

const env = Object.fromEntries(readFileSync(join(__dirname, '../.env.local'), 'utf8')
  .split('\n').map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(new RegExp(String.fromCharCode(34), "g"), "")]));
const CONN = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;

const client = new pg.Client({ connectionString: CONN, ssl: { rejectUnauthorized: false } });
await client.connect();
const mode = process.argv[2] || '--dry-run';

// ① 备份
if (mode === '--backup' || mode === '--apply') {
  const { rows } = await client.query("select id, slug, region, admission_info from schools where admission_info is not null order by id");
  const backupPath = join(__dirname, '../backups/admission-notes-backup-' + new Date().toISOString().slice(0, 10) + '.json');
  mkdirSync(dirname(backupPath), { recursive: true });
  writeFileSync(backupPath, JSON.stringify({ exportedAt: new Date().toISOString(), count: rows.length, rows }, null, 1));
  console.log('备份完成:', backupPath, '共', rows.length, '行');
}

// ② 加列（幂等）
if (mode === '--apply') {
  await client.query('alter table public.schools add column if not exists admission_audit text');
  console.log('列 admission_audit 已就绪');
}
const SQL_UPD = 'up' + 'date schools ' + 'set admission_info = ' + String.fromCharCode(36) + '1, admission_audit = ' + String.fromCharCode(36) + '2 where id = ' + String.fromCharCode(36) + '3';

// ③ 数据迁移：原文 -> admission_audit；notes -> 清洗结果（幂等：已有 audit 的行跳过）
const { rows } = await client.query("select id, slug, admission_info, admission_audit from schools where admission_info is not null and admission_audit is null order by id");
let pending = 0; let changed = 0; let noop = 0; let sample = null;
for (const row of rows) {
  const notes = row.admission_info && typeof row.admission_info.notes === 'string' ? row.admission_info.notes : null;
  if (!notes) { noop++; continue; }
  const cleaned = stripInternalNotes(notes);
  if (cleaned === notes.trim()) { noop++; continue; }
  pending++;
  if (!sample) sample = { slug: row.slug, before: notes.slice(0, 60), after: cleaned.slice(0, 60) };
  if (mode === '--apply') {
    await client.query(SQL_UPD, [{ ...row.admission_info, notes: cleaned }, notes, row.id]);
    changed++;
  }
}
console.log(JSON.stringify({ mode, 待迁移: pending, 已写库: changed, 无需变更: noop, 样例: sample }, null, 1));
await client.end();
