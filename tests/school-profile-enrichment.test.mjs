import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDecisionTags,
  buildProfileSignals,
  buildRelatedSchoolIds,
  buildSearchKeywords
} from '../lib/school-profile-enrichment.mjs';

const school = {
  id: 'pudong-demo-high',
  name: '上海市测试高级中学',
  districtId: 'pudong',
  districtName: '浦东新区',
  schoolStage: 'senior_high',
  schoolStageLabel: '高中',
  schoolTypeLabel: '公办市重点',
  tier: '市重点',
  admissionCode: '10199',
  admissionMethods: ['district_allocation', 'self_recruitment'],
  admissionRoutes: [{ high_school_id: 'x', count: 2, year: 2025 }],
  trainingDirections: ['科创竞赛', '人文综合'],
  tags: ['公办高中'],
  features: ['实验课程'],
  contentFile: 'content/schools/pudong-demo-high.md'
};

test('builds decision tags from admissions, stage, and training directions', () => {
  const tags = buildDecisionTags(school);

  assert.ok(tags.includes('中考路径'));
  assert.ok(tags.includes('名额分配'));
  assert.ok(tags.includes('自主招生'));
  assert.ok(tags.includes('科创竞赛'));
});

test('builds searchable school keywords without duplicates', () => {
  const keywords = buildSearchKeywords(school);

  assert.ok(keywords.includes('上海市测试高级中学'));
  assert.ok(keywords.includes('浦东新区'));
  assert.ok(keywords.includes('招生代码10199'));
  assert.equal(new Set(keywords).size, keywords.length);
});

test('builds profile signals with completeness and route focus', () => {
  const signals = buildProfileSignals(school);

  assert.equal(signals.stage, '高中');
  assert.equal(signals.hasOfficialCode, true);
  assert.equal(signals.hasAdmissionRoutes, true);
  assert.ok(signals.completenessScore >= 60);
  assert.ok(signals.routeFocus.includes('自主招生'));
});

test('builds related schools by district, stage, type, and system while excluding self', () => {
  const peer = { ...school, id: 'pudong-demo-peer', name: '上海市测试实验中学' };
  const distant = { ...school, id: 'xuhui-demo', name: '上海市其他学校', districtId: 'xuhui', districtName: '徐汇区' };
  const related = buildRelatedSchoolIds(school, [school, distant, peer], 2);

  assert.equal(related[0], 'pudong-demo-peer');
  assert.equal(related.includes(school.id), false);
});
