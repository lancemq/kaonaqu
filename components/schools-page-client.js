'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import CompareBagCheckbox from './compare-bag-checkbox';
import { dataQualityBadge, dataQualityScore, getSchoolDataQuality } from '../lib/school-data-quality';
import {
  filterSchools,
  clipText,
  formatSchoolUpdate,
  getUpdateSortValue,
  getSchoolAdmissionInfo,
  getSchoolCategory,
  getSchoolCategoryLabel,
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolSpecializationLabels,
  getSchoolTrainingDirections,
  getSchoolType,
  SCHOOL_CATEGORY_LIST
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

const CATEGORY_FILTER_OPTIONS = SCHOOL_CATEGORY_LIST.map((cat) => ({
  value: cat.id,
  label: cat.shortLabel
}));

const SCHOOLS_PER_PAGE = 10;

function resolveFeaturedSchool(schools, keyword, preferredName) {
  return schools.find((entry) => entry.name === preferredName)
    || schools.find((entry) => entry.name === keyword)
    || schools.find((entry) => entry.name.includes(keyword) || keyword.includes(entry.name))
    || null;
}

function getOwnershipLabel(school) {
  const label = String(school?.schoolTypeLabel || '').trim();
  return label || '—';
}

function getSchoolPositioning(school) {
  const admission = clipText(getSchoolAdmissionInfo(school), 84);
  if (admission && admission !== '暂无') {
    return admission;
  }
  const directions = getSchoolTrainingDirections(school);
  if (directions.length) {
    return `培养方向：${directions.slice(0, 2).join('、')}`;
  }
  return '';
}

function buildCardTags(school) {
  const values = [
    getSchoolCategoryLabel(school),
    ...getSchoolSpecializationLabels(school),
    ...(school.tags || []),
    ...(school.features || []),
    ...getSchoolTrainingDirections(school)
  ].filter(Boolean);

  return Array.from(new Set(values)).slice(0, 4);
}

export default function SchoolsPageClient({
  districts,
  schools,
  initialDistrict = 'all',
  initialStage = 'all',
  initialOwnership = 'all',
  initialCategory = 'all',
  initialTag = 'all',
  initialDirection = 'all',
  initialQuery = ''
}) {
  const [activeDistrict, setActiveDistrict] = useState(initialDistrict);
  const [activeStage, setActiveStage] = useState(initialStage);
  const [activeOwnership, setActiveOwnership] = useState(initialOwnership);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [activeDirection, setActiveDirection] = useState(initialDirection);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(
    initialCategory !== 'all' || initialTag !== 'all' || initialDirection !== 'all'
  );

  const filteredSchools = useMemo(
    () => {
      let result = filterSchools(schools, {
        district: activeDistrict,
        query: searchQuery,
        stage: activeStage,
        ownership: activeOwnership,
        tag: activeTag,
        direction: activeDirection
      });
      if (activeCategory !== 'all') {
        result = result.filter((school) => (school.category || getSchoolCategory(school)?.id) === activeCategory);
      }
      return result;
    },
    [schools, activeDistrict, searchQuery, activeStage, activeOwnership, activeCategory, activeTag, activeDirection]
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
    if (activeCategory !== 'all') {
      const cat = SCHOOL_CATEGORY_LIST.find((c) => c.id === activeCategory);
      lines.push(`分类：${cat?.label || activeCategory}`);
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
  const advancedCount = [
    activeCategory !== 'all',
    activeTag !== 'all',
    activeDirection !== 'all'
  ].filter(Boolean).length;

  const resultDescriptor = activeFilterSummary.length
    ? `${currentDistrictLabel}下匹配 ${filteredSchools.length} 所学校`
    : `数据库收录 ${schools.length} 所学校`;

  const emptyStateSchools = featuredSchools.map((item) => item.school);

  const applySearch = () => {
    setSearchQuery(queryInput.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setActiveDistrict('all');
    setActiveStage('all');
    setActiveOwnership('all');
    setActiveCategory('all');
    setActiveTag('all');
    setActiveDirection('all');
    setQueryInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <main className="schools-aerial-page">
      <nav className="schools-aerial-nav" aria-label="顶部导航">
        <Link className="schools-aerial-brand" href="/" aria-label="考哪去首页">
          <strong>考哪去</strong>
          <span>SHANGHAI EDUCATION</span>
        </Link>
        <div className="schools-aerial-nav-links">
          <Link href="/">首页</Link>
          <Link href="/news">新闻</Link>
          <Link className="is-active" href="/schools">学校</Link>
          <Link href="/knowledge">知识</Link>
        </div>
      </nav>

      <header className="schools-aerial-hero" id="top">
        <div className="schools-aerial-hero-content">
          <section className="schools-aerial-hero-copy" aria-label="学校频道概览">
            <div className="schools-aerial-kicker"><span aria-hidden="true"></span><p>SCHOOL DATABASE</p></div>
            <h1>上海学校数据库</h1>
            <p>收录全市 {schools.length.toLocaleString('zh-CN')} 所学校详细信息，按区县、类型精准筛选，全面了解各校特色与升学数据。</p>
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
                placeholder="搜索学校名称、区县或类型..."
              />
              <button type="button" onClick={applySearch}>检索</button>
            </div>
          </section>

          <aside className="schools-aerial-hero-stats" aria-label="学校数据统计">
            <article><strong>{schools.length}</strong><span>收录学校</span></article>
            <article><strong>{districts.length}</strong><span>覆盖区县</span></article>
            <article><strong>{schoolStageTotals.senior_high}</strong><span>高中样本</span></article>
          </aside>
        </div>
      </header>

      <section className="schools-aerial-content">
        <aside className="schools-aerial-sidebar" aria-label="筛选条件">
          <div className="schools-aerial-sidebar-head">
            <div className="schools-aerial-kicker"><span aria-hidden="true"></span><p>FILTER</p></div>
            <h2>筛选条件</h2>
          </div>

          <section className="schools-aerial-filter-block">
            <label htmlFor="prototype-district-filter">区县</label>
            <select id="prototype-district-filter" value={activeDistrict} onChange={(event) => { setActiveDistrict(event.target.value); setCurrentPage(1); }}>
              <option value="all">全部区域</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name || district.districtName}</option>
              ))}
            </select>
          </section>

          <section className="schools-aerial-filter-block">
            <label>学校类型</label>
            <div className="schools-aerial-filter-stack">
              {CATEGORY_FILTER_OPTIONS.slice(0, 5).map((option) => (
                <button key={option.value} type="button" className={activeCategory === option.value ? 'is-active' : ''} onClick={() => { setActiveCategory(activeCategory === option.value ? 'all' : option.value); setCurrentPage(1); }}>
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>学段</label>
            <div className="schools-aerial-filter-stack">
              {STAGE_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={activeStage === option.value ? 'is-active' : ''} onClick={() => { setActiveStage(option.value); setCurrentPage(1); }}>
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="schools-aerial-filter-block">
            <label>学校特征</label>
            <div className="schools-aerial-feature-stack">
              {tagOptions.slice(1, 7).map((option) => (
                <button key={option} type="button" className={activeTag === option ? 'is-active' : ''} onClick={() => { setActiveTag(activeTag === option ? 'all' : option); setCurrentPage(1); }}>
                  {option}
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
            {(pagedSchools.length ? pagedSchools : emptyStateSchools).map((school) => {
              const cardTags = buildCardTags(school);
              const quality = getSchoolDataQuality(school);
              const badge = dataQualityBadge(dataQualityScore(quality));
              return (
                <article key={school.id} className="schools-aerial-card-wrap">
                  <Link href={`/schools/${school.id}`} className="schools-aerial-card">
                    <div className="schools-aerial-card-main">
                      <p>{getSchoolDistrictName(school)} / {getSchoolStage(school)} / {getOwnershipLabel(school)}</p>
                      <h3>{school.name}</h3>
                      <span>{getSchoolPositioning(school) || '查看学校画像、招生路径与择校提示。'}</span>
                      <div className="schools-aerial-card-tags">
                        {cardTags.slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
                        {badge ? <em>{badge.label}</em> : null}
                      </div>
                    </div>
                    <div className="schools-aerial-card-side">
                      <strong>{school.tier || getSchoolType(school) || '—'}</strong>
                      <small>更新于 {formatSchoolUpdate(school.updatedAt)}</small>
                      <b>查看详情 →</b>
                    </div>
                  </Link>
                  <CompareBagCheckbox schoolId={school.id} schoolName={school.name} />
                </article>
              );
            })}
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
