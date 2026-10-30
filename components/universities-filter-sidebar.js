'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buildUniversitiesHref } from '../lib/universities-list.mjs';

// 高校列表筛选侧栏（client 岛）：DOM 结构与 SchoolsFilterSidebar 完全同款
// （schools-aerial-sidebar / -filter-block / -section / -filter-stack / -tool-stack / -reset），
// 所有筛选变更经 URL 导航触发服务端重取，服务端是唯一数据源。
// 与学校侧栏的差异仅在筛选项与「工具与导航」链接，视觉不新增任何类名。
const LEVEL_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'undergrad', label: '本科' },
  { value: 'juniorCollege', label: '专科' }
];

const TAG_OPTIONS = [
  { value: '双一流', label: '双一流' },
  { value: '985', label: '985' },
  { value: '211', label: '211' },
  { value: '强基计划', label: '强基计划' }
];

const NATURE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '公办', label: '公办' },
  { value: '民办', label: '民办' },
  { value: '中外合作', label: '中外合作' }
];

const AFFILIATION_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '教育部', label: '教育部' },
  { value: '工信部', label: '工信部' },
  { value: '其他部委', label: '其他部委' },
  { value: '省级', label: '省级' },
  { value: '市级', label: '市级' },
  { value: '军队', label: '军队' }
];

function FilterSection({ id, label, open, onToggle, active, badge, children }) {
  return (
    <section className={`schools-aerial-filter-block schools-aerial-section ${open ? 'is-open' : 'is-closed'}`}>
      <button type="button" className="schools-aerial-section-head" onClick={() => onToggle(id)} aria-expanded={open}>
        <span className="schools-aerial-section-title">
          {label}
          {active ? <i className="schools-aerial-section-flag" aria-hidden="true" /> : null}
        </span>
        <span className="schools-aerial-section-right">
          {badge != null ? <span className="schools-aerial-section-badge">{badge}</span> : null}
          <i className="schools-aerial-section-chevron" aria-hidden="true" />
        </span>
      </button>
      {open ? <div className="schools-aerial-section-body">{children}</div> : null}
    </section>
  );
}

export default function UniversitiesFilterSidebar({ filters, provinceOptions, quickLinks, basePath = '/universities' }) {
  const router = useRouter();
  const navigate = (next) => router.push(buildUniversitiesHref(basePath, next, 1));

  const activeLevel = filters.level;
  const activeTags = Array.isArray(filters.tags) ? filters.tags : [];
  const activeProvince = filters.province;
  const activeNature = filters.nature;
  const activeAffiliation = filters.affiliation;

  const [openSections, setOpenSections] = useState(() => new Set(['level', 'tags', 'province', 'nature']));
  const toggleSection = (id) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTag = (tag) => {
    const next = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag];
    navigate({ ...filters, tags: next });
  };

  return (
    <aside className="schools-aerial-sidebar" aria-label="筛选条件">
      <div className="schools-aerial-sidebar-head">
        <div className="channel-kicker"><span aria-hidden="true"></span><p>FILTER</p></div>
        <h2>筛选条件</h2>
      </div>

      <FilterSection id="level" label="层次" open={openSections.has('level')} onToggle={toggleSection} active={activeLevel !== 'all'}>
        <div className="schools-aerial-filter-stack">
          {LEVEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={activeLevel === option.value ? 'is-active' : ''}
              onClick={() => navigate({ ...filters, level: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection id="tags" label="标签" open={openSections.has('tags')} onToggle={toggleSection} active={activeTags.length > 0}>
        <div className="schools-aerial-filter-stack schools-aerial-feature-chips">
          {TAG_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={activeTags.includes(option.value) ? 'is-active' : ''}
              onClick={() => toggleTag(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection id="province" label="省份" open={openSections.has('province')} onToggle={toggleSection} active={activeProvince !== 'all'}>
        <select
          id="prototype-province-filter"
          value={activeProvince}
          onChange={(event) => navigate({ ...filters, province: event.target.value })}
        >
          <option value="all">全部省市区</option>
          {provinceOptions.map((province) => (
            <option key={province} value={province}>{province}</option>
          ))}
        </select>
      </FilterSection>

      <FilterSection id="nature" label="办学性质" open={openSections.has('nature')} onToggle={toggleSection} active={activeNature !== 'all'}>
        <div className="schools-aerial-filter-stack">
          {NATURE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={activeNature === option.value ? 'is-active' : ''}
              onClick={() => navigate({ ...filters, nature: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection id="affiliation" label="隶属" open={openSections.has('affiliation')} onToggle={toggleSection} active={activeAffiliation !== 'all'}>
        <div className="schools-aerial-filter-stack">
          {AFFILIATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={activeAffiliation === option.value ? 'is-active' : ''}
              onClick={() => navigate({ ...filters, affiliation: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection id="tools" label="工具与导航" open={openSections.has('tools')} onToggle={toggleSection}>
        <div className="schools-aerial-subgroup">
          <div className="schools-aerial-filter-block">
            <label>快捷入口</label>
            <div className="schools-aerial-tool-stack">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span>{link.label}</span>
                  <i>{link.meta}</i>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      <button className="schools-aerial-reset" type="button" onClick={() => router.push(basePath)}>
        清空全部条件
      </button>
    </aside>
  );
}
