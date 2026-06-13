import { readFileSync, writeFileSync } from 'node:fs';
import {
  SCHOOL_CATEGORIES,
  SPECIALIZATION_CATEGORIES,
  getCanonicalGroupName,
  normalizeTag,
  inferSchoolCategory,
  inferSpecializations
} from '../lib/school-taxonomy.js';

const FILE = 'data/schools.json';
const schools = JSON.parse(readFileSync(FILE, 'utf8'));

let updatedCategories = 0;
let updatedGroups = 0;
let updatedTags = 0;
let updatedSpecializations = 0;

for (const s of schools) {
  // 1. 规范化 group
  if (s.group) {
    const canonical = getCanonicalGroupName(s.group);
    if (canonical !== s.group) {
      s.groupCanonical = canonical;
      updatedGroups++;
    } else {
      s.groupCanonical = canonical;
    }
  }

  // 2. 规范化 tags (去重 + 同义合并)
  if (Array.isArray(s.tags)) {
    const normalized = s.tags
      .map((t) => normalizeTag(t))
      .filter(Boolean);
    const deduped = [...new Set(normalized)];
    if (deduped.length !== s.tags.length) {
      updatedTags++;
      s.tags = deduped;
    }
  }

  // 3. 推断 category
  const cat = inferSchoolCategory(s);
  if (cat && cat !== s.category) {
    s.category = cat;
    updatedCategories++;
  }

  // 4. 推断 specializations
  const specs = inferSpecializations(s);
  s.specializations = specs;
  updatedSpecializations++;
}

console.log(`Updated: ${updatedCategories} categories, ${updatedGroups} groups, ${updatedTags} tags, ${updatedSpecializations} specializations`);

// 统计
const catCounts = new Map();
const specCounts = new Map();
for (const s of schools) {
  catCounts.set(s.category, (catCounts.get(s.category) || 0) + 1);
  for (const spec of s.specializations || []) {
    specCounts.set(spec, (specCounts.get(spec) || 0) + 1);
  }
}

console.log('\n=== Category distribution ===');
for (const cat of SCHOOL_CATEGORIES) {
  const count = catCounts.get(cat.id) || 0;
  if (count > 0) {
    console.log(`  ${cat.label}: ${count}`);
  }
}

console.log('\n=== Specialization distribution ===');
for (const spec of SPECIALIZATION_CATEGORIES) {
  const count = specCounts.get(spec.id) || 0;
  if (count > 0) {
    console.log(`  ${spec.label}: ${count}`);
  }
}

writeFileSync(FILE, `${JSON.stringify(schools, null, 2)}\n`);
console.log(`\nWrote ${FILE} (${schools.length} schools)`);
