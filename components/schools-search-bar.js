'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegion } from './region-context';
import { regionPath } from '../shared/region-path.mjs';
import { buildSchoolsHref } from '../lib/schools-list-url.mjs';

// 学校频道 hero 搜索框（client 岛：本地输入态 + 提交后导航，服务端是唯一数据源）。
export default function SchoolsSearchBar({ filters }) {
  const router = useRouter();
  const { region } = useRegion();
  const [queryInput, setQueryInput] = useState(filters.query || '');

  const applySearch = () => {
    router.push(regionPath(buildSchoolsHref(filters, { query: queryInput.trim() }), region));
  };

  return (
    <div className="schools-aerial-searchbar">
      <span aria-hidden="true"></span>
      <input
        id="prototype-school-search"
        type="search"
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            applySearch();
          }
        }}
        placeholder="搜索学校名称、区域或类型..."
      />
      <button type="button" onClick={applySearch}>检索</button>
    </div>
  );
}
