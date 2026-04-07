#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

if (errors.length) {
  console.error('news school link checks failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('news school link checks passed');
