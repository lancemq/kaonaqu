'use client';

import Link from 'next/link';
import Pager from './pager';
import { useCompareBag } from './compare-bag';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

const FILTER_KEYS = ['district', 'stage', 'property', 'keyLevel', 'cohort', 'boarding', 'international', 'query', 'sort'];

const SORT_OPTIONS = [
  { value: 'priority', label: '默认排序' },
  { value: 'level', label: '按等级' },
  { value: 'district', label: '按区域' },
  { value: 'year', label: '按建校年份' },
  { value: 'score', label: '按录取分数线' }
];

function getOwnershipLabel(school) {
  const label = String(school?.schoolPropertyLabel || '').trim();
  return label || '—';
}

function buildHref(base, next) {
  const merged = { ...base, page: 1, ...next };
  const qs = new URLSearchParams();
  for (const key of ['district', 'stage', 'property', 'keyLevel', 'cohort', 'boarding', 'international', 'query']) {
    const v = merged[key];
    if (v && v !== 'all') qs.set(key, v);
  }
  if (merged.sort && merged.sort !== 'priority') qs.set('sort', merged.sort);
  if (Array.isArray(merged.features) && merged.features.length) qs.set('features', merged.features.join(','));
  if (merged.page && Number(merged.page) > 1) qs.set('page', String(merged.page));
  const s = qs.toString();
  return s ? `/schools?${s}` : '/schools';
}

function ScoreLineBadge({ scoreLines }) {
  const lines = Array.isArray(scoreLines) ? scoreLines : [];
  if (!lines.length) return null;
  let best = lines[0];
  for (const line of lines) {
    if (Number(line.year) > Number(best.year)) best = line;
  }
  const scoreText = best.score != null && String(best.score).trim() !== '' ? String(best.score) : null;
  return (
    <div className="schools-aerial-card-score">
      <span className="schools-aerial-card-score-year">{best.year} 年</span>
      {scoreText ? (
        <span className="schools-aerial-card-score-value">录取线 {scoreText}</span>
      ) : (
        <span className="schools-aerial-card-score-note">{best.note || '近年无统一录取线'}</span>
      )}
    </div>
  );
}

