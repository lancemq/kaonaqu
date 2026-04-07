'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  filterSchools,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolTrainingDirections,
  getSchoolType
} from '../lib/site-utils';

const STAGE_OPTIONS = [
  { value: 'all', label: '全部学段' },
  { value: 'junior', label: '初中' },
  { value: 'senior_high', label: '高中' },
  { value: 'complete', label: '完全中学' }
];

const OWNERSHIP_OPTIONS = [
  { value: 'all', label: '全部办学性质' },
  { value: 'public', label: '公办' },
  { value: 'private', label: '民办' },
  { value: 'international', label: '国际化 / 双语' },
  { value: 'foreign', label: '外籍学校' }
];

const FEATURE_FILTER_OPTIONS = [
  '示范性高中',
  '外语特色',
  '双语',
  '寄宿',
  '九年一贯',
  '百年名校',
  '国际化',
  '实验',
  '科技特色',
  '艺术特色'
];

const DIRECTION_FILTER_OPTIONS = [
  '科创竞赛',
  '人文综合',
  '国际课程',
  '寄宿管理',
  '贯通培养',
  '外语特色'
];

const SCHOOLS_PER_PAGE = 10;

function resolveFeaturedSchool(schools, keyword, preferredName) {
  return schools.find((entry) => entry.name === preferredName)
    || schools.find((entry) => entry.name === keyword)
    || schools.find((entry) => entry.name.includes(keyword) || keyword.includes(entry.name))
    || null;
}

