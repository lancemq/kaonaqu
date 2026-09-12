// 地区配置：集中所有"地区专属"规则（区目录、学校层级权重、考试满分、品牌、
// SEO 文案模板等）。纯数据 + 纯函数，零外部依赖（不引入 supabase / next），
// 可被 shared/（CJS require）、app server 组件（createRequire 桥接）、
// 以及 proxy（经 .mjs 入口）安全引用。
//
// 数据唯一真源是 shared/regions.data.json（CJS require JSON 原生支持）；
// shared/region-list.mjs（ESM）也从同一 JSON 派生，两处不再手工双写。
// 多地区扩展时：在 regions.data.json 的 regions 下新增一个条目即可，
// 无需改框架代码。上海（DEFAULT_REGION）保持现有行为不变。
//
// 迁移来源（阶段 0 搬家，值原样保留）：
// - districtCatalog      <- 原 shared/data-schema.js DISTRICT_CATALOG
// - keyLevelPriority     <- 原 shared/data-store.js KEY_LEVEL_PRIORITY

const REGIONS_DATA = require('./regions.data.json');

const DEFAULT_REGION = REGIONS_DATA.defaultRegion;
const REGIONS = REGIONS_DATA.regions;

// 取某地区完整配置；未知 region 抛错（fail-fast，避免静默回退到上海导致数据串区）。
function getRegionConfig(region) {
  const cfg = REGIONS[region || DEFAULT_REGION];
  if (!cfg) {
    const error = new Error(`未知地区: ${region}`);
    error.statusCode = 400;
    throw error;
  }
  return cfg;
}

function getDistrictCatalog(region) {
  return getRegionConfig(region).districtCatalog;
}

function getDistrictNameToId(region) {
  const catalog = getDistrictCatalog(region);
  return Object.fromEntries(catalog.map((item) => [item.name, item.id]));
}

function getDistrictIdToName(region) {
  const catalog = getDistrictCatalog(region);
  return Object.fromEntries(catalog.map((item) => [item.id, item.name]));
}

function getKeyLevelPriority(region) {
  return getRegionConfig(region).keyLevelPriority;
}

function getRegionFeatures(region) {
  return getRegionConfig(region).features;
}

module.exports = {
  DEFAULT_REGION,
  REGIONS,
  getRegionConfig,
  getDistrictCatalog,
  getDistrictNameToId,
  getDistrictIdToName,
  getKeyLevelPriority,
  getRegionFeatures
};
