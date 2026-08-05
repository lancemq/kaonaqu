// 地区配置：集中所有"地区专属"规则（区目录、学校层级权重、考试满分、品牌、
// SEO 文案模板等）。纯数据 + 纯函数，零外部依赖（不引入 supabase / next），
// 可被 shared/（CJS require）、app server 组件（createRequire 桥接）、
// 以及阶段 2 的 proxy（经 .mjs 入口）安全引用。
//
// 多地区扩展时：在 REGIONS 下新增一个 region 条目，复制上海配置后改值即可，
// 无需改框架代码。上海（DEFAULT_REGION）保持现有行为不变。
//
// 迁移来源（阶段 0 搬家，值原样保留）：
// - districtCatalog      <- 原 shared/data-schema.js DISTRICT_CATALOG
// - keyLevelPriority     <- 原 shared/data-store.js KEY_LEVEL_PRIORITY

const DEFAULT_REGION = 'shanghai';

const SHANGHAI = {
  label: '上海',
  // 品牌副标题（原 13+ 文件硬编码的 SHANGHAI EDUCATION / ... PLATFORM）
  brandSuffix: 'SHANGHAI EDUCATION',
  brandSuffixFull: 'SHANGHAI EDUCATION PLATFORM',
  // 教育主管部门名称：用于判断政策来源是否为官方机构（isRenderablePolicy 等），
  // 新闻/政策列表页据此过滤机构页本身与非官方来源。新增地区时改为对应省市教委名称。
  officialSourceName: '上海市教育委员会',
  // 各考试满分（上海中考 750；上海高考 660）
  examTotal: { zhongkao: 750, gaokao: 660 },
  // 区目录（原 shared/data-schema.js:5-22，上海 16 区）
  districtCatalog: [
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
  ],
  // 学校层级排序权重（原 shared/data-store.js:67-76，DB 8 值词表）
  // ⚠️ 键必须与 DB 真实 school_key_level 词表严格对齐（带 (高中)/(初中) 后缀）。
  keyLevelPriority: {
    '市重点(高中)': 100,
    '顶级公办(初中)': 95,
    '顶级民办(初中)': 95,
    '区重点(高中)': 80,
    '强民办(初中)': 72,
    '强公办(初中)': 70,
    '一般高中': 60,
    '一般初中': 40
  },
  // SEO 文案模板（{label} 占位地区名，阶段 3 metadata 参数化时使用）
  seo: {
    areaServed: '上海',
    titleTemplate: '考哪去 | {label}中考高考政策、学校信息与知识体系平台',
    descriptionTemplate: '考哪去聚合{label}中考、高考新闻政策、学校信息和初高中知识体系，覆盖升学动态、学校筛选、知识点梳理与年级学习路径。',
    keywords: ['{label}中考', '{label}高考', '{label}学校', '升学政策', '中招', '高招', '{label}教育']
  }
};

const REGIONS = {
  shanghai: SHANGHAI
};

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

module.exports = {
  DEFAULT_REGION,
  REGIONS,
  getRegionConfig,
  getDistrictCatalog,
  getDistrictNameToId,
  getDistrictIdToName,
  getKeyLevelPriority
};
