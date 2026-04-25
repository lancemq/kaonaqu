import test from 'node:test';
import assert from 'node:assert/strict';
import { getKnowledgeChannelJourney, getNewsChannelJourney, getSchoolChannelJourney } from '../lib/cross-channel-journeys.mjs';

test('builds knowledge page cross-channel journey with news and school links', () => {
  const journey = getKnowledgeChannelJourney(
    { slug: 'physics-grade9' },
    {
      news: [
        {
          id: 'physics-news',
          title: '2026上海中考物理实验操作复习提醒',
          summary: '物理实验和中考复习安排',
          content: '物理 实验 中考',
          examType: 'zhongkao',
          newsType: 'policy',
          category: '政策深度',
          updatedAt: '2026-04-20'
        }
      ]
    }
  );

  assert.equal(journey.groups.length, 2);
  assert.equal(journey.groups[0].label, '相关政策与动态');
  assert.equal(journey.groups[0].items[0].href, '/news/physics-news');
  assert.equal(journey.groups[1].items.some((item) => item.href === '/schools'), true);
});

test('builds school page cross-channel journey with knowledge recommendations', () => {
  const journey = getSchoolChannelJourney(
    {
      id: 'school-1',
      name: '上海市测试高级中学',
      schoolStage: 'senior_high',
      districtName: '浦东新区'
    },
    {
      news: [
        {
          id: 'admission-news',
          title: '上海市测试高级中学2026招生安排',
          summary: '学校招生动态',
          content: '招生',
          newsType: 'admission',
          updatedAt: '2026-04-18'
        }
      ]
    }
  );

  assert.equal(journey.groups.length, 2);
  assert.equal(journey.groups[0].items[0].href, '/news/admission-news');
  assert.equal(journey.groups[1].items[0].href, '/knowledge/grade-9');
});

test('builds news page cross-channel journey with school and knowledge links', () => {
  const journey = getNewsChannelJourney(
    {
      id: 'news-1',
      title: '2026上海中考物理实验安排',
      summary: '这条新闻涉及中考物理实验和招生准备',
      content: '中考 物理 实验',
      examType: 'zhongkao',
      primarySchoolId: 'school-1'
    },
    {
      schools: [
        {
          id: 'school-1',
          name: '上海市测试中学',
          districtName: '浦东新区'
        }
      ]
    }
  );

  assert.equal(journey.groups.length, 2);
  assert.equal(journey.groups[0].items[0].href, '/schools/school-1');
  assert.equal(journey.groups[1].items.some((item) => item.href === '/knowledge/physics-grade9'), true);
});
