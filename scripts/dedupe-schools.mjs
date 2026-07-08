// 一次性去重脚本：合并 A 类 5 组完中初高中记录、删除 B/C 类 5 条错误/重复记录
// 用法：node scripts/dedupe-schools.mjs
// 运行后请执行 npm run data:validate 与测试套件

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const SCHOOLS_PATH = path.join(cwd, 'data', 'schools.json');

// A 类合并：LO（初中部/重复登记，districtId 不规范）合并到 HI（高中部记录）
const MERGE_PAIRS = [
  { hiId: 'huangpu-上海市同济黄浦设计创意中学', loId: '黄浦区-同济黄浦设计创意中学' },
  { hiId: 'huangpu-上海市金陵中学',             loId: '黄浦区-金陵中学' },
  { hiId: 'jingan-上海市民立中学',              loId: '静安区-民立中学' },
  { hiId: 'songjiang-上海市松江区民办茸一中学', loId: '松江区-松江区民办茸一中学' },
  { hiId: 'xuhui-上海市民办世外中学',          loId: 'xuhui-世外中学' },
];

// B/C 类删除：删 id -> 真校 id（用于把反向引用重写为真校）
const DELETE_MAP = {
  '徐汇区-上海师范大学附属外国语中学': 'songjiang-上海师范大学附属外国语中学',
  'minhang-上海市民办交华中学':         'baoshan-上海市民办交华中学',
  'changning-民办新华初级中学':         'hongkou-上海市民办新华初级中学',
  'minhang-上海市七宝德怀特高级中学':   'minhang-上海市民办七宝德怀特高级中学',
  'minhang-上海市虹桥中学':             '长宁区-虹桥中学',
};

// 完整的旧 id -> 新 id 映射（合并 + 删除）
const ID_REWRITE = {
  ...Object.fromEntries(MERGE_PAIRS.map(({ hiId, loId }) => [loId, hiId])),
  ...DELETE_MAP,
};

