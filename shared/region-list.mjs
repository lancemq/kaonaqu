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
export const KNOWN_REGIONS = ['shanghai'];

// RegionSelector 下拉选项（value=地区名、label=展示名）。
// label 与 region-config.js 对应地区配置的 label 同步；
// 新增地区时两处 label 都要改，避免下拉文案与品牌/SEO 不一致。
export const REGION_ENTRIES = [{ value: 'shanghai', label: '上海' }];

export function isKnownRegion(name) {
  return name != null && KNOWN_REGIONS.includes(String(name));
}
