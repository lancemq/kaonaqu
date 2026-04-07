# News Channel Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase conversion from `/news` to news detail pages, then from eligible news detail pages to school pages, with school-dynamic news as the primary path and school-mentioned admission news as a secondary path.

**Architecture:** Add lightweight school-link metadata to normalized news records, expose deterministic helpers in `lib/site-utils.js`, then update the news list and news detail UIs to surface stronger click intent and a school CTA only when the data link is explicit enough. Verification stays simple: schema/data validation, a small regression script for school-link rules, a visual smoke script, and a production build.

**Tech Stack:** Next.js App Router, React 19, shared JSON data store, Node scripts, Playwright screenshot smoke checks

---

## File Structure

- Modify: `/Users/maqi/project/kaonaqu/shared/data-schema.js`
  Normalize new news-school linkage fields and keep backward compatibility with existing data.
- Modify: `/Users/maqi/project/kaonaqu/lib/site-utils.js`
  Keep generic news classification helpers focused on section/category logic.
- Create: `/Users/maqi/project/kaonaqu/lib/news-channel-utils.mjs`
  Add deterministic helpers for school-link detection, school-observation tags, homepage CTA copy, and detail-page CTA copy that can be reused by both Next pages and Node regression scripts.
- Modify: `/Users/maqi/project/kaonaqu/scripts/validate-data.js`
  Validate new optional linkage fields so bad mappings fail fast.
- Modify: `/Users/maqi/project/kaonaqu/data/news.json`
  Add explicit `primarySchoolId`, `relatedSchoolIds`, `schoolLinkReason`, and `schoolLinkConfidence` for a small high-value seed set.
- Modify: `/Users/maqi/project/kaonaqu/app/news/page.js`
  Load schools data and pass it to the homepage client so the list can show linked-school labels.
- Modify: `/Users/maqi/project/kaonaqu/components/news-page-client.js`
  Rework homepage card copy hierarchy and expose school/value cues that improve click-through to detail pages.
- Modify: `/Users/maqi/project/kaonaqu/app/news/[id]/page.js`
  Render the new “这条新闻说明了这所学校什么” bridge block and a primary school CTA before related content.
- Modify: `/Users/maqi/project/kaonaqu/styles.css`
  Style the stronger homepage CTA rows and the detail-page school-bridge module without disrupting existing topic pages.
- Create: `/Users/maqi/project/kaonaqu/scripts/check-news-school-links.mjs`
  Run deterministic assertions against a few representative news items to guard the new linkage rules.
- Modify: `/Users/maqi/project/kaonaqu/scripts/visual-check-news.mjs`
  Add at least one detail page with a school CTA and one admission-news detail route to the screenshot smoke set.

### Task 1: Add News-School Link Metadata

**Files:**
- Modify: `/Users/maqi/project/kaonaqu/shared/data-schema.js`
- Modify: `/Users/maqi/project/kaonaqu/scripts/validate-data.js`
- Modify: `/Users/maqi/project/kaonaqu/data/news.json`
- Test: `/Users/maqi/project/kaonaqu/scripts/check-news-school-links.mjs`

- [ ] **Step 1: Create the failing regression script**

```js
// /Users/maqi/project/kaonaqu/scripts/check-news-school-links.mjs
import fs from 'fs';
import path from 'path';
import assert from 'assert/strict';

const news = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'news.json'), 'utf8'));

function getItem(id) {
  const item = news.find((entry) => entry.id === id);
  assert.ok(item, `missing news item: ${id}`);
  return item;
}

const schoolDynamic = getItem('school-2026-shs-cross-disciplinary-teaching');
assert.equal(schoolDynamic.primarySchoolId, 'pudong-上海市浦东新区上海中学东校');
assert.equal(schoolDynamic.schoolLinkReason, 'school_signal');
assert.ok(schoolDynamic.schoolLinkConfidence >= 0.9);

const admissionSchoolMention = getItem('admission-2026-hsefz-sports-students-plan');
assert.equal(admissionSchoolMention.primarySchoolId, 'pudong-华东师范大学第二附属中学');
assert.equal(admissionSchoolMention.schoolLinkReason, 'admission_school_mention');
assert.ok(admissionSchoolMention.relatedSchoolIds.includes('pudong-华东师范大学第二附属中学'));

const genericExam = getItem('exam-2026-zhongzhao-opinion');
assert.equal(genericExam.primarySchoolId || '', '');
assert.ok(!genericExam.relatedSchoolIds || genericExam.relatedSchoolIds.length === 0);

console.log('news school-link regression checks passed');
```

