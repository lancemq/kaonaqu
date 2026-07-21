// 历年录取线回填脚本（P1：将 score_lines 纳入学校信息校正流程）
//
// 两种用法：
//   1) 高置信回填：把 lib/school-rich-profiles.generated.js 中已人工核对的真实录取线
//      写入线上 schools 表（仅覆盖有 rich profile 的头部校，数据已 vet）。
//      node scripts/backfill-score-lines.mjs --rich
//
//   2) 搜索回填（供 info_verified 校正自动化调用）：先由具备 WebSearch 能力的
//      代理检索某校"2025 录取分数线"，得到结构化 lines 后写入。
//      node scripts/backfill-score-lines.mjs --write <slug> --lines '<json>'
//      json 形如 [{"year":"2025","score":"707","plan":"1-15志愿","note":"市重/委属"}]
//
// 注意：updateSchoolInSupabase 走 schoolToRow 全行 UPDATE，故必须传入完整学校对象，
// 仅覆盖 scoreLines 字段，避免清空 name/district 等其它列。

import fs from 'fs';
import path from 'path';

// 加载 .env.local
(function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const txt = fs.readFileSync(envPath, 'utf8');
  const re = /^([A-Za-z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/gm;
  let m;
  while ((m = re.exec(txt)) !== null) {
    if (!(m[1] in process.env)) process.env[m[1]] = m[2];
  }
})();

const dataStore = await import('../shared/data-store.js');
const { GENERATED_SCHOOL_PROFILES } = await import('../lib/school-rich-profiles.generated.js');

function normalizeProfileLines(profile) {
  const lines = Array.isArray(profile?.scoreLines) ? profile.scoreLines : [];
  return lines
    .map((l) => ({
      year: String(l.year || '').trim(),
      score: String(l.score || '').trim(),
      plan: String(l.batch || l.plan || '').trim(),
      note: String(l.scope || l.note || '').trim()
    }))
    .filter((l) => l.year && /^\d{4}$/.test(l.year) && /^\d{2,3}(\.\d)?$/.test(l.score));
}

// 把某校的录取线写入 DB（传入完整学校对象，仅覆盖 scoreLines）
export async function writeScoreLines(slug, lines) {
  const all = await dataStore.loadSchoolsList();
  const school = all.find((s) => s.id === slug || s.slug === slug);
  if (!school) throw new Error(`学校不存在: ${slug}`);
  const updated = await dataStore.updateSchoolInSupabase(slug, { ...school, scoreLines: lines });
  return updated;
}

// 高置信回填：rich profile 真实线 → DB
// 注意：rich profile 的键（如 "xuhui-上海中学"）与 DB slug 约定不一定一致，
// 故按"键中 '-' 之后的校名"匹配 DB 的 name 字段（同名校名唯一）。
export async function backfillFromRichProfiles() {
  const all = await dataStore.loadSchoolsList();
  const byName = new Map();
  for (const s of all) {
    if (s.name && !byName.has(s.name)) byName.set(s.name, s);
  }
  let written = 0;
  const skipped = [];
  for (const [key, profile] of Object.entries(GENERATED_SCHOOL_PROFILES)) {
    const lines = normalizeProfileLines(profile);
    if (!lines.length) continue;
    const name = key.includes('-') ? key.slice(key.indexOf('-') + 1) : key;
    const school = byName.get(name);
    if (!school) {
      skipped.push(key);
      continue;
    }
    await dataStore.updateSchoolInSupabase(school.id, { ...school, scoreLines: lines });
    written += 1;
  }
  return { written, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--rich')) {
    const { written, skipped } = await backfillFromRichProfiles();
    console.log(`[backfill] rich-profile 真实录取线已写入 ${written} 所；未匹配 slug: ${skipped.length ? skipped.join(', ') : '无'}`);
    return;
  }
  if (args.includes('--write')) {
    const i = args.indexOf('--write');
    const slug = args[i + 1];
    const j = args.indexOf('--lines');
    const linesRaw = j >= 0 ? args[j + 1] : null;
    if (!slug || !linesRaw) {
      console.error('用法: --write <slug> --lines \'<json>\'');
      process.exit(1);
    }
    let lines;
    try {
      lines = JSON.parse(linesRaw);
    } catch {
      console.error('lines 不是合法 JSON');
      process.exit(1);
    }
    const updated = await writeScoreLines(slug, lines);
    console.log(`[backfill] ${slug} 已写入 ${updated.scoreLines?.length || 0} 条录取线`);
    return;
  }
  console.error('未知参数。用法:\n  node scripts/backfill-score-lines.mjs --rich\n  node scripts/backfill-score-lines.mjs --write <slug> --lines \'<json>\'');
  process.exit(1);
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
