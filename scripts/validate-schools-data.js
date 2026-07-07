#!/usr/bin/env node
/**
 * 校验 Supabase schools 表数据准确性
 *   node scripts/validate-schools-data.js
 *
 * 校验维度：
 *   1. 完整性 — 必填字段非空
 *   2. 唯一性 — slug 唯一、name+district 唯一
 *   3. 格式   — slug 格式、website URL、phone、founding_year
 *   4. 类型   — 布尔、JSONB 数组/对象结构
 *   5. 一致性 — slug 前缀=district_name、admission_info 结构
 *   6. 内容   — 残留模板/梯队标签、标准枚举值
 */
require('dotenv').config({ path: '.env.local' });
const { getServiceClient, SCHOOLS_TABLE } = require('../shared/supabase-client');

const STAGE_VALUES = new Set(['幼儿园', '小学', '初中', '高中', '完中', '完全中学', '九年一贯', '十二年一贯', '十五年一贯', '一贯制']);
const TYPE_VALUES = new Set(['公办', '民办', '其他', '转制', '中外合作', '国际', '国际化']);
const TIER_VALUES = new Set(['', '市实验性示范性高中', '区实验性示范性高中', '特色普通高中', '一般', '区重点', '市重点', '国家重点', '其他', '四校', '八大', '四校分校', '八大分校']);

const issues = [];
const stats = { error: 0, warn: 0, info: 0 };

function addIssue(severity, school, field, message) {
  issues.push({ severity, slug: school.slug, name: school.name, field, message });
  stats[severity] = (stats[severity] || 0) + 1;
}

function isUrl(s) {
  if (!s) return false;
  try { new URL(String(s)); return true; } catch { return false; }
}

function hasTierResidue(text) {
  if (!text) return false;
  return /梯队标签/.test(text) || /^该校(?:属于|是)(?:上海市|区)?(?:实验性示范性|重点)/.test(String(text).trim());
}

function hasTemplateResidue(text) {
  if (!text) return false;
  return /后续可继续补充|当前先完成官方名单收录|待补充|待完善|TODO|占位/.test(text);
}

