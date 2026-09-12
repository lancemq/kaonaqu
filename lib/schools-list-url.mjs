// 学校列表页 URL 构造（纯函数，server 组件与 client 筛选岛共用）。
// buildSchoolsHref(base, next)：以当前筛选 base 为底，应用 next 变更（自动重置 page=1），
// 生成 /schools?... 形式的无前缀路径（region 前缀由调用方经 regionPath/RegionLink 补）。

export const SCHOOLS_SORT_OPTIONS = [
  { value: 'priority', label: '默认排序' },
  { value: 'level', label: '按等级' },
  { value: 'district', label: '按区域' },
  { value: 'year', label: '按建校年份' },
  { value: 'score', label: '按录取分数线' }
];

export function buildSchoolsHref(base, next) {
  const merged = { ...base, page: 1, ...next };
  const qs = new URLSearchParams();
  for (const key of ['district', 'stage', 'property', 'keyLevel', 'cohort', 'boarding', 'international', 'query']) {
    const v = merged[key];
    if (v && v !== 'all') qs.set(key, v);
  }
  if (merged.sort && merged.sort !== 'priority') qs.set('sort', merged.sort);
  if (Array.isArray(merged.features) && merged.features.length) qs.set('features', merged.features.join(','));
  if (merged.page && Number(merged.page) > 1) qs.set('page', String(merged.page));
  const s = qs.toString();
  return s ? `/schools?${s}` : '/schools';
}