export default function SchoolsPageClient({
  districts = [],
  schools = [],
  total = 0,
  totalPages = 1,
  currentPage = 1,
  filters = { district: 'all', stage: 'all', property: 'all', keyLevel: 'all', cohort: 'all', boarding: 'all', international: 'all', features: [], sort: 'priority', query: '' },
  filterOptions = { stage: [], property: [], keyLevel: [], cohort: [], featureFilters: [] },
  stageTotals = { junior: 0, senior_high: 0, complete: 0 }
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [queryInput, setQueryInput] = useState(filters.query || '');

  // 服务端是唯一数据源：URL 变化即重新请求并下发当前页 10 条。
  // queryInput 仅在用户本地输入时变更，提交后由 filters.query 回写。
  useEffect(() => {
    setQueryInput(filters.query || '');
  }, [filters.query]);

  const navigate = (next) => {
    startTransition(() => {
      router.push(buildHref(filters, next));
    });
  };

  const activeDistrict = filters.district;
  const activeStage = filters.stage;
  const activeProperty = filters.property;
  const activeKeyLevel = filters.keyLevel;
  const activeCohort = filters.cohort;
  const activeBoarding = filters.boarding;
  const activeInternational = filters.international;
  const activeSort = filters.sort || 'priority';
  const activeFeatures = Array.isArray(filters.features) ? filters.features : [];
  const searchQuery = filters.query || '';

  // 对比篮：localStorage 持久化，跨组件（列表页 ↔ 对比页）通过事件同步
  const { ids: bagIds, ready: bagReady, has: bagHas, toggle: bagToggle, clear: clearBag, max: bagMax } = useCompareBag();

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
    if (activeStage !== 'all') lines.push(`学段：${activeStage}`);
    if (activeProperty !== 'all') lines.push(`办学性质：${activeProperty}`);
    if (activeKeyLevel !== 'all') lines.push(`等级：${activeKeyLevel}`);
    if (activeCohort !== 'all') lines.push(`荣誉：${activeCohort}`);
    if (activeBoarding === 'boarding') lines.push('寄宿制');
    if (activeBoarding === 'day') lines.push('走读');
    if (activeInternational === 'international') lines.push('国际课程');
    if (activeFeatures.length) {
      const labels = activeFeatures
        .map((fid) => filterOptions.featureFilters.find((f) => f.id === fid)?.label)
        .filter(Boolean);
      if (labels.length) lines.push(`特色：${labels.join('/')}`);
    }
    if (searchQuery) lines.push(`关键词：${searchQuery}`);
    if (activeSort !== 'priority') {
      const opt = SORT_OPTIONS.find((o) => o.value === activeSort);
      if (opt) lines.push(`排序：${opt.label}`);
    }
    return lines;
  }, [activeDistrict, activeStage, activeProperty, activeKeyLevel, activeCohort, activeBoarding, activeInternational, activeFeatures, activeSort, searchQuery, districts, filterOptions.featureFilters]);

  const totalDb = stageTotals.junior + stageTotals.senior_high + stageTotals.complete;
  const currentDistrictLabel = activeDistrict === 'all'
    ? '全市范围'
    : (districts.find((item) => item.id === activeDistrict)?.name || activeDistrict);
  const resultDescriptor = activeFilterSummary.length
    ? `${currentDistrictLabel}下匹配 ${total} 所学校`
    : `数据库收录 ${totalDb} 所学校`;

  const applySearch = () => navigate({ query: queryInput.trim() });
  const toggleFeature = (fid) => {
    const next = activeFeatures.includes(fid)
      ? activeFeatures.filter((id) => id !== fid)
      : [...activeFeatures, fid];
    navigate({ features: next });
  };
  const resetFilters = () => {
    setQueryInput('');
    navigate({ district: 'all', stage: 'all', property: 'all', keyLevel: 'all', cohort: 'all', boarding: 'all', international: 'all', features: [], sort: 'priority', query: '' });
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
            <p>收录全市 {totalDb.toLocaleString('zh-CN')} 所学校详细信息，按区域、类型精准筛选，全面了解各校特色与升学数据。</p>
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
            <article><strong>{totalDb}</strong><span>收录学校</span></article>
            <article><strong>{districts.length}</strong><span>覆盖区域</span></article>
            <article><strong>{stageTotals.senior_high}</strong><span>高中样本</span></article>
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
            <select
              id="prototype-district-filter"
              value={activeDistrict}
              onChange={(event) => navigate({ district: event.target.value })}
            >
              <option value="all">全部区域</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
              ))}
            </select>
          </section>

          <section className="schools-aerial-filter-block">
            <label>学段</label>
            <div className="schools-aerial-filter-stack">
              {filterOptions.stage.map((option) => (
                <button key={option} type="button" className={activeStage === option ? 'is-active' : ''} onClick={() => navigate({ stage: activeStage === option ? 'all' : option })}>
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>办学性质</label>
            <div className="schools-aerial-filter-stack">
              {filterOptions.property.map((option) => (
                <button key={option} type="button" className={activeProperty === option ? 'is-active' : ''} onClick={() => navigate({ property: activeProperty === option ? 'all' : option })}>
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>等级</label>
            <div className="schools-aerial-filter-stack">
              {filterOptions.keyLevel.map((option) => (
                <button key={option} type="button" className={activeKeyLevel === option ? 'is-active' : ''} onClick={() => navigate({ keyLevel: activeKeyLevel === option ? 'all' : option })}>
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>荣誉</label>
            <div className="schools-aerial-filter-stack">
              {filterOptions.cohort.map((option) => (
                <button key={option} type="button" className={activeCohort === option ? 'is-active' : ''} onClick={() => navigate({ cohort: activeCohort === option ? 'all' : option })}>
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>寄宿 / 走读</label>
            <div className="schools-aerial-filter-stack">
              <button type="button" className={activeBoarding === 'boarding' ? 'is-active' : ''} onClick={() => navigate({ boarding: activeBoarding === 'boarding' ? 'all' : 'boarding' })}>寄宿制</button>
              <button type="button" className={activeBoarding === 'day' ? 'is-active' : ''} onClick={() => navigate({ boarding: activeBoarding === 'day' ? 'all' : 'day' })}>走读</button>
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>国际课程</label>
            <div className="schools-aerial-filter-stack">
              <button type="button" className={activeInternational === 'international' ? 'is-active' : ''} onClick={() => navigate({ international: activeInternational === 'international' ? 'all' : 'international' })}>国际课程 / 中外合作</button>
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>特色标签</label>
            <div className="schools-aerial-filter-stack schools-aerial-feature-chips">
              {filterOptions.featureFilters.map((option) => (
                <button key={option.id} type="button" className={activeFeatures.includes(option.id) ? 'is-active' : ''} onClick={() => toggleFeature(option.id)}>
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

          <section className="schools-aerial-filter-block schools-aerial-compare-basket-block">
            <label>对比篮</label>
            <div className="schools-aerial-compare-basket">
              <span>{bagReady ? `${bagIds.length}/${bagMax}` : `0/${bagMax}`} 所</span>
              <Link href="/schools/compare">查看对比 →</Link>
              {bagReady && bagIds.length > 0 && (
                <button type="button" className="schools-aerial-compare-clear" onClick={() => clearBag()}>清空</button>
              )}
            </div>
            <p className="schools-aerial-compare-hint">在右侧卡片点「加入对比」，最多可同时对比 {bagMax} 所。</p>
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

        <section
          className="schools-aerial-results"
          aria-label="学校检索结果"
          aria-busy={isPending}
          style={{ opacity: isPending ? 0.55 : 1, transition: 'opacity 120ms' }}
        >
          <header className="schools-aerial-results-head">
            <div>
              <span>{total}</span>
              <h2>所学校</h2>
            </div>
            <div className="schools-aerial-results-head-right">
              <label htmlFor="prototype-sort-filter" className="schools-aerial-sort-label">排序</label>
              <select
                id="prototype-sort-filter"
                className="schools-aerial-sort"
                value={activeSort}
                onChange={(event) => navigate({ sort: event.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <p>{activeFilterSummary.length ? activeFilterSummary.join(' · ') : '未筛选，展示全量结果。'}</p>
          </header>

          <div className="schools-aerial-cardlist">
            {schools.length === 0 ? (
              <div className="schools-aerial-empty">
                <p>没有匹配的学校，请调整筛选条件。</p>
              </div>
            ) : schools.map((school) => (
              <article key={school.id} className="schools-aerial-card-wrap">
                {bagReady && (
                  <button
                    type="button"
                    className={`schools-aerial-compare-toggle ${bagHas(school.id) ? 'is-added' : ''}`}
                    aria-pressed={bagHas(school.id)}
                    onClick={() => bagToggle(school.id, school.name)}
                  >
                    {bagHas(school.id) ? '✓ 已加入' : '＋ 对比'}
                  </button>
                )}
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
                <ScoreLineBadge scoreLines={school.scoreLines} />
              </article>
            ))}
          </div>

          <Pager
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => navigate({ page })}
          />
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
