#!/usr/bin/env node
/**
 * 清洗 school_type_label 和 tier 两列
 *   school_type_label → 公办 / 民办 / 国际（只体现办学性质）
 *   tier              → 四校 / 四校分校 / 八大 / 八大分校 / 市重点 / 区重点 / 一般
 *
 * 用法：
 *   node scripts/clean-school-tier-fields.mjs --dry-run  # 预览
 *   node scripts/clean-school-tier-fields.mjs            # 正式执行（更新本地 + 同步数据库）
 */
import fs from 'fs';
import path from 'path';
import { getSchoolOwnershipLabel } from '../lib/site-utils.js';

const isDryRun = process.argv.includes('--dry-run');
const doSync = !process.argv.includes('--no-sync');

const schoolsPath = path.join(process.cwd(), 'data', 'schools.json');
const raw = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
const arr = Array.isArray(raw) ? raw : raw.schools;

const NATURE_WORDS = ['公办', '民办', '国际'];

function cleanTypeLabel(school) {
  const tl = String(school.schoolTypeLabel || '').trim();
  if (tl === '公办') return '公办';
  if (['民办', '民办双语', '民办双语 / 国际化', '民办双语/国际化'].includes(tl)) return '民办';
  if (tl === '国际' || tl === '外籍') return tl;
  // 非性质词：从 tier 推断
  const tier = String(school.tier || '');
  for (const w of NATURE_WORDS) {
    if (tier.includes(w)) return w === '国际' ? '国际' : w;
  }
  // 从 ownership 推断
  const ownership = getSchoolOwnershipLabel(school);
  if (ownership === '公办') return '公办';
  if (ownership === '民办') return '民办';
  if (ownership.includes('国际') || ownership.includes('外籍')) return ownership.includes('外籍') ? '外籍' : '国际';
  return '公办'; // 兜底
}

function cleanTier(school) {
  // 综合两个字段的梯队信息（部分学校梯队只在 schoolTypeLabel 里）
  const text = `${school.tier || ''} ${school.schoolTypeLabel || ''}`;
  if (text.includes('四校分校')) return '四校分校';
  if (text.includes('四校')) return '四校';
  if (text.includes('八大分校')) return '八大分校';
  if (text.includes('八大')) return '八大';
  if (text.includes('市实验性示范性') || text.includes('市重点') || text.includes('享受市实验')) return '市重点';
  if (text.includes('区实验性示范性') || text.includes('区重点')) return '区重点';
  return '一般';
}

const before = { tl: {}, tier: {} };
const after = { tl: {}, tier: {} };
const samples = [];

for (const s of arr) {
  const oldTl = s.schoolTypeLabel || '(空)';
  const oldTier = s.tier || '(空)';
  before.tl[oldTl] = (before.tl[oldTl] || 0) + 1;
  before.tier[oldTier] = (before.tier[oldTier] || 0) + 1;

  const newTl = cleanTypeLabel(s);
  const newTier = cleanTier(s);
  after.tl[newTl] = (after.tl[newTl] || 0) + 1;
  after.tier[newTier] = (after.tier[newTier] || 0) + 1;

  if (oldTl !== newTl && samples.length < 8) {
    samples.push({ name: s.name, oldTl, newTl, oldTier, newTier });
  }
}

console.log('=== school_type_label 清洗 ===');
console.log('清洗前 (%d 种值):', Object.keys(before.tl).length);
Object.entries(before.tl).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));
console.log('清洗后 (%d 种值):', Object.keys(after.tl).length);
Object.entries(after.tl).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));

console.log('\n=== tier 清洗 ===');
console.log('清洗前 (%d 种值):', Object.keys(before.tier).length);
Object.entries(before.tier).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));
console.log('清洗后 (%d 种值):', Object.keys(after.tier).length);
Object.entries(after.tier).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));

console.log('\n=== 抽样变更 ===');
for (const s of samples) {
  console.log(`  ${s.name}`);
  console.log(`    type_label: ${s.oldTl} → ${s.newTl}`);
  console.log(`    tier:       ${s.oldTier} → ${s.newTier}`);
}

if (isDryRun) {
  console.log('\n[dry-run] 未写入。正式执行去掉 --dry-run');
  process.exit(0);
}

// 写回本地 JSON
for (const s of arr) {
  s.schoolTypeLabel = cleanTypeLabel(s);
  s.tier = cleanTier(s);
}
fs.writeFileSync(schoolsPath, JSON.stringify(arr, null, 2) + '\n', 'utf8');
console.log('\n✓ 已更新 data/schools.json');
if (doSync) {
  console.log('下一步：npm run data:sync:supabase 同步到数据库');
}
