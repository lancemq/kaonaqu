#!/usr/bin/env node
/**
 * 审计 Supabase schools 表的 tier / school_property_label 字段（只读，不写库）
 *   node scripts/audit-supabase-tier-type.js
 *
 * 产出：
 *   - 控制台摘要（distinct 分布、需纠错条数）
 *   - reports/supabase-tier-type-audit.md  可读报告
 *   - reports/supabase-tier-type-corrections.json  机器可读纠错计划（供后续 apply 使用）
 */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { getServiceClient, SCHOOLS_TABLE, isSupabaseConfigured } = require('../shared/supabase-client');

// ===== 规范目标值（取自 clean-school-tier-fields.mjs 的清洗口径） =====
const CANONICAL_TIERS = new Set(['四校', '四校分校', '八大', '八大分校', '市重点', '区重点', '一般']);
const VALID_TYPES = new Set(['公办', '民办', '中外合作', '外籍']);

// ===== 复用项目既有清洗逻辑（与 clean-school-tier-fields.mjs 对齐） =====
function cleanTypeLabel(school) {
  const tl = String(school.school_property_label || '').trim();
  if (tl === '公办') return '公办';
  if (['民办', '民办双语', '民办双语 / 国际化', '民办双语/国际化'].includes(tl)) return '民办';
  if (tl === '国际' || tl === '外籍') return tl;
  const tier = String(school.tier || '');
  for (const w of ['公办', '民办', '国际']) {
    if (tier.includes(w)) return w === '国际' ? '国际' : w;
  }
  return '公办';
}

function cleanTier(school) {
  const text = `${school.tier || ''} ${school.school_property_label || ''}`;
  if (text.includes('四校分校')) return '四校分校';
  if (text.includes('四校')) return '四校';
  if (text.includes('八大分校')) return '八大分校';
  if (text.includes('八大')) return '八大';
  if (text.includes('市实验性示范性') || text.includes('市重点') || text.includes('享受市实验')) return '市重点';
  if (text.includes('区实验性示范性') || text.includes('区重点')) return '区重点';
  return '一般';
}

const HS_TIERS = new Set(['四校', '四校分校', '八大', '八大分校', '市重点', '区重点']);

