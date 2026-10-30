'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildUniversitiesHref } from '../lib/universities-list.mjs';

// 高校频道 hero 搜索框（client 岛，与 SchoolsSearchBar 同款 DOM/交互：
// 本地输入态 + 提交后 URL 导航，服务端是唯一数据源）。
export default function UniversitiesSearchBar({ filters }) {
  const router = useRouter();
  const [queryInput, setQueryInput] = useState(filters.query || '');

  const applySearch = () => {
    router.push(buildUniversitiesHref('/universities', { ...filters, query: queryInput.trim() }, 1));
  };

  return (
    <div className="schools-aerial-searchbar">
      <span aria-hidden="true"></span>
      <input
        id="prototype-university-search"
        type="search"
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            applySearch();
          }
        }}
        placeholder="搜索校名 / 简称 / 曾用名，如：清华、华政、哈工大"
      />
      <button type="button" onClick={applySearch}>检索</button>
    </div>
  );
}
