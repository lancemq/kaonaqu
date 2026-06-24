'use client';

import { useCompareBag } from './compare-bag';

export default function CompareBagCheckbox({ schoolId, schoolName }) {
  const { ids, has, toggle, max } = useCompareBag();
  const checked = has(schoolId);
  const full = !checked && ids.length >= max;

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = toggle(schoolId, schoolName);
    if (!result.ok && result.reason === 'full' && typeof window !== 'undefined') {
      window.alert(`比较篮已满（最多 ${max} 所），请先移除一所。`);
    }
  };

  const label = checked
    ? `从比较篮移除 ${schoolName || ''}`
    : full
      ? '比较篮已满'
      : `加入比较 ${schoolName || ''}`;

  const classes = [
    'compare-bag-checkbox',
    checked && 'compare-bag-checkbox-checked',
    full && 'compare-bag-checkbox-disabled'
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      aria-pressed={checked}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{checked ? '✓' : '＋'}</span>
      <span className="compare-bag-checkbox-text">{checked ? '已加入比较' : '加入比较'}</span>
    </button>
  );
}
