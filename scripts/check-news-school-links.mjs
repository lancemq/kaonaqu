#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getNewsCardValueLine,
  getNewsCardActionLabel,
  getSchoolObservationTag,
  getNewsSchoolCtaCopy,
  getNewsSection,
  shouldShowNewsSchoolCta
} from '../lib/news-channel-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEWS_PATH = path.join(__dirname, '..', 'data', 'news.json');
const news = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
const newsById = new Map(news.map((entry) => [entry.id, entry]));

const errors = [];

function expect(id, condition, message) {
  if (!condition) {
    errors.push(`[${id}] ${message}`);
  }
}

function getLinkData(item) {
  return {
    primarySchoolId: item.primarySchoolId || '',
    relatedSchoolIds: Array.isArray(item.relatedSchoolIds) ? item.relatedSchoolIds : [],
    schoolLinkReason: item.schoolLinkReason || '',
    schoolLinkConfidence: typeof item.schoolLinkConfidence === 'number' ? item.schoolLinkConfidence : null
  };
}

function findNewsItem(id) {
  const item = newsById.get(id);
  if (!item) {
    errors.push(`missing news item ${id} for helper assertions`);
  }
  return item;
}

[
  {
    id: 'school-2026-shs-cross-disciplinary-teaching',
    primarySchoolId: 'pudong-上海市浦东新区上海中学东校',
    schoolLinkReason: 'school_signal',
    minConfidence: 0.9
  },
  {
    id: 'admission-2026-hsefz-sports-students-plan',
    primarySchoolId: 'pudong-华东师范大学第二附属中学',
    schoolLinkReason: 'admission_school_mention',
    requireRelatedIncludesPrimary: true
  }
].forEach((spec) => {
  const item = newsById.get(spec.id);
  if (!item) {
    errors.push(`missing news item ${spec.id}`);
    return;
  }

  const { primarySchoolId, relatedSchoolIds, schoolLinkReason, schoolLinkConfidence } = getLinkData(item);

  expect(
    spec.id,
    primarySchoolId === spec.primarySchoolId,
    `primarySchoolId should be "${spec.primarySchoolId}", found "${primarySchoolId}"`
  );

  if (spec.schoolLinkReason) {
    expect(
      spec.id,
      schoolLinkReason === spec.schoolLinkReason,
      `schoolLinkReason should be "${spec.schoolLinkReason}", found "${schoolLinkReason}"`
    );
  }

  if (typeof spec.minConfidence === 'number') {
    expect(
      spec.id,
      typeof schoolLinkConfidence === 'number' && schoolLinkConfidence >= spec.minConfidence,
      `schoolLinkConfidence should be >= ${spec.minConfidence}, found ${schoolLinkConfidence}`
    );
  }

  if (spec.requireRelatedIncludesPrimary) {
    expect(
      spec.id,
      relatedSchoolIds.includes(spec.primarySchoolId),
      `relatedSchoolIds should include "${spec.primarySchoolId}", found [${relatedSchoolIds.join(', ')}]`
    );
  }
});

[
  {
    id: 'exam-2026-zhongzhao-opinion'
  }
].forEach((spec) => {
  const item = newsById.get(spec.id);
  if (!item) {
    errors.push(`missing news item ${spec.id}`);
    return;
  }

  const { primarySchoolId, relatedSchoolIds, schoolLinkReason, schoolLinkConfidence } = getLinkData(item);

  expect(
    spec.id,
    !primarySchoolId,
    `primarySchoolId should be empty for ${spec.id}`
  );
  expect(
    spec.id,
    relatedSchoolIds.length === 0,
    `relatedSchoolIds should be empty for ${spec.id}, found [${relatedSchoolIds.join(', ')}]`
  );
  expect(
    spec.id,
    !schoolLinkReason,
    `schoolLinkReason should be empty for ${spec.id}`
  );
  expect(
    spec.id,
    schoolLinkConfidence === null,
    `schoolLinkConfidence should be null for ${spec.id}, found ${schoolLinkConfidence}`
  );
});

