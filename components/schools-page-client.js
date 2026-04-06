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

export default function SchoolsPageClient({
  districts,
  schools,
  news,
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
      { keyword: '上海中学', preferredName: '上海中学', eyebrow: '徐汇区 / 高中 / 上海中学' },
      { keyword: '华东师范大学第二附属中学', preferredName: '华东师范大学第二附属中学', eyebrow: '浦东新区 / 高中 / 华东师大二附中' },
      { keyword: '复旦大学附属中学', eyebrow: '杨浦区 / 高中 / 复旦附中' },
      { keyword: '上外附属双语学校', preferredName: '上海外国语大学附属双语学校', eyebrow: '全部学段 / 完全中学 / 上外附属双语学校' }
    ];

    return picks
      .map((item) => {
        const school = resolveFeaturedSchool(schools, item.keyword, item.preferredName);
        return school ? { ...item, school } : null;
      })
      .filter(Boolean);
  }, [schools]);

  const highlightedDistricts = useMemo(
    () => districts.slice().sort((left, right) => Number(right.schoolCount || 0) - Number(left.schoolCount || 0)).slice(0, 4),
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
        <section className="search-panel news-channel-hero schools-channel-hero" aria-label="学校检索首页">
          <div className="news-channel-hero-grid schools-channel-hero-grid">
            <div className="news-channel-hero-main schools-channel-hero-main">
              <p className="overview-label">SCHOOL INDEX</p>
              <h1>上海学校数据库检索页</h1>
              <p className="news-channel-subtitle schools-channel-subtitle">基于学段、区域、办学性质与学校特点标签，快速缩小上海学校搜索范围。</p>
              <p>现在不仅能按区域和学段筛，还能继续叠加示范性高中、寄宿、外语特色、九年一贯、双语、百年名校等学校特点标签。</p>
              <div className="schools-prototype-search-row">
                <label className="search-field search-field-main schools-prototype-search" htmlFor="prototype-school-search">
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
                    placeholder="搜索学校、区域或关键词"
                  />
                </label>
                <button className="schools-prototype-button" type="button" onClick={applySearch}>搜索学校</button>
              </div>
            </div>
            <aside className="news-channel-hero-side schools-channel-hero-side">
              <article className="news-channel-focus-card schools-channel-focus-card">
                <p className="overview-label">先定范围</p>
                <h2>区域、学段和办学性质，通常是第一轮筛选最有效的 3 个条件。</h2>
              </article>
              <article className="news-channel-focus-card schools-channel-focus-card schools-channel-focus-card-metrics">
                <p className="overview-label">当前收录</p>
                <div className="schools-prototype-hero-stats">
                  <article><strong>{schools.length}</strong><span>学校信息</span></article>
                  <article><strong>{districts.length}</strong><span>覆盖区域</span></article>
                  <article><strong>{news.length}</strong><span>相关动态</span></article>
                </div>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="news-channel-status-bar schools-channel-status-bar">
        <span className="news-channel-status-label">学校库状态</span>
        <span>学校总量 {schools.length} · 覆盖区域 {districts.length} · 关联动态 {news.length}</span>
      </section>

      <main className="layout schools-prototype-layout">
        <section className="schools-prototype-body">
          <aside className="schools-prototype-filters">
            <section className="schools-prototype-filter-card schools-prototype-filter-card-dark">
              <p className="overview-label">筛选逻辑</p>
              <p>先定区域与学段。</p>
              <p>再看办学性质与学校特点。</p>
              <p>最后结合学校详情判断是否匹配。</p>
            </section>

            <section className="schools-prototype-filter-card">
              <p className="overview-label">当前筛选</p>
              {activeFilterSummary.length ? activeFilterSummary.map((line) => (
                <p key={line}>{line}</p>
              )) : (
                <p>当前未限定具体条件，可先从区域和学段开始缩小范围。</p>
              )}
            </section>

            <section className="schools-prototype-filter-card">
              <p className="overview-label">使用学校库前先决定什么</p>
              <p>如果目标还不明确，先看区域和学段。</p>
              <p>如果已经有目标学校，直接搜索学校名更快。</p>
              <p>如果要横向比较，再叠加特色和培养方向。</p>
            </section>

            <section className="schools-prototype-filter-card schools-prototype-filter-card-dark">
              <p className="overview-label">热门筛选组合</p>
              <button type="button" className="schools-prototype-filter-link" onClick={() => { setActiveDistrict('xuhui'); setActiveStage('senior_high'); setSearchQuery('上海中学'); setCurrentPage(1); }}>• 徐汇区 + 高中 + 上海中学</button>
              <button type="button" className="schools-prototype-filter-link" onClick={() => { setActiveDistrict('pudong'); setActiveStage('senior_high'); setSearchQuery('华东师范大学第二附属中学'); setCurrentPage(1); }}>• 浦东新区 + 高中 + 华东师大二附中</button>
              <button type="button" className="schools-prototype-filter-link" onClick={() => { setActiveDistrict('yangpu'); setActiveStage('senior_high'); setSearchQuery('复旦大学附属中学'); setCurrentPage(1); }}>• 杨浦区 + 高中 + 复旦附中</button>
            </section>

            <section className="schools-prototype-filter-card">
              <p className="overview-label">重点学校入口</p>
              {featuredSchools.map((item) => (
                <Link key={item.school.id} className="schools-prototype-filter-entry" href={`/schools/${item.school.id}`}>
                  <strong>{item.school.name}</strong>
                  <span>{item.eyebrow}</span>
                </Link>
              ))}
            </section>

            <section className="schools-prototype-filter-card schools-prototype-filter-card-note">
              <p className="overview-label">数据口径提醒</p>
              <p>当前把学校分成纯初中、纯高中和完全中学三类整理，并把相关政策动态统一连接到新闻政策模块。</p>
            </section>

            <section className="schools-prototype-filter-card">
              <p className="overview-label">热门区域专题</p>
              {highlightedDistricts.map((district) => (
                <Link key={district.id} className="schools-prototype-filter-entry" href={`/schools/district/${district.id}`}>
                  <strong>{district.name || district.districtName}</strong>
                  <span>{district.schoolCount || 0} 所学校</span>
                </Link>
              ))}
            </section>
          </aside>

          <section className="schools-prototype-results">
            <div className="schools-prototype-results-head">
              <div>
                <p className="overview-label">检索结果</p>
                <h2>筛选结果</h2>
              </div>
              <p>当前匹配 {filteredSchools.length} 所学校</p>
            </div>

            <div className="schools-prototype-stats">
              <article><strong>{filteredSchools.length}</strong><span>学校总量</span></article>
              <article><strong>{districts.length}</strong><span>覆盖区域</span></article>
              <article><strong>{stageStats.junior}</strong><span>纯初中</span></article>
              <article><strong>{stageStats.senior_high} / {stageStats.complete}</strong><span>纯高中 / 完全中学</span></article>
            </div>

            <div className="schools-prototype-controls">
              <label className="search-field search-field-select" htmlFor="prototype-district-filter">
                <span className="visually-hidden">按区域筛选</span>
                <select id="prototype-district-filter" value={activeDistrict} onChange={(event) => { setActiveDistrict(event.target.value); setCurrentPage(1); }}>
                  <option value="all">全部区域</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
                  ))}
                </select>
              </label>
              <label className="search-field search-field-select" htmlFor="prototype-stage-filter">
                <span className="visually-hidden">按学段筛选</span>
                <select id="prototype-stage-filter" value={activeStage} onChange={(event) => { setActiveStage(event.target.value); setCurrentPage(1); }}>
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="search-field search-field-select" htmlFor="prototype-ownership-filter">
                <span className="visually-hidden">按办学性质筛选</span>
                <select id="prototype-ownership-filter" value={activeOwnership} onChange={(event) => { setActiveOwnership(event.target.value); setCurrentPage(1); }}>
                  {OWNERSHIP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <button className="schools-prototype-button schools-prototype-button-secondary" type="button" onClick={resetFilters}>重置筛选</button>
            </div>

            <div className="schools-prototype-tag-groups">
              <section className="schools-prototype-tag-group" aria-label="学校特色筛选">
                <p className="overview-label">特色筛选</p>
                <div className="schools-prototype-tag-row">
                  {tagOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`schools-prototype-tag${activeTag === option ? ' schools-prototype-tag-active' : ''}`}
                      onClick={() => { setActiveTag(option); setCurrentPage(1); }}
                    >
                      {option === 'all' ? '全部特色' : option}
                    </button>
                  ))}
                </div>
              </section>

              <section className="schools-prototype-tag-group" aria-label="培养方向筛选">
                <p className="overview-label">培养方向</p>
                <div className="schools-prototype-tag-row">
                  {directionOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`schools-prototype-tag${activeDirection === option ? ' schools-prototype-tag-active' : ''}`}
                      onClick={() => { setActiveDirection(option); setCurrentPage(1); }}
                    >
                      {option === 'all' ? '全部方向' : option}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="schools-prototype-card-list">
              {(pagedSchools.length ? pagedSchools : featuredSchools.map((item) => item.school)).map((school, index) => {
                const eyebrow = featuredSchools.find((item) => item.school.id === school.id)?.eyebrow
                  || `${getSchoolDistrictName(school)} / ${getSchoolStage(school)} / ${school.name}`;
                const directions = getSchoolTrainingDirections(school).slice(0, 2);
                return (
                  <Link
                    key={school.id}
                    href={`/schools/${school.id}`}
                    className={`schools-prototype-school-card schools-prototype-school-card-link${index === 1 ? ' schools-prototype-school-card-dark' : ''}`}
                  >
                    <p className="schools-prototype-school-kicker">{eyebrow}</p>
                    <h3>{school.name}</h3>
                    <p>{getSchoolAdmissionInfo(school) || `${school.name}已收录到当前学校信息页，可查看学校详情信息。`}</p>
                    <div className="schools-prototype-school-meta">
                      <span>{getSchoolType(school)}</span>
                      <span>{getSchoolStage(school)}</span>
                    </div>
                    {directions.length ? (
                      <div className="schools-prototype-school-tags">
                        {directions.map((direction) => (
                          <span key={direction} className="schools-prototype-school-tag">{direction}</span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>

            <div className="schools-prototype-pager">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>上一页</button>
              <span>{currentPage} / {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>下一页</button>
            </div>
          </section>
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 学校信息汇总搜索页</span>
        <span>学校检索 / 标签筛选 / {schools.length} 所学校 / {districts.length} 区</span>
      </footer>
    </>
  );
}
