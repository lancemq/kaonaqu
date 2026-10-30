// 给路径加 region 前缀的纯函数（ESM 零依赖，server/client/proxy 共用）。
// regionPath('/schools', 'shanghai') -> '/shanghai/schools'
// regionPath('/', 'shanghai') -> '/shanghai'（根路径不加尾斜杠）
// 保留 query/hash；非字符串（Next URL 对象等）透传不处理。
// 全局频道（proxy.js GLOBAL_CHANNELS 同源清单）不加前缀：所有地区同一系统。
import { DEFAULT_REGION } from './region-list.mjs';

const GLOBAL_CHANNELS = new Set(['universities']);

// 全局频道首段清单（proxy.js GLOBAL_CHANNELS 同源语义；RegionSelector 等需要判断
// "当前页是否无地区归属"时复用，避免各处硬编码首段名）。
export const GLOBAL_CHANNEL_SEGMENTS = GLOBAL_CHANNELS;

export function isGlobalChannelPath(pathname) {
  const seg = String(pathname || '/').split('/')[1];
  return Boolean(seg) && GLOBAL_CHANNELS.has(seg);
}

export function regionPath(path, region = DEFAULT_REGION) {
  if (path == null) return `/${region}`;
  if (typeof path !== 'string') return path;
  const m = path.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const pathname = m[1] || '/';
  const search = m[2] || '';
  const hash = m[3] || '';
  // 全局频道首段命中：不加 region 前缀（/universities 或 /universities/...）
  const seg = pathname.split('/')[1];
  if (seg && GLOBAL_CHANNELS.has(seg)) return `${pathname}${search}${hash}`;
  const clean = pathname === '/' ? '' : pathname;
  return `/${region}${clean}${search}${hash}`;
}
