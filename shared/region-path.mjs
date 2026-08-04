// 给路径加 region 前缀的纯函数（ESM 零依赖，server/client/proxy 共用）。
// regionPath('/schools', 'shanghai') -> '/shanghai/schools'
// regionPath('/', 'shanghai') -> '/shanghai'（根路径不加尾斜杠）
// 保留 query/hash；非字符串（Next URL 对象等）透传不处理。
import { DEFAULT_REGION } from './region-list.mjs';

export function regionPath(path, region = DEFAULT_REGION) {
  if (path == null) return `/${region}`;
  if (typeof path !== 'string') return path;
  const m = path.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const pathname = m[1] || '/';
  const search = m[2] || '';
  const hash = m[3] || '';
  const clean = pathname === '/' ? '' : pathname;
  return `/${region}${clean}${search}${hash}`;
}
