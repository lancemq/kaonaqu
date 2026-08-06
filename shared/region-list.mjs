// 合法地区列表 -- 多地区路由的“白名单”。
//
// 纯数据 + 纯 ESM，零依赖，可安全用于：
//   - proxy.js（Next 16 约定，原 middleware.js）
//   - components/body-page-flag.js（client bundle）
//   - lib/region-server.mjs（server）
//   - app/layout.js inline script（KNOWN_REGIONS 注入）
//   - app/sitemap.js（遍历地区生成 URL）
//
// 注意：地区完整配置（目录/品牌/考分/SEO）在 shared/region-config.js（CJS）。
// 新增地区时，本文件与 region-config.js 的 REGIONS 两处都要加地区名。
//
// KNOWN_REGIONS 是合法地区白名单（proxy 接受前缀 + client 选择器）；
// REGION_ENTRIES 供 RegionSelector 下拉（value+label），与 region-config.js REGIONS 键保持一致。
// 阶段 3 起所有地区统一带前缀（/{region}/），无特例。

export const DEFAULT_REGION = 'shanghai';

// 已知地区名（小写、[a-z0-9-]），与 region-config.js REGIONS 的键保持一致。
export const KNOWN_REGIONS = ['shanghai', 'suzhou'];

// RegionSelector 下拉选项 + client 端 region 元数据（value=地区名、label=展示名）。
// 含 client 组件需要的字段（brand/examTotal/features），与 region-config.js 对应地区配置同步；
// 新增地区时两处都要改，避免下拉/品牌/features 与 server 端不一致。
// useRegion() 从 pathname 解析 region 后从此处取这些字段（client 导航实时更新）。
export const REGION_ENTRIES = [
  {
    value: 'shanghai',
    label: '上海',
    brandSuffix: 'SHANGHAI EDUCATION',
    brandSuffixFull: 'SHANGHAI EDUCATION PLATFORM',
    examTotal: { zhongkao: 750, gaokao: 660 },
    features: { schools: true, knowledge: true, compare: true, groups: true, district: true, scoreMatch: true }
  },
  {
    value: 'suzhou',
    label: '苏州',
    brandSuffix: 'SUZHOU EDUCATION',
    brandSuffixFull: 'SUZHOU EDUCATION PLATFORM',
    examTotal: { zhongkao: 740, gaokao: 750 },
    features: { schools: true, knowledge: false, compare: true, groups: false, district: true, scoreMatch: true }
  }
];

export function isKnownRegion(name) {
  return name != null && KNOWN_REGIONS.includes(String(name));
}
