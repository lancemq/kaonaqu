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

  const featuredGroups = filteredGroups.slice(0, 5);
  const regionalGroups = filteredGroups.filter((group) => !group.hasTopTier).slice(0, 5);
  const visibleRegionalGroups = regionalGroups.length ? regionalGroups : filteredGroups.slice(5, 10);
  const groupTypes = [
    { label: '高校附属集团', value: groupsData.filter((group) => /复旦|交大|华二|上外|同济|华师/.test(group.name)).length || 4 },
    { label: '区域教育联盟', value: districtCoverage },
    { label: '名校集团', value: groupsData.filter((group) => group.hasTopTier).length },
    { label: '特色教育集团', value: groupsData.filter((group) => group.tiers.includes('国际课程') || group.stages.includes('完全中学')).length }
  ];
  const benefitNotes = [
    '资源共享：课程体系、教学资源、实验室设施集团内互通',
    '师资流动：骨干教师在成员校间轮岗交流，提升整体教学水平'
  ];

  return (
    <>
      <nav className="channel-nav" aria-label="顶部导航">
        <Link className="channel-brand" href="/" aria-label="考哪去首页">
          <strong>考哪去</strong>
          <span>SHANGHAI EDUCATION</span>
        </Link>
        <div className="channel-nav-links">
          <Link href="/">首页</Link>
          <Link href="/news">新闻</Link>
          <Link className="is-active" href="/schools">学校</Link>
          <Link href="/knowledge">知识</Link>
        </div>
      </nav>

      <header className="school-groups-aerial-hero" id="top">
        <section className="school-groups-aerial-hero-content" aria-label="上海教育集团专题">
          <div className="school-groups-aerial-hero-copy">
            <p className="channel-kicker"><span aria-hidden="true"></span>EDUCATION GROUPS</p>
            <h1>教育集团</h1>
            <p>上海自 2014 年起推行学区化集团化办学，通过名校引领、资源共享、课程共建、师资流动等方式，促进优质教育资源均衡分布。</p>
          </div>

          <aside className="school-groups-aerial-hero-stats" aria-label="教育集团统计">
            <article>
              <strong>{groupsData.length}</strong>
              <span>教育集团</span>
            </article>
            <article>
              <strong>{memberSchoolTotal}</strong>
              <span>成员学校</span>
            </article>
            <article>
              <strong>{districtCoverage}</strong>
              <span>覆盖区域</span>
            </article>
          </aside>
        </section>
      </header>

      <section className="school-groups-aerial-overview">
        <h2>集团化办学概况</h2>
        <p>当前页面已排除区域名归并、泛化类别与单校伪集团；集团化办学不等于升学结果，适合先看核心校、成员校分布、覆盖学段与区域扩展，再进入具体学校详情确认官方口径。</p>
      </section>

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
            <select value={selectedDistrict} onChange={(event) => setSelectedDistrict(event.target.value)}>
              <option value="all">全部区域</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
              ))}
            </select>
          </label>
          <label>
            <span>学段</span>
            <select value={selectedStage} onChange={(event) => setSelectedStage(event.target.value)}>
              {STAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>梯队</span>
            <select value={selectedTier} onChange={(event) => setSelectedTier(event.target.value)}>
              <option value="all">全部梯队</option>
              {allTiers.map((tier) => (
                <option key={tier} value={tier}>{TIER_LABELS[tier] || tier}</option>
              ))}
            </select>
          </label>
          {activeFilterCount ? <button type="button" onClick={resetFilters}>清空条件</button> : null}
        </div>
      </section>

      <section className="school-groups-aerial-list" aria-label="主要教育集团">
        <div className="school-groups-aerial-section-head">
          <p className="channel-kicker"><span aria-hidden="true"></span>MAJOR GROUPS</p>
          <h2>主要教育集团</h2>
        </div>
        <div className="school-groups-grid">
          {featuredGroups.map((group) => (
            <GroupCard
              key={group.name}
              group={group}
              districts={districts}
              isExpanded={expandedGroup === group.name}
              onToggle={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
            />
          ))}
        </div>
      </section>

      <section className="school-groups-aerial-list" aria-label="区域联盟与特色集团">
        <div className="school-groups-aerial-section-head">
          <p className="channel-kicker"><span aria-hidden="true"></span>REGIONAL GROUPS</p>
          <h2>区域联盟与特色集团</h2>
          <p>{activeFilterCount ? `当前筛选匹配 ${filteredGroups.length} 个集团。` : `按头部梯队与成员校数量排序，当前展示 ${filteredGroups.length} 个通过校验的集团。`}</p>
        </div>
        <div className="school-groups-aerial-row-list">
          {visibleRegionalGroups.map((group) => (
            <article className="school-groups-aerial-row" key={group.name}>
              <div>
                <strong>{group.name}</strong>
                <span>{group.districts.slice(0, 4).join(' / ') || '区域待补充'}</span>
              </div>
              <p>{group.summary}</p>
              <button type="button" onClick={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}>
                {expandedGroup === group.name ? '收起' : '展开'}
              </button>
              {expandedGroup === group.name ? (
                <div className="school-group-members">
                  {group.schools.slice(0, 8).map((school) => (
                    <Link key={school.id} href={`/schools/${school.id}`}>
                      <strong>{school.name}</strong>
                      <span>{getDistrictLabel(districts, school.districtId || school.district)} / {getSchoolStage(school)} / {getSchoolType(school)}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="school-groups-aerial-types" aria-label="教育集团类型">
        {groupTypes.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="school-groups-aerial-benefits">
        <article>
          <p className="channel-kicker"><span aria-hidden="true"></span>BENEFITS</p>
          <h2>为什么要看教育集团</h2>
          <p>集团化办学不是简单看名字，而是观察课程、师资、活动和升学信息如何在成员校之间流动。它能帮助家庭理解一个学校背后的资源网络。</p>
        </article>
        <div>
          {benefitNotes.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <footer className="channel-footer">
        <div><strong>考哪去</strong><span>SHANGHAI EDUCATION PLATFORM</span></div>
        <nav aria-label="页脚导航">
          <Link href="/">首页</Link>
          <Link href="/news">新闻</Link>
          <Link href="/schools">学校</Link>
          <Link href="/knowledge">知识</Link>
        </nav>
        <p>© 2026 考哪去</p>
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
        )) : <span className="school-group-tag school-group-tag-muted">—</span>}
      </div>
      <div className="school-group-meta">
        <span>{group.stages.join('、') || '—'}</span>
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
