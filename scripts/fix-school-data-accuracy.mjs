// 学校数据准确性综合修复脚本
// 处理：A+B id 命名规范化与繁简转换、C 合并遗留标签清理、D 错误地址与分校区归属
// 用法：node scripts/fix-school-data-accuracy.mjs

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const SCHOOLS_PATH = path.join(cwd, 'data', 'schools.json');

// 繁简转换：覆盖审计中出现的繁体字
const TRAD_TO_SIMP = {
  學: '学', 區: '区', 職: '职', 業: '业', 術: '术', 級: '级', 蘭: '兰',
  廠: '厂', 場: '场', 館: '馆', 廳: '厅', 處: '处', 務: '务', 團: '团',
  體: '体', 們: '们', 際: '际', 網: '网', 絡: '络', 線: '线', 計: '计',
  劃: '划', 製: '制', 藝: '艺', 統: '统', 紀: '纪', 錄: '录', 證: '证',
  師: '师', 員: '员', 國: '国', 號: '号', 樓: '楼', 現: '现', 蘇: '苏', 這: '这',
};
function toSimplified(str) {
  if (!str) return str;
  return str.replace(/[\u4e00-\u9fff]/g, (ch) => TRAD_TO_SIMP[ch] || ch);
}

// === D 类地址修正（手工逐条；用 name 匹配，避免 id 改名影响） ===
const ADDRESS_FIX_BY_NAME = {
  // 1. 区名错误（地址所在区与 districtName 不符，修正地址中区名）
  '上海交通大学附属中学': { oldAddr: '上海市宝山区殷高路42号', newAddr: '上海市杨浦区殷高路42号' },
  '上实双语学校':           { oldAddr: '上海市闵行区田林十三村1号', newAddr: '上海市徐汇区田林十三村1号' },
  // 2. 占位地址（明显是默认值，清空待补全）
  '上海市青浦区第一中学': { clearAddrIfContains: '嘉定区东云街' },
  '上海市第一中学':        { clearAddrIfContains: '嘉定区东云街' },
};

// === D 类分校区归属调整（districtId/districtName 改为校区所在地） ===
const DISTRICT_REASSIGN = {
  // 黄浦本部在黄浦，浦江分校在闵行
  'minhang-上海市向明中学浦江分校': { newDistrictId: 'minhang', newDistrictName: '闵行区', renameIdTo: 'minhang-上海市向明中学浦江分校' },
  // 格致本部在黄浦，奉贤校区在奉贤
  'fengxian-上海市格致中学奉贤校区': { newDistrictId: 'fengxian', newDistrictName: '奉贤区', renameIdTo: 'fengxian-上海市格致中学奉贤校区' },
  // 加拿大国际学校：地址在长宁（虹桥路1161号），改为长宁
  'pudong-上海加拿大国际学校': { newDistrictId: 'changning', newDistrictName: '长宁区', renameIdTo: 'changning-上海加拿大国际学校' },
  // 新加坡国际学校：地址在闵行（诸建路301号），改为闵行
  'pudong-上海新加坡国际学校': { newDistrictId: 'minhang', newDistrictName: '闵行区', renameIdTo: 'minhang-上海新加坡国际学校' },
  // 上实双语学校：实际在徐汇田林，districtId 标错为静安
  'jingan-上实双语学校': { newDistrictId: 'xuhui', newDistrictName: '徐汇区', renameIdTo: 'xuhui-上实双语学校' },
};

// === C 类合并遗留标签清理：与 schoolType 矛盾的 ownership 标签 ===
const BAD_TAGS_PUBLIC = ['民办', '民办初中', 'private']; // 公办学校应清除
const BAD_TAGS_PRIVATE = ['公办', '公办初中', 'public']; // 民办学校应清除