- [ ] **Step 2: Run the regression script to verify it fails**

Run: `node scripts/check-news-school-links.mjs`
Expected: FAIL with an assertion similar to `undefined !== 'pudong-上海市浦东新区上海中学东校'`.

- [ ] **Step 3: Extend normalization and validation for the new fields**

```js
// /Users/maqi/project/kaonaqu/shared/data-schema.js
function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map(cleanString).filter(Boolean) : [];
}

function normalizeConfidence(value) {
  if (typeof value !== 'number') {
    return null;
  }
  if (Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(1, value));
}

function normalizeNews(raw, index = 0) {
  const source = normalizeSource(raw);
  const title = cleanString(raw.title);
  const newsType = cleanString(raw.newsType || raw.news_type || inferNewsSection(raw));
  const inferredExamType = inferNewsExamType(title, raw.content || raw.summary);
  const examType = cleanString(raw.examType || raw.exam_type || inferredExamType);
  const category = cleanString(raw.category || inferNewsCategory(newsType, examType));

  return {
    id: cleanString(raw.id) || slugify(`${category}-${title || index}`),
    title,
    newsType,
    category,
    examType: examType === 'gaokao' ? 'gaokao' : examType === 'zhongkao' ? 'zhongkao' : '',
    summary: cleanString(raw.summary || raw.content),
    content: cleanString(raw.content),
    contentMd: cleanString(raw.contentMd || raw.content_md),
    contentFile: cleanString(raw.contentFile || raw.content_file),
    primarySchoolId: cleanString(raw.primarySchoolId || raw.primary_school_id),
    relatedSchoolIds: normalizeStringArray(raw.relatedSchoolIds || raw.related_school_ids),
    schoolLinkReason: cleanString(raw.schoolLinkReason || raw.school_link_reason),
    schoolLinkConfidence: normalizeConfidence(raw.schoolLinkConfidence ?? raw.school_link_confidence),
    publishedAt: raw.publishedAt || raw.publishDate || raw.date || null,
    updatedAt: raw.updatedAt || source.crawledAt || raw.publishDate || raw.date || null,
    source
  };
}
```

```js
// /Users/maqi/project/kaonaqu/scripts/validate-data.js
function validateNews(news) {
  const errors = [];
  const seenIds = new Set();

  news.forEach((item, index) => {
    validateRequired(item, ['id', 'title', 'category', 'examType', 'summary']).forEach((message) => {
      errors.push(`news[${index}]: ${message}`);
    });

    if (!['zhongkao', 'gaokao'].includes(item.examType)) {
      errors.push(`news[${index}]: invalid examType ${item.examType}`);
    }

    if (item.primarySchoolId && !/^[a-z]+-.+/.test(item.primarySchoolId)) {
      errors.push(`news[${index}]: invalid primarySchoolId ${item.primarySchoolId}`);
    }

    if (item.relatedSchoolIds && !Array.isArray(item.relatedSchoolIds)) {
      errors.push(`news[${index}]: relatedSchoolIds must be an array`);
    }

    if (Array.isArray(item.relatedSchoolIds) && item.primarySchoolId && !item.relatedSchoolIds.includes(item.primarySchoolId)) {
      errors.push(`news[${index}]: relatedSchoolIds must include primarySchoolId`);
    }

    if (item.schoolLinkConfidence !== undefined && item.schoolLinkConfidence !== null) {
      if (typeof item.schoolLinkConfidence !== 'number' || item.schoolLinkConfidence < 0 || item.schoolLinkConfidence > 1) {
        errors.push(`news[${index}]: invalid schoolLinkConfidence ${item.schoolLinkConfidence}`);
      }
    }

    if (seenIds.has(item.id)) {
      errors.push(`news[${index}]: duplicate news id ${item.id}`);
    }
    seenIds.add(item.id);
  });

  return errors;
}
```

