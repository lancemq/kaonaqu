'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolType
} from '../lib/site-utils';

const STAGE_OPTIONS = [
  { value: 'all', label: '全部学段' },
  { value: 'junior', label: '初中' },
  { value: 'senior_high', label: '高中' },
  { value: 'complete', label: '完全中学' }
];

const TIER_ORDER = ['四校', '四校分校', '八大', '八大分校', '市实验性示范性高中', '区重点', '一般高中', '民办高中', '国际课程', '公办初中', '民办初中', '公办完全中学', '民办完全中学'];
const TOP_TIER_SET = new Set(['四校', '四校分校', '八大', '八大分校', '市实验性示范性高中']);
const EXCLUDED_GROUP_NAMES = new Set([
  '黄浦系',
  '徐汇系',
  '长宁系',
  '静安系',
  '普陀系',
  '虹口系',
  '杨浦系',
  '闵行系',
  '宝山系',
  '嘉定系',
  '浦东系',
  '浦东新区系',
  '金山系',
  '松江系',
  '青浦系',
  '奉贤系',
  '崇明系',
  '南汇系',
  '国际学校',
  '二中系',
  '教院系'
]);

const TIER_LABELS = {
  四校: '四校',
  四校分校: '四校分校',
  八大: '八大',
  八大分校: '八大分校',
  市实验性示范性高中: '市重点',
  区重点: '区重点',
  一般高中: '一般高中',
  民办高中: '民办高中',
  国际课程: '国际课程',
  公办初中: '公办初中',
  民办初中: '民办初中',
  公办完全中学: '公办完中',
  民办完全中学: '民办完中'
};

function getTierRank(tier) {
  const index = TIER_ORDER.indexOf(tier);
  return index === -1 ? 999 : index;
}

