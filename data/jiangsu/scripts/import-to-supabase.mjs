#!/usr/bin/env node
// 入库脚本：node scripts/import-to-supabase.mjs <city> [--exec]（在 data/jiangsu 目录下运行）
// 默认 dry-run（只打印将写入的行数 + 抽样）；--exec 才真写库。
// 按 slug upsert：DB 已存在该 slug 则 updateSchoolInSupabase，否则 createSchoolInSupabase。
// source 字段非 DB 列，写入前剥离。经 createRequire 桥接 CommonJS 的 shared/data-store.js。

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { CITY_SLUGS } from './lib/schema.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
const require = createRequire(import.meta.url);
const dataStore = require(path.join(REPO_ROOT, 'shared', 'data-store.js'));

const city = process.argv.slice(2).find((a) => !a.startsWith('--'));
const exec = process.argv.includes('--exec');

if (!city || !CITY_SLUGS.includes(city)) {
  console.error(`用法: node scripts/import-to-supabase.mjs <city> [--exec]\n合法 city: ${CITY_SLUGS.join(', ')}`);
  process.exit(2);
}

const cityDir = path.join(ROOT, 'cities', city);
if (!fs.existsSync(cityDir)) {
  console.error(`城市目录不存在: cities/${city}`);
  process.exit(2);
}

// 收集 schools/senior + schools/junior 下的单校 JSON
const records = [];
for (const stage of ['senior', 'junior']) {
  const stageDir = path.join(cityDir, 'schools', stage);
  if (!fs.existsSync(stageDir)) continue;
  for (const f of fs.readdirSync(stageDir).sort()) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    const raw = JSON.parse(fs.readFileSync(path.join(stageDir, f), 'utf8'));
    // 剥离非 DB 列的溯源字段；补齐应用层 id/districtId 派生字段
    const { source, ...school } = raw;
    records.push({
      ...school,
      id: school.slug,
      region: city,
      infoVerified: !!school.infoVerified,
      // 入库元信息（console 报告用）
      _source: source || null,
      _stageDir: stage
    });
  }
}

if (!records.length) {
  console.log(`cities/${city}: 无学校文件，未${exec ? '写入' : '待写入'}任何行`);
  process.exit(0);
}

console.log(`cities/${city}: 共 ${records.length} 所学校`);
console.log('抽样（前 3 条，写库行经 schoolToRow 转 snake_case）:');
for (const rec of records.slice(0, 3)) {
  console.log(`  - ${rec.slug} | ${rec.name} | ${rec.districtName} | ${rec.schoolStageLabel} | ${rec.schoolKeyLevel} | features: ${(rec.features || []).join('、') || '(空)'} | scoreLines: ${(rec.scoreLines || []).map((l) => `${l.year}=${l.score}`).join(', ') || '(空)'}`);
}

if (!exec) {
  console.log('\n[dry-run] 未写库。确认无误后加 --exec 执行写入。');
  process.exit(0);
}

// --exec：按 slug upsert
console.log('\n开始写入 Supabase schools 表（按 slug upsert）...');
let created = 0;
let updated = 0;
const failures = [];
for (const rec of records) {
  const { _source, _stageDir, ...school } = rec;
  try {
    await dataStore.updateSchoolInSupabase(school.slug, school);
    updated += 1;
    console.log(`  ↻ update ${school.slug}`);
  } catch (err) {
    if (err.statusCode === 404) {
      try {
        await dataStore.createSchoolInSupabase(school);
        created += 1;
        console.log(`  ＋ create ${school.slug}`);
      } catch (err2) {
        failures.push([school.slug, err2.message]);
        console.error(`  ❌ create ${school.slug}: ${err2.message}`);
      }
    } else {
      failures.push([school.slug, err.message]);
      console.error(`  ❌ update ${school.slug}: ${err.message}`);
    }
  }
}

console.log(`\n完成：新增 ${created}，更新 ${updated}，失败 ${failures.length}`);
if (failures.length) {
  for (const [slug, msg] of failures) console.error(`  ❌ ${slug}: ${msg}`);
  process.exit(1);
}