[
  {
    id: 'school-2026-shs-cross-disciplinary-teaching',
    run(item) {
      expect(
        this.id,
        getNewsSection(item) === 'school',
        `getNewsSection should be school for ${this.id}`
      );
      expect(
        this.id,
        getSchoolObservationTag(item) === '教研与课程',
        `getSchoolObservationTag should return 教研与课程 for ${this.id}`
      );
      expect(
        this.id,
        getNewsCardActionLabel(item) === '继续看这条的学校线索',
        `getNewsCardActionLabel should return 继续看这条的学校线索 for ${this.id}`
      );
      const valueLine = String(getNewsCardValueLine(item) || '');
      expect(
        this.id,
        valueLine.includes('学校'),
        `getNewsCardValueLine for ${this.id} should mention 学校`
      );
      const schoolCta = getNewsSchoolCtaCopy(item);
      expect(
        this.id,
        schoolCta && schoolCta.title === '这条新闻说明了这所学校什么',
        `getNewsSchoolCtaCopy should return the school CTA title for ${this.id}`
      );
      expect(
        this.id,
        schoolCta && schoolCta.body.includes(getSchoolObservationTag(item)),
        `getNewsSchoolCtaCopy should mention the observation tag for ${this.id}`
      );
      expect(
        this.id,
        schoolCta && schoolCta.action === '查看学校详情',
        `getNewsSchoolCtaCopy should return the school CTA for ${this.id}`
      );
    }
  },
  {
    id: 'admission-2026-hsefz-sports-students-plan',
    run(item) {
      expect(
        this.id,
        getNewsSection(item) === 'admission',
        `getNewsSection should be admission for ${this.id}`
      );
      expect(
        this.id,
        getNewsCardActionLabel(item) === '进去看完整安排',
        `getNewsCardActionLabel should return 进去看完整安排 for ${this.id}`
      );
      expect(
        this.id,
        shouldShowNewsSchoolCta(item),
        `shouldShowNewsSchoolCta should be true for ${this.id}`
      );
      const admissionCta = getNewsSchoolCtaCopy(item);
      expect(
        this.id,
        admissionCta && admissionCta.title === '这条招生安排和这所学校有什么关系',
        `getNewsSchoolCtaCopy should return the admission CTA title for ${this.id}`
      );
      expect(
        this.id,
        admissionCta && admissionCta.body === '这条新闻已经明确提到具体学校，继续看学校页可以补齐办学定位、招生口径和公开特征。',
        `getNewsSchoolCtaCopy should return the admission CTA body for ${this.id}`
      );
      expect(
        this.id,
        admissionCta && admissionCta.action === '查看这所学校的招生与定位',
        `getNewsSchoolCtaCopy should return the admission CTA for ${this.id}`
      );
    }
  },
  {
    id: 'exam-2026-zhongzhao-opinion',
    run(item) {
      expect(
        this.id,
        getNewsSection(item) === 'exam',
        `getNewsSection should be exam for ${this.id}`
      );
      expect(
        this.id,
        !shouldShowNewsSchoolCta(item),
        `shouldShowNewsSchoolCta should be false for ${this.id}`
      );
      expect(
        this.id,
        getNewsSchoolCtaCopy(item) === null,
        `getNewsSchoolCtaCopy should be null for ${this.id}`
      );
    }
  }
].forEach((spec) => {
  const item = findNewsItem(spec.id);
  if (!item) return;
  spec.run(item);
});

const legacySchoolLike = {
  id: 'legacy-school-like',
  title: '这是一条学校官网发布的动态',
  summary: '说明学校组织了一个教研活动',
  category: '学校动态',
  source: {
    name: '某学校官网'
  }
};

expect(
  legacySchoolLike.id,
  getNewsSection(legacySchoolLike) === 'school',
  'getNewsSection should classify a legacy-shaped school-like item as school'
);
expect(
  legacySchoolLike.id,
  getNewsSchoolCtaCopy(legacySchoolLike) === null,
  'getNewsSchoolCtaCopy should stay null for a legacy school-like item without linkage'
);

if (errors.length) {
  console.error('news school link checks failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('news school link checks passed');
