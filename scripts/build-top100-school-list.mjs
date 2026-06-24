#!/usr/bin/env node
// 按 tier + profileDepth + group + 学段 加权挑出"信息丰富度优先扩展"的 100 所学校。
// 产出 data/top100-schools.json 供 generate-rich-profiles.mjs 消费。
//
// 重跑场景：tier 体系或权重调整后；其余时候稳定。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHOOLS_PATH = path.join(ROOT, 'data', 'schools.json');
const OUT_PATH = path.join(ROOT, 'data', 'top100-schools.json');

const TIER_WEIGHT = {
  '四校': 100,
  '四校分校': 80,
  '八大': 75,
  '八大分校': 60,
  '市实验性示范性高中': 50,
  '区重点': 30,
  '民办高中': 28,
  '国际课程': 24,
  '民办完全中学': 18,
  '民办初中': 14,
  '公办完全中学': 12,
  '一般高中': 10,
  '公办初中': 4
};

function scoreSchool(s) {
  let score = TIER_WEIGHT[s.tier] || 0;
  if (s.profileDepth === 'priority') score += 20;
  if (s.group) score += 5;
  if (s.schoolStage === 'senior_high') score += 5;
  return score;
}

function main() {
  const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, 'utf8'));
  const scored = schools.map((s) => ({
    id: s.id,
    name: s.name,
    tier: s.tier || null,
    group: s.group || null,
    district: s.districtName || s.districtId,
    stage: s.schoolStage,
    foundingYear: s.foundingYear,
    score: scoreSchool(s)
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id, 'zh');
  });

  const top100 = scored.slice(0, 100);
  fs.writeFileSync(OUT_PATH, JSON.stringify(top100, null, 2) + '\n');

  const tierBreakdown = {};
  for (const s of top100) {
    tierBreakdown[s.tier || '未标注'] = (tierBreakdown[s.tier || '未标注'] || 0) + 1;
  }
  console.log(`Wrote ${top100.length} schools to ${path.relative(ROOT, OUT_PATH)}`);
  console.log('Tier distribution:');
  for (const [k, v] of Object.entries(tierBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }
}

main();
