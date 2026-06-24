// 学校字段质量识别 — 运行时把"占位填充"和"真实信息"区分开。
// 不修改 data/schools.json；视图层按结果做降级展示。

const PLACEHOLDER_IMAGE_PREFIX = 'school-images/placeholder-';

// 通过 data/schools.json 统计得到的、被复用 >=3 次且明显是政务列表页 / 兜底落地页的 URL。
// 后续 enrich pipeline 把真实官网写回时，对应 entry 自然变成 unique，不再命中本集合。
const PLACEHOLDER_WEBSITES = new Set([
  'http://school.bsedu.org.cn/宝山教育',
  'http://school.bsedu.org.cn/宝山求真',
  'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
  'http://school.pudong-edu.sh.cn/上海民办',
  'http://school.pudong-edu.sh.cn/上海师范'
]);

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isPlaceholderImage(url) {
  const value = asString(url);
  if (!value) return true;
  return value.includes(PLACEHOLDER_IMAGE_PREFIX);
}

export function isPlaceholderWebsite(url) {
  const value = asString(url);
  if (!value) return true;
  if (PLACEHOLDER_WEBSITES.has(value)) return true;
  // 包含中文路径段且指向 *.edu.sh.cn / *.bsedu.org.cn 这类区局聚合页的，统一视为占位
  if (/\/[一-鿿]/.test(value) && /(edu|jyj|bsedu)\.[^/]+\//.test(value)) {
    return true;
  }
  return false;
}

export function hasRealAddress(value) {
  return Boolean(asString(value));
}

export function hasRealPhone(value) {
  return Boolean(asString(value));
}

export function getSchoolDataQuality(school) {
  return {
    hasRealImage: !isPlaceholderImage(school?.image),
    hasRealWebsite: !isPlaceholderWebsite(school?.website),
    hasRealPhone: hasRealPhone(school?.phone),
    hasRealAddress: hasRealAddress(school?.address)
  };
}

export function dataQualityScore(quality) {
  if (!quality) return 0;
  let n = 0;
  if (quality.hasRealImage) n += 1;
  if (quality.hasRealWebsite) n += 1;
  if (quality.hasRealPhone) n += 1;
  if (quality.hasRealAddress) n += 1;
  return n;
}

export function dataQualityBadge(score) {
  if (score >= 3) return { label: '信息齐全 ✓', tone: 'strong' };
  if (score <= 1) return { label: '信息待补充', tone: 'muted' };
  return null;
}
