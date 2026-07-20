'use client';

import { useState } from 'react';

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

export default function Pager({ currentPage = 1, totalPages = 1, onPageChange }) {
  const [jumpValue, setJumpValue] = useState('');
  const safeCurrent = Math.min(Math.max(1, Number(currentPage) || 1), Math.max(1, totalPages));
  const pageItems = buildPageItems(safeCurrent, totalPages);

  const goTo = (page) => {
    const target = Math.min(Math.max(1, page), totalPages);
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

  return (
    <div className="pager pager-enhanced" aria-label="分页导航">
      <button className="pager-prev" type="button" onClick={() => goTo(safeCurrent - 1)} disabled={safeCurrent === 1}>
        上一页
      </button>

      {pageItems.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="pager-ellipsis" aria-hidden="true">…</span>
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

      <button className="pager-next" type="button" onClick={() => goTo(safeCurrent + 1)} disabled={safeCurrent === totalPages}>
        下一页
      </button>

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
