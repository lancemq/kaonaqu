'use client';

import { useRouter } from 'next/navigation';
import { UNIVERSITIES_SORT_OPTIONS, buildUniversitiesHref } from '../lib/universities-list.mjs';

// 结果区排序下拉（client 岛，与 SchoolsSortSelect 同款：裸 select + 变更即 URL 导航）。
export default function UniversitiesSortSelect({ filters, basePath = '/universities' }) {
  const router = useRouter();

  return (
    <select
      id="prototype-sort-filter"
      className="schools-aerial-sort"
      value={filters.sort || 'priority'}
      onChange={(event) => router.push(buildUniversitiesHref(basePath, { ...filters, sort: event.target.value }, 1))}
    >
      {UNIVERSITIES_SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}
