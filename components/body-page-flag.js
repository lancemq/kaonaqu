'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function resolvePage(pathname) {
  if (pathname.startsWith('/news')) {
    return 'news';
  }
  if (pathname.startsWith('/schools')) {
    return 'schools';
  }
  if (pathname.startsWith('/knowledge') || pathname.startsWith('/shanghai-grade8-knowledge')) {
    return 'knowledge';
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
