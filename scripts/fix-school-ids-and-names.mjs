// 一次性修正脚本：
// 1. 长宁区-虹桥中学 -> changning-虹桥中学（id 与 contentFile 命名规范化）
// 2. xuhui-上海市民办世外中学 的 name 字段：上海市世外中学 -> 上海市民办世外中学
// 用法：node scripts/fix-school-ids-and-names.mjs

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const SCHOOLS_PATH = path.join(cwd, 'data', 'schools.json');

// id 重命名映射
const ID_RENAME = {
  '长宁区-虹桥中学': 'changning-虹桥中学',
};

// name 修正映射
const NAME_FIX = {
  'xuhui-上海市民办世外中学': {
    from: '上海市世外中学',
    to: '上海市民办世外中学',
  },
};

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

function rewriteIdArray(arr) {
  if (!Array.isArray(arr)) return arr;
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const next = typeof item === 'string' ? (ID_RENAME[item] || item) : item;
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
      next.high_school_id = ID_RENAME[next.high_school_id] || next.high_school_id;
    }
    const key = JSON.stringify(next);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }
  return out;
}

function main() {
  const raw = readJson(SCHOOLS_PATH);
  const arr = Array.isArray(raw) ? raw : raw.schools;
  console.log(`Loaded ${arr.length} schools`);

  // === 1. 重命名 id ===
  let renameCount = 0;
  for (const s of arr) {
    if (ID_RENAME[s.id]) {
      const oldId = s.id;
      const newId = ID_RENAME[oldId];
      s.id = newId;
      // contentFile 也跟着改
      const oldMd = s.contentFile || '';
      if (oldMd.endsWith(`${oldId}.md`)) {
        const newMd = oldMd.replace(`${oldId}.md`, `${newId}.md`);
        const oldPath = path.join(cwd, oldMd);
        const newPath = path.join(cwd, newMd);
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          console.log(`[rename] ${oldId} -> ${newId}; markdown ${oldMd} -> ${newMd}`);
        } else {
          console.log(`[rename] ${oldId} -> ${newId}; markdown not found: ${oldMd}`);
        }
        s.contentFile = newMd;
      }
      renameCount++;
    }
  }
  console.log(`Renamed ${renameCount} school ids`);

  // === 2. 重写所有反向引用 ===
  let rewriteCount = 0;
  for (const s of arr) {
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
  if (rewriteCount > 0) console.log(`Rewrote id references in ${rewriteCount} records`);

  // === 3. 修正 name 字段与 searchKeywords ===
  let nameFixCount = 0;
  for (const s of arr) {
    if (NAME_FIX[s.id]) {
      const { from, to } = NAME_FIX[s.id];
      let changed = false;
      if (s.name === from) {
        s.name = to;
        changed = true;
      }
      // searchKeywords: 把 from 替换为 to，然后去重
      if (Array.isArray(s.searchKeywords)) {
        const before = s.searchKeywords.length;
        s.searchKeywords = dedupeArray(
          s.searchKeywords.map((k) => (k === from ? to : k))
        );
        if (s.searchKeywords.length !== before) changed = true;
      }
      // tags / decisionTags 里如有 from 同样替换
      for (const key of ['tags', 'decisionTags', 'features']) {
        if (Array.isArray(s[key])) {
          s[key] = dedupeArray(s[key].map((k) => (k === from ? to : k)));
        }
      }
      if (changed) {
        nameFixCount++;
        console.log(`[name-fix] ${s.id}: "${from}" -> "${to}"`);
      }
    }
  }
  console.log(`Fixed name in ${nameFixCount} records`);

  // === 4. 写回 ===
  const out = Array.isArray(raw) ? arr : { ...raw, schools: arr };
  writeJson(SCHOOLS_PATH, out);

  // === 5. 残留引用检查 ===
  const finalIds = new Set(arr.map((s) => s.id));
  const dangling = [];
  for (const s of arr) {
    for (const r of s.related_schools || []) {
      if (typeof r === 'string' && !finalIds.has(r)) dangling.push({ from: s.id, field: 'related_schools', ref: r });
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

  // === 6. 重复检查 ===
  const norm = (str) => (str || '').toLowerCase().replace(/[\s\u3000·\-_（）()【】[\]]/g, '').replace(/上海市?/g, '').replace(/上海/g, '');
  const byNormName = {};
  const dups = [];
  for (const x of arr) {
    const nn = norm(x.name);
    if (byNormName[nn]) dups.push({ a: byNormName[nn].id, b: x.id, name: x.name });
    byNormName[nn] = x;
  }
  if (dups.length) {
    console.log('Name dups (still):');
    for (const d of dups) console.log(`  ${d.a} vs ${d.b} | ${d.name}`);
  } else {
    console.log('No name duplicates.');
  }
}

main();
