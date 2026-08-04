import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  DEFAULT_REGION,
  REGIONS,
  getRegionConfig,
  getDistrictCatalog,
  getDistrictNameToId,
  getDistrictIdToName,
  getKeyLevelPriority
} = require('../shared/region-config');
const {
  DISTRICT_CATALOG,
  DISTRICT_NAME_TO_ID,
  DISTRICT_ID_TO_NAME,
  buildDistricts
} = require('../shared/data-schema');
const { sortBySchoolPriority } = require('../shared/data-store');

// 阶段 0 回归测试：验证"上海硬编码 -> region-config 搬家"后值与行为均不变。
// 期望值取自原 shared/data-schema.js / data-store.js 的内联常量。

const EXPECTED_DISTRICT_IDS = [
  'huangpu', 'xuhui', 'changning', 'jingan', 'putuo', 'hongkou', 'yangpu',
  'minhang', 'baoshan', 'jiading', 'pudong', 'jinshan', 'songjiang', 'qingpu',
  'fengxian', 'chongming'
];
const EXPECTED_DISTRICT_NAMES = [
  '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区',
  '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区',
  '奉贤区', '崇明区'
];

const EXPECTED_KEY_LEVEL_PRIORITY = {
  '市重点(高中)': 100,
  '顶级公办(初中)': 95,
  '顶级民办(初中)': 95,
  '区重点(高中)': 80,
  '强民办(初中)': 72,
  '强公办(初中)': 70,
  '一般高中': 60,
  '一般初中': 40
};

test('DEFAULT_REGION 与 REGIONS 注册表正确', () => {
  assert.equal(DEFAULT_REGION, 'shanghai');
  assert.ok(REGIONS.shanghai, 'shanghai 应已注册');
});

test('getRegionConfig 返回上海配置，未知 region 抛错', () => {
  const cfg = getRegionConfig('shanghai');
  assert.equal(cfg.label, '上海');
  assert.equal(cfg.examTotal.zhongkao, 750);
  assert.equal(cfg.examTotal.gaokao, 660);

  assert.throws(() => getRegionConfig('beijing'), /未知地区/);
  // region 为空时兜底 DEFAULT_REGION
  assert.doesNotThrow(() => getRegionConfig(undefined));
});

test('上海区目录 16 项 id/name/description 与原硬编码一致', () => {
  const catalog = getDistrictCatalog('shanghai');
  assert.equal(catalog.length, 16);
  assert.deepEqual(
    catalog.map((d) => d.id),
    EXPECTED_DISTRICT_IDS
  );
  assert.deepEqual(
    catalog.map((d) => d.name),
    EXPECTED_DISTRICT_NAMES
  );
  // description 非空（原值保留）
  for (const d of catalog) {
    assert.ok(d.description, `${d.name} description 不应为空`);
  }
});

test('区名/区ID 双向映射正确', () => {
  const nameToId = getDistrictNameToId('shanghai');
  const idToName = getDistrictIdToName('shanghai');
  assert.equal(nameToId['黄浦区'], 'huangpu');
  assert.equal(nameToId['崇明区'], 'chongming');
  assert.equal(idToName['huangpu'], '黄浦区');
  assert.equal(idToName['chongming'], '崇明区');
});

test('上海学校层级权重 8 键与原硬编码逐项相等', () => {
  const priority = getKeyLevelPriority('shanghai');
  assert.deepEqual(priority, EXPECTED_KEY_LEVEL_PRIORITY);
});

test('data-schema 向后兼容导出（上海视图）与 region-config 一致', () => {
  assert.equal(DISTRICT_CATALOG.length, 16);
  assert.deepEqual(
    DISTRICT_CATALOG.map((d) => d.id),
    EXPECTED_DISTRICT_IDS
  );
  assert.equal(DISTRICT_NAME_TO_ID['黄浦区'], 'huangpu');
  assert.equal(DISTRICT_ID_TO_NAME['huangpu'], '黄浦区');
});

test('buildDistricts 按 region 区目录聚合，默认上海', () => {
  const schools = [
    { districtId: 'huangpu', name: '校A' },
    { districtId: 'huangpu', name: '校B' },
    { districtId: 'xuhui', name: '校C' }
  ];
  const news = [
    { newsType: 'policy', districtId: 'huangpu', title: '政策1', publishedAt: '2026-01-01' },
    { newsType: 'policy', districtId: 'xuhui', title: '政策2', publishedAt: '2026-02-01' },
    { newsType: 'news', districtId: 'huangpu', title: '新闻1', publishedAt: '2026-03-01' }
  ];

  const districts = buildDistricts(schools, news);
  assert.equal(districts.length, 16);
  const huangpu = districts.find((d) => d.id === 'huangpu');
  const xuhui = districts.find((d) => d.id === 'xuhui');
  const putuo = districts.find((d) => d.id === 'putuo');
  assert.equal(huangpu.schoolCount, 2);
  assert.equal(huangpu.policyCount, 1);
  assert.equal(huangpu.latestPolicyTitle, '政策1');
  assert.equal(xuhui.schoolCount, 1);
  assert.equal(xuhui.latestPolicyTitle, '政策2');
  assert.equal(putuo.schoolCount, 0);
  assert.equal(putuo.policyCount, 0);
  assert.equal(putuo.latestPolicyTitle, '');
});

test('sortBySchoolPriority 行为不变：市重点 > 区重点 > 一般高中', () => {
  const sorted = sortBySchoolPriority([
    { name: '一般校', eliteCohort: '', schoolKeyLevel: '一般高中' },
    { name: '市重点校', eliteCohort: '', schoolKeyLevel: '市重点(高中)' },
    { name: '区重点校', eliteCohort: '', schoolKeyLevel: '区重点(高中)' }
  ]);
  assert.deepEqual(
    sorted.map((s) => s.name),
    ['市重点校', '区重点校', '一般校']
  );
});

test('sortBySchoolPriority：eliteCohort 非空优先', () => {
  const sorted = sortBySchoolPriority([
    { name: '普通市重点', eliteCohort: '', schoolKeyLevel: '市重点(高中)' },
    { name: '四校', eliteCohort: '四校', schoolKeyLevel: '市重点(高中)' }
  ]);
  assert.equal(sorted[0].name, '四校');
});
