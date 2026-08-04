// 数据 schema：区域目录 + 基础工具函数。
// normalizeSchool/normalizeNews/normalizePolicy 及其专属辅助函数已移除
// （CRUD 改为直接操作 DB，归一化在 content-service.buildSchoolRecord/buildNewsRecord 内完成）。
//
// 区目录现由 shared/region-config.js 按 region 提供（多地区扩展）。
// 此处导出的 DISTRICT_CATALOG / DISTRICT_NAME_TO_ID / DISTRICT_ID_TO_NAME
// 为 DEFAULT_REGION（上海）视图，保持向后兼容；region-aware 调用方应改用
// region-config 的 getDistrictCatalog(region) 等。

const {
  DEFAULT_REGION,
  getDistrictCatalog,
  getDistrictNameToId,
  getDistrictIdToName
} = require('./region-config');

const DISTRICT_CATALOG = getDistrictCatalog(DEFAULT_REGION);
const DISTRICT_NAME_TO_ID = getDistrictNameToId(DEFAULT_REGION);
const DISTRICT_ID_TO_NAME = getDistrictIdToName(DEFAULT_REGION);

function cleanString(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim().replace(/\s+/g, ' ');
}

function slugify(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// 由 schools/news 派生区域聚合（学校数、政策数、最新政策标题）。
// region 默认 DEFAULT_REGION（上海）；多地区调用方传入对应 region，
// 内部按该 region 的区目录聚合（非该 region 的区会被忽略，符合地区隔离语义）。
function buildDistricts(schools, news, region = DEFAULT_REGION) {
  const catalog = getDistrictCatalog(region);
  const policyNews = (Array.isArray(news) ? news : []).filter((item) => item.newsType === 'policy');
  return catalog.map((district) => {
    const districtSchools = schools.filter((school) => school.districtId === district.id);
    const districtPolicies = policyNews.filter((policy) => policy.districtId === district.id);
    const latestPolicy = districtPolicies
      .slice()
      .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')))[0];

    return {
      id: district.id,
      name: district.name,
      description: district.description,
      schoolCount: districtSchools.length,
      policyCount: districtPolicies.length,
      latestPolicyTitle: latestPolicy ? latestPolicy.title : ''
    };
  });
}

function validateRequired(record, requiredFields) {
  return requiredFields
    .filter((field) => {
      const value = record[field];
      return value === undefined || value === null || value === '';
    })
    .map((field) => `missing ${field}`);
}

module.exports = {
  DISTRICT_CATALOG,
  DISTRICT_NAME_TO_ID,
  DISTRICT_ID_TO_NAME,
  buildDistricts,
  cleanString,
  slugify,
  validateRequired
};