function dedupeArray(arr) {
  if (!Array.isArray(arr)) return arr;
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// 完中阶段/分类推导：保留 HI 的 school_type_label
function deriveCompleteFields(hi) {
  const type = hi.schoolTypeLabel; // '公办' | '民办' | ...
  if (type === '公办') {
    return { schoolStage: 'complete', schoolStageLabel: '完全中学', tier: '公办完全中学', category: 'gongban-chuzhong' };
  }
  if (type === '民办') {
    return { schoolStage: 'complete', schoolStageLabel: '完全中学', tier: '民办完全中学', category: 'minban-chuzhong' };
  }
  // 其他类型（国际等）保留 HI 原值，只改 stage
  return {
    schoolStage: 'complete',
    schoolStageLabel: '完全中学',
    tier: hi.tier,
    category: hi.category,
  };
}

// 标量字段：HI 优先（已是非空值则保留），否则取 LO
function mergeScalar(hiVal, loVal) {
  if (hiVal !== undefined && hiVal !== null && hiVal !== '' && !(Array.isArray(hiVal) && hiVal.length === 0)) {
    return hiVal;
  }
  return loVal;
}

// 合并 HI 与 LO 的记录，更新 stage/tier/category
function mergeSchoolRecord(hi, lo) {
  const merged = { ...hi };

  // 阶段/分类升级为完中
  const complete = deriveCompleteFields(hi);
  merged.schoolStage = complete.schoolStage;
  merged.schoolStageLabel = complete.schoolStageLabel;
  merged.tier = complete.tier;
  merged.category = complete.category;

  // 标量字段：HI 优先，缺失用 LO
  for (const key of [
    'address', 'phone', 'website', 'foundingYear', 'isBoarding', 'isInternational',
    'image', 'description', 'achievements', 'admissionNotes', 'group', 'groupCanonical',
  ]) {
    merged[key] = mergeScalar(hi[key], lo[key]);
  }

  // 数组字段：去重合并
  for (const key of [
    'features', 'tags', 'trainingDirections', 'facilities', 'decisionTags',
    'searchKeywords', 'specializations', 'related_schools', 'admissionMethods',
    'admissionRoutes',
  ]) {
    merged[key] = dedupeArray([...(hi[key] || []), ...(lo[key] || [])]);
  }

  // profileSignals：合并对象，routeFocus 等数组去重合并
  if (hi.profileSignals || lo.profileSignals) {
    const psHi = hi.profileSignals || {};
    const psLo = lo.profileSignals || {};
    const mergedPs = { ...psLo, ...psHi }; // HI 覆盖 LO（stage/ownership 等 HI 已是真值）
    for (const key of ['routeFocus']) {
      mergedPs[key] = dedupeArray([...(psHi[key] || []), ...(psLo[key] || [])]);
    }
    merged.profileSignals = mergedPs;
  }

  // updatedAt: 取较新者
  const tHi = Date.parse(hi.updatedAt || '');
  const tLo = Date.parse(lo.updatedAt || '');
  merged.updatedAt = (Number.isFinite(tHi) && tHi >= (Number.isFinite(tLo) ? tLo : 0))
    ? hi.updatedAt
    : lo.updatedAt || hi.updatedAt;

  // profileDepth: 取较高档
  const depthRank = { foundation: 0, enhanced: 1, priority: 2 };
  merged.profileDepth = (depthRank[hi.profileDepth] || 0) >= (depthRank[lo.profileDepth] || 0)
    ? hi.profileDepth
    : lo.profileDepth;

  // source: 保留 HI 的（高中部招生数据来源），如 HI 无则用 LO
  merged.source = hi.source || lo.source;

  // contentFile: 保留 HI 的（HI 文件名规范）
  merged.contentFile = hi.contentFile;

  return merged;
}

// 合并 HI 与 LO 的 markdown：HI stub + 分隔 + LO 内容
function mergeMarkdown(hiMd, loMd) {
  const parts = [hiMd.trim()];
  if (loMd && loMd.trim()) {
    parts.push('', '---', '', loMd.trim());
  }
  return `${parts.join('\n')}\n`;
}

function rewriteIdArray(arr) {
  if (!Array.isArray(arr)) return arr;
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const next = typeof item === 'string' ? (ID_REWRITE[item] || item) : item;
    const key = typeof next === 'object' && next !== null ? JSON.stringify(next) : String(next);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }
  return out;
}

function rewriteRouteArray(arr) {
  if (!Array.isArray(arr)) return arr;
  const seen = new Set();
  const out = [];
  for (const r of arr) {
    if (!r || typeof r !== 'object') {
      out.push(r);
      continue;
    }
    const next = { ...r };
    if (typeof next.high_school_id === 'string') {
      next.high_school_id = ID_REWRITE[next.high_school_id] || next.high_school_id;
    }
    const key = JSON.stringify(next);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }
  return out;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function deleteFileIfExist(p) {
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    return true;
  }
  return false;
}

