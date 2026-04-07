# School Information Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production slice of the school-information enrichment system by formalizing enrichment tiers, filling structured deep fields, and validating the new layered data contract.

**Architecture:** Keep the current school pages mostly intact and improve the data layer first. Introduce a shared enrichment configuration for priority schools and tag vocabularies, extend the normalized school shape with explicit `profileDepth` and `trainingDirections`, refactor enrichment scripts to follow the “all schools get foundations, high-interest schools get deep fields” rule, then protect the result with a regression script and validation.

**Tech Stack:** Node.js scripts, JSON data files, shared schema normalizers, existing school enrichment scripts, Next.js build validation

---

## File Structure

- Create: `/Users/maqi/project/kaonaqu/lib/school-enrichment-config.mjs`
  Store the high-interest school roster and stable/judgment tag vocabulary in one place.
- Modify: `/Users/maqi/project/kaonaqu/shared/data-schema.js`
  Preserve new enrichment fields in normalized school records.
- Modify: `/Users/maqi/project/kaonaqu/scripts/validate-data.js`
  Validate `profileDepth`, `trainingDirections`, and minimum deep-field expectations for priority schools.
- Create: `/Users/maqi/project/kaonaqu/scripts/check-school-enrichment.mjs`
  Regression-check the layered enrichment result on representative schools.
- Modify: `/Users/maqi/project/kaonaqu/scripts/enrich-school-details.mjs`
  Generate foundation-level fields for all schools and explicit `profileDepth` / `trainingDirections`.
- Modify: `/Users/maqi/project/kaonaqu/scripts/enrich-head-schools.mjs`
  Apply curated high-interest overrides while preserving the new layered field contract.
- Modify: `/Users/maqi/project/kaonaqu/data/schools.json`
  Persist regenerated enrichment results.
- Modify: `/Users/maqi/project/kaonaqu/package.json`
  Add the new school-enrichment regression check to the standard validation path.

## Task 1: Add Regression Coverage for Layered School Enrichment

**Files:**
- Create: `/Users/maqi/project/kaonaqu/scripts/check-school-enrichment.mjs`
- Test: `/Users/maqi/project/kaonaqu/data/schools.json`

- [x] **Step 1: Write the failing regression script**

```js
// /Users/maqi/project/kaonaqu/scripts/check-school-enrichment.mjs
import fs from 'fs';
import path from 'path';
import assert from 'assert/strict';

const schools = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'schools.json'), 'utf8'));

function getSchool(name) {
  const school = schools.find((item) => item.name === name);
  assert.ok(school, `missing school: ${name}`);
  return school;
}

const shs = getSchool('上海中学');
assert.equal(shs.profileDepth, 'priority');
assert.ok(Array.isArray(shs.trainingDirections) && shs.trainingDirections.includes('科创竞赛'));
assert.ok(Array.isArray(shs.schoolHighlights) && shs.schoolHighlights.length >= 3);

const hsefz = getSchool('华东师范大学第二附属中学');
assert.equal(hsefz.profileDepth, 'priority');
assert.ok(Array.isArray(hsefz.trainingDirections) && hsefz.trainingDirections.length >= 2);

const ordinary = getSchool('上海市崇明区城桥中学');
assert.equal(ordinary.profileDepth, 'foundation');
assert.ok(String(ordinary.schoolDescription || '').trim().length >= 20);
assert.ok(Array.isArray(ordinary.tags) && ordinary.tags.length >= 2);

console.log('school enrichment checks passed');
```

- [x] **Step 2: Run the regression script to verify it fails**

Run: `node scripts/check-school-enrichment.mjs`
Expected: FAIL with an assertion about missing `profileDepth` or `trainingDirections`.

## Task 2: Add Enrichment Configuration and Normalized Field Support

**Files:**
- Create: `/Users/maqi/project/kaonaqu/lib/school-enrichment-config.mjs`
- Modify: `/Users/maqi/project/kaonaqu/shared/data-schema.js`
- Modify: `/Users/maqi/project/kaonaqu/scripts/validate-data.js`
- Modify: `/Users/maqi/project/kaonaqu/package.json`

