// 学校数据准确性全面审计脚本
// 用法：node scripts/audit-schools.mjs

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const SCHOOLS_PATH = path.join(cwd, 'data', 'schools.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const raw = readJson(SCHOOLS_PATH);
const arr = Array.isArray(raw) ? raw : raw.schools;
const byId = new Map(arr.map((s) => [s.id, s]));
const allIds = new Set(byId.keys());

// 标准区拼音集合
const DISTRICT_PINYIN = new Set([
  'baoshan', 'changning', 'chongming', 'fengxian', 'hongkou', 'huangpu',
  'jiading', 'jingan', 'jinshan', 'minhang', 'pudong', 'putuo',
  'qingpu', 'songjiang', 'xuhui', 'yangpu',
]);

// 简体转繁体常用字检测（中學、職業、技術等）
const TRADITIONAL_CHARS = /[學職業技術廠場館廳處務團體們際網絡線計劃劃製藝術系統紀錄證書場務員會員會計員會計師師生員會員會員會員會員會員會員]/;

// school_type_label（办学性质）合法值
const VALID_SCHOOL_TYPE = new Set(['公办', '民办', '中外合作', '外籍', '']);
const VALID_SCHOOL_STAGE = new Set(['junior', 'senior_high', 'complete', '']);

// tier 期望值映射（基于 school_type_label）
function expectedTier(s) {
  const t = s.schoolTypeLabel;
  const st = s.schoolStage;
  if (t === '公办' && st === 'junior') return '公办初中';
  if (t === '公办' && st === 'senior_high') return /示范性|实验性/.test(s.tier || '') ? s.tier : '一般高中';
  if (t === '公办' && st === 'complete') return '公办完全中学';
  if (t === '民办' && st === 'junior') return '民办初中';
  if (t === '民办' && st === 'senior_high') return '民办高中';
  if (t === '民办' && st === 'complete') return '民办完全中学';
  return null;
}

function expectedCategory(s) {
  const t = s.schoolTypeLabel;
  const st = s.schoolStage;
  if (t === '公办' && (st === 'junior' || st === 'complete')) return 'gongban-chuzhong';
  if (t === '公办' && st === 'senior_high') return 'gongban-gaozhong';
  if (t === '民办' && (st === 'junior' || st === 'complete')) return 'minban-chuzhong';
  if (t === '民办' && st === 'senior_high') return 'minban-gaozhong';
  if (t === '中外合作' || t === '外籍') return 'guoji-kecheng';
  return null;
}

const problems = {
  id_format: [],         // id 命名不规范
  id_district_mismatch: [], // id 前缀与 districtId 不一致
  trad_chars: [],        // 繁体字
  field_inconsistent: [], // 字段间不一致
  critical_missing: [],  // 关键字段缺失
  contentFile_missing: [], // contentFile 文件不存在
  dangling_refs: [],     // 悬挂引用
  duplicate_name_in_district: [], // 同区同名
  cross_district_same_name: [], // 跨区同名
  merge_residual: [],    // 合并遗留标签
  address_district_mismatch: [], // 地址所在区与 districtName 不一致
  founding_year_invalid: [], // 创办年份异常
  empty_arrays: [],     // 关键数组为空
};

// === 1. id 命名规范 ===
for (const s of arr) {
  // 1.1 id 前缀应为区拼音
  const dashIdx = s.id.indexOf('-');
  if (dashIdx < 0) {
    problems.id_format.push({ id: s.id, issue: 'no dash' });
    continue;
  }
  const prefix = s.id.slice(0, dashIdx);
  if (!DISTRICT_PINYIN.has(prefix)) {
    problems.id_format.push({ id: s.id, issue: `prefix "${prefix}" not in pinyin set` });
  }
  // 1.2 id 前缀应与 districtId 一致
  if (prefix !== s.districtId) {
    problems.id_district_mismatch.push({ id: s.id, prefix, districtId: s.districtId });
  }
  // 1.3 繁体字
  if (TRADITIONAL_CHARS.test(s.id) || TRADITIONAL_CHARS.test(s.name)) {
    problems.trad_chars.push({ id: s.id, name: s.name });
  }
}

// === 2. 字段一致性 ===
for (const s of arr) {
  const issues = [];
  // school_type_label 合法性
  if (s.schoolTypeLabel && !VALID_SCHOOL_TYPE.has(s.schoolTypeLabel)) {
    issues.push(`school_type_label 非法值: ${s.schoolTypeLabel}`);
  }
  // schoolStage / schoolStageLabel
  const stageLabelMap = { junior: '初中', senior_high: '高中', complete: '完全中学', '': '' };
  if (s.schoolStage && s.schoolStageLabel && stageLabelMap[s.schoolStage] && s.schoolStageLabel !== stageLabelMap[s.schoolStage]) {
    issues.push(`stage/label: ${s.schoolStage}/${s.schoolStageLabel}`);
  }
  // profileSignals.stage 与 schoolStage 不一致
  if (s.profileSignals?.stage && s.schoolStage) {
    const ps = s.profileSignals.stage;
    const expectedPs = stageLabelMap[s.schoolStage] || s.schoolStage;
    if (ps !== expectedPs && ps !== s.schoolStageLabel) {
      issues.push(`profileSignals.stage="${ps}" vs schoolStage="${s.schoolStage}"`);
    }
  }
  // profileSignals.ownership 与 school_type_label 不一致
  if (s.profileSignals?.ownership && s.schoolTypeLabel) {
    const po = s.profileSignals.ownership;
    if (po !== s.schoolTypeLabel) {
      issues.push(`profileSignals.ownership="${po}" vs school_type_label="${s.schoolTypeLabel}"`);
    }
  }
  // category 与 school_type_label/stage 不匹配
  const expCat = expectedCategory(s);
  if (expCat && s.category && s.category !== expCat) {
    if (['公办', '民办', '中外合作', '外籍'].includes(s.schoolTypeLabel) && ['junior', 'senior_high', 'complete'].includes(s.schoolStage)) {
      issues.push(`category="${s.category}" expected="${expCat}"`);
    }
  }
  if (issues.length) {
    problems.field_inconsistent.push({ id: s.id, name: s.name, type: s.schoolTypeLabel, stage: s.schoolStage, tier: s.tier, issues });
  }
}

// === 3. 关键字段缺失 ===
for (const s of arr) {
  const missing = [];
  if (!s.schoolTypeLabel) missing.push('schoolTypeLabel');
  if (!s.schoolStage) missing.push('schoolStage');
  if (!s.districtId) missing.push('districtId');
  if (!s.tier) missing.push('tier');
  if (!s.category) missing.push('category');
  if (!s.name) missing.push('name');
  if (!s.contentFile) missing.push('contentFile');
  if (!s.address || !s.address.trim()) missing.push('address');
  if (missing.length) {
    problems.critical_missing.push({ id: s.id, name: s.name, missing });
  }
}

// === 4. contentFile 存在性 ===
for (const s of arr) {
  if (s.contentFile) {
    const p = path.join(cwd, s.contentFile);
    if (!fs.existsSync(p)) {
      problems.contentFile_missing.push({ id: s.id, contentFile: s.contentFile });
    }
  }
}

// === 5. 引用完整性 ===
for (const s of arr) {
  for (const r of s.related_schools || []) {
    if (typeof r === 'string' && !allIds.has(r)) {
      problems.dangling_refs.push({ from: s.id, field: 'related_schools', ref: r });
    }
  }
  for (const ar of s.admissionRoutes || []) {
    if (ar.high_school_id && !allIds.has(ar.high_school_id)) {
      problems.dangling_refs.push({ from: s.id, field: 'admissionRoutes.high_school_id', ref: ar.high_school_id });
    }
  }
}

// === 6. 同名重复 ===
const nameMap = {};
for (const s of arr) {
  if (!nameMap[s.name]) nameMap[s.name] = [];
  nameMap[s.name].push(s);
}
for (const [name, list] of Object.entries(nameMap)) {
  if (list.length < 2) continue;
  // 同区同名
  const byDist = {};
  for (const s of list) {
    if (!byDist[s.districtId]) byDist[s.districtId] = [];
    byDist[s.districtId].push(s.id);
  }
  for (const [dist, ids] of Object.entries(byDist)) {
    if (ids.length > 1) {
      problems.duplicate_name_in_district.push({ name, districtId: dist, ids });
    }
  }
  if (list.length > 1) {
    problems.cross_district_same_name.push({ name, ids: list.map((s) => s.id) });
  }
}

// === 7. 合并遗留标签（民办含公办标签，反之亦然） ===
for (const s of arr) {
  const tags = s.tags || [];
  const kw = s.searchKeywords || [];
  if (s.schoolTypeLabel === '民办') {
    const badTags = tags.filter((t) => t === '公办' || t === '公办初中' || t === 'public');
    const badKw = kw.filter((k) => k === '公办' || k === '公办初中' || k === 'public');
    if (badTags.length || badKw.length) {
      problems.merge_residual.push({ id: s.id, name: s.name, type: s.schoolTypeLabel, badTags, badKw });
    }
  } else if (s.schoolTypeLabel === '公办') {
    const badTags = tags.filter((t) => t === '民办' || t === '民办初中' || t === 'private');
    const badKw = kw.filter((k) => k === '民办' || k === '民办初中' || k === 'private');
    if (badTags.length || badKw.length) {
      problems.merge_residual.push({ id: s.id, name: s.name, type: s.schoolTypeLabel, badTags, badKw });
    }
  }
}

// === 8. 地址与 districtName 不一致 ===
const DISTRICT_NAMES_CN = [
  '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区',
  '闵行区', '宝山区', '嘉定区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区',
];
for (const s of arr) {
  if (!s.address || !s.districtName) continue;
  // 找地址中包含的区名
  const matched = DISTRICT_NAMES_CN.find((d) => s.address.includes(d));
  if (matched && matched !== s.districtName) {
    problems.address_district_mismatch.push({
      id: s.id, name: s.name, districtName: s.districtName, address: s.address.slice(0, 50), matched,
    });
  }
}

// === 9. 创办年份异常 ===
const CURRENT_YEAR = 2026;
for (const s of arr) {
  if (s.foundingYear == null) continue;
  const y = Number(s.foundingYear);
  if (!Number.isFinite(y)) continue;
  if (y > CURRENT_YEAR || y < 1800) {
    problems.founding_year_invalid.push({ id: s.id, name: s.name, foundingYear: s.foundingYear });
  }
}

// === 10. 关键数组为空 ===
for (const s of arr) {
  const empty = [];
  if (Array.isArray(s.tags) && s.tags.length === 0) empty.push('tags');
  if (Array.isArray(s.features) && s.features.length === 0) empty.push('features');
  if (Array.isArray(s.related_schools) && s.related_schools.length === 0) empty.push('related_schools');
  if (Array.isArray(s.admissionMethods) && s.admissionMethods.length === 0) empty.push('admissionMethods');
  if (empty.length) {
    problems.empty_arrays.push({ id: s.id, name: s.name, empty });
  }
}

// === 输出 ===
console.log(`Total schools: ${arr.length}\n`);
for (const [cat, items] of Object.entries(problems)) {
  console.log(`=== ${cat} (${items.length}) ===`);
  if (items.length === 0) {
    console.log('  (none)');
    continue;
  }
  // 输出前 30 条，避免过长
  const limit = items.length > 30 ? 30 : items.length;
  for (let i = 0; i < limit; i++) {
    console.log(`  ${JSON.stringify(items[i])}`);
  }
  if (items.length > limit) {
    console.log(`  ... and ${items.length - limit} more`);
  }
  console.log();
}
