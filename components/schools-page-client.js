'use client';

import { useMemo, useState } from 'react';
import {
  filterSchools,
  formatConfidence,
  getLatestNewsByExamType,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolFeatureTags,
  getSchoolFeatures,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolTags,
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
  { value: 'senior_high', label: '高中' }
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

export default function SchoolsPageClient({ districts, schools, news }) {
  const [activeDistrict, setActiveDistrict] = useState('all');
  const [activeStage, setActiveStage] = useState('all');
  const [activeOwnership, setActiveOwnership] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  const [queryInput, setQueryInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchools = useMemo(
    () => filterSchools(schools, {
      district: activeDistrict,
      query: searchQuery,
      stage: activeStage,
      ownership: activeOwnership,
      tag: activeTag
    }),
    [schools, activeDistrict, searchQuery, activeStage, activeOwnership, activeTag]
  );

  const schoolContextNews = useMemo(() => getLatestNewsByExamType(news, 'zhongkao'), [news]);
  const districtName = activeDistrict === 'all'
    ? '全上海'
    : (districts.find((district) => district.id === activeDistrict)?.name || activeDistrict);
  const queryLabel = searchQuery ? `关键词“${searchQuery}”` : '全部关键词';
  const stageLabel = STAGE_OPTIONS.find((item) => item.value === activeStage)?.label || '全部学段';
  const ownershipLabel = OWNERSHIP_OPTIONS.find((item) => item.value === activeOwnership)?.label || '全部办学性质';
  const tagLabel = activeTag === 'all' ? '全部特色' : activeTag;

  const applySearch = (value = queryInput) => {
    setSearchQuery(value.trim());
  };

  const resetFilters = () => {
    setActiveDistrict('all');
    setActiveStage('all');
    setActiveOwnership('all');
    setActiveTag('all');
    setQueryInput('');
    setSearchQuery('');
  };

  return (
    <main className="layout">
      <section className="panel summary-panel">
        <div className="summary-copy">
          <h2>学校检索工作区</h2>
          <p id="result-summary">
            当前范围：{districtName}，学段为 {stageLabel}，办学性质为 {ownershipLabel}，特色筛选为 {tagLabel}，搜索条件为 {queryLabel}。当前匹配 {filteredSchools.length} 所学校，相关政策与考试动态已统一收纳到新闻政策模块，当前共可查看 {news.length} 条新闻。
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
      </section>

      <section className="content-layout">
        <section className="content-main" id="schools">
          <div className="panel main-panel">
            <div className="section-heading">
              <h2>学校列表</h2>
              <p>展示学校区域、介绍、阶段、特色标签、梯队与来源信息。</p>
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
            <div className="filter-group" aria-label="特色筛选" style={{ marginBottom: 18 }}>
              <span className="filter-group-label">特色筛选</span>
              <div className="quick-searches">
                <button
                  className={`quick-chip${activeTag === 'all' ? ' quick-chip-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTag('all')}
                >
                  全部特色
                </button>
                {FEATURE_TAG_OPTIONS.map((chip) => (
                  <button
                    key={chip}
                    className={`quick-chip${activeTag === chip ? ' quick-chip-active' : ''}`}
                    type="button"
                    onClick={() => setActiveTag(chip)}
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
                  onClick={() => {
                    setQueryInput(chip);
                    setSearchQuery(chip);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="school-grid">
              {filteredSchools.length ? filteredSchools.map((school) => (
                <article key={school.id} className="school-card">
                  <div className="school-card-header">
                    <div>
                      <h3>{school.name}</h3>
                      <p>{getSchoolDistrictName(school)}</p>
                    </div>
                    <span className="pill">{getSchoolStage(school)} · {getSchoolType(school)}</span>
                  </div>
                  <p className="school-summary">{getSchoolAdmissionInfo(school)}</p>
                  <div className="school-highlights">
                    {getSchoolFeatureTags(school).length
                      ? getSchoolFeatureTags(school).map((feature) => <span key={feature} className="meta-chip">{feature}</span>)
                      : <span className="meta-chip meta-chip-muted">暂无特色标签</span>}
                  </div>
                  {schoolContextNews ? <p className="school-link-note">关联动态：{schoolContextNews.title}</p> : null}
                  <details className="school-details">
                    <summary>查看详细信息</summary>
                    <dl className="school-meta">
                      <div><dt>梯队</dt><dd>{school.tier ? `${school.tier} 梯队` : '暂无'}</dd></div>
                      <div><dt>办学性质</dt><dd>{getSchoolOwnershipLabel(school)}</dd></div>
                      <div><dt>地址</dt><dd>{school.address || '暂无'}</dd></div>
                      <div><dt>电话</dt><dd>{school.phone || '暂无'}</dd></div>
                      <div><dt>完整特色</dt><dd>{getSchoolFeatures(school).join('、') || '暂无'}</dd></div>
                      <div><dt>标签</dt><dd>{getSchoolTags(school).join('、') || '暂无'}</dd></div>
                      <div><dt>来源</dt><dd>{school.source?.name || '未知'} · 可信度 {formatConfidence(school.source?.confidence)}</dd></div>
                      <div><dt>抓取时间</dt><dd>{school.source?.crawledAt || '暂无'}</dd></div>
                    </dl>
                    {school.website ? <a className="text-link" href={school.website} target="_blank" rel="noreferrer">查看学校网站</a> : null}
                  </details>
                </article>
              )) : <EmptyState />}
            </div>
          </div>
        </section>

        <aside className="content-side">
          <section className="panel side-panel" id="districts">
            <div className="section-heading">
              <h2>区域概览</h2>
              <p>点击区域，快速切换当前学校结果。</p>
            </div>
            <div className="district-grid">
              {districts.map((district) => (
                <button
                  key={district.id}
                  className={`district-card${activeDistrict === district.id ? ' district-card-active' : ''}`}
                  type="button"
                  onClick={() => setActiveDistrict(district.id)}
                >
                  <div className="district-card-header">
                    <h3>{district.name || district.districtName}</h3>
                    <span>{district.schoolCount || district.count || 0} 所学校</span>
                  </div>
                  <p>{district.description || '暂无说明'}</p>
                  <p className="district-meta">点击查看该区域学校列表与学校特色。</p>
                </button>
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
        </aside>
      </section>
    </main>
  );
}