```json
// /Users/maqi/project/kaonaqu/data/news.json
{
  "id": "school-2026-shs-cross-disciplinary-teaching",
  "primarySchoolId": "pudong-上海市浦东新区上海中学东校",
  "relatedSchoolIds": ["pudong-上海市浦东新区上海中学东校"],
  "schoolLinkReason": "school_signal",
  "schoolLinkConfidence": 0.98
}
{
  "id": "admission-2026-hsefz-sports-students-plan",
  "primarySchoolId": "pudong-华东师范大学第二附属中学",
  "relatedSchoolIds": ["pudong-华东师范大学第二附属中学"],
  "schoolLinkReason": "admission_school_mention",
  "schoolLinkConfidence": 0.92
}
```

- [ ] **Step 4: Re-run the regression script and data validation**

Run: `node scripts/check-news-school-links.mjs`
Expected: PASS with `news school-link regression checks passed`

Run: `npm run data:validate`
Expected: PASS with `数据校验通过`

- [ ] **Step 5: Commit**

```bash
git add shared/data-schema.js scripts/validate-data.js scripts/check-news-school-links.mjs data/news.json
git commit -m "feat: add news school-link metadata"
```

### Task 2: Add Shared Conversion Copy Helpers

**Files:**
- Create: `/Users/maqi/project/kaonaqu/lib/news-channel-utils.mjs`
- Test: `/Users/maqi/project/kaonaqu/scripts/check-news-school-links.mjs`

- [ ] **Step 1: Extend the regression script with helper expectations**

```js
// /Users/maqi/project/kaonaqu/scripts/check-news-school-links.mjs
import { getNewsCardValueLine, getNewsCardActionLabel, getSchoolObservationTag, shouldShowNewsSchoolCta } from '../lib/news-channel-utils.mjs';

assert.equal(getSchoolObservationTag(schoolDynamic), '教研与课程');
assert.equal(getNewsCardActionLabel(schoolDynamic), '继续看这条的学校线索');
assert.match(getNewsCardValueLine(schoolDynamic), /学校/);

assert.equal(getNewsCardActionLabel(admissionSchoolMention), '进去看完整安排');
assert.equal(shouldShowNewsSchoolCta(admissionSchoolMention), true);
assert.equal(shouldShowNewsSchoolCta(genericExam), false);
```

- [ ] **Step 2: Run the regression script to verify the new helper imports fail**

Run: `node scripts/check-news-school-links.mjs`
Expected: FAIL with an error similar to `does not provide an export named 'getNewsCardActionLabel'`.

- [ ] **Step 3: Implement deterministic helper functions**

