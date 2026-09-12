'use client';

import { useRouter } from 'next/navigation';
import { regionPath } from '../shared/region-path.mjs';
import { useRegion } from './region-context';
import { buildSchoolsHref, SCHOOLS_SORT_OPTIONS } from '../lib/schools-list-url.mjs';

// 结果区排序下拉（client 岛）：变更经 URL 导航，服务端重取当前页。
export default function SchoolsSortSelect({ filters }) {
  const router = useRouter();
  const { region } = useRegion();
  const activeSort = filters.sort || 'priority';

  return (
    <select
      id="prototype-sort-filter"
      className="schools-aerial-sort"
      value={activeSort}
      onChange={(event) => router.push(regionPath(buildSchoolsHref(filters, { sort: event.target.value }), region))}
    >
      {SCHOOLS_SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}