async function main() {
  const c = getServiceClient();
  const { data, error } = await c.from(SCHOOLS_TABLE).select('*');
  if (error) { console.error('查询失败:', error.message); process.exit(1); }

  console.log(`校验 ${data.length} 条学校记录\n`);

  const slugMap = new Map();
  const nameDistrictMap = new Map();

  data.forEach((school) => {
    // ===== 1. 完整性：必填字段 =====
    if (!school.slug) addIssue('error', school, 'slug', 'slug 为空');
    if (!school.name) addIssue('error', school, 'name', 'name 为空');
    if (!school.district_name) addIssue('error', school, 'district_name', 'district_name 为空');
    if (!school.school_stage_label) addIssue('warn', school, 'school_stage_label', 'school_stage_label 为空');
    if (!school.school_type_label) addIssue('warn', school, 'school_type_label', 'school_type_label 为空');

    // ===== 2. 唯一性 =====
    if (school.slug) {
      if (slugMap.has(school.slug)) {
        addIssue('error', school, 'slug', `slug 重复（与 ${slugMap.get(school.slug)} 相同）`);
      } else {
        slugMap.set(school.slug, school.name);
      }
    }
    const nk = `${school.district_name}|${school.name}`;
    if (nameDistrictMap.has(nk)) {
      addIssue('warn', school, 'name', `区名+校名 重复（与 ${nameDistrictMap.get(nk)} 相同）`);
    } else {
      nameDistrictMap.set(nk, school.slug);
    }

    // ===== 3. 格式校验 =====
    if (school.slug) {
      const expected = `${school.district_name}-${school.name}`;
      if (school.slug !== expected) {
        addIssue('warn', school, 'slug', `slug "${school.slug}" 与预期 "${expected}" 不一致`);
      }
    }
    if (school.website && !isUrl(school.website)) {
      addIssue('warn', school, 'website', `website 非法 URL: ${school.website}`);
    }
    if (school.phone && !/^[\d\-+()（）\s*、转]+$/.test(String(school.phone))) {
      addIssue('warn', school, 'phone', `phone 格式异常: ${school.phone}`);
    }
    if (school.founding_year != null) {
      const y = Number(school.founding_year);
      if (!Number.isInteger(y) || y < 1800 || y > 2026) {
        addIssue('warn', school, 'founding_year', `founding_year 异常: ${school.founding_year}`);
      }
    }
    if (school.image && !isUrl(school.image) && !/^(school-images|\/|images\/)/.test(String(school.image))) {
      addIssue('info', school, 'image', `image 路径异常: ${school.image}`);
    }

    // ===== 4. 类型校验 =====
    if (typeof school.is_boarding !== 'boolean') addIssue('warn', school, 'is_boarding', `非布尔: ${typeof school.is_boarding}`);
    if (typeof school.is_international !== 'boolean') addIssue('warn', school, 'is_international', `非布尔: ${typeof school.is_international}`);
    if (school.features != null && !Array.isArray(school.features)) addIssue('warn', school, 'features', '非数组');
    if (Array.isArray(school.features)) {
      school.features.forEach((f) => {
        if (typeof f !== 'string' || !f.trim()) addIssue('warn', school, 'features', `features 元素无效: ${JSON.stringify(f)}`);
      });
    }

    // ===== 5. admission_info 结构一致性 =====
    if (school.admission_info != null) {
      if (typeof school.admission_info !== 'object' || Array.isArray(school.admission_info)) {
        addIssue('warn', school, 'admission_info', '非对象');
      } else {
        const ai = school.admission_info;
        if (!('code' in ai)) addIssue('info', school, 'admission_info', '缺少 code 字段');
        if (!('methods' in ai)) addIssue('info', school, 'admission_info', '缺少 methods 字段');
        if (!('routes' in ai)) addIssue('info', school, 'admission_info', '缺少 routes 字段');
        if (ai.methods != null && !Array.isArray(ai.methods)) addIssue('warn', school, 'admission_info.methods', '非数组');
        if (ai.routes != null && !Array.isArray(ai.routes)) addIssue('warn', school, 'admission_info.routes', '非数组');
      }
    }

    // ===== 6. 内容质量 =====
    if (hasTierResidue(school.description)) {
      addIssue('warn', school, 'description', '残留梯队标签文字');
    }
    if (hasTemplateResidue(school.description)) {
      addIssue('info', school, 'description', '残留模板占位文字');
    }
    if (hasTemplateResidue(school.achievements)) {
      addIssue('info', school, 'achievements', '残留模板占位文字');
    }
    if (school.school_stage_label && !STAGE_VALUES.has(school.school_stage_label)) {
      addIssue('warn', school, 'school_stage_label', `非标准值: ${school.school_stage_label}`);
    }
    if (school.school_type_label && !TYPE_VALUES.has(school.school_type_label)) {
      addIssue('warn', school, 'school_type_label', `非标准值: ${school.school_type_label}`);
    }
    if (school.tier && !TIER_VALUES.has(school.tier)) {
      addIssue('info', school, 'tier', `非标准梯队值: ${school.tier}`);
    }
  });

  // ===== 输出报告 =====
  const errors = issues.filter((i) => i.severity === 'error');
  const warns = issues.filter((i) => i.severity === 'warn');
  const infos = issues.filter((i) => i.severity === 'info');

  console.log('═══════════════════════════════════════');
  console.log(`  ERROR: ${errors.length}   WARN: ${warns.length}   INFO: ${infos.length}`);
  console.log('═══════════════════════════════════════\n');

  if (errors.length) {
    console.log('━━━ ERROR（必须修复）━━━');
    errors.forEach((i) => console.log(`  [${i.field}] ${i.name} (${i.slug})\n     ${i.message}`));
    console.log('');
  }

  // WARN 按字段聚合统计
  if (warns.length) {
    console.log('━━━ WARN 按字段统计 ━━━');
    const byField = {};
    warns.forEach((i) => { byField[i.field] = (byField[i.field] || 0) + 1; });
    Object.entries(byField).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => {
      console.log(`  ${f}: ${n} 条`);
    });
    console.log('');

    console.log('━━━ WARN 详情（按字段，各前 8 条）━━━');
    const warnByField = {};
    warns.forEach((i) => { (warnByField[i.field] = warnByField[i.field] || []).push(i); });
    Object.entries(warnByField).sort((a, b) => b[1].length - a[1].length).forEach(([f, list]) => {
      console.log(`\n  [${f}] ${list.length} 条:`);
      list.slice(0, 8).forEach((i) => console.log(`    ${i.name} — ${i.message}`));
      if (list.length > 8) console.log(`    ...还有 ${list.length - 8} 条`);
    });
    console.log('');
  }

  if (infos.length) {
    console.log('━━━ INFO 按字段统计 ━━━');
    const byField = {};
    infos.forEach((i) => { byField[i.field] = (byField[i.field] || 0) + 1; });
    Object.entries(byField).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => {
      console.log(`  ${f}: ${n} 条`);
    });

    console.log('\n━━━ INFO 详情（按字段，各前 12 条）━━━');
    const infoByField = {};
    infos.forEach((i) => { (infoByField[i.field] = infoByField[i.field] || []).push(i); });
    Object.entries(infoByField).sort((a, b) => b[1].length - a[1].length).forEach(([f, list]) => {
      console.log(`\n  [${f}] ${list.length} 条:`);
      // tier 输出去重后的非标准值集合
      if (f === 'tier') {
        const vals = new Set(list.map((i) => i.message.replace('非标准梯队值: ', '')));
        console.log(`    非标准值集合: ${[...vals].join(' / ')}`);
      } else {
        list.slice(0, 12).forEach((i) => console.log(`    ${i.name}`));
        if (list.length > 12) console.log(`    ...还有 ${list.length - 12} 条`);
      }
    });
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
