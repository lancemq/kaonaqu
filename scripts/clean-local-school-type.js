#!/usr/bin/env node
/**
 * 把已清洗好的 Supabase schools 表的 school_type_label + is_international
 * 同步回本地 data/schools.json（按 区名+校名 定位，因为 Supabase id 是数字代理键、
 * 而 slug=区名-校名 与本地 districtName+name 对应）。
 *   node scripts/clean-local-school-type.js            # 正式写回（先自动备份）
 *   node scripts/clean-local-school-type.js --dry-run # 预览
 *
 * 以 Supabase 为权威源，确保本地 == Supabase，避免 data:sync:supabase 把旧「国际」回写。
 * 仅改 schoolTypeLabel 与 isInternational 两字段。
 * 注：schoolType（旧代码字段）已从本地 JSON 与归一化对象中彻底移除，全校统一到 school_type_label。
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { getServiceClient, SCHOOLS_TABLE, isSupabaseConfigured } = require('../shared/supabase-client');

const isDryRun = process.argv.includes('--dry-run');
const DATA_FILE = path.join(process.cwd(), 'data', 'schools.json');
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

async function fetchSupabase() {
  const c = getServiceClient();
  const cols = 'name,district_name,school_type_label,is_international';
  const PAGE = 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await c.from(SCHOOLS_TABLE).select(cols).range(from, from + PAGE - 1);
    if (error) throw new Error('Supabase 查询失败: ' + error.message);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  if (!isSupabaseConfigured()) { console.error('Supabase 未配置'); process.exit(1); }
  const sb = await fetchSupabase();
  const map = new Map();
  for (const r of sb) map.set(`${r.district_name || ''}||${r.name || ''}`, {
    type: String(r.school_type_label || '').trim(),
    intl: r.is_international === true
  });

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error('data/schools.json 顶层不是数组');

  let changed = 0;
  const unmatched = [];
  const plan = [];
  for (const s of arr) {
    const key = `${s.districtName || ''}||${s.name || ''}`;
    const m = map.get(key);
    if (!m) { unmatched.push(`${s.name} (${s.districtName || ''})`); continue; }
    const curType = String(s.schoolTypeLabel || '').trim();
    const curIntl = s.isInternational === true;
    if (curType !== m.type || curIntl !== m.intl) {
      const fromType = curType || '(空)';
      const fromIntl = curIntl ? 'true' : 'false';
      s.schoolTypeLabel = m.type || s.schoolTypeLabel;
      s.isInternational = m.intl;
      changed++;
      plan.push(`${s.name} (${s.districtName || ''}): type ${fromType}→${m.type}, intl ${fromIntl}→${m.intl}`);
    }
  }

  if (unmatched.length) {
    console.log(`⚠ 本地有 ${unmatched.length} 条在 Supabase 未匹配到（区名+校名）：`);
    unmatched.slice(0, 20).forEach((u) => console.log('   ' + u));
  }
  console.log(`本地需同步变更: ${changed} 条（Supabase 权威源）\n`);
  plan.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));

  if (isDryRun) { console.log('\n[dry-run] 未写入。'); return; }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = path.join(BACKUP_DIR, `schools-pre-type-clean-${ts}.json`);
  fs.copyFileSync(DATA_FILE, bak);
  console.log(`\n✓ 备份: ${bak}`);

  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2) + '\n', 'utf8');
  console.log(`✓ 写回: ${DATA_FILE}`);

  const dist = {};
  let intlTrue = 0;
  for (const s of arr) {
    const v = String(s.schoolTypeLabel || '').trim();
    dist[v] = (dist[v] || 0) + 1;
    if (s.isInternational === true) intlTrue++;
  }
  console.log('\n新 schoolTypeLabel 分布:', JSON.stringify(dist));
  console.log(`isInternational=true 总数: ${intlTrue}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
