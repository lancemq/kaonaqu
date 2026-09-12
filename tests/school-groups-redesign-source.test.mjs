import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// groups 页结构守护（原针对 groups-page-client.js 的断言已随 P2 服务端化迁移）：
// 页面为服务端骨架（channel-hero/footer + aerial 布局），交互只存在于岛组件中。
test('school groups page keeps the aerial layout and is server-rendered with islands', () => {
  const pageSource = readFileSync('app/schools/groups/page.js', 'utf8');

  // 无遗留 SiteShell / 旧版页脚
  assert.doesNotMatch(pageSource, /<SiteShell/);
  assert.doesNotMatch(pageSource, /prototype-page-footer/);
  // 服务端骨架保留 aerial 布局与 hero/footer
  assert.match(pageSource, /className="schools-aerial-page school-groups-aerial-page"/);
  assert.match(pageSource, /className="channel-hero"/);
  assert.match(pageSource, /className="school-groups-aerial-list"/);
  assert.match(pageSource, /className="channel-footer"/);
  // 页面自身不是 client 组件，且通过岛组件挂载交互
  assert.doesNotMatch(pageSource, /^'use client'/m);
  assert.match(pageSource, /import GroupsToolbar from/);
  assert.match(pageSource, /import GroupsCard from/);
  assert.match(pageSource, /import GroupsRow from/);
  // 聚合/过滤走纯函数模块（服务端计算）
  assert.match(pageSource, /buildGroupsData/);
  assert.match(pageSource, /filterGroups/);
});

test('groups islands only manage interaction, not data', () => {
  for (const file of ['components/groups-toolbar.js', 'components/groups-card.js', 'components/groups-row.js']) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /^'use client';/m);
    // 岛不做数据获取/派生：不引入 data-store，聚合来自 props 或 lib 常量
    assert.doesNotMatch(source, /data-store/);
  }
});