```js
// /Users/maqi/project/kaonaqu/lib/news-channel-utils.mjs
export function getNewsSection(item) {
  const rawType = String(item?.newsType || '').toLowerCase();
  if (rawType === 'school' || rawType === 'schoolnews' || rawType === 'school_news') return 'school';
  if (rawType === 'admission' || rawType === 'admissionnews' || rawType === 'admission_news') return 'admission';
  if (rawType === 'exam' || rawType === 'examnews' || rawType === 'exam_news') return 'exam';
  return item?.examType === 'gaokao' || item?.examType === 'zhongkao' ? 'exam' : 'exam';
}

export function shouldShowNewsSchoolCta(item) {
  return Boolean(item?.primarySchoolId) && typeof item?.schoolLinkConfidence === 'number' && item.schoolLinkConfidence >= 0.85;
}

export function getSchoolObservationTag(item) {
  const text = `${item?.title || ''} ${item?.summary || ''}`.toLowerCase();
  if (/(教研|课程|学科|课堂)/.test(text)) return '教研与课程';
  if (/(机器人|科创|实验|论坛|科研)/.test(text)) return '科创实践';
  if (/(德育|志愿|红领巾|成长)/.test(text)) return '德育活动';
  if (/(竞赛|获奖|金牌|奖项)/.test(text)) return '竞赛培养';
  if (/(健康|体检|管理|寄宿)/.test(text)) return '校园管理';
  if (/(外语|国际|联合国)/.test(text)) return '国际化表达';
  return '学校观察';
}

export function getNewsCardValueLine(item) {
  if (getNewsSection(item) === 'school') {
    return `这条动态更像学校观察线索，重点看 ${getSchoolObservationTag(item)} 对择校判断的帮助。`;
  }
  if (shouldShowNewsSchoolCta(item) && getNewsSection(item) === 'admission') {
    return '这条不只是招生信息，还明确关联到具体学校，适合点进去继续看学校承接。';
  }
  if (getNewsSection(item) === 'exam') {
    return '这条更适合先点进去确认时间、资格或后续安排，避免错过关键节点。';
  }
  return '先点进去看重点，再决定要不要继续跟进专题或学校信息。';
}

export function getNewsCardActionLabel(item) {
  if (getNewsSection(item) === 'school') return '继续看这条的学校线索';
  if (shouldShowNewsSchoolCta(item) && getNewsSection(item) === 'admission') return '进去看完整安排';
  return '点进去看重点';
}

export function getNewsSchoolCtaCopy(item) {
  if (getNewsSection(item) === 'school') {
    return {
      title: '这条新闻说明了这所学校什么',
      body: `这条动态更适合当作 ${getSchoolObservationTag(item)} 的学校线索，再结合学校页里的办学定位、招生信息和公开特征一起判断。`,
      action: '查看学校详情'
    };
  }

  return {
    title: '这条招生安排和这所学校有什么关系',
    body: '这条新闻已经明确提到具体学校，继续看学校页可以补齐办学定位、招生口径和公开特征。',
    action: '查看这所学校的招生与定位'
  };
}
```

- [ ] **Step 4: Re-run the regression script**

Run: `node scripts/check-news-school-links.mjs`
Expected: PASS with `news school-link regression checks passed`

- [ ] **Step 5: Commit**

```bash
git add lib/news-channel-utils.mjs scripts/check-news-school-links.mjs
git commit -m "feat: add news conversion copy helpers"
```

### Task 3: Rework Homepage Cards for Detail Click-Through

**Files:**
- Modify: `/Users/maqi/project/kaonaqu/app/news/page.js`
- Modify: `/Users/maqi/project/kaonaqu/components/news-page-client.js`
- Modify: `/Users/maqi/project/kaonaqu/styles.css`
- Test: `/Users/maqi/project/kaonaqu/scripts/visual-check-news.mjs`

- [ ] **Step 1: Add a visual smoke target for the homepage**

```js
// /Users/maqi/project/kaonaqu/scripts/visual-check-news.mjs
const routes = [
  { name: 'news', path: '/news' },
  { name: 'news-detail-school', path: '/news/school-2026-shs-cross-disciplinary-teaching' },
  { name: 'news-detail-admission-school', path: '/news/admission-2026-hsefz-sports-students-plan' }
];
```

- [ ] **Step 2: Run the visual smoke script before UI changes**

Run: `PORT=3003 npm run dev`
Expected: app starts on `http://127.0.0.1:3003`

Run: `node scripts/visual-check-news.mjs`
Expected: PASS and write `tmp/visual-news/report.json`, but screenshots still show the old homepage card hierarchy.

- [ ] **Step 3: Update homepage card hierarchy and CTA copy**

```jsx
// /Users/maqi/project/kaonaqu/app/news/page.js
const { news, policies, schools } = await loadDataStore();
<NewsPageClient news={news} policies={policies} schools={schools} />
```

