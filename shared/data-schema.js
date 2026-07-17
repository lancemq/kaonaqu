// 数据 schema：区域目录 + 基础工具函数。
// normalizeSchool/normalizeNews/normalizePolicy 及其专属辅助函数已移除
// （CRUD 改为直接操作 DB，归一化在 content-service.buildSchoolRecord/buildNewsRecord 内完成）。

const DISTRICT_CATALOG = [
  { id: 'huangpu', name: '黄浦区', description: '上海市中心城区，教育资源丰富' },
  { id: 'xuhui', name: '徐汇区', description: '教育强区，名校集中' },
  { id: 'changning', name: '长宁区', description: '国际化程度高，教育质量优秀' },
  { id: 'jingan', name: '静安区', description: '市中心区域，优质教育资源集中' },
  { id: 'putuo', name: '普陀区', description: '教育资源均衡发展' },
  { id: 'hongkou', name: '虹口区', description: '历史悠久，教育传统深厚' },
  { id: 'yangpu', name: '杨浦区', description: '高校聚集，教育资源丰富' },
  { id: 'minhang', name: '闵行区', description: '新兴教育区域，发展迅速' },
  { id: 'baoshan', name: '宝山区', description: '教育资源不断完善' },
  { id: 'jiading', name: '嘉定区', description: '历史文化名城，教育发展良好' },
  { id: 'pudong', name: '浦东新区', description: '经济发达，教育资源丰富' },
  { id: 'jinshan', name: '金山区', description: '教育资源稳步提升' },
  { id: 'songjiang', name: '松江区', description: '大学城区域，教育氛围浓厚' },
  { id: 'qingpu', name: '青浦区', description: '教育资源快速发展' },
  { id: 'fengxian', name: '奉贤区', description: '教育资源持续改善' },
  { id: 'chongming', name: '崇明区', description: '生态岛，教育资源特色发展' }
];

const DISTRICT_NAME_TO_ID = Object.fromEntries(DISTRICT_CATALOG.map((item) => [item.name, item.id]));
const DISTRICT_ID_TO_NAME = Object.fromEntries(DISTRICT_CATALOG.map((item) => [item.id, item.name]));

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
function buildDistricts(schools, news) {
  const policyNews = (Array.isArray(news) ? news : []).filter((item) => item.newsType === 'policy');
  return DISTRICT_CATALOG.map((district) => {
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
