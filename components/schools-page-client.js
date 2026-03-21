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

export default function SchoolsPageClient({ districts, schools, news }) {
  const [activeDistrict, setActiveDistrict] = useState('all');
  const [queryInput, setQueryInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchools = useMemo(
    () => filterSchools(schools, activeDistrict, searchQuery),
    [schools, activeDistrict, searchQuery]
  );

  const schoolContextNews = useMemo(() => getLatestNewsByExamType(news, 'zhongkao'), [news]);
  const districtName = activeDistrict === 'all'
    ? '全上海'
    : (districts.find((district) => district.id === activeDistrict)?.name || activeDistrict);
  const queryLabel = searchQuery ? `关键词“${searchQuery}”` : '全部关键词';

  const applySearch = (value = queryInput) => {
    setSearchQuery(value.trim());
  };

  const resetFilters = () => {
    setActiveDistrict('all');
    setQueryInput('');
    setSearchQuery('');
  };

  return (
    <main className="layout">
      <section className="panel summary-panel">
        <div className="summary-copy">
          <h2>学校检索工作区</h2>
          <p id="result-summary">
            当前范围：{districtName}，匹配 {filteredSchools.length} 所学校，搜索条件为 {queryLabel}。相关政策与考试动态已统一收纳到新闻政策模块，当前共可查看 {news.length} 条新闻。
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
            <div className="search-actions" style={{ marginBottom: 18 }}>
              <button className="action-button" type="button" onClick={() => applySearch()}>搜索学校</button>
              <button className="action-button action-button-secondary" type="button" onClick={resetFilters}>重置条件</button>
            </div>
            <div className="quick-searches" aria-label="快速搜索" style={{ marginBottom: 24 }}>
              {['市重点', '实验学校', '科技', '国际课程', '双语', '民办', '国际化', '寄宿'].map((chip) => (
                <button
                  key={chip}
                  className="quick-chip"
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