function clipText(text, maxLength = 120) {
  const value = String(text || '').trim();
  if (!value || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength).trim()}...`;
}

function getOwnershipLabel(school) {
  const label = String(school?.schoolTypeLabel || '').trim();
  return label || '办学性质待补充';
}

function getSchoolPositioning(school) {
  const description = clipText(school?.schoolDescription, 84);
  if (description) {
    return description;
  }
  const admission = clipText(getSchoolAdmissionInfo(school), 84);
  if (admission) {
    return admission;
  }
  return `${school.name}已收录到学校数据库，可继续查看详情、标签和招生相关线索。`;
}

function buildCardTags(school) {
  const values = [
    ...(school.tags || []),
    ...(school.features || []),
    ...getSchoolTrainingDirections(school)
  ].filter(Boolean);

  return Array.from(new Set(values)).slice(0, 4);
}

function formatSchoolUpdate(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '时间待补充';
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    if (hour && minute) {
      return `${year}.${month}.${day} ${hour}:${minute}`;
    }
    return `${year}.${month}.${day}`;
  }
  return text;
}

function getUpdateSortValue(value) {
  const text = String(value || '').trim();
  if (!text) {
    return 0;
  }
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) {
    return 0;
  }
  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
  return Number(`${year}${month}${day}${hour}${minute}${second}`);
}

export default function SchoolsPageClient({
  districts,
  schools,
  initialDistrict = 'all',
  initialStage = 'all',
  initialOwnership = 'all',
  initialTag = 'all',
  initialDirection = 'all',
  initialQuery = ''
}) {
  const [activeDistrict, setActiveDistrict] = useState(initialDistrict);
  const [activeStage, setActiveStage] = useState(initialStage);
  const [activeOwnership, setActiveOwnership] = useState(initialOwnership);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [activeDirection, setActiveDirection] = useState(initialDirection);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSchools = useMemo(
    () => filterSchools(schools, {
      district: activeDistrict,
      query: searchQuery,
      stage: activeStage,
      ownership: activeOwnership,
      tag: activeTag,
      direction: activeDirection
    }),
    [schools, activeDistrict, searchQuery, activeStage, activeOwnership, activeTag, activeDirection]
  );

  const tagOptions = useMemo(() => {
    const available = new Set();
    for (const school of schools) {
      for (const item of [...(school.tags || []), ...(school.features || []), ...(school.keyFeatures || [])]) {
        if (item) available.add(item);
      }
    }
    return ['all', ...FEATURE_FILTER_OPTIONS.filter((option) => available.has(option))];
  }, [schools]);

  const directionOptions = useMemo(() => {
    const unique = new Set();
    for (const school of schools) {
      const directions = getSchoolTrainingDirections(school);
      for (const item of directions) {
        if (item) unique.add(item);
      }
    }
    return ['all', ...DIRECTION_FILTER_OPTIONS.filter((option) => unique.has(option))];
  }, [schools]);

  const featuredSchools = useMemo(() => {
    const picks = [
      { keyword: '上海中学', preferredName: '上海中学', label: '重点高中样本' },
      { keyword: '华东师范大学第二附属中学', preferredName: '华东师范大学第二附属中学', label: '浦东头部高中' },
      { keyword: '复旦大学附属中学', label: '杨浦代表学校' },
      { keyword: '上外附属双语学校', preferredName: '上海外国语大学附属双语学校', label: '完全中学样本' }
    ];

    return picks
      .map((item) => {
        const school = resolveFeaturedSchool(schools, item.keyword, item.preferredName);
        return school ? { ...item, school } : null;
      })
      .filter(Boolean);
  }, [schools]);

  const highlightedDistricts = useMemo(
    () => districts.slice().sort((left, right) => Number(right.schoolCount || 0) - Number(left.schoolCount || 0)).slice(0, 6),
    [districts]
  );

  const activeFilterSummary = useMemo(() => {
    const lines = [];
    if (activeDistrict !== 'all') {
      const district = districts.find((item) => item.id === activeDistrict);
      lines.push(`区域：${district?.name || district?.districtName || activeDistrict}`);
    }
    if (activeStage !== 'all') {
      lines.push(`学段：${STAGE_OPTIONS.find((item) => item.value === activeStage)?.label || activeStage}`);
    }
    if (activeOwnership !== 'all') {
      lines.push(`办学性质：${OWNERSHIP_OPTIONS.find((item) => item.value === activeOwnership)?.label || activeOwnership}`);
    }
    if (activeTag !== 'all') {
      lines.push(`特色：${activeTag}`);
    }
    if (activeDirection !== 'all') {
      lines.push(`培养方向：${activeDirection}`);
    }
    if (searchQuery) {
      lines.push(`关键词：${searchQuery}`);
    }
    return lines;
  }, [activeDistrict, activeStage, activeOwnership, activeTag, activeDirection, searchQuery, districts]);

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / SCHOOLS_PER_PAGE));
  const pagedSchools = useMemo(() => {
    const start = (currentPage - 1) * SCHOOLS_PER_PAGE;
    return filteredSchools.slice(start, start + SCHOOLS_PER_PAGE);
  }, [filteredSchools, currentPage]);

  const stageStats = useMemo(() => {
    const counts = { junior: 0, senior_high: 0, complete: 0 };
    for (const school of filteredSchools) {
      counts[school.schoolStage] = (counts[school.schoolStage] || 0) + 1;
    }
    return counts;
  }, [filteredSchools]);

  const schoolStageTotals = useMemo(() => {
    const counts = { junior: 0, senior_high: 0, complete: 0 };
    for (const school of schools) {
      counts[school.schoolStage] = (counts[school.schoolStage] || 0) + 1;
    }
    return counts;
  }, [schools]);

  const currentDistrictLabel = activeDistrict === 'all'
    ? '全市范围'
    : (districts.find((item) => item.id === activeDistrict)?.name || activeDistrict);

  const latestUpdated = useMemo(() => {
    const values = schools
      .map((school) => String(school.updatedAt || '').trim())
      .filter(Boolean)
      .sort((left, right) => getUpdateSortValue(right) - getUpdateSortValue(left));
    return formatSchoolUpdate(values[0]);
  }, [schools]);

  const activeFilterCount = activeFilterSummary.length;

  const resultDescriptor = activeFilterSummary.length
    ? `${currentDistrictLabel}下匹配 ${filteredSchools.length} 所学校`
    : `当前数据库收录 ${schools.length} 所学校，可按区域和学段逐步缩小范围`;

  const emptyStateSchools = featuredSchools.map((item) => item.school);

  const applySearch = () => {
    setSearchQuery(queryInput.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setActiveDistrict('all');
    setActiveStage('all');
    setActiveOwnership('all');
    setActiveTag('all');
    setActiveDirection('all');
    setQueryInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <>
      <header className="hero" id="top">
        <section className="search-panel schools-datadesk-hero" aria-label="上海学校数据库入口">
          <div className="schools-datadesk-hero-grid">
            <div className="schools-datadesk-intro">
              <p className="overview-label">School Database</p>
              <h1>上海学校数据库</h1>
              <p className="schools-datadesk-subtitle">先按区域、学段、办学性质与学校特征缩小范围，再进入学校详情做判断。</p>
              <p className="schools-datadesk-description">这一页优先解决“先把候选学校缩到可比较范围内”这个问题。搜索适合已知目标学校，左侧控制台适合还在缩范围的家庭。</p>
              <div className="schools-datadesk-search-row">
                <label className="search-field search-field-main schools-datadesk-search" htmlFor="prototype-school-search">
                  <span className="visually-hidden">搜索学校、区域或关键词</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"></path>
                  </svg>
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
                    placeholder="搜索学校名、区域或办学特征"
                  />
                </label>
                <button className="schools-datadesk-button" type="button" onClick={applySearch}>执行检索</button>
              </div>
              <div className="schools-datadesk-inline-meta">
                <span>区域优先</span>
                <span>学段与性质并排判断</span>
                <span>标签用于快速比较</span>
              </div>
            </div>

            <div className="schools-datadesk-summary-grid">
              <article className="schools-datadesk-summary-card schools-datadesk-summary-card-strong">
                <span>学校总量</span>
                <strong>{schools.length}</strong>
                <p>当前数据库收录的可检索学校条目</p>
              </article>
              <article className="schools-datadesk-summary-card">
                <span>覆盖区域</span>
                <strong>{districts.length}</strong>
                <p>上海 16 区学校检索入口</p>
              </article>
              <article className="schools-datadesk-summary-card">
                <span>当前结果</span>
                <strong>{filteredSchools.length}</strong>
                <p>{activeFilterSummary.length ? '筛选后的可比较范围' : '尚未添加筛选条件'}</p>
              </article>
              <article className="schools-datadesk-summary-card schools-datadesk-summary-card-stack">
                <span>学段分布</span>
                <strong>{schoolStageTotals.senior_high} / {schoolStageTotals.junior} / {schoolStageTotals.complete}</strong>
                <p>高中 / 初中 / 完全中学</p>
              </article>
            </div>
            <div className="schools-datadesk-hero-footnote">
              <span>数据更新时间 {latestUpdated}</span>
              <span>来源以学校索引与公开资料整理为主</span>
            </div>
          </div>
        </section>
      </header>

      <section className="schools-datadesk-statusbar" aria-label="数据库状态摘要">
        <span className="schools-datadesk-statuslabel">Database Status</span>
        <span>{resultDescriptor}</span>
      </section>

      <main className="layout schools-datadesk-layout">
        <aside className="schools-datadesk-sidebar">
          <section className="schools-datadesk-panel schools-datadesk-panel-dark">
            <div className="schools-datadesk-panel-head schools-datadesk-panel-head-tight">
              <p className="overview-label">当前条件</p>
              <span>{activeFilterCount} 项激活</span>
            </div>
            {activeFilterSummary.length ? (
              <div className="schools-datadesk-activechips">
                {activeFilterSummary.map((line) => (
                  <span key={line} className="schools-datadesk-activechip">{line}</span>
                ))}
              </div>
            ) : (
              <p className="schools-datadesk-panel-copy">当前未添加具体筛选条件，建议先从区域和学段开始缩小范围。</p>
            )}
            <div className="schools-datadesk-panel-meta">
              <span>最近更新时间</span>
              <strong>{latestUpdated}</strong>
            </div>
            <button className="schools-datadesk-button schools-datadesk-button-secondary" type="button" onClick={resetFilters}>清空全部条件</button>
          </section>

          <section className="schools-datadesk-panel">
            <div className="schools-datadesk-panel-head">
              <p className="overview-label">控制台</p>
              <span>先缩范围，再看学校</span>
            </div>
            <div className="schools-datadesk-controls">
              <div className="schools-datadesk-controlblock">
                <span>区域</span>
                <label className="search-field search-field-select" htmlFor="prototype-district-filter">
                  <span className="visually-hidden">按区域筛选</span>
                  <select id="prototype-district-filter" value={activeDistrict} onChange={(event) => { setActiveDistrict(event.target.value); setCurrentPage(1); }}>
                    <option value="all">全部区域</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="schools-datadesk-controlblock">
                <span>学段</span>
                <label className="search-field search-field-select" htmlFor="prototype-stage-filter">
                  <span className="visually-hidden">按学段筛选</span>
                  <select id="prototype-stage-filter" value={activeStage} onChange={(event) => { setActiveStage(event.target.value); setCurrentPage(1); }}>
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="schools-datadesk-controlblock">
                <span>办学性质</span>
                <label className="search-field search-field-select" htmlFor="prototype-ownership-filter">
                  <span className="visually-hidden">按办学性质筛选</span>
                  <select id="prototype-ownership-filter" value={activeOwnership} onChange={(event) => { setActiveOwnership(event.target.value); setCurrentPage(1); }}>
                    {OWNERSHIP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="schools-datadesk-panel">
            <div className="schools-datadesk-panel-head">
              <p className="overview-label">学校特征</p>
              <span>用标签快速缩小比较范围</span>
            </div>
            <div className="schools-datadesk-taggroup" aria-label="学校特色筛选">
              <div className="schools-datadesk-tagrow">
                {tagOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`schools-datadesk-tag${activeTag === option ? ' schools-datadesk-tag-active' : ''}`}
                    onClick={() => { setActiveTag(option); setCurrentPage(1); }}
                  >
                    {option === 'all' ? '全部特色' : option}
                  </button>
                ))}
              </div>
            </div>
            <div className="schools-datadesk-taggroup" aria-label="培养方向筛选">
              <div className="schools-datadesk-tagrow">
                {directionOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`schools-datadesk-tag${activeDirection === option ? ' schools-datadesk-tag-active' : ''}`}
                    onClick={() => { setActiveDirection(option); setCurrentPage(1); }}
                  >
                    {option === 'all' ? '全部方向' : option}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="schools-datadesk-panel">
            <div className="schools-datadesk-panel-head">
              <p className="overview-label">快速入口</p>
              <span>高频学校与热门区县</span>
            </div>
            <div className="schools-datadesk-shortcuts">
              {featuredSchools.map((item) => (
                <Link key={item.school.id} className="schools-datadesk-entry" href={`/schools/${item.school.id}`}>
                  <strong>{item.school.name}</strong>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="schools-datadesk-districts">
              {highlightedDistricts.map((district) => (
                <Link key={district.id} className="schools-datadesk-district" href={`/schools/district/${district.id}`}>
                  <strong>{district.name || district.districtName}</strong>
                  <span>{district.schoolCount || 0} 所学校</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="schools-datadesk-panel schools-datadesk-panel-note">
            <div className="schools-datadesk-panel-head">
              <p className="overview-label">数据口径</p>
              <span>数据库说明</span>
            </div>
            <p>当前收录口径以学校索引和公开资料整理为主，首页优先解决“筛到哪一组学校值得继续比较”这个问题。</p>
            <p>学段按初中、高中、完全中学区分；标签用于快速比较，不替代学校官方简章与区级招生细则。</p>
          </section>
        </aside>

        <section className="schools-datadesk-results">
          <div className="schools-datadesk-results-head">
            <div>
              <p className="overview-label">检索结果</p>
              <h2>当前可比较范围</h2>
            </div>
            <p>{activeFilterSummary.length ? activeFilterSummary.join(' · ') : '未添加筛选条件时，默认展示全量结果。'}</p>
          </div>

          <div className="schools-datadesk-metrics">
            <article>
              <strong>{filteredSchools.length}</strong>
              <span>当前结果数</span>
            </article>
            <article>
              <strong>{stageStats.junior}</strong>
              <span>纯初中</span>
            </article>
            <article>
              <strong>{stageStats.senior_high}</strong>
              <span>纯高中</span>
            </article>
            <article>
              <strong>{stageStats.complete}</strong>
              <span>完全中学</span>
            </article>
          </div>

          <div className="schools-datadesk-cardlist">
            {(pagedSchools.length ? pagedSchools : emptyStateSchools).map((school) => {
              const cardTags = buildCardTags(school);
              return (
                <Link key={school.id} href={`/schools/${school.id}`} className="schools-datadesk-card schools-datadesk-card-link">
                  <div className="schools-datadesk-cardhead">
                    <div>
                      <p className="schools-datadesk-cardkicker">{getSchoolDistrictName(school)} / {getSchoolStage(school)} / {getOwnershipLabel(school)}</p>
                      <h3>{school.name}</h3>
                    </div>
                    <div className="schools-datadesk-cardmeta">
                      <span>{getSchoolType(school)}</span>
                      <span>{school.tier || '梯队信息待补充'}</span>
                      <span>更新于 {formatSchoolUpdate(school.updatedAt)}</span>
                    </div>
                  </div>
                  <p className="schools-datadesk-cardsummary">{getSchoolPositioning(school)}</p>
                  <div className="schools-datadesk-cardfooter">
                    <div className="schools-datadesk-cardtags">
                      {cardTags.length ? cardTags.map((tag) => (
                        <span key={tag} className="schools-datadesk-cardtag">{tag}</span>
                      )) : (
                        <span className="schools-datadesk-cardtag schools-datadesk-cardtag-muted">标签待补充</span>
                      )}
                    </div>
                    <span className="schools-datadesk-cardlink">进入学校详情</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="schools-datadesk-pager">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>上一页</button>
            <span>{currentPage} / {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>下一页</button>
          </div>
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 首页数据台</span>
        <span>区域筛选 / 学段筛选 / 标签比较 / {schools.length} 所学校</span>
      </footer>
    </>
  );
}
