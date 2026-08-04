// 合法地区列表 —— 多地区路由的"白名单"。
//
// 纯数据 + 纯 ESM，零依赖，可安全用于：
//   - proxy.js（Next 16 约定，原 middleware.js）
//   - components/body-page-flag.js（client bundle）
//   - lib/region-server.mjs（server）
//
// 注意：地区完整配置（目录/品牌/考分/SEO）在 shared/region-config.js（CJS）。
// 新增地区时，本文件与 region-config.js 的 REGIONS 两处都要加地区名。
// 上海（DEFAULT_REGION）走无前缀 URL（/schools），因此 KNOWN_REGIONS 含 shanghai
// 仅用于接受可选前缀（/shanghai/schools 同样解析为上海），不影响 SEO。

export const DEFAULT_REGION = 'shanghai';

// 已知地区名（小写、[a-z0-9-]），与 region-config.js REGIONS 的键保持一致。
export const KNOWN_REGIONS = ['shanghai'];

export function isKnownRegion(name) {
  return name != null && KNOWN_REGIONS.includes(String(name));
}