async function fetchAll() {
  const c = getServiceClient();
  const cols = 'id,slug,name,district_name,school_stage_label,school_property_label,tier,is_international,description';
  const PAGE = 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await c.from(SCHOOLS_TABLE).select(cols).range(from, from + PAGE - 1);
    if (error) throw new Error('查询失败: ' + error.message);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.error('Supabase 未配置，请检查 .env.local 中的 KNQ_SUPABASE_URL / SUPABASE_URL 与 service_role key');
    process.exit(1);
  }
  console.log(`\n=== 审计 Supabase.${SCHOOLS_TABLE}（只读） ===\n`);
  const rows = await fetchAll();
  console.log(`拉取到 ${rows.length} 条学校记录\n`);

  const tierDist = {};
  const typeDist = {};
  const corrections = [];
  const nonStdTiers = {};
  const nonStdTypes = {};

  for (const r of rows) {
    const curTier = String(r.tier || '').trim();
    const curType = String(r.school_property_label || '').trim();
    tierDist[curTier || '(空)'] = (tierDist[curTier || '(空)'] || 0) + 1;
    typeDist[curType || '(空)'] = (typeDist[curType || '(空)'] || 0) + 1;

    let newTier = cleanTier(r);
    const newType = cleanTypeLabel(r);
    const reasons = [];

    if (curTier && !CANONICAL_TIERS.has(curTier)) {
      nonStdTiers[curTier] = (nonStdTiers[curTier] || 0) + 1;
      reasons.push(`tier 非规范值「${curTier}」→「${newTier}」`);
    }
    if (curType && !VALID_TYPES.has(curType)) {
      nonStdTypes[curType] = (nonStdTypes[curType] || 0) + 1;
      reasons.push(`school_property_label 非规范值「${curType}」→「${newType}」`);
    }
    if (newTier !== curTier) reasons.push(`tier 需校正「${curTier || '(空)'}」→「${newTier}」`);
    if (newType !== curType) reasons.push(`school_property_label 需校正「${curType || '(空)'}」→「${newType}」`);

    // 阶段/梯队一致性：纯初中阶段不应带高中梯队，按项目规范统一为「一般」
    const stage = String(r.school_stage_label || '').trim();
    if (stage === '初中' && HS_TIERS.has(newTier)) {
      reasons.push(`纯初中阶段(${stage})带高中梯队「${newTier}」→ 修正为「一般」`);
      newTier = '一般';
    }

    if (reasons.length) {
      corrections.push({
        slug: r.slug,
        name: r.name,
        district_name: r.district_name,
        school_stage_label: stage,
        current_tier: curTier,
        proposed_tier: newTier,
        current_school_property_label: curType,
        proposed_school_property_label: newType,
        reasons
      });
    }
  }

  // ===== 控制台摘要 =====
  console.log('━━━ tier 当前分布（Supabase）━');
  Object.entries(tierDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const mark = CANONICAL_TIERS.has(k) ? ' ' : ' ✗非规范';
    console.log(`  ${String(v).padStart(4)}  ${k}${mark}`);
  });
  console.log('\n━━━ school_property_label 当前分布（Supabase）━');
  Object.entries(typeDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const mark = VALID_TYPES.has(k) ? ' ' : ' ✗非规范';
    console.log(`  ${String(v).padStart(4)}  ${k}${mark}`);
  });

  const tierChanged = corrections.filter((c) => c.proposed_tier !== c.current_tier).length;
  const typeChanged = corrections.filter((c) => c.proposed_school_property_label !== c.current_school_property_label).length;
  const nonStdTierRows = corrections.filter((c) => c.current_tier && !CANONICAL_TIERS.has(c.current_tier)).length;
  const nonStdTypeRows = corrections.filter((c) => c.current_school_property_label && !VALID_TYPES.has(c.current_school_property_label)).length;
  console.log('\n━━━ 纠错统计 ━━━');
  console.log(`  需改动行数（tier 或 type 任一变化）: ${corrections.length}`);
  console.log(`    tier 需变更: ${tierChanged}`);
  console.log(`    school_property_label 需变更: ${typeChanged}`);
  console.log(`    其中 tier 非规范值行: ${nonStdTierRows}`);
  console.log(`    其中 type 非规范值行: ${nonStdTypeRows}`);

  // ===== 写报告 =====
  const outDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(outDir, { recursive: true });

  const md = [
    `# Supabase schools 表 tier / school_property_label 审计`,
    '',
    `> 生成时间: ${new Date().toLocaleString('zh-CN')}`,
    `> 数据源: Supabase \`${SCHOOLS_TABLE}\` 表（共 ${rows.length} 条）`,
    `> 范围: 第一期 —— 仅校验 tier 与 school_property_label 两字段`,
    '',
    `## 规范目标值`,
    '',
    `- **tier** ∈ { 四校, 四校分校, 八大, 八大分校, 市重点, 区重点, 一般 }`,
    `- **school_property_label** ∈ { 公办, 民办, 国际, 外籍 }`,
    '',
    `## tier 当前分布（Supabase）`,
    '',
    `| 值 | 条数 | 是否规范 |`,
    `| --- | --- | --- |`,
    ...Object.entries(tierDist).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      `| ${k} | ${v} | ${CANONICAL_TIERS.has(k) ? '✓' : '✗ 非规范'} |`),
    '',
    `## school_property_label 当前分布（Supabase）`,
    '',
    `| 值 | 条数 | 是否规范 |`,
    `| --- | --- | --- |`,
    ...Object.entries(typeDist).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      `| ${k} | ${v} | ${VALID_TYPES.has(k) ? '✓' : '✗ 非规范'} |`),
    '',
    `## 纠错统计`,
    '',
    `- 需改动行数（tier 或 type 任一变化）: **${corrections.length}**`,
    `- tier 需变更: ${tierChanged}`,
    `- school_property_label 需变更: ${typeChanged}`,
    `- 其中 tier 非规范值行: ${nonStdTierRows}`,
    `- 其中 type 非规范值行: ${nonStdTypeRows}`,
    '',
    `## 待纠错明细（前 200 行）`,
    '',
    `| # | 学校 | 区 | 阶段 | 当前 tier | 建议 tier | 当前 type | 建议 type | 原因 |`,
    `| --- | --- | --- | --- | --- | --- | --- | --- | --- |`,
    ...corrections.slice(0, 200).map((c, i) =>
      `| ${i + 1} | ${c.name} | ${c.district_name || ''} | ${c.school_stage_label || ''} | ${c.current_tier || '(空)'} | ${c.proposed_tier} | ${c.current_school_property_label || '(空)'} | ${c.proposed_school_property_label} | ${c.reasons.join('；')} |`),
    corrections.length > 200 ? `\n> 仅展示前 200 行，完整 ${corrections.length} 行见 corrections.json` : '',
    ''
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'supabase-tier-type-audit.md'), md, 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'supabase-tier-type-corrections.json'),
    JSON.stringify({ total: rows.length, corrections }, null, 2) + '\n',
    'utf8'
  );
  console.log(`\n✓ 报告: reports/supabase-tier-type-audit.md`);
  console.log(`✓ 纠错计划: reports/supabase-tier-type-corrections.json`);
  console.log(`\n下一步: 确认无误后运行 apply 脚本写回 Supabase（本脚本未做任何写操作）`);
}

main().catch((err) => { console.error(err); process.exit(1); });
