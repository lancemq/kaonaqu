'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const SCHOOLS_PER_PAGE = 10;

function getOwnershipLabel(school) {
  const label = String(school?.schoolPropertyLabel || '').trim();
  return label || '—';
}

export default function SchoolsPageClient({
  districts,
  schools,
  initialDistrict = 'all',
  initialStage = 'all',
  initialProperty = 'all',
  initialKeyLevel = 'all',
  initialCohort = 'all',
  initialQuery = ''
}) {
  const [activeDistrict, setActiveDistrict] = useState(initialDistrict);
  const [activeStage, setActiveStage] = useState(initialStage);
  const [activeProperty, setActiveProperty] = useState(initialProperty);
  const [activeKeyLevel, setActiveKeyLevel] = useState(initialKeyLevel);
  const [activeCohort, setActiveCohort] = useState(initialCohort);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);

  const stageOptions = useMemo(() => {
    const map = new Map();
    for (const school of schools) {
      const label = String(school?.schoolStageLabel || '').trim();
      if (label && !map.has(label)) {
        map.set(label, { value: label, label });
      }
    }
    return [{ value: 'all', label: '全部学段' }, ...map.values()];
  }, [schools]);

  const propertyOptions = useMemo(() => {
    const map = new Map();
    for (const school of schools) {
      const label = String(school?.schoolPropertyLabel || '').trim();
      if (label && !map.has(label)) {
        map.set(label, { value: label, label });
      }
    }
    return [{ value: 'all', label: '全部性质' }, ...map.values()];
  }, [schools]);

  const keyLevelOptions = useMemo(() => {
    const map = new Map();
    for (const school of schools) {
      const label = String(school?.schoolKeyLevel || '').trim();
      if (label && !map.has(label)) {
        map.set(label, { value: label, label });
      }
    }
    return [{ value: 'all', label: '全部等级' }, ...map.values()];
  }, [schools]);

  const cohortOptions = useMemo(() => {
    const map = new Map();
    for (const school of schools) {
      const label = String(school?.eliteCohort || '').trim();
      if (label && !map.has(label)) {
        map.set(label, { value: label, label });
      }
    }
    return [{ value: 'all', label: '全部荣誉' }, ...map.values()];
  }, [schools]);

  const filteredSchools = useMemo(
    () => {
      const q = searchQuery.trim().toLowerCase();
      let result = schools.filter((s) => {
        if (activeDistrict !== 'all' && s.districtId !== activeDistrict) return false;
        if (q && !s.searchText.includes(q)) return false;
        return true;
      });
      if (activeStage !== 'all') {
        result = result.filter((s) => String(s?.schoolStageLabel || '').trim() === activeStage);
      }
      if (activeProperty !== 'all') {
        result = result.filter((s) => String(s?.schoolPropertyLabel || '').trim() === activeProperty);
      }
      if (activeKeyLevel !== 'all') {
        result = result.filter((s) => String(s?.schoolKeyLevel || '').trim() === activeKeyLevel);
      }
      if (activeCohort !== 'all') {
        result = result.filter((s) => String(s?.eliteCohort || '').trim() === activeCohort);
      }
      return result;
    },
    [schools, activeDistrict, searchQuery, activeStage, activeProperty, activeKeyLevel, activeCohort]
  );

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
      lines.push(`学段：${stageOptions.find((item) => item.value === activeStage)?.label || activeStage}`);
    }
    if (activeProperty !== 'all') {
      lines.push(`办学性质：${activeProperty}`);
    }
    if (activeKeyLevel !== 'all') {
      lines.push(`等级：${activeKeyLevel}`);
    }
    if (activeCohort !== 'all') {
      lines.push(`荣誉：${activeCohort}`);
    }
    if (searchQuery) {
      lines.push(`关键词：${searchQuery}`);
    }
    return lines;
  }, [activeDistrict, activeStage, activeProperty, activeKeyLevel, activeCohort, searchQuery, districts]);

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

  const activeFilterCount = activeFilterSummary.length;

  const resultDescriptor = activeFilterSummary.length
    ? `${currentDistrictLabel}下匹配 ${filteredSchools.length} 所学校`
    : `数据库收录 ${schools.length} 所学校`;

  const applySearch = () => {
    setSearchQuery(queryInput.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setActiveDistrict('all');
    setActiveStage('all');
    setActiveProperty('all');
    setActiveKeyLevel('all');
    setActiveCohort('all');
    setQueryInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <main className="schools-aerial-page">
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

      <header className="channel-hero" id="top">
        <div className="channel-hero-content">
          <section className="channel-hero-copy" aria-label="学校频道概览">
            <div className="channel-kicker"><span aria-hidden="true"></span><p>SCHOOL DATABASE</p></div>
            <h1>上海学校数据库</h1>
            <p>收录全市 {schools.length.toLocaleString('zh-CN')} 所学校详细信息，按区域、类型精准筛选，全面了解各校特色与升学数据。</p>
            <div className="schools-aerial-searchbar">
              <span aria-hidden="true"></span>
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
                placeholder="搜索学校名称、区域或类型..."
              />
              <button type="button" onClick={applySearch}>检索</button>
            </div>
          </section>

          <aside className="channel-hero-stats" aria-label="学校数据统计">
            <article><strong>{schools.length}</strong><span>收录学校</span></article>
            <article><strong>{districts.length}</strong><span>覆盖区域</span></article>
            <article><strong>{schoolStageTotals.senior_high}</strong><span>高中样本</span></article>
          </aside>
        </div>
      </header>

      <section className="schools-aerial-content">
        <aside className="schools-aerial-sidebar" aria-label="筛选条件">
          <div className="schools-aerial-sidebar-head">
            <div className="channel-kicker"><span aria-hidden="true"></span><p>FILTER</p></div>
            <h2>筛选条件</h2>
          </div>

          <section className="schools-aerial-filter-block">
            <label htmlFor="prototype-district-filter">区域</label>
            <select id="prototype-district-filter" value={activeDistrict} onChange={(event) => { setActiveDistrict(event.target.value); setCurrentPage(1); }}>
              <option value="all">全部区域</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
              ))}
            </select>
          </section>

          <section className="schools-aerial-filter-block">
            <label>学段</label>
            <div className="schools-aerial-filter-stack">
              {stageOptions.slice(1).map((option) => (
                <button key={option.value} type="button" className={activeStage === option.value ? 'is-active' : ''} onClick={() => { setActiveStage(activeStage === option.value ? 'all' : option.value); setCurrentPage(1); }}>
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>办学性质</label>
            <div className="schools-aerial-filter-stack">
              {propertyOptions.slice(1).map((option) => (
                <button key={option.value} type="button" className={activeProperty === option.value ? 'is-active' : ''} onClick={() => { setActiveProperty(activeProperty === option.value ? 'all' : option.value); setCurrentPage(1); }}>
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>等级</label>
            <div className="schools-aerial-filter-stack">
              {keyLevelOptions.slice(1).map((option) => (
                <button key={option.value} type="button" className={activeKeyLevel === option.value ? 'is-active' : ''} onClick={() => { setActiveKeyLevel(activeKeyLevel === option.value ? 'all' : option.value); setCurrentPage(1); }}>
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>荣誉</label>
            <div className="schools-aerial-filter-stack">
              {cohortOptions.slice(1).map((option) => (
                <button key={option.value} type="button" className={activeCohort === option.value ? 'is-active' : ''} onClick={() => { setActiveCohort(activeCohort === option.value ? 'all' : option.value); setCurrentPage(1); }}>
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>快速工具</label>
            <div className="schools-aerial-tool-stack">
              <Link href="/schools/compare"><span>学校对比</span><i>→</i></Link>
              <Link href="/schools/score-match"><span>分数匹配</span><i>→</i></Link>
              <Link href="/news/admission-timeline"><span>政策日历</span><i>→</i></Link>
              <Link href="/schools/groups"><span>教育集团</span><i>→</i></Link>
              <Link href="/schools/district"><span>区域专题</span><i>→</i></Link>
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>热门区域</label>
            <div className="schools-aerial-tool-stack">
              {highlightedDistricts.map((district) => (
                <Link key={district.id} href={`/schools/district/${district.id}`}>
                  <span>{district.name || district.districtName}</span>
                  <i>{district.schoolCount || 0} 所</i>
                </Link>
              ))}
            </div>
          </section>

          <button className="schools-aerial-reset" type="button" onClick={resetFilters}>清空全部条件</button>
        </aside>

        <section className="schools-aerial-results" aria-label="学校检索结果">
          <header className="schools-aerial-results-head">
            <div>
              <span>{filteredSchools.length}</span>
              <h2>所学校</h2>
            </div>
            <p>{activeFilterSummary.length ? activeFilterSummary.join(' · ') : '未筛选，展示全量结果。'}</p>
          </header>

          <div className="schools-aerial-cardlist">
            {pagedSchools.length === 0 ? (
              <div className="schools-aerial-empty">
                <p>没有匹配的学校，请调整筛选条件。</p>
              </div>
            ) : pagedSchools.map((school) => (
              <article key={school.id} className="schools-aerial-card-wrap">
                <Link href={`/schools/${school.id}`} className="schools-aerial-card">
                  <div className="schools-aerial-card-main">
                    <p>{school.districtName} / {school.schoolStageLabel} / {getOwnershipLabel(school)}</p>
                    <h3>{school.name}</h3>
                    <span>{school.positioning || '查看学校画像、招生路径与择校提示。'}</span>
                    <div className="schools-aerial-card-tags">
                      {school.tags.slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
                    </div>
                  </div>
                  <div className="schools-aerial-card-side">
                    <strong>{school.eliteCohort || school.schoolKeyLevel || school.schoolPropertyLabel || '—'}</strong>
                    <b>查看详情 →</b>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="pager">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>上一页</button>
            <span>{currentPage} / {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>下一页</button>
          </div>
        </section>
      </section>

      <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <footer className="channel-footer">
        <div><strong>考哪去</strong><span>SHANGHAI EDUCATION PLATFORM</span></div>
        <nav aria-label="页脚导航"><Link href="/">首页</Link><Link href="/news">新闻</Link><Link href="/schools">学校</Link><Link href="/knowledge">知识</Link></nav>
        <p>© 2026 考哪去</p>
      </footer>
    </main>
  );
}
