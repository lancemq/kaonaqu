'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { regionPath } from '../shared/region-path.mjs';
import { useRegion } from './region-context';

// 计算窗口化页码：总量小时全部展示；量大时保留 1 / 末页，并围绕当前页 ±2，
// 缺口处用 'ellipsis' 占位。返回的数组中数字为页码，'ellipsis' 为省略号。
function buildPageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const candidates = new Set([
    1,
    total,
    current,
    current - 1,
    current + 1,
    current - 2,
    current + 2
  ]);
  const sorted = [...candidates].filter((page) => page >= 1 && page <= total).sort((left, right) => left - right);
  const result = [];
  let prev = 0;
  for (const page of sorted) {
    if (page - prev > 1) result.push('ellipsis');
    result.push(page);
    prev = page;
  }
  return result;
}

// 两种用法：
// 1. 回调模式（client 调用方）：传 onPageChange(page)。
// 2. 链接模式（server 组件可安全使用）：传 route（如 '/schools'）+ params（当前筛选对象，
//    可序列化），页码渲染为 <Link>，href = route?params&page=N（自动补 region 前缀）。
export default function Pager({ currentPage = 1, totalPages = 1, onPageChange, route, params }) {
  const router = useRouter();
  const { region } = useRegion();
  const [jumpValue, setJumpValue] = useState('');
  const safeCurrent = Math.min(Math.max(1, Number(currentPage) || 1), Math.max(1, totalPages));
  const pageItems = buildPageItems(safeCurrent, totalPages);
  const linkMode = typeof route === 'string' && route;

  const hrefFor = (page) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params || {})) {
      if (value == null || value === '' || value === 'all') continue;
      // sort=priority 是默认值，与 buildSchoolsHref 口径一致：不写入 URL，保持规范形式
      if (key === 'sort' && value === 'priority') continue;
      if (Array.isArray(value)) {
        if (value.length) qs.set(key, value.join(','));
      } else {
        qs.set(key, String(value));
      }
    }
    if (page > 1) qs.set('page', String(page));
    const s = qs.toString();
    return regionPath(s ? `${route}?${s}` : route, region);
  };

  const goTo = (page) => {
    const target = Math.min(Math.max(1, page), totalPages);
    if (linkMode) {
      if (target !== safeCurrent) router.push(hrefFor(target));
      return;
    }
    if (target !== safeCurrent && typeof onPageChange === 'function') {
      onPageChange(target);
    }
  };

  const handleJump = (event) => {
    event.preventDefault();
    const parsed = parseInt(jumpValue, 10);
    if (Number.isFinite(parsed)) {
      goTo(parsed);
      setJumpValue('');
    }
  };

  if (totalPages <= 1) {
    return (
      <div className="pager pager-enhanced" aria-label="分页">
        <span className="pager-status">第 {safeCurrent} / {totalPages} 页</span>
      </div>
    );
  }

  const prevHref = safeCurrent === 1 ? null : hrefFor(safeCurrent - 1);
  const nextHref = safeCurrent === totalPages ? null : hrefFor(safeCurrent + 1);

  return (
    <div className="pager pager-enhanced" aria-label="分页导航">
      {prevHref ? (
        <Link className="pager-prev" href={prevHref}>上一页</Link>
      ) : (
        <button className="pager-prev" type="button" disabled>上一页</button>
      )}

      {pageItems.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="pager-ellipsis" aria-hidden="true">…</span>
        ) : linkMode ? (
          <Link
            key={item}
            className={`pager-page${item === safeCurrent ? ' is-current' : ''}`}
            aria-current={item === safeCurrent ? 'page' : undefined}
            href={hrefFor(item)}
          >
            {item}
          </Link>
        ) : (
          <button
            key={item}
            type="button"
            className={`pager-page${item === safeCurrent ? ' is-current' : ''}`}
            aria-current={item === safeCurrent ? 'page' : undefined}
            onClick={() => goTo(item)}
          >
            {item}
          </button>
        )
      )}

      {nextHref ? (
        <Link className="pager-next" href={nextHref}>下一页</Link>
      ) : (
        <button className="pager-next" type="button" disabled>下一页</button>
      )}

      <form className="pager-jump" onSubmit={handleJump}>
        <label htmlFor="pager-jump-input">跳至</label>
        <input
          id="pager-jump-input"
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(event) => setJumpValue(event.target.value)}
          placeholder={String(safeCurrent)}
        />
        <span>页</span>
        <button type="submit">跳转</button>
      </form>
    </div>
  );
}
