'use client';

import { createContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { REGION_ENTRIES, DEFAULT_REGION } from '../shared/region-list.mjs';

// useRegion() 优先从 pathname 实时解析 region（client 导航随 URL 更新），
// 从 REGION_ENTRIES（ESM，client 可读）取 label/brand/examTotal/features。
// 这样 client 导航（router.push 选地区）后 region/features 立即更新，
// 不依赖 server layout 注入的 context（layout 在 client 导航间不重新执行，context 会停留在首次加载的地区）。
// RegionProvider 保留兼容（layout 仍包裹），但 useRegion 不再读 context。
const RegionContext = createContext(null);

const REGION_MAP = Object.fromEntries(REGION_ENTRIES.map((r) => [r.value, r]));
const FALLBACK = REGION_MAP[DEFAULT_REGION];

function extractRegion(pathname) {
  if (!pathname) return DEFAULT_REGION;
  const m = pathname.match(/^\/([a-z][a-z0-9-]*)(\/.*)?$/);
  return m && REGION_MAP[m[1]] ? m[1] : DEFAULT_REGION;
}

export function RegionProvider({ children }) {
  return <RegionContext.Provider value={null}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  const pathname = usePathname();
  const region = useMemo(() => extractRegion(pathname), [pathname]);
  const entry = REGION_MAP[region] || FALLBACK;
  return { region, ...entry };
}
