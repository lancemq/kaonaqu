// 合法地区列表 -- 多地区路由的“白名单”。
//
// 纯 ESM，可安全用于：
//   - proxy.js（Next 16 约定，原 middleware.js）
//   - components/body-page-flag.js（client bundle，JSON import 由打包器内联）
//   - lib/region-server.mjs（server）
//   - app/layout.js inline script（KNOWN_REGIONS 注入）
//   - app/sitemap.js（遍历地区生成 URL）
//
// 数据唯一真源是 shared/regions.data.json；本文件与 shared/region-config.js（CJS）
// 均从它派生，新增地区只改 JSON 一处，不再手工双写。
//
// KNOWN_REGIONS 是合法地区白名单（proxy 接受前缀 + client 选择器）；
// REGION_ENTRIES 供 RegionSelector 下拉（value+label）及 client 端 region 元数据
// （brand/examTotal/features），useRegion() 从 pathname 解析 region 后从此处取。
// 所有地区统一带前缀（/{region}/），无特例。

import regionsData from './regions.data.json' with { type: 'json' };

export const DEFAULT_REGION = regionsData.defaultRegion;

// 已知地区名（小写、[a-z0-9-]），顺序即下拉展示顺序，与 regions.data.json 键一致。
export const KNOWN_REGIONS = Object.keys(regionsData.regions);

// RegionSelector 下拉选项 + client 组件需要的字段（与 server 端 region-config 同源）。
export const REGION_ENTRIES = Object.entries(regionsData.regions).map(([value, cfg]) => ({
  value,
  label: cfg.label,
  brandSuffix: cfg.brandSuffix,
  brandSuffixFull: cfg.brandSuffixFull,
  examTotal: cfg.examTotal,
  features: cfg.features
}));

export function isKnownRegion(name) {
  return name != null && KNOWN_REGIONS.includes(String(name));
}
