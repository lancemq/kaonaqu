import { headers } from 'next/headers';
import { createRequire } from 'module';

// server 组件读取当前地区的人口。
// 中间件把地区注入 request header（x-region）；无前缀路径（上海）未注入时兜底 DEFAULT_REGION。
//
// region-config 是 CommonJS（被 shared/ CJS 模块 require），这里用 createRequire 桥接进 ESM。

const require = createRequire(import.meta.url);
const { DEFAULT_REGION, getRegionConfig } = require('../shared/region-config');

// 读取当前请求的地区标识（如 'shanghai'）。
export async function getRegion() {
  const h = await headers();
  const region = h.get('x-region');
  return region || DEFAULT_REGION;
}

// 读取地区标识 + 完整配置（用于页面品牌/目录/SEO 等渲染）。
export async function getRegionContext() {
  const region = await getRegion();
  return { region, config: getRegionConfig(region) };
}
