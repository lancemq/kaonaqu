import { notFound } from 'next/navigation';
import { createRequire } from 'module';

// server 组件解析当前地区。
// 【性能关键】旧实现从 proxy 注入的 x-region header 读取（headers()），会使所有页面
// 退化为动态渲染（每次请求都执行函数，ISR 全部失效），是 Vercel Fluid CPU 高的主因。
// 现改为从路由段 /{region}/... 的 params 读取，页面不再触碰 Request-time API，
// revalidate ISR 真正生效（CDN 直出，函数只在过期后执行）。

const require = createRequire(import.meta.url);
const { DEFAULT_REGION, getRegionConfig } = require('../shared/region-config');
const { KNOWN_REGIONS } = require('../shared/region-list.mjs');

// 校验并解析地区标识（未知地区直接 404 终局）。
export function resolveRegion(regionRaw) {
  const region = String(regionRaw || '').trim() || DEFAULT_REGION;
  if (!KNOWN_REGIONS.includes(region)) notFound();
  return region;
}

// 从页面 params（Promise，Next 15+）解析地区标识 + 完整配置。
export async function getRegionContextFromParams(params) {
  const resolved = await params;
  const region = resolveRegion(resolved?.region);
  return { region, config: getRegionConfig(region) };
}

// 同步版本（已拿到 region 字符串时使用）。
export function getRegionContextSync(regionRaw) {
  const region = resolveRegion(regionRaw);
  return { region, config: getRegionConfig(region) };
}
