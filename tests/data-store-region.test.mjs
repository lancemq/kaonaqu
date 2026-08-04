import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { rowToSchool, schoolToRow, rowToNews, newsToRow } = require('../shared/data-store');
const { DEFAULT_REGION } = require('../shared/region-config');

// 阶段 1 回归测试：data-store 的 region 透传（rowToSchool/schoolToRow/rowToNews/newsToRow）。
// 纯函数测试，不连 DB。

test('rowToSchool：DB 行含 region 时映射，districtId 按该 region 反查', () => {
  const school = rowToSchool({
    id: 1,
    slug: 'sch1',
    name: '测试校',
    district_name: '黄浦区',
    school_stage_label: '高中',
    region: 'shanghai'
  });
  assert.equal(school.region, 'shanghai');
  assert.equal(school.districtId, 'huangpu');
  assert.equal(school.districtName, '黄浦区');
});

test('rowToSchool：DB 行无 region 时兜底 DEFAULT_REGION', () => {
  const school = rowToSchool({
    id: 2,
    slug: 'sch2',
    name: '测试校2',
    district_name: '徐汇区',
    school_stage_label: '初中'
    // 无 region 列（旧表兼容）
  });
  assert.equal(school.region, DEFAULT_REGION);
  assert.equal(school.districtId, 'xuhui');
});

test('rowToSchool：未配置的 region 容错兜底（districtId 不抛错）', () => {
  // beijing 尚未在 region-config 注册，映射层应容错不崩
  const school = rowToSchool({
    id: 3,
    slug: 'sch3',
    name: '北京校',
    district_name: '海淀区',
    school_stage_label: '高中',
    region: 'beijing'
  });
  assert.equal(school.region, 'beijing');
  assert.equal(school.districtId, '');
});

test('schoolToRow：写入 region，无值时兜底 DEFAULT_REGION', () => {
  const row = schoolToRow({ id: 'sch1', name: '校', districtName: '黄浦区', region: 'beijing' });
  assert.equal(row.region, 'beijing');
  const rowDefault = schoolToRow({ id: 'sch2', name: '校', districtName: '黄浦区' });
  assert.equal(rowDefault.region, DEFAULT_REGION);
});

test('rowToNews：region 映射，无值兜底', () => {
  const news = rowToNews({ id: 'n1', title: 't', region: 'beijing' });
  assert.equal(news.region, 'beijing');
  const newsDefault = rowToNews({ id: 'n2', title: 't' });
  assert.equal(newsDefault.region, DEFAULT_REGION);
});

test('newsToRow：写入 region，无值兜底', () => {
  const row = newsToRow({ id: 'n1', title: 't', region: 'beijing' });
  assert.equal(row.region, 'beijing');
  const rowDefault = newsToRow({ id: 'n2', title: 't' });
  assert.equal(rowDefault.region, DEFAULT_REGION);
});
