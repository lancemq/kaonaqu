'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { KNOWN_REGIONS } from '../shared/region-list.mjs';

// 剥离地区前缀后再判定频道：/shanghai/schools -> /schools -> schools。
function stripRegionPrefix(pathname) {
  const m = pathname.match(/^\/([a-z][a-z0-9-]*)(\/.*)?$/);
  if (m && KNOWN_REGIONS.includes(m[1])) {
    return m[2] || '/';
  }
  return pathname;
}

// 全局频道路径（无 region 前缀，stripRegionPrefix 后原样匹配）。
const GLOBAL_PAGE_PREFIXES = ['/universities'];

function resolvePage(pathname) {
  const path = stripRegionPrefix(pathname);
  if (path.startsWith('/news')) {
    return 'news';
  }
  if (path.startsWith('/schools')) {
    return 'schools';
  }
  if (path.startsWith('/knowledge')) {
    return 'knowledge';
  }
  for (const prefix of GLOBAL_PAGE_PREFIXES) {
    if (path.startsWith(prefix)) return prefix.slice(1);
  }
  return 'home';
}

export default function BodyPageFlag() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.dataset.page = resolvePage(pathname || '/');
  }, [pathname]);

  return null;
}