```jsx
// /Users/maqi/project/kaonaqu/components/news-page-client.js
import {
  getNewsCategoryLabel,
  filterNews
} from '../lib/site-utils';
import {
  getNewsSection,
  getNewsCardActionLabel,
  getNewsCardValueLine,
  getSchoolObservationTag,
  shouldShowNewsSchoolCta
} from '../lib/news-channel-utils.mjs';

export default function NewsPageClient({ news, policies, schools = [] }) {
  const schoolsById = useMemo(
    () => Object.fromEntries(schools.map((school) => [school.id, school])),
    [schools]
  );
  const getLinkedSchoolName = (item) => (
    item?.primarySchoolId ? schoolsById[item.primarySchoolId]?.name || '' : ''
  );

// inside the list card render
<p className="news-prototype-item-kicker">
  {item.itemType === 'policy'
    ? `${String(item.title || '').includes('义务教育') ? '义务教育' : '政策文件'} / 政策文件`
    : `${item.examType === 'zhongkao' ? '中招新闻' : item.examType === 'gaokao' ? '高招新闻' : '综合资讯'} / ${getNewsCategoryLabel(item)}`}
</p>
<h3>
  <span className="news-title-link">{item.title}</span>
</h3>
{item.itemType === 'news' ? (
  <>
    {getNewsSection(item) === 'school' ? (
      <p className="news-prototype-item-signal">
        {getLinkedSchoolName(item)} / {getSchoolObservationTag(item)}
      </p>
    ) : null}
    {shouldShowNewsSchoolCta(item) && getNewsSection(item) === 'admission' ? (
      <p className="news-prototype-item-signal">
        涉及学校 / {getLinkedSchoolName(item)}
      </p>
    ) : null}
    <p>{getNewsCardValueLine(item)}</p>
    <span className="news-prototype-item-action">{getNewsCardActionLabel(item)}</span>
  </>
) : (
  <p>{getPolicySummaryText(item)}</p>
)}
}
```

```css
/* /Users/maqi/project/kaonaqu/styles.css */
.news-prototype-item-signal {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #6c7a89;
}

.news-prototype-item-action {
  display: inline-flex;
  align-items: center;
  margin-top: 14px;
  font-size: 13px;
  font-weight: 700;
  color: #163a63;
}

.news-prototype-item-action::after {
  content: ' ->';
  margin-left: 6px;
}
```

- [ ] **Step 4: Re-run the visual smoke script and production build**

Run: `node scripts/visual-check-news.mjs`
Expected: PASS and updated screenshots show school-signal rows plus a clear CTA line on `/news`

Run: `npm run build`
Expected: PASS with a successful Next.js production build

- [ ] **Step 5: Commit**

```bash
git add app/news/page.js components/news-page-client.js styles.css scripts/visual-check-news.mjs
git commit -m "feat: improve news homepage detail click-through"
```

### Task 4: Add Detail-Page School Bridge and Primary CTA

**Files:**
- Modify: `/Users/maqi/project/kaonaqu/app/news/[id]/page.js`
- Modify: `/Users/maqi/project/kaonaqu/styles.css`
- Test: `/Users/maqi/project/kaonaqu/scripts/check-news-school-links.mjs`

- [ ] **Step 1: Extend the regression script to assert CTA eligibility**

```js
// /Users/maqi/project/kaonaqu/scripts/check-news-school-links.mjs
import { getNewsSchoolCtaCopy } from '../lib/news-channel-utils.mjs';

const schoolCta = getNewsSchoolCtaCopy(schoolDynamic);
assert.equal(schoolCta.title, '这条新闻说明了这所学校什么');
assert.equal(schoolCta.action, '查看学校详情');

const admissionCta = getNewsSchoolCtaCopy(admissionSchoolMention);
assert.equal(admissionCta.action, '查看这所学校的招生与定位');
```

- [ ] **Step 2: Run the regression script to verify the page still lacks the bridge module**

Run: `node scripts/check-news-school-links.mjs`
Expected: PASS for helpers, but the UI is still missing the bridge block when you open a linked detail page in the browser.

- [ ] **Step 3: Render the detail-page bridge and CTA**