function getDistrictLabel(districts, id) {
  const district = districts.find((item) => item.id === id || item.districtId === id);
  return district?.name || district?.districtName || id;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function buildGroupSummary(group) {
  const topTiers = group.tiers.filter((tier) => TOP_TIER_SET.has(tier));
  if (topTiers.length) {
    return `覆盖 ${topTiers.map((tier) => TIER_LABELS[tier] || tier).join('、')} 等头部梯队，适合先看集团核心校与分校分布。`;
  }
  if (group.districts.length >= 4) {
    return `跨 ${group.districts.length} 个区域布局，适合观察集团化办学的区域扩展路径。`;
  }
  return `当前收录 ${group.schoolCount} 所成员校，适合结合区域、学段和学校详情继续判断。`;
}

function getGroupExclusionReason(group) {
  if (!group?.name) return 'empty';
  if (EXCLUDED_GROUP_NAMES.has(group.name)) return 'low-confidence';
  if (group.schoolCount < 2) return 'single-school';
  return '';
}

export default function GroupsPageClient({ districts, schools, initialDistrict = 'all', initialStage = 'all', initialTier = 'all', initialQuery = '' }) {
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [selectedStage, setSelectedStage] = useState(initialStage);
  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [expandedGroup, setExpandedGroup] = useState(null);

  const groupsData = useMemo(() => {
    const groupsMap = new Map();

    for (const school of schools) {
      const groupName = String(school.group || '').trim();
      if (!groupName) continue;

      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, {
          name: groupName,
          schools: [],
          districtIds: new Set(),
          districts: new Set(),
          stages: new Set(),
          stageKeys: new Set(),
          tiers: new Set(),
          hasTopTier: false,
          schoolCount: 0
        });
      }

      const group = groupsMap.get(groupName);
      const districtId = school.districtId || school.district;
      const tier = String(school.tier || '').trim();

      group.schools.push(school);
      group.districtIds.add(districtId);
      group.districts.add(getSchoolDistrictName(school));
      group.stages.add(getSchoolStage(school));
      group.stageKeys.add(school.schoolStage || 'senior_high');
      if (tier) {
        group.tiers.add(tier);
        if (TOP_TIER_SET.has(tier)) group.hasTopTier = true;
      }
      group.schoolCount += 1;
    }

    return Array.from(groupsMap.values())
      .map((group) => {
        const tiers = Array.from(group.tiers).sort((left, right) => getTierRank(left) - getTierRank(right));
        const schoolsInGroup = group.schools.slice().sort((left, right) => {
          const tierDiff = getTierRank(left.tier) - getTierRank(right.tier);
          if (tierDiff !== 0) return tierDiff;
          return left.name.localeCompare(right.name, 'zh-Hans-CN');
        });
        return {
          ...group,
          districtIds: Array.from(group.districtIds).filter(Boolean),
          districts: Array.from(group.districts).filter(Boolean),
          stages: Array.from(group.stages).filter(Boolean),
          stageKeys: Array.from(group.stageKeys).filter(Boolean),
          tiers,
          schools: schoolsInGroup,
          summary: buildGroupSummary({ ...group, districts: Array.from(group.districts), tiers })
        };
      })
      .filter((group) => !getGroupExclusionReason(group))
      .sort((left, right) => {
        if (left.hasTopTier !== right.hasTopTier) return Number(right.hasTopTier) - Number(left.hasTopTier);
        if (left.schoolCount !== right.schoolCount) return right.schoolCount - left.schoolCount;
        return left.name.localeCompare(right.name, 'zh-Hans-CN');
      });
  }, [schools]);

  const allTiers = useMemo(() => {
    const tiers = new Set();
    for (const group of groupsData) {
      for (const tier of group.tiers) tiers.add(tier);
    }
    return Array.from(tiers).sort((left, right) => getTierRank(left) - getTierRank(right));
  }, [groupsData]);

  const filteredGroups = useMemo(() => {
    const query = normalizeText(searchQuery);
    return groupsData.filter((group) => {
      if (selectedDistrict !== 'all' && !group.districtIds.includes(selectedDistrict)) return false;
      if (selectedStage !== 'all' && !group.stageKeys.includes(selectedStage)) return false;
      if (selectedTier !== 'all' && !group.tiers.includes(selectedTier)) return false;
      if (!query) return true;
      return (
        normalizeText(group.name).includes(query) ||
        group.districts.some((district) => normalizeText(district).includes(query)) ||
        group.schools.some((school) => normalizeText(school.name).includes(query))
      );
    });
  }, [groupsData, selectedDistrict, selectedStage, selectedTier, searchQuery]);

  const topGroups = groupsData.filter((group) => group.hasTopTier).slice(0, 4);
  const rawGroupedSchoolTotal = schools.filter((school) => String(school.group || '').trim()).length;
  const memberSchoolTotal = groupsData.reduce((sum, group) => sum + group.schoolCount, 0);
  const excludedGroupedSchoolTotal = rawGroupedSchoolTotal - memberSchoolTotal;
  const districtCoverage = new Set(groupsData.flatMap((group) => group.districtIds)).size;
  const activeFilterCount = [selectedDistrict !== 'all', selectedStage !== 'all', selectedTier !== 'all', Boolean(searchQuery)].filter(Boolean).length;

  const applySearch = () => setSearchQuery(queryInput.trim());
  const resetFilters = () => {
    setSelectedDistrict('all');
    setSelectedStage('all');
    setSelectedTier('all');
    setQueryInput('');
    setSearchQuery('');
  };

  return (
    <>
      <header className="hero" id="top">
        <section className="school-groups-hero" aria-label="上海教育集团专题">
          <div className="school-groups-hero-grid">
            <div className="school-groups-intro">
              <p className="overview-label">School Groups</p>
              <h1>上海教育集团专题</h1>
              <p className="school-groups-subtitle">把可信的多校教育集团放在一张图里看，先判断核心校、分校、区域扩展和学段覆盖。</p>
              <p className="school-groups-description">本页已排除区域名归并、泛化类别和单校伪集团；集团化办学不能直接等同于升学结果，仍建议进入学校详情核对官方口径。</p>
              <div className="schools-datadesk-search-row">
                <label className="schools-datadesk-searchfield schools-datadesk-searchfield-main schools-datadesk-search" htmlFor="school-group-search">
                  <span className="visually-hidden">搜索教育集团、成员校或区域</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"></path>
                  </svg>
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
                </label>
                <button className="schools-datadesk-button" type="button" onClick={applySearch}>检索集团</button>
              </div>
              <div className="school-groups-actions">
                <Link className="module-link" href="/schools">返回学校数据库</Link>
                <Link className="module-link" href="/schools/compare">进入学校对比台</Link>
              </div>
            </div>

            <div className="school-groups-summary-grid">
              <article className="schools-datadesk-summary-card schools-datadesk-summary-card-strong">
                <span>教育集团</span>
                <strong>{groupsData.length}</strong>
                <p>通过基础校验的多校集团候选</p>
              </article>
              <article className="schools-datadesk-summary-card">
                <span>成员学校</span>
                <strong>{memberSchoolTotal}</strong>
                <p>纳入本页展示的成员校条目</p>
              </article>
              <article className="schools-datadesk-summary-card">
                <span>覆盖区域</span>
                <strong>{districtCoverage}</strong>
                <p>集团成员校触达的上海区县</p>
              </article>
              <article className="schools-datadesk-summary-card schools-datadesk-summary-card-stack">
                <span>当前结果</span>
                <strong>{filteredGroups.length}</strong>
                <p>{activeFilterCount ? '筛选后的集团范围' : `已排除 ${excludedGroupedSchoolTotal} 条低置信归类`}</p>
              </article>
            </div>
          </div>
        </section>
      </header>

      <section className="schools-datadesk-statusbar school-groups-statusbar" aria-label="教育集团专题状态">
        <span className="schools-datadesk-statuslabel">Group Desk</span>
        <span>当前显示 {filteredGroups.length} 个通过校验的教育集团，覆盖 {memberSchoolTotal} 所成员校</span>
      </section>

      <main className="layout schools-datadesk-layout school-groups-layout">
        <aside className="schools-datadesk-sidebar">
          <section className="schools-datadesk-panel schools-datadesk-panel-dark">
            <div className="schools-datadesk-panel-head schools-datadesk-panel-head-tight">
              <p className="overview-label">当前条件</p>
              <span>{activeFilterCount} 项激活</span>
            </div>
            <p className="schools-datadesk-panel-copy">用区域、学段和梯队先缩小集团范围，再展开成员校逐个查看详情。区域系、单校系和泛化类别已从本页隐藏。</p>
            <button className="schools-datadesk-button schools-datadesk-button-secondary" type="button" onClick={resetFilters}>清空全部条件</button>
          </section>

          <section className="schools-datadesk-panel">
            <div className="schools-datadesk-panel-head">
              <p className="overview-label">筛选控制台</p>
              <span>集团维度</span>
            </div>
            <div className="schools-datadesk-controls">
              <div className="schools-datadesk-controlblock">
                <span>区域</span>
                <label className="schools-datadesk-searchfield schools-datadesk-searchfield-select" htmlFor="group-district-filter">
                  <span className="visually-hidden">按区域筛选教育集团</span>
                  <select id="group-district-filter" value={selectedDistrict} onChange={(event) => setSelectedDistrict(event.target.value)}>
                    <option value="all">全部区域</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="schools-datadesk-controlblock">
                <span>学段</span>
                <label className="schools-datadesk-searchfield schools-datadesk-searchfield-select" htmlFor="group-stage-filter">
                  <span className="visually-hidden">按学段筛选教育集团</span>
                  <select id="group-stage-filter" value={selectedStage} onChange={(event) => setSelectedStage(event.target.value)}>
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="schools-datadesk-controlblock">
                <span>梯队</span>
                <label className="schools-datadesk-searchfield schools-datadesk-searchfield-select" htmlFor="group-tier-filter">
                  <span className="visually-hidden">按梯队筛选教育集团</span>
                  <select id="group-tier-filter" value={selectedTier} onChange={(event) => setSelectedTier(event.target.value)}>
                    <option value="all">全部梯队</option>
                    {allTiers.map((tier) => (
                      <option key={tier} value={tier}>{TIER_LABELS[tier] || tier}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="schools-datadesk-panel">
            <div className="schools-datadesk-panel-head">
              <p className="overview-label">头部集团</p>
              <span>优先观察</span>
            </div>
            <div className="school-groups-shortlist">
              {topGroups.map((group) => (
                <button key={group.name} type="button" className="schools-datadesk-entry school-groups-shortcut" onClick={() => { setQueryInput(group.name); setSearchQuery(group.name); }}>
                  <strong>{group.name}</strong>
                  <span>{group.schoolCount} 所成员校 / {group.districts.slice(0, 2).join('、')}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="schools-datadesk-results school-groups-results">
          <div className="schools-datadesk-results-head">
            <div>
              <p className="overview-label">集团结果</p>
              <h2>可展开的教育集团</h2>
            </div>
            <p>{activeFilterCount ? '已按当前条件筛选。展开卡片可查看成员校，并进入学校详情页继续判断。' : '默认按头部梯队和成员校数量排序，只展示通过基础校验的多校集团候选。'}</p>
          </div>

          {filteredGroups.length ? (
            <div className="school-groups-grid">
              {filteredGroups.map((group) => (
                <GroupCard
                  key={group.name}
                  group={group}
                  districts={districts}
                  isExpanded={expandedGroup === group.name}
                  onToggle={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
                />
              ))}
            </div>
          ) : (
            <section className="schools-datadesk-panel school-groups-empty">
              <p className="overview-label">没有匹配项</p>
              <h2>暂未找到符合条件的教育集团</h2>
              <p>可以放宽区域、学段或梯队条件，也可以直接搜索学校名来定位对应集团。</p>
              <button className="schools-datadesk-button" type="button" onClick={resetFilters}>重置筛选</button>
            </section>
          )}
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 教育集团专题</span>
        <span>{groupsData.length} 个教育集团 / {memberSchoolTotal} 所成员校</span>
      </footer>
    </>
  );
}

function GroupCard({ group, districts, isExpanded, onToggle }) {
  return (
    <article className={`school-group-card${group.hasTopTier ? ' school-group-card-strong' : ''}`}>
      <button className="school-group-card-toggle" type="button" onClick={onToggle} aria-expanded={isExpanded}>
        <span>{isExpanded ? '收起成员校' : '展开成员校'}</span>
      </button>
      <div className="school-group-card-head">
        <div>
          <p className="schools-datadesk-cardkicker">{group.districts.slice(0, 3).join(' / ') || '区域待补充'}</p>
          <h3>{group.name}</h3>
        </div>
        <div className="school-group-count">
          <strong>{group.schoolCount}</strong>
          <span>所学校</span>
        </div>
      </div>
      <p className="school-group-summary">{group.summary}</p>
      <div className="school-group-tags" aria-label={`${group.name}覆盖梯队`}>
        {group.tiers.length ? group.tiers.slice(0, 6).map((tier) => (
          <span key={tier} className={TOP_TIER_SET.has(tier) ? 'school-group-tag school-group-tag-strong' : 'school-group-tag'}>{TIER_LABELS[tier] || tier}</span>
        )) : <span className="school-group-tag school-group-tag-muted">梯队待补充</span>}
      </div>
      <div className="school-group-meta">
        <span>{group.stages.join('、') || '学段待补充'}</span>
        <span>{group.districtIds.length} 个区域</span>
      </div>

      {isExpanded ? (
        <div className="school-group-members">
          {group.schools.map((school) => (
            <Link key={school.id} className="school-group-member" href={`/schools/${school.id}`}>
              <div>
                <strong>{school.name}</strong>
                <span>{getDistrictLabel(districts, school.districtId)} · {getSchoolStage(school)} · {getSchoolType(school)}</span>
              </div>
              <span>{school.tier ? (TIER_LABELS[school.tier] || school.tier) : '详情'}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}
