/**
 * split-tier-fields.js
 * 
 * 将 tier 拆分为 school_key_level + elite_cohort 两个字段。
 * 覆盖本地 data/schools.json 和 Supabase schools 表。
 * 
 * 用法：
 *   node scripts/split-tier-fields.js              # 仅本地（默认）
 *   node scripts/split-tier-fields.js --local      # 仅本地
 *   node scripts/split-tier-fields.js --dry-run    # 预览不写
 *   node scripts/split-tier-fields.js --supabase   # 写本地 + 同步 Supabase
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// ─── 配置 ──────────────────────────────────────────────
const JSON_PATH = path.resolve(__dirname, '../data/schools.json');
const BACKUP_DIR = path.resolve(__dirname, '../data/backups');
const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');

// 三公学校名单（elite_cohort=三公，school_key_level=市重点）
const SANGONG = [
  '上海外国语大学附属外国语学校',
  '上海市实验学校',
  '上海外国语大学附属浦东外国语学校',
];

// 顶级民办初中
const TOP_MINBAN = [
  '上海民办华育中学',
  '民办上宝中学',
  '上海市民办张江集团中学',
];

// 优质公办初中（按区整理的网络排名数据，已交叉验证）
const QUALITY_PUBLIC_JUNIOR = [
  '上海市黄浦区格致初级中学',
  '上海市黄浦区大同初级中学',
  '上海市向明初级中学',
  '上海市卢湾初级中学',
  '位育初级中学',
  '上海市园南中学',
  '上海南洋模范初级中学',
  '市北初级中学',
  '上海市市西初级中学',
  '上海市静安区彭浦初级中学',
  '上海外国语大学苏河湾实验中学',
  '延安初级中学',
  '上海市西延安中学',
  '上海市娄山中学',
  '上海市长宁区天山初级中学',
  '张江集团中学',
  '上海市浦东新区建平西校',
  '建平实验中学',
  '进才实验中学',
  '进才实验学校',
  '上海市莘松中学',
  '铁岭中学',
  '上海市梅陇中学',
  '上海市宝山区求真中学',
  '上海市宝山区求真中学北校',
  '上海市宝山区求真中学南校',
  '同济大学附属实验中学',
  '上海市奉贤区实验中学',
  '上海市崇明区东门中学',
  '上海市金山区蒙山中学',
  '罗星中学',
];

// elite_cohort 映射（基于旧 tier）
const ELITE_COHORT_MAP = {
  '四校': '四校',
  '八大': '八大',
  '四校分校': '四校分校',
  '八大分校': '八大分校',
};

// 市重点 tier 集合
const KEY_TIERS = new Set(['四校', '八大', '四校分校', '八大分校', '市重点']);

// ─── 核心映射函数 ───────────────────────────────────────
function computeFields(school) {
  const tier = (school.tier || '').trim();
  const stage = (school.schoolStageLabel || '').trim();
  const name = (school.name || '').trim();
  const type = (school.schoolTypeLabel || '').trim();

  let schoolKeyLevel = '';
  let eliteCohort = '';

  // 1) elite_cohort
  if (ELITE_COHORT_MAP[tier]) {
    eliteCohort = ELITE_COHORT_MAP[tier];
  } else if (SANGONG.includes(name)) {
    eliteCohort = '三公';
  }

  // 2) school_key_level
  if (stage === '初中') {
    if (TOP_MINBAN.includes(name)) {
      schoolKeyLevel = '顶级民办';
    } else if (SANGONG.includes(name)) {
      schoolKeyLevel = '三公';
    } else if (type === '公办' && QUALITY_PUBLIC_JUNIOR.includes(name)) {
      schoolKeyLevel = '优质公办';
    } else {
      schoolKeyLevel = '一般初中';
    }
  } else {
    // 高中 / 完全中学
    if (KEY_TIERS.has(tier) || SANGONG.includes(name)) {
      schoolKeyLevel = '市重点';
    } else if (tier === '区重点') {
      schoolKeyLevel = '区重点';
    } else {
      schoolKeyLevel = '一般高中';
    }
  }

  return { schoolKeyLevel, eliteCohort };
}

// ─── 统计 ───────────────────────────────────────────────
function printStats(arr, label) {
  const skl = {}, ec = {};
  for (const s of arr) {
    skl[s.schoolKeyLevel] = (skl[s.schoolKeyLevel] || 0) + 1;
    ec[s.eliteCohort || ''] = (ec[s.eliteCohort || ''] || 0) + 1;
  }
  console.log(`\n${label}`);
  console.log('schoolKeyLevel:');
  Object.entries(skl).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('eliteCohort:');
  Object.entries(ec).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k||'(空)'}: ${v}`));
}

// ─── 主逻辑 ─────────────────────────────────────────────
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const doSupabase = process.argv.includes('--supabase');

  if (isDryRun) console.log('═══ DRY RUN（仅预览，不写文件）═══\n');
  if (doSupabase) console.log('═══ 包含 Supabase 同步 ═══\n');

  // 读取 JSON
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  const arr = JSON.parse(raw);
  console.log(`读取记录数: ${arr.length}`);

  // 备份
  let bakPath = '';
  if (!isDryRun) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    bakPath = path.join(BACKUP_DIR, `schools-pre-tier-split-${ts}.json`);
    fs.writeFileSync(bakPath, raw, 'utf8');
    console.log(`备份: ${bakPath}\n`);
  }

  // 修正 8 所初中八大分校并计算新字段
  let fixed8 = 0;
  for (const s of arr) {
    if (s.schoolStageLabel === '初中' && s.tier === '八大分校') {
      s.tier = '一般';
      fixed8++;
    }
    const { schoolKeyLevel, eliteCohort } = computeFields(s);
    s.schoolKeyLevel = schoolKeyLevel;
    s.eliteCohort = eliteCohort;
  }

  if (fixed8 > 0) console.log(`✓ 修正 ${fixed8} 所初中八大分校→一般（对齐 Supabase）`);

  // 打印分布
  printStats(arr, '=== 拆分后分布 ===');

  if (isDryRun) {
    console.log('\nDRY RUN 结束，未写入文件');
    process.exit(0);
  }

  // 删除旧 tier 字段
  let removed = 0;
  for (const s of arr) {
    if ('tier' in s) { delete s.tier; removed++; }
  }
  console.log(`\n已移除 tier 字段: ${removed} 条`);

  // 写回 JSON
  fs.writeFileSync(JSON_PATH, JSON.stringify(arr, null, 2) + '\n', 'utf8');
  console.log('✓ 已写入 data/schools.json');

  // 生成迁移 SQL
  const migDir = MIGRATIONS_DIR;
  fs.mkdirSync(migDir, { recursive: true });
  const migContent = `-- 004_split_tier_into_two_fields.sql
-- 将 tier 拆分为 school_key_level + elite_cohort

ALTER TABLE IF EXISTS public.schools
  ADD COLUMN IF NOT EXISTS school_key_level TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS elite_cohort     TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.schools.school_key_level IS '官方重点层级：市重点/区重点/特色高中/一般高中 | 顶级民办/优质公办/三公/一般初中';
COMMENT ON COLUMN public.schools.elite_cohort IS '精英声誉梯队标签（高中/完中）：四校/八大/四校分校/八大分校/三公';
`;
  const migFile = path.join(migDir, '004_split_tier_into_two_fields.sql');
  fs.writeFileSync(migFile, migContent, 'utf8');
  console.log(`✓ 迁移 SQL: ${migFile}`);
  console.log('  → 请在 Supabase Dashboard → SQL Editor 中执行此文件');

  // ─── Supabase 同步 ──────────────────────────────
  if (doSupabase) {
    const { getServiceClient, SCHOOLS_TABLE } = require('../shared/supabase-client');
    const client = getServiceClient();

    console.log('\n=== 开始同步 Supabase ===');

    // Step 1: 检查列是否存在
    let colsExist = false;
    try {
      const { data: td } = await client.from(SCHOOLS_TABLE).select('school_key_level').limit(1);
      colsExist = true;
    } catch {
      console.log('⚠ school_key_level 列不存在，请先在 Supabase SQL Editor 执行迁移 SQL');
      console.log('  完成后重新运行: node scripts/split-tier-fields.js --supabase');
      process.exit(1);
    }

    // Step 2: 批量更新
    const BATCH = 100;
    let ok = 0, fail = 0;

    for (let i = 0; i < arr.length; i += BATCH) {
      const batch = arr.slice(i, i + BATCH);
      const names = batch.map(s => s.name);

      const { data: matches } = await client
        .from(SCHOOLS_TABLE)
        .select('id, name')
        .in('name', names);

      if (!matches) { fail += batch.length; continue; }

      for (const s of batch) {
        const match = matches.find(m => m.name === s.name);
        if (!match) { fail++; continue; }
        const { error } = await client
          .from(SCHOOLS_TABLE)
          .update({
            school_key_level: s.schoolKeyLevel,
            elite_cohort: s.eliteCohort,
          })
          .eq('id', match.id);
        if (error) {
          console.log(`  ❌ ${s.name}: ${error.message}`);
          fail++;
        } else {
          ok++;
        }
      }
    }

    console.log(`\nSupabase 同步: 成功 ${ok} / 失败 ${fail}`);
    if (fail > 0) console.log(`  ⚠ ${fail} 条未匹配或更新失败`);
  }

  console.log('\n✅ 全部完成');
  console.log(`   data/schools.json → 已拆分`);
  if (bakPath) console.log(`   备份 → ${bakPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