```jsx
// /Users/maqi/project/kaonaqu/app/news/[id]/page.js
import Link from 'next/link';
import {
  getNewsCategoryLabel,
  getNewsPriorityScore,
  getPolicyExamType,
  getNewsSection
} from '../../../lib/site-utils';
import { getNewsSchoolCtaCopy, shouldShowNewsSchoolCta } from '../../../lib/news-channel-utils.mjs';

const { news, policies, schools } = await loadDataStore();
const schoolsById = Object.fromEntries(schools.map((school) => [school.id, school]));
const linkedSchool = item.primarySchoolId ? schoolsById[item.primarySchoolId] : null;
const schoolBridge = shouldShowNewsSchoolCta(item) && linkedSchool ? getNewsSchoolCtaCopy(item) : null;

{schoolBridge ? (
  <section className="news-detail-school-bridge news-detail-article-shell" aria-label="学校延伸入口">
    <div className="news-detail-school-bridge-copy">
      <p className="overview-label">学校延伸阅读</p>
      <h2>{schoolBridge.title}</h2>
      <p>{schoolBridge.body}</p>
    </div>
    <div className="news-detail-school-bridge-actions">
      <p className="news-detail-school-bridge-school">{linkedSchool.name}</p>
      <Link className="news-detail-school-bridge-button" href={`/schools/${encodeURIComponent(linkedSchool.id)}`}>
        {schoolBridge.action}
      </Link>
    </div>
  </section>
) : null}
```

```css
/* /Users/maqi/project/kaonaqu/styles.css */
.news-detail-school-bridge {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(240px, 0.9fr);
  gap: 24px;
  margin: 28px auto 32px;
  padding: 28px;
  border: 1px solid #d7dee6;
  border-radius: 24px;
  background: linear-gradient(135deg, #f7fafc 0%, #eef4f9 100%);
}

.news-detail-school-bridge-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  background: #163a63;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}
```

- [ ] **Step 4: Verify linked and unlinked detail pages**

Run: `PORT=3003 npm run dev`
Expected: app starts on `http://127.0.0.1:3003`

Run: `node scripts/visual-check-news.mjs`
Expected: PASS and screenshots show the bridge CTA on linked school-detail routes only

Run: `node scripts/check-news-school-links.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/news/[id]/page.js styles.css scripts/check-news-school-links.mjs lib/news-channel-utils.mjs
git commit -m "feat: add school bridge to news detail pages"
```

### Task 5: Final Verification and Cleanup

**Files:**
- Modify: `/Users/maqi/project/kaonaqu/docs/superpowers/plans/2026-04-07-news-channel-conversion.md`
- Test: `/Users/maqi/project/kaonaqu/scripts/check-news-school-links.mjs`

- [ ] **Step 1: Run the full verification suite**

Run: `node scripts/check-news-school-links.mjs`
Expected: PASS with `news school-link regression checks passed`

Run: `npm run data:validate`
Expected: PASS with `数据校验通过`

Run: `node scripts/visual-check-news.mjs`
Expected: PASS and write `tmp/visual-news/report.json`

Run: `npm run build`
Expected: PASS with a successful Next.js production build

- [ ] **Step 2: Manually inspect the final routes in a browser**

Run: `PORT=3003 npm run dev`
Expected: app starts on `http://127.0.0.1:3003`

Check:
- `http://127.0.0.1:3003/news`
- `http://127.0.0.1:3003/news/school-2026-shs-cross-disciplinary-teaching`
- `http://127.0.0.1:3003/news/admission-2026-hsefz-sports-students-plan`
- `http://127.0.0.1:3003/news/exam-2026-zhongzhao-opinion`

Expected:
- homepage cards show stronger value copy and CTA labels
- linked school detail pages show the school bridge before related content
- unlinked generic exam detail pages do not show a school CTA

- [ ] **Step 3: Update the plan checklist with any deviations**

```md
<!-- /Users/maqi/project/kaonaqu/docs/superpowers/plans/2026-04-07-news-channel-conversion.md -->
- [x] Verification complete on local build
- [x] Linked school CTA only appears on high-confidence items
- [x] Generic exam news remains article-first with no forced school jump
```

- [ ] **Step 4: Commit the final verification state**

```bash
git add app/news/page.js components/news-page-client.js app/news/[id]/page.js lib/news-channel-utils.mjs lib/site-utils.js shared/data-schema.js scripts/validate-data.js scripts/check-news-school-links.mjs scripts/visual-check-news.mjs data/news.json styles.css
git commit -m "chore: verify news channel conversion flow"
```

- [ ] **Step 5: Prepare merge notes**

```md
- Homepage conversion focus: stronger value lines and CTA copy
- Detail-page conversion focus: school bridge block for high-confidence school-linked news
- Data support: explicit news-school metadata plus validation/regression checks
```