- [x] **Step 1: Add the shared enrichment config**

```js
// /Users/maqi/project/kaonaqu/lib/school-enrichment-config.mjs
export const HIGH_INTEREST_SCHOOL_NAMES = [
  '上海中学',
  '华东师范大学第二附属中学',
  '复旦大学附属中学',
  '上海交通大学附属中学',
  '上海市建平中学',
  '上海市七宝中学',
  '上海市实验学校'
];

export const STABLE_TAGS = [
  '公办',
  '民办',
  '双语',
  '外籍学校',
  '初中',
  '高中',
  '完全中学',
  '寄宿',
  '九年一贯',
  '外语特色',
  '国际课程',
  '示范性高中',
  '市重点',
  '区重点'
];

export const JUDGMENT_TAGS = [
  '科创竞赛',
  '人文综合',
  '艺术特色',
  '寄宿管理',
  '贯通培养',
  '教研课程强',
  '德育活动强'
];
```

- [x] **Step 2: Extend the normalized school shape**

```js
// /Users/maqi/project/kaonaqu/shared/data-schema.js
function normalizeSchool(raw) {
  // existing setup...
  return {
    // existing fields...
    schoolHighlights: Array.isArray(raw.schoolHighlights) ? raw.schoolHighlights.map(cleanString).filter(Boolean) : [],
    suitableStudents: cleanString(raw.suitableStudents),
    applicationTips: cleanString(raw.applicationTips),
    trainingDirections: Array.isArray(raw.trainingDirections) ? raw.trainingDirections.map(cleanString).filter(Boolean) : [],
    profileDepth: cleanString(raw.profileDepth || 'foundation'),
    features: Array.isArray(raw.features) ? raw.features.map(cleanString).filter(Boolean) : [],
    tags: buildSchoolTags(raw, schoolStage, tier),
    source,
    updatedAt: raw.updatedAt || source.crawledAt || null
  };
}
```

- [x] **Step 3: Tighten validation and wire the new regression into validation**

```js
// /Users/maqi/project/kaonaqu/scripts/validate-data.js
const ALLOWED_PROFILE_DEPTHS = new Set(['foundation', 'priority']);
const HIGH_INTEREST_SCHOOL_NAMES = new Set([
  '上海中学',
  '华东师范大学第二附属中学',
  '复旦大学附属中学',
  '上海交通大学附属中学',
  '上海市建平中学',
  '上海市七宝中学',
  '上海市实验学校'
]);

if (!ALLOWED_PROFILE_DEPTHS.has(cleanString(school.profileDepth || 'foundation'))) {
  errors.push(`schools[${index}]: invalid profileDepth ${school.profileDepth}`);
}

if (!Array.isArray(school.trainingDirections)) {
  errors.push(`schools[${index}]: trainingDirections must be an array`);
}

if (HIGH_INTEREST_SCHOOL_NAMES.has(school.name)) {
  if (cleanString(school.profileDepth) !== 'priority') {
    errors.push(`schools[${index}]: priority school must have profileDepth=priority`);
  }
  if (!Array.isArray(school.schoolHighlights) || school.schoolHighlights.length < 3) {
    errors.push(`schools[${index}]: priority school must have at least 3 highlights`);
  }
  if (!cleanString(school.suitableStudents)) {
    errors.push(`schools[${index}]: priority school missing suitableStudents`);
  }
  if (!cleanString(school.applicationTips)) {
    errors.push(`schools[${index}]: priority school missing applicationTips`);
  }
}
```

```json
// /Users/maqi/project/kaonaqu/package.json
{
  "scripts": {
    "data:validate": "node scripts/check-news-school-links.mjs && node scripts/check-school-enrichment.mjs && node scripts/validate-data.js"
  }
}
```

- [x] **Step 4: Run the failing regression again**

Run: `node scripts/check-school-enrichment.mjs`
Expected: still FAIL until the enrichment scripts populate the new fields.