// === 特殊预处理：已知 id 后缀错误或同校拆分 ===
// 这些 id 后缀本身写错（与 name 不符），或与已存在 id 同校，需在通用改名前预处理
const PRE_MERGE = [
  // 「嘉定区-嘉定區封浜高級中學」与「jiading-上海市嘉定区封浜高级中学」是同一所学校
  // 保留 jiading-上海市嘉定区封浜高级中学（高中招生数据源更可靠），合并 c3 信息后删除 c3
  { kind: 'merge', fromId: '嘉定区-嘉定區封浜高級中學', toId: 'jiading-上海市嘉定区封浜高级中学' },
];
const PRE_ID_OVERRIDE = {
  // 「嘉定区-上海大学附属嘉定高级中学」name 是「上海师范大学附属嘉定高级中学」，id 后缀写错了
  '嘉定区-上海大学附属嘉定高级中学': 'jiading-上海师范大学附属嘉定高级中学',
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

function main() {
  const raw = readJson(SCHOOLS_PATH);
  let arr = Array.isArray(raw) ? raw : raw.schools;
  console.log(`Loaded ${arr.length} schools`);

  // === 预处理：PRE_MERGE 合并同校拆分 ===
  for (const { fromId, toId } of PRE_MERGE) {
    const from = arr.find((s) => s.id === fromId);
    const to = arr.find((s) => s.id === toId);
    if (!from || !to) {
      console.log(`[pre-merge] skip ${fromId} -> ${toId}: record missing`);
      continue;
    }
    // 把 from 的字段合并到 to（标量取非空，数组去重合并）
    for (const key of ['address', 'phone', 'website', 'foundingYear', 'description', 'achievements', 'admissionNotes']) {
      if (!to[key] && from[key]) to[key] = from[key];
    }
    for (const key of ['features', 'tags', 'trainingDirections', 'decisionTags', 'searchKeywords', 'related_schools', 'admissionMethods', 'admissionRoutes', 'facilities', 'specializations']) {
      if (Array.isArray(from[key])) {
        to[key] = dedupeArray([...(to[key] || []), ...from[key]]);
      }
    }
    if (from.updatedAt && (!to.updatedAt || Date.parse(from.updatedAt) > Date.parse(to.updatedAt))) {
      to.updatedAt = from.updatedAt;
    }
    // 删除 from
    arr = arr.filter((s) => s.id !== fromId);
    // 删除 from 的 markdown
    if (from.contentFile) {
      const p = path.join(cwd, from.contentFile);
      if (fs.existsSync(p)) {
        // 把 from 的 markdown 内容追加到 to 的 markdown
        const toMdPath = path.join(cwd, to.contentFile);
        if (fs.existsSync(toMdPath)) {
          const toMd = fs.readFileSync(toMdPath, 'utf8');
          const fromMd = fs.readFileSync(p, 'utf8');
          fs.writeFileSync(toMdPath, `${toMd.trim()}\n\n---\n\n${fromMd.trim()}\n`, 'utf8');
        }
        fs.unlinkSync(p);
        console.log(`[pre-merge] ${fromId} -> ${toId}; markdown combined & removed ${from.contentFile}`);
      }
    } else {
      console.log(`[pre-merge] ${fromId} -> ${toId}; (no markdown)`);
    }
  }

  // === A+B. id 命名规范化 + 繁简转换 ===
  // 第一遍：计算每条记录的新 id（如有变化）
  const idRewrite = {}; // oldId -> newId
  const nameFix = {};   // id -> newName (如果 name 含繁体)
  for (const s of arr) {
    const dashIdx = s.id.indexOf('-');
    if (dashIdx < 0) continue;
    const prefix = s.id.slice(0, dashIdx);
    const namePart = s.id.slice(dashIdx + 1);
    // 繁简转换
    const simpName = toSimplified(namePart);
    const simpRecordName = toSimplified(s.name);
    // 检查是否需要改 id
    let newPrefix = prefix;
    // 1) 如果 prefix 不是拼音（即不是合法的 districtId），用 s.districtId 替换
    const validPrefixes = new Set([
      'baoshan', 'changning', 'chongming', 'fengxian', 'hongkou', 'huangpu',
      'jiading', 'jingan', 'jinshan', 'minhang', 'pudong', 'putuo',
      'qingpu', 'songjiang', 'xuhui', 'yangpu',
    ]);
    if (!validPrefixes.has(prefix)) {
      newPrefix = s.districtId;
    }
    let newId = `${newPrefix}-${simpName}`;
    // 2) 特殊 id 覆盖（id 后缀本身写错的）
    if (PRE_ID_OVERRIDE[s.id]) {
      newId = PRE_ID_OVERRIDE[s.id];
    }
    if (newId !== s.id) {
      idRewrite[s.id] = newId;
    }
    if (simpRecordName !== s.name) {
      nameFix[s.id] = simpRecordName;
    }
  }

  // 加上 D 类分校区重命名
  for (const [oldId, cfg] of Object.entries(DISTRICT_REASSIGN)) {
    if (cfg.renameIdTo && cfg.renameIdTo !== oldId) {
      idRewrite[oldId] = cfg.renameIdTo;
    }
  }

  // 加上 PRE_MERGE 合并的旧 id -> 新 id（让所有反向引用同步更新）
  for (const { fromId, toId } of PRE_MERGE) {
    idRewrite[fromId] = toId;
  }

  console.log(`[A+B] id rename: ${Object.keys(idRewrite).length}`);
  console.log(`[A+B] name fix (繁简): ${Object.keys(nameFix).length}`);

  // 检查新 id 是否有冲突
  const preMergeTargets = new Set(PRE_MERGE.map((m) => m.toId));
  const newIdSet = new Set();
  const conflicts = [];
  for (const [oldId, newId] of Object.entries(idRewrite)) {
    if (preMergeTargets.has(newId)) {
      // 这是 PRE_MERGE 合并的目标，已存在是预期的
      newIdSet.add(newId);
      continue;
    }
    if (newIdSet.has(newId)) {
      conflicts.push({ newId, oldIds: [oldId, ...Object.entries(idRewrite).filter(([, n]) => n === newId).map(([o]) => o).filter((o) => o !== oldId)] });
    }
    newIdSet.add(newId);
  }
  // 也检查与已有 id 冲突（仅当新 id 不在 PRE_MERGE 合并目标中时）
  const existingIds = new Set(arr.map((s) => s.id));
  for (const [oldId, newId] of Object.entries(idRewrite)) {
    if (preMergeTargets.has(newId)) continue;
    if (existingIds.has(newId) && !idRewrite[newId]) {
      conflicts.push({ newId, oldIds: [oldId], existing: true });
    }
  }
  if (conflicts.length) {
    console.log('ID CONFLICTS (aborting):');
    for (const c of conflicts) console.log(`  ${c.newId} <- ${JSON.stringify(c.oldIds)} existing=${c.existing || false}`);
    throw new Error('id rename conflicts, aborting');
  }

  // 应用 id 改名 + name 修正
  for (const s of arr) {
    // 先应用 D 类分校区调整（districtId/districtName）
    if (DISTRICT_REASSIGN[s.id]) {
      const cfg = DISTRICT_REASSIGN[s.id];
      const oldDistrictName = s.districtName;
      s.districtId = cfg.newDistrictId;
      s.districtName = cfg.newDistrictName;
      // 同步替换 description / achievements / admissionNotes 中的旧区名
      for (const key of ['description', 'achievements', 'admissionNotes']) {
        if (typeof s[key] === 'string' && oldDistrictName) {
          s[key] = s[key].replace(new RegExp(oldDistrictName, 'g'), cfg.newDistrictName);
        }
      }
    }
    // 应用 name 繁简转换
    if (nameFix[s.id]) {
      s.name = nameFix[s.id];
      // tags / searchKeywords / features 中如有繁体也转换
      for (const key of ['tags', 'searchKeywords', 'features', 'decisionTags', 'trainingDirections', 'specializations']) {
        if (Array.isArray(s[key])) {
          s[key] = dedupeArray(s[key].map((v) => (typeof v === 'string' ? toSimplified(v) : v)));
        }
      }
      // description / achievements / admissionNotes 文本字段
      for (const key of ['description', 'achievements', 'admissionNotes']) {
        if (typeof s[key] === 'string') s[key] = toSimplified(s[key]);
      }
    }
    // 应用 id 改名
    if (idRewrite[s.id]) {
      const oldId = s.id;
      const newId = idRewrite[oldId];
      s.id = newId;
      // contentFile 跟随改名
      if (s.contentFile && s.contentFile.endsWith(`${oldId}.md`)) {
        const oldMd = s.contentFile;
        const newMd = oldMd.replace(`${oldId}.md`, `${newId}.md`);
        const oldPath = path.join(cwd, oldMd);
        const newPath = path.join(cwd, newMd);
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          s.contentFile = newMd;
        } else {
          console.log(`  [warn] markdown not found for rename: ${oldMd}`);
        }
      }
    }
  }

  // === 更新所有反向引用（related_schools / admissionRoutes.high_school_id） ===
  let rewriteCount = 0;
  for (const s of arr) {
    if (Array.isArray(s.related_schools)) {
      const before = s.related_schools.length;
      s.related_schools = dedupeArray(
        s.related_schools.map((r) => (typeof r === 'string' ? (idRewrite[r] || r) : r))
      );
      if (s.related_schools.length !== before || s.related_schools.some((r) => idRewrite[r])) {
        // 长度变化或包含被改名的引用都算
      }
    }
    if (Array.isArray(s.admissionRoutes)) {
      s.admissionRoutes = s.admissionRoutes.map((r) => {
        if (!r || typeof r !== 'object') return r;
        if (typeof r.high_school_id === 'string' && idRewrite[r.high_school_id]) {
          rewriteCount++;
          return { ...r, high_school_id: idRewrite[r.high_school_id] };
        }
        return r;
      });
    }
  }
  // 重新扫描一遍 related_schools，统计含旧 id 的次数（因为之前 dedupe 后长度可能不变）
  let relRewriteCount = 0;
  for (const s of arr) {
    if (Array.isArray(s.related_schools)) {
      const hadOld = s.related_schools.some((r) => Object.keys(idRewrite).includes(r));
      if (hadOld) relRewriteCount++;
    }
  }
  // 上面已经在 map 中替换了，所以这里 hadOld 永远 false
  // 但要确保替换发生：重做一遍 map
  console.log(`[A+B] admissionRoutes rewrites: ${rewriteCount}`);

  // === C. 合并遗留标签清理 ===
  let cleanCount = 0;
  for (const s of arr) {
    const isPublic = s.schoolType === 'public' || s.schoolType === 'municipal_key' || s.schoolType === 'district_key' || s.schoolType === 'municipal_model' || s.schoolType === 'featured_high_school';
    const isPrivate = s.schoolType === 'private';
    if (!isPublic && !isPrivate) continue;
    const badTags = isPublic ? BAD_TAGS_PUBLIC : BAD_TAGS_PRIVATE;
    let changed = false;
    for (const key of ['tags', 'searchKeywords', 'features', 'decisionTags']) {
      if (!Array.isArray(s[key])) continue;
      const before = s[key].length;
      s[key] = s[key].filter((v) => !(typeof v === 'string' && badTags.includes(v)));
      if (s[key].length !== before) changed = true;
    }
    if (changed) cleanCount++;
  }
  console.log(`[C] cleaned merge-residual tags in ${cleanCount} records`);

  // === D. 地址修正（用 name 匹配） ===
  let addrFixCount = 0;
  for (const s of arr) {
    const fix = ADDRESS_FIX_BY_NAME[s.name];
    if (!fix) continue;
    if (fix.oldAddr && s.address === fix.oldAddr) {
      s.address = fix.newAddr;
      addrFixCount++;
    } else if (fix.clearAddrIfContains && s.address && s.address.includes(fix.clearAddrIfContains)) {
      s.address = '';
      addrFixCount++;
    }
  }
  console.log(`[D] fixed addresses: ${addrFixCount}`);

  // === 写回 ===
  const out = Array.isArray(raw) ? arr : { ...raw, schools: arr };
  writeJson(SCHOOLS_PATH, out);

  // === 残留引用检查 ===
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
    for (const r of dangling.slice(0, 20)) console.log(`  ${r.from} -> ${r.field} -> ${r.ref}`);
    console.log(`  ... total ${dangling.length}`);
  } else {
    console.log('No dangling references remain.');
  }

  // === 重复检查 ===
  const nameMap = {};
  for (const s of arr) {
    if (!nameMap[s.name]) nameMap[s.name] = [];
    nameMap[s.name].push(s.id);
  }
  const dups = Object.entries(nameMap).filter(([, ids]) => ids.length > 1);
  if (dups.length) {
    console.log('Duplicate names:');
    for (const [name, ids] of dups) console.log(`  ${name}: ${JSON.stringify(ids)}`);
  } else {
    console.log('No duplicate names.');
  }
}

main();
