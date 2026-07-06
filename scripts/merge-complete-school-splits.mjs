// 合并 3 组完中拆分重复：完中记录保留，初中部/高中部记录字段合并后删除
// 用法：node scripts/merge-complete-school-splits.mjs

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const SCHOOLS_PATH = path.join(cwd, 'data', 'schools.json');

// 合并对：HI 保留，LO 合并后删除
const MERGE_PAIRS = [
  { hiId: 'minhang-上海市民办文来中学', loIds: ['minhang-上海市文来中学初中部', 'minhang-文来中学高中部'] },
  { hiId: 'pudong-上海市上南中学',      loIds: ['pudong-上南中学'] },
  { hiId: 'putuo-上海市民办新黄浦实验学校', loIds: ['putuo-新黄浦实验学校'] },
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

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

function mergeScalar(hiVal, loVal) {
  if (hiVal !== undefined && hiVal !== null && hiVal !== '' && !(Array.isArray(hiVal) && hiVal.length === 0)) {
    return hiVal;
  }
  return loVal;
}

function mergeSchoolRecord(hi, ...los) {
  const merged = { ...hi };
  // 标量字段：HI 优先
  for (const key of ['address', 'phone', 'website', 'foundingYear', 'isBoarding', 'isInternational',
    'image', 'description', 'achievements', 'admissionNotes', 'group', 'groupCanonical']) {
    for (const lo of los) {
      merged[key] = mergeScalar(merged[key], lo[key]);
    }
  }
  // 数组字段：去重合并
  for (const key of ['features', 'tags', 'trainingDirections', 'facilities', 'decisionTags',
    'searchKeywords', 'specializations', 'related_schools', 'admissionMethods', 'admissionRoutes']) {
    let arr = [...(hi[key] || [])];
    for (const lo of los) {
      if (Array.isArray(lo[key])) arr = [...arr, ...lo[key]];
    }
    merged[key] = dedupeArray(arr);
  }
  // profileSignals：合并对象
  const psSources = [hi.profileSignals, ...los.map((lo) => lo.profileSignals)].filter(Boolean);
  if (psSources.length) {
    const mergedPs = {};
    for (const ps of psSources) {
      for (const [k, v] of Object.entries(ps)) {
        if (Array.isArray(v)) {
          mergedPs[k] = dedupeArray([...(mergedPs[k] || []), ...v]);
        } else if (mergedPs[k] === undefined) {
          mergedPs[k] = v;
        }
      }
    }
    merged.profileSignals = mergedPs;
  }
  // updatedAt: 取最新
  let latest = Date.parse(hi.updatedAt || '');
  for (const lo of los) {
    const t = Date.parse(lo.updatedAt || '');
    if (Number.isFinite(t) && t > latest) latest = t;
  }
  merged.updatedAt = latest ? new Date(latest).toISOString() : hi.updatedAt;
  // profileDepth: 取较高
  const rank = { foundation: 0, enhanced: 1, priority: 2 };
  let highRank = rank[hi.profileDepth] || 0;
  for (const lo of los) {
    if ((rank[lo.profileDepth] || 0) > highRank) {
      merged.profileDepth = lo.profileDepth;
      highRank = rank[lo.profileDepth];
    }
  }
  return merged;
}

function mergeMarkdown(hiMd, ...loMds) {
  const parts = [hiMd.trim()];
  for (const md of loMds) {
    if (md && md.trim()) {
      parts.push('', '---', '', md.trim());
    }
  }
  return `${parts.join('\n')}\n`;
}

function main() {
  const raw = readJson(SCHOOLS_PATH);
  const arr = Array.isArray(raw) ? raw : raw.schools;
  console.log(`Loaded ${arr.length} schools`);

  const byId = new Map(arr.map((s) => [s.id, s]));

  // id 重写映射：LO -> HI
  const idRewrite = {};
  for (const { hiId, loIds } of MERGE_PAIRS) {
    for (const loId of loIds) idRewrite[loId] = hiId;
  }

  // 校验所有 id 存在
  for (const { hiId, loIds } of MERGE_PAIRS) {
    if (!byId.has(hiId)) throw new Error(`missing hi: ${hiId}`);
    for (const loId of loIds) {
      if (!byId.has(loId)) throw new Error(`missing lo: ${loId}`);
    }
  }

  // 执行合并
  let mergeCount = 0;
  for (const { hiId, loIds } of MERGE_PAIRS) {
    const hi = byId.get(hiId);
    const los = loIds.map((id) => byId.get(id));
    const merged = mergeSchoolRecord(hi, ...los);
    byId.set(hiId, merged);

    // 合并 markdown
    const hiMdPath = path.join(cwd, hi.contentFile);
    const loMds = [];
    for (const lo of los) {
      if (lo.contentFile) {
        const p = path.join(cwd, lo.contentFile);
        if (fs.existsSync(p)) {
          loMds.push(fs.readFileSync(p, 'utf8'));
          fs.unlinkSync(p);
        }
      }
    }
    if (loMds.length && fs.existsSync(hiMdPath)) {
      const hiMd = fs.readFileSync(hiMdPath, 'utf8');
      fs.writeFileSync(hiMdPath, mergeMarkdown(hiMd, ...loMds), 'utf8');
    }

    for (const loId of loIds) byId.delete(loId);
    mergeCount++;
    console.log(`[merge] ${hiId} <- ${JSON.stringify(loIds)}`);
  }

  // 重写所有反向引用
  const finalArr = Array.from(byId.values());
  let rewriteCount = 0;
  for (const s of finalArr) {
    if (Array.isArray(s.related_schools)) {
      const before = s.related_schools.length;
      s.related_schools = dedupeArray(
        s.related_schools.map((r) => (typeof r === 'string' ? (idRewrite[r] || r) : r))
      );
      if (s.related_schools.length !== before) rewriteCount++;
    }
    if (Array.isArray(s.admissionRoutes)) {
      const before = s.admissionRoutes.length;
      s.admissionRoutes = dedupeArray(
        s.admissionRoutes.map((r) => {
          if (!r || typeof r !== 'object') return r;
          if (typeof r.high_school_id === 'string' && idRewrite[r.high_school_id]) {
            return { ...r, high_school_id: idRewrite[r.high_school_id] };
          }
          return r;
        })
      );
      if (s.admissionRoutes.length !== before) rewriteCount++;
    }
  }
  console.log(`Rewrote references in ${rewriteCount} records`);

  // 写回
  const out = Array.isArray(raw) ? finalArr : { ...raw, schools: finalArr };
  writeJson(SCHOOLS_PATH, out);
  console.log(`Wrote ${finalArr.length} schools (before: ${arr.length})`);

  // 残留引用检查
  const finalIds = new Set(finalArr.map((s) => s.id));
  const dangling = [];
  for (const s of finalArr) {
    for (const r of s.related_schools || []) {
      if (typeof r === 'string' && !finalIds.has(r)) {
        dangling.push({ from: s.id, field: 'related_schools', ref: r });
      }
    }
    for (const ar of s.admissionRoutes || []) {
      if (ar.high_school_id && !finalIds.has(ar.high_school_id)) {
        dangling.push({ from: s.id, field: 'admissionRoutes', ref: ar.high_school_id });
      }
    }
  }
  if (dangling.length) {
    console.log('DANGLING REFS:');
    for (const r of dangling) console.log(`  ${r.from} -> ${r.field} -> ${r.ref}`);
  } else {
    console.log('No dangling references remain.');
  }
}

main();