## Task 3: Refactor Enrichment Scripts and Regenerate School Data

**Files:**
- Modify: `/Users/maqi/project/kaonaqu/scripts/enrich-school-details.mjs`
- Modify: `/Users/maqi/project/kaonaqu/scripts/enrich-head-schools.mjs`
- Modify: `/Users/maqi/project/kaonaqu/data/schools.json`

- [x] **Step 1: Refactor the foundation enrichment script**

```js
// /Users/maqi/project/kaonaqu/scripts/enrich-school-details.mjs
import { HIGH_INTEREST_SCHOOL_NAMES } from '../lib/school-enrichment-config.mjs';

function buildTrainingDirections(school) {
  const directions = new Set();
  const haystack = [
    school.name,
    school.schoolDescription,
    school.admissionNotes,
    ...(school.features || []),
    ...(school.tags || [])
  ].filter(Boolean).join(' ');

  if (/(科技|科创|创新|竞赛|研究)/.test(haystack)) directions.add('科创竞赛');
  if (/(人文|综合|通识|领导力)/.test(haystack)) directions.add('人文综合');
  if (/(国际|双语|ib|ap|alevel)/i.test(haystack)) directions.add('国际课程');
  if (/(寄宿|住宿)/.test(haystack)) directions.add('寄宿管理');
  if (/(贯通|一贯|衔接|完全中学|十年一贯)/.test(haystack)) directions.add('贯通培养');
  if (/(外语|外国语|英语)/.test(haystack)) directions.add('外语特色');

  return Array.from(directions).slice(0, 3);
}

const nextSchools = schools.map((school) => ({
  ...school,
  schoolDescription: buildDescription(school),
  admissionRequirements: buildAdmissionRequirements(school),
  profileDepth: HIGH_INTEREST_SCHOOL_NAMES.includes(school.name) ? 'priority' : 'foundation',
  trainingDirections: buildTrainingDirections(school)
}));
```

- [x] **Step 2: Ensure high-interest overrides preserve deep fields**

```js
// /Users/maqi/project/kaonaqu/scripts/enrich-head-schools.mjs
const overrides = {
  '上海中学': {
    profileDepth: 'priority',
    trainingDirections: ['科创竞赛', '国际课程', '人文综合'],
    features: ['拔尖创新人才早期培育', '大学先修与竞赛课程', '研究型课程体系', '本部与国际部一体资源']
  }
  // repeat same pattern for the other priority schools
};
```

- [x] **Step 3: Run the enrichment scripts**

Run: `node scripts/enrich-school-details.mjs`
Expected: PASS and rewrite `data/schools.json`

Run: `node scripts/enrich-head-schools.mjs`
Expected: PASS and re-apply curated priority-school depth fields

- [x] **Step 4: Re-run regressions and validation**

Run: `node scripts/check-school-enrichment.mjs`
Expected: PASS with `school enrichment checks passed`

Run: `npm run data:validate`
Expected: PASS with `数据校验通过`

## Task 4: Final Verification

**Files:**
- Modify: `/Users/maqi/project/kaonaqu/docs/superpowers/plans/2026-04-07-school-information-enrichment.md`

- [x] **Step 1: Run production verification**

Run: `npm run build`
Expected: PASS with a successful Next.js production build

- [x] **Step 2: Spot-check rendered data consumers**

Check:
- `/schools`
- `/schools/xuhui-%E4%B8%8A%E6%B5%B7%E4%B8%AD%E5%AD%A6` if route format allows direct detail access, otherwise `/schools` entry click-through

Expected:
- priority schools still show enriched highlights
- no school card or detail page crashes from the new fields

- [ ] **Step 3: Commit**

```bash
git add lib/school-enrichment-config.mjs shared/data-schema.js scripts/validate-data.js scripts/check-school-enrichment.mjs scripts/enrich-school-details.mjs scripts/enrich-head-schools.mjs data/schools.json package.json docs/superpowers/plans/2026-04-07-school-information-enrichment.md
git commit -m "feat: add layered school enrichment pipeline"
```
