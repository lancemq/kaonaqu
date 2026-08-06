'use client';

// 全站导航区域选择器：放在各频道 channel-nav-links 末尾。
// 地区列表（REGIONS/DEFAULT_REGION）来自 shared/region-list.mjs 的 REGION_ENTRIES，
// 与 region-config.js REGIONS 键保持一致；新增地区时只需改 shared/ 两处。
// 选上海/其他 -> /{region}/schools（统一带前缀，由 proxy.js rewrite 到无前缀实际路由）。
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useRegion } from './region-context';
import { regionPath } from '../shared/region-path.mjs';
import { REGION_ENTRIES as REGIONS, DEFAULT_REGION } from '../shared/region-list.mjs';

// 剥离 URL 中的 region 前缀，得到无前缀路径（/shanghai/schools -> /schools）
function stripRegionPrefix(pathname) {
  const m = pathname.match(/^\/([a-z][a-z0-9-]*)(\/.*)?$/);
  if (m && REGIONS.some((r) => r.value === m[1])) {
    return m[2] || '/';
  }
  return pathname;
}

export function RegionSelector({ className = '' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { region } = useRegion();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // 点击外部 / Esc 关闭下拉
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = REGIONS.find((r) => r.value === region) || REGIONS[0];

  const select = (value) => {
    setOpen(false);
    if (value === region) return;
    const base = stripRegionPrefix(pathname || '/');
    window.location.assign(regionPath(base, value));
  };

  return (
    <div className={`region-selector${className ? ` ${className}` : ''}`} ref={ref}>
      <button
        type="button"
        className="region-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="选择地区"
        onClick={() => setOpen((o) => !o)}
      >
        <svg className="region-selector-pin" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
            fill="currentColor"
          />
        </svg>
        <span className="region-selector-label">{current.label}</span>
        <svg className="region-selector-caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="region-selector-menu" role="listbox" aria-label="地区列表">
          {REGIONS.map((r) => (
            <li key={r.value} role="option" aria-selected={r.value === region}>
              <button type="button" onClick={() => select(r.value)}>
                <span>{r.label}</span>
                {r.value === region && (
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path d="M2 7l3.5 3.5L12 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          ))}
          {REGIONS.length <= 1 && (
            <li className="region-selector-hint" aria-hidden="true">
              更多地区即将上线
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
