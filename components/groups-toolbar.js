'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { regionPath } from '../shared/region-path.mjs';
import { useRegion } from './region-context';
import { STAGE_OPTIONS, TIER_LABELS } from '../lib/groups-data.mjs';

// 教育集团检索工具栏（client 岛）：筛选经 URL 导航，服务端重算（与学校列表页同模式）。
export default function GroupsToolbar({ districts, filters, allTiers }) {
  const router = useRouter();
  const { region } = useRegion();
  const [queryInput, setQueryInput] = useState(filters.query || '');

  const navigate = (next) => {
    const merged = {
      district: 'all', stage: 'all', tier: 'all', query: '',
      ...filters,
      ...next
    };
    const qs = new URLSearchParams();
    for (const key of ['district', 'stage', 'tier', 'query']) {
      const v = merged[key];
      if (v && v !== 'all') qs.set(key, v);
    }
    const s = qs.toString();
    router.push(regionPath(s ? `/schools/groups?${s}` : '/schools/groups', region));
  };

  const applySearch = () => navigate({ query: queryInput.trim() });
  const activeFilterCount = [
    filters.district !== 'all',
    filters.stage !== 'all',
    filters.tier !== 'all',
    Boolean(filters.query)
  ].filter(Boolean).length;

  return (
    <section className="school-groups-aerial-tools" aria-label="教育集团检索筛选">
      <label className="school-groups-aerial-search" htmlFor="school-group-search">
        <span className="visually-hidden">搜索教育集团、成员校或区域</span>
        <input
          id="school-group-search"
          type="search"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applySearch();
            }
          }}
          placeholder="搜索集团名、学校名或区域"
        />
        <button type="button" onClick={applySearch}>检索</button>
      </label>
      <div className="school-groups-aerial-filters">
        <label>
          <span>区域</span>
          <select value={filters.district} onChange={(event) => navigate({ district: event.target.value })}>
            <option value="all">全部区域</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
            ))}
          </select>
        </label>
        <label>
          <span>学段</span>
          <select value={filters.stage} onChange={(event) => navigate({ stage: event.target.value })}>
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>梯队</span>
          <select value={filters.tier} onChange={(event) => navigate({ tier: event.target.value })}>
            <option value="all">全部梯队</option>
            {allTiers.map((tier) => (
              <option key={tier} value={tier}>{TIER_LABELS[tier] || tier}</option>
            ))}
          </select>
        </label>
        {activeFilterCount ? (
          <button type="button" onClick={() => { setQueryInput(''); router.push(regionPath('/schools/groups', region)); }}>
            清空条件
          </button>
        ) : null}
      </div>
    </section>
  );
}