function main() {
  const raw = readJson(SCHOOLS_PATH);
  const arr = Array.isArray(raw) ? raw : raw.schools;
  console.log(`Loaded ${arr.length} schools`);

  const byId = new Map(arr.map((s) => [s.id, s]));

  // 校验所有 hi/lo id 都存在
  const missing = [];
  for (const { hiId, loId } of MERGE_PAIRS) {
    if (!byId.has(hiId)) missing.push(`hi: ${hiId}`);
    if (!byId.has(loId)) missing.push(`lo: ${loId}`);
  }
  for (const id of Object.keys(DELETE_MAP)) {
    if (!byId.has(id)) missing.push(`del: ${id}`);
  }
  if (missing.length) {
    throw new Error(`missing expected ids: ${missing.join(', ')}`);
  }

  // === A 类合并 ===
  const mergedRecords = [];
  for (const { hiId, loId } of MERGE_PAIRS) {
    const hi = byId.get(hiId);
    const lo = byId.get(loId);
    const merged = mergeSchoolRecord(hi, lo);
    byId.set(hiId, merged);
    byId.delete(loId);
    mergedRecords.push({ hiId, loId, merged });

    // 合并 markdown：保留 HI 的 contentFile 路径
    const hiMdPath = path.join(cwd, hi.contentFile);
    const loMdPath = path.join(cwd, lo.contentFile);
    if (fs.existsSync(hiMdPath) && fs.existsSync(loMdPath)) {
      const hiMd = fs.readFileSync(hiMdPath, 'utf8');
      const loMd = fs.readFileSync(loMdPath, 'utf8');
      fs.writeFileSync(hiMdPath, mergeMarkdown(hiMd, loMd), 'utf8');
      deleteFileIfExist(loMdPath);
      console.log(`[merge] ${hiId} <- ${loId}; markdown combined into ${hi.contentFile}, removed ${lo.contentFile}`);
    } else if (fs.existsSync(loMdPath)) {
      // HI md 不存在但 LO 存在：把 LO 内容写到 HI 路径，然后删 LO
      fs.writeFileSync(hiMdPath, fs.readFileSync(loMdPath, 'utf8'), 'utf8');
      deleteFileIfExist(loMdPath);
      console.log(`[merge] ${hiId}: HI md missing, copied LO md -> ${hi.contentFile}, removed ${lo.contentFile}`);
    } else {
      console.log(`[merge] ${hiId} <- ${loId}: no md files to combine (skipped)`);
    }
  }

  // === B/C 类删除 ===
  const deletedIds = [];
  for (const delId of Object.keys(DELETE_MAP)) {
    if (!byId.has(delId)) {
      console.log(`[delete] ${delId}: not found (already merged?)`);
      continue;
    }
    const rec = byId.get(delId);
    byId.delete(delId);
    deletedIds.push(delId);
    const mdPath = rec.contentFile ? path.join(cwd, rec.contentFile) : null;
    if (mdPath && deleteFileIfExist(mdPath)) {
      console.log(`[delete] ${delId}; removed markdown ${rec.contentFile}`);
    } else {
      console.log(`[delete] ${delId}; (no markdown)`);
    }
  }

  // === 重写所有 related_schools / admissionRoutes 中的旧 id ===
  let rewriteCount = 0;
  const finalArr = Array.from(byId.values());
  for (const s of finalArr) {
    if (Array.isArray(s.related_schools)) {
      const before = s.related_schools.length;
      s.related_schools = rewriteIdArray(s.related_schools);
      if (s.related_schools.length !== before) rewriteCount++;
    }
    if (Array.isArray(s.admissionRoutes)) {
      const before = s.admissionRoutes.length;
      s.admissionRoutes = rewriteRouteArray(s.admissionRoutes);
      if (s.admissionRoutes.length !== before) rewriteCount++;
    }
  }
  if (rewriteCount > 0) {
    console.log(`Rewrote id references in ${rewriteCount} records`);
  }

  // === 写回 ===
  // 保留原结构（如果是 {schools: [...]} 则保持，否则直接数组）
  const out = Array.isArray(raw) ? finalArr : { ...raw, schools: finalArr };
  writeJson(SCHOOLS_PATH, out);
  console.log(`Wrote ${finalArr.length} schools to data/schools.json (before: ${arr.length})`);

  // === 残留引用检查 ===
  const danglingRefs = [];
  const finalIds = new Set(finalArr.map((s) => s.id));
  for (const s of finalArr) {
    for (const r of s.related_schools || []) {
      if (typeof r === 'string' && !finalIds.has(r)) danglingRefs.push({ from: s.id, field: 'related_schools', ref: r });
    }
    for (const ar of s.admissionRoutes || []) {
      if (ar.high_school_id && !finalIds.has(ar.high_school_id)) {
        danglingRefs.push({ from: s.id, field: 'admissionRoutes.high_school_id', ref: ar.high_school_id });
      }
    }
  }
  if (danglingRefs.length) {
    console.log('DANGLING REFS (please investigate):');
    for (const r of danglingRefs) console.log(`  ${r.from} -> ${r.field} -> ${r.ref}`);
  } else {
    console.log('No dangling references remain.');
  }
}

main();
