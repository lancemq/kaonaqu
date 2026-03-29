'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  buildSchoolSystems,
  filterSchools,
  getLatestNewsByExamType,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolDisplayTags,
  getSchoolFeatures,
  getSchoolHighlights,
  getSchoolOwnershipLabel,
  getDistrictSchoolTopic,
  getSchoolRelationMeta,
  getSchoolStage,
  getSchoolTags,
  getSchoolTrainingDirections,
  getSchoolType
} from '../lib/site-utils';

function EmptyState() {
  return (
    <div className="empty-state">
      <h3>暂无数据</h3>
      <p>当前条件下没有匹配结果。</p>
    </div>
  );
}

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

const FEATURE_TAG_OPTIONS = [
  '示范性高中',
  '外语特色',
  '双语',
  '国际化',
  '寄宿',
  '九年一贯',
  '集团校',
  '百年名校'
];

const TRAINING_DIRECTION_OPTIONS = [
  '科创竞赛',
  '人文综合',
  '国际课程',
  '寄宿管理',
  '贯通培养',
  '外语特色'
];

function getStageMeta(stage) {
  if (stage === 'junior') {
    return { label: '纯初中', className: 'stage-badge stage-badge-junior' };
  }
  if (stage === 'complete') {
    return { label: '完全中学', className: 'stage-badge stage-badge-complete' };
  }
  return { label: '纯高中', className: 'stage-badge stage-badge-senior' };
}

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
  openDays = [],
  initialDistrict = 'all',
  initialStage = 'all',
  initialQuery = '',
  initialDirection = 'all'
}) {
  const router = useRouter();
  const [activeDistrict, setActiveDistrict] = useState(initialDistrict);
  const [activeStage, setActiveStage] = useState(initialStage);
  const [activeOwnership, setActiveOwnership] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  const [activeDirection, setActiveDirection] = useState(initialDirection);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [compareIds, setCompareIds] = useState([]);

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

  const schoolContextNews = useMemo(() => getLatestNewsByExamType(news, 'zhongkao'), [news]);
  const featuredSchools = useMemo(() => {
    const picks = [
      { keyword: '上海中学', preferredName: '上海中学', eyebrow: '徐汇头部学校', blurb: '拔尖创新、竞赛课程和连续培养关注度高。' },
      { keyword: '华东师范大学第二附属中学', preferredName: '华东师范大学第二附属中学', eyebrow: '华二体系', blurb: '科技创新与竞赛培养辨识度很强。' },
      { keyword: '复旦大学附属中学', eyebrow: '复附专题', blurb: '寄宿、人文科技并重，大学附属资源明显。' },
      { keyword: '上海交通大学附属中学', preferredName: '上海交通大学附属中学', eyebrow: '交附专题', blurb: '工程科技特色鲜明，附中体系关注度高。' },
      { keyword: '上海市建平中学', eyebrow: '浦东重点', blurb: '浦东传统强校，课程选择和国际理解教育较强。' },
      { keyword: '上海市七宝中学', eyebrow: '闵行重点', blurb: '科创与人文并重，区域影响力稳定。' }
    ];

    return picks
      .map((item) => {
        const school = resolveFeaturedSchool(schools, item.keyword, item.preferredName);
        if (!school) {
          return null;
        }
        return { ...item, school };
      })
      .filter(Boolean);
  }, [schools]);
  const featuredSchoolBriefs = useMemo(
    () => featuredSchools.map(({ eyebrow, blurb, school }) => ({
      id: school.id,
      title: school.name,
      eyebrow,
      blurb,
      district: school.districtName,
      stage: getSchoolStage(school),
      type: getSchoolType(school),
      phone: school.phone || '',
      website: school.website || '',
      summary: getSchoolAdmissionInfo(school),
      features: getSchoolFeatures(school).slice(0, 3)
    })),
    [featuredSchools]
  );
  const schoolSystems = useMemo(() => buildSchoolSystems(schools), [schools]);
  const filteredStageStats = useMemo(() => {
    const counts = { junior: 0, senior_high: 0, complete: 0 };
    for (const school of filteredSchools) {
      counts[school.schoolStage] = (counts[school.schoolStage] || 0) + 1;
    }
    return counts;
  }, [filteredSchools]);
  const districtName = activeDistrict === 'all'
    ? '全上海'
    : (districts.find((district) => district.id === activeDistrict)?.name || activeDistrict);
  const queryLabel = searchQuery ? `关键词“${searchQuery}”` : '全部关键词';
  const stageLabel = STAGE_OPTIONS.find((item) => item.value === activeStage)?.label || '全部学段';
  const ownershipLabel = OWNERSHIP_OPTIONS.find((item) => item.value === activeOwnership)?.label || '全部办学性质';
  const tagLabel = activeTag === 'all' ? '全部特色' : activeTag;
  const directionLabel = activeDirection === 'all' ? '全部培养方向' : activeDirection;
  const compareSchools = useMemo(
    () => compareIds.map((id) => schools.find((item) => item.id === id)).filter(Boolean),
    [compareIds, schools]
  );
  const compareHref = compareSchools.length
    ? `/schools/compare?ids=${encodeURIComponent(compareSchools.map((item) => item.id).join(','))}`
    : '/schools/compare';

  const applySearch = (value = queryInput) => {
    setSearchQuery(value.trim());
  };

  const applyFocusedFilters = ({
    district = 'all',
    stage = 'all',
    ownership = 'all',
    tag = 'all',
    direction = 'all',
    query = ''
  } = {}) => {
    setActiveDistrict(district);
    setActiveStage(stage);
    setActiveOwnership(ownership);
    setActiveTag(tag);
    setActiveDirection(direction);
    setQueryInput(query);
    setSearchQuery(query);
  };

  const resetFilters = () => {
    applyFocusedFilters();
  };

  const toggleCompare = (schoolId) => {
    setCompareIds((current) => {
      if (current.includes(schoolId)) {
        return current.filter((item) => item !== schoolId);
      }
      if (current.length >= 4) {
        return [...current.slice(1), schoolId];
      }
      return [...current, schoolId];
    });
  };

  return (
    <main className="layout">
      <section className="panel summary-panel">
        <div className="summary-copy">
          <h2>学校检索工作区</h2>
          <p id="result-summary">
            当前范围：{districtName}，学段为 {stageLabel}，办学性质为 {ownershipLabel}，特色筛选为 {tagLabel}，培养方向为 {directionLabel}，搜索条件为 {queryLabel}。当前匹配 {filteredSchools.length} 所学校，相关政策与考试动态已统一收纳到新闻政策模块，当前共可查看 {news.length} 条新闻。
          </p>
        </div>
        <div className="stats-bar" aria-label="结果统计">
          <div>
            <strong>{filteredSchools.length}</strong>
            <span>所学校</span>
          </div>
          <div>
            <strong>{districts.length}</strong>
            <span>个区域</span>
          </div>
        </div>
        <div className="stage-stat-grid" aria-label="学段统计">
          {[
            { key: 'junior', title: '纯初中', description: '仅覆盖初中学段', value: filteredStageStats.junior },
            { key: 'senior_high', title: '纯高中', description: '仅覆盖高中学段', value: filteredStageStats.senior_high },
            { key: 'complete', title: '完全中学', description: '同时覆盖初中与高中', value: filteredStageStats.complete }
          ].map((item) => (
            <article key={item.key} className={`stage-stat-card stage-stat-card-${item.key}`}>
              <span className="stage-stat-label">{item.title}</span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <div className="stage-entry-row" aria-label="学段专题入口">
          {[
            { key: 'junior', title: '查纯初中', text: '适合小升初、初中择校和九年级前规划。' },
            { key: 'senior_high', title: '查纯高中', text: '聚焦示范性高中、区重点和特色高中。' },
            { key: 'complete', title: '查完全中学', text: '查看同时覆盖初高中的连续培养学校。' }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`stage-entry-card${activeStage === item.key ? ' stage-entry-card-active' : ''}`}
              onClick={() => applyFocusedFilters({ stage: item.key })}
            >
              <span>{item.title}</span>
              <p>{item.text}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="content-layout">
        <section className="content-main" id="schools">
          <div className="panel main-panel">
            <div className="section-heading">
              <h2>学校列表</h2>
              <p>展示学校区域、介绍、阶段、标签、学校特色和梯队信息。</p>
            </div>
            <div className="search-shell" style={{ marginBottom: 20 }}>
              <label className="search-field search-field-main" htmlFor="search-input">
                <span className="visually-hidden">搜索学校、区域或关键词</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"></path>
                </svg>
                <input
                  id="search-input"
                  type="search"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      applySearch(event.currentTarget.value);
                    }
                  }}
                  placeholder="搜索学校、区域、招生特色，例如：徐汇区、复旦、科技创新"
                />
              </label>
              <label className="search-field search-field-select" htmlFor="district-filter">
                <span className="visually-hidden">按区域筛选</span>
                <select id="district-filter" value={activeDistrict} onChange={(event) => setActiveDistrict(event.target.value)} aria-label="按区域筛选">
                  <option value="all">全部区域</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="search-shell search-shell-advanced" style={{ marginBottom: 18 }}>
              <label className="search-field search-field-select" htmlFor="stage-filter">
                <span className="visually-hidden">按学段筛选</span>
                <select id="stage-filter" value={activeStage} onChange={(event) => setActiveStage(event.target.value)} aria-label="按学段筛选">
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="search-field search-field-select" htmlFor="ownership-filter">
                <span className="visually-hidden">按办学性质筛选</span>
                <select id="ownership-filter" value={activeOwnership} onChange={(event) => setActiveOwnership(event.target.value)} aria-label="按办学性质筛选">
                  {OWNERSHIP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="search-actions" style={{ marginBottom: 18 }}>
              <button className="action-button" type="button" onClick={() => applySearch()}>搜索学校</button>
              <button className="action-button action-button-secondary" type="button" onClick={resetFilters}>重置条件</button>
            </div>
            {featuredSchools.length ? (
              <section className="featured-school-launcher" aria-label="重点学校快捷入口">
                <div className="section-heading" style={{ marginBottom: 14 }}>
                  <h2>重点学校快捷入口</h2>
                  <p>这里不是学校列表结果，而是 6 所高关注学校的专题入口。点击后会自动带入区域、学段和学校名称筛选。</p>
                </div>
                <div className="featured-school-strip">
                {featuredSchools.map(({ keyword, eyebrow, blurb, school }) => (
                  <button
                    key={school.id}
                    type="button"
                    className="featured-school-chip"
                    onClick={() => applyFocusedFilters({
                      district: school.districtId || 'all',
                      stage: school.schoolStage || 'all',
                      query: keyword
                    })}
                  >
                    <p className="featured-school-eyebrow">{eyebrow}</p>
                    <h3>{school.name}</h3>
                    <p>{blurb}</p>
                    <div className="featured-school-meta">
                      <span>{school.districtName}</span>
                      <span>{getSchoolStage(school)}</span>
                      <span>点击进入专题筛选</span>
                    </div>
                  </button>
                ))}
                </div>
              </section>
            ) : null}
            <div className="filter-group" aria-label="特色筛选" style={{ marginBottom: 18 }}>
              <span className="filter-group-label">特色筛选</span>
              <div className="quick-searches">
                <button
                  className={`quick-chip${activeTag === 'all' && !searchQuery ? ' quick-chip-active' : ''}`}
                  type="button"
                  onClick={() => {
                    setActiveTag('all');
                  }}
                >
                  全部特色
                </button>
                {FEATURE_TAG_OPTIONS.map((chip) => (
                  <button
                    key={chip}
                    className={`quick-chip${activeTag === chip ? ' quick-chip-active' : ''}`}
                    type="button"
                    onClick={() => {
                      setActiveTag(chip);
                      setQueryInput('');
                      setSearchQuery('');
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <div className="quick-searches" aria-label="快速搜索" style={{ marginBottom: 24 }}>
              {['市重点', '实验学校', '科技', '国际课程', '双语', '民办', '国际化', '寄宿'].map((chip) => (
                <button
                  key={chip}
                  className={`quick-chip${searchQuery === chip ? ' quick-chip-active' : ''}`}
                  type="button"
                  onClick={() => applyFocusedFilters({
                    district: activeDistrict,
                    stage: activeStage,
                    ownership: activeOwnership,
                    query: chip
                  })}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="filter-group" aria-label="培养方向筛选" style={{ marginBottom: 24 }}>
              <span className="filter-group-label">培养方向</span>
              <div className="quick-searches">
                <button
                  className={`quick-chip${activeDirection === 'all' ? ' quick-chip-active' : ''}`}
                  type="button"
                  onClick={() => setActiveDirection('all')}
                >
                  全部方向
                </button>
                {TRAINING_DIRECTION_OPTIONS.map((item) => (
                  <button
                    key={item}
                    className={`quick-chip${activeDirection === item ? ' quick-chip-active' : ''}`}
                    type="button"
                    onClick={() => setActiveDirection(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            {compareSchools.length ? (
              <section className="compare-bar" aria-label="学校对比篮子">
                <div>
                  <p className="compare-bar-label">已选学校对比</p>
                  <div className="compare-pill-row">
                    {compareSchools.map((school) => (
                      <button key={school.id} type="button" className="compare-pill" onClick={() => toggleCompare(school.id)}>
                        <span>{school.name}</span>
                        <span>移除</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="compare-bar-actions">
                  <Link className="action-button" href={compareHref}>进入学校对比</Link>
                  <button type="button" className="action-button action-button-secondary" onClick={() => setCompareIds([])}>清空对比</button>
                </div>
              </section>
            ) : null}
            <div className="school-grid">
              {filteredSchools.length ? filteredSchools.map((school) => (
                <article
                  key={school.id}
                  className="school-card school-card-clickable"
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/schools/${school.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/schools/${school.id}`);
                    }
                  }}
                >
                  <div className="school-card-header">
                    <div>
                      <h3>{school.name}</h3>
                      <p>{getSchoolDistrictName(school)}</p>
                    </div>
                    <div className="school-card-badges">
                      <span className={getStageMeta(school.schoolStage).className}>{getStageMeta(school.schoolStage).label}</span>
                      <span className="pill school-type-pill">{getSchoolType(school)}</span>
                    </div>
                  </div>
                  <p className="school-summary">{getSchoolAdmissionInfo(school)}</p>
                  <div className="school-highlights">
                    {getSchoolDisplayTags(school).length
                      ? getSchoolDisplayTags(school).map((tag) => <span key={tag} className="meta-chip">{tag}</span>)
                      : <span className="meta-chip meta-chip-muted">暂无标签</span>}
                  </div>
                  <div className="school-direction-row">
                    {getSchoolTrainingDirections(school).length
                      ? getSchoolTrainingDirections(school).map((direction) => <span key={direction} className="direction-chip">{direction}</span>)
                      : <span className="direction-chip direction-chip-muted">方向待补充</span>}
                  </div>
                  {getSchoolHighlights(school).length ? (
                    <p className="school-link-note">{getSchoolHighlights(school)[0]}</p>
                  ) : null}
                  {schoolContextNews ? <p className="school-link-note">关联动态：{schoolContextNews.title}</p> : null}
                  <div className="school-card-footer">
                    <span className="school-card-footnote">
                      {school.tier ? `${school.tier} 梯队` : getSchoolOwnershipLabel(school)}
                    </span>
                    <div className="school-card-actions-inline">
                      <button
                        type="button"
                        className={`compare-inline-button${compareIds.includes(school.id) ? ' compare-inline-button-active' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleCompare(school.id);
                        }}
                      >
                        {compareIds.includes(school.id) ? '已加入对比' : '加入对比'}
                      </button>
                      <span className="school-card-enter">点击查看学校详情</span>
                    </div>
                  </div>
                </article>
              )) : <EmptyState />}
            </div>
          </div>
        </section>

        <aside className="content-side">
          <section className="panel side-panel" id="districts">
            <div className="section-heading">
              <h2>区域概览</h2>
              <p>可以直接切换当前结果，也可以进入区级专题页连续阅读。</p>
            </div>
            <div className="district-grid">
              {districts.map((district) => (
                <article key={district.id} className={`district-card${activeDistrict === district.id ? ' district-card-active' : ''}`}>
                  <div className="district-card-header">
                    <h3>{district.name || district.districtName}</h3>
                    <span>{district.schoolCount || district.count || 0} 所学校</span>
                  </div>
                  <p>{district.description || '暂无说明'}</p>
                  <p className="district-meta">{getDistrictSchoolTopic(district)}</p>
                  <div className="district-card-actions">
                    <button type="button" className="text-link-button" onClick={() => applyFocusedFilters({ district: district.id })}>查看当前列表</button>
                    <Link className="text-link" href={`/schools/district/${district.id}`}>进入区级专题</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel side-panel" id="news-policy-link">
            <div className="section-heading">
              <h2>新闻政策</h2>
              <p>学校页不再展示政策内容，相关政策、头条和考试新闻统一在新闻政策页面查看。</p>
            </div>
            <a className="module-link" href="/news">查看新闻政策</a>
          </section>

          <section className="panel side-panel" id="school-open-days">
            <div className="section-heading">
              <h2>招简与开放日</h2>
              <p>整理最近可查的学校招生简章、校园开放日和咨询入口，便于择校时快速对照。</p>
            </div>
            <div className="open-day-list">
              {openDays.length ? openDays.map((item) => (
                <article key={item.id} className="open-day-card">
                  <div className="open-day-meta">
                    <span className="pill">{item.tag}</span>
                    <span>{item.window}</span>
                  </div>
                  <h3>{item.schoolName}</h3>
                  <p className="open-day-district">{item.district}</p>
                  <p>{item.summary}</p>
                  <p className="open-day-note">{item.detail}</p>
                  <a className="text-link" href={item.href} target="_blank" rel="noreferrer">查看原页</a>
                </article>
              )) : <EmptyState />}
            </div>
          </section>

          <section className="panel side-panel" id="featured-school-briefs">
            <div className="section-heading">
              <h2>名校招简与咨询</h2>
              <p>把头部学校当前可查的官网、电话和招生线索集中放在一起，便于进一步跟进。</p>
            </div>
            <div className="featured-school-brief-list">
              {featuredSchoolBriefs.length ? featuredSchoolBriefs.map((item) => (
                <article key={item.id} className="featured-school-brief-card">
                  <div className="open-day-meta">
                    <span className="pill">{item.eyebrow}</span>
                    <span>{item.district} · {item.stage}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.blurb}</p>
                  <p className="open-day-note">{item.summary}</p>
                  <div className="featured-school-brief-tags">
                    {item.features.length
                      ? item.features.map((feature) => <span key={feature} className="meta-chip">{feature}</span>)
                      : <span className="meta-chip meta-chip-muted">{item.type}</span>}
                  </div>
                  <div className="featured-school-brief-links">
                    {item.phone ? <span className="featured-school-brief-contact">咨询电话：{item.phone}</span> : null}
                    {item.website ? <a className="text-link" href={item.website} target="_blank" rel="noreferrer">查看官网</a> : null}
                  </div>
                </article>
              )) : <EmptyState />}
            </div>
          </section>

          <section className="panel side-panel" id="school-systems">
            <div className="section-heading">
              <h2>学校体系导览</h2>
              <p>把主校、分校和校区放在同一组里看，避免把不同学校体系混在一起判断。</p>
            </div>
            <div className="school-system-list">
              {schoolSystems.length ? schoolSystems.map((group) => (
                <article key={group.id} className="school-system-card">
                  <h3>{group.name}</h3>
                  <p>{group.description}</p>
                  <div className="school-system-summary">
                    <span>{group.schools.length} 所学校</span>
                    <span>{group.schools.filter((school) => school.website).length} 个官网入口</span>
                    <span>{group.schools.filter((school) => school.phone).length} 个咨询电话</span>
                  </div>
                  <div className="school-system-entries">
                    {group.schools.map((school) => (
                      <button
                        key={school.id}
                        type="button"
                        className="school-system-entry"
                        onClick={() => applyFocusedFilters({
                          district: school.districtId || 'all',
                          stage: school.schoolStage || 'all',
                          query: school.name
                        })}
                      >
                          <div className="school-system-entry-head">
                            <strong>{school.name}</strong>
                            <span className={getSchoolRelationMeta(school).className}>{getSchoolRelationMeta(school).label}</span>
                          </div>
                          <span>{school.districtName} · {getSchoolStage(school)} · {getSchoolType(school)}</span>
                          <span>{getSchoolFeatures(school).slice(0, 2).join(' / ') || getSchoolAdmissionInfo(school)}</span>
                          <div className="school-system-entry-links">
                            {school.phone ? <span className="school-system-contact">咨询：{school.phone}</span> : null}
                            {school.website ? (
                              <a
                                className="text-link"
                                href={school.website}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                              >
                                查看官网
                              </a>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                </article>
              )) : <EmptyState />}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
