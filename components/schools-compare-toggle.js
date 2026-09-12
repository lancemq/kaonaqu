'use client';

import { useCompareBag } from './compare-bag';

// 学校列表卡片底部的「加入对比」按钮（client 岛）。
// 与 compare-bag-checkbox 同源（localStorage + 事件同步），仅样式随列表卡。
export default function SchoolsCompareToggle({ schoolId, schoolName }) {
  const { ids, ready, has, toggle, max } = useCompareBag();
  if (!ready) return null;
  const checked = has(schoolId);
  const full = !checked && ids.length >= max;

  return (
    <button
      type="button"
      className={`schools-aerial-compare-toggle ${checked ? 'is-added' : ''}${full ? ' is-full' : ''}`}
      aria-pressed={checked}
      onClick={() => {
        const result = toggle(schoolId, schoolName);
        if (!result.ok && result.reason === 'full' && typeof window !== 'undefined') {
          window.alert(`比较篮已满（最多 ${max} 所），请先移除一所。`);
        }
      }}
    >
      {checked ? '✓ 已加入对比' : '＋ 加入对比'}
    </button>
  );
}
