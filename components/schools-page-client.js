'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { dataQualityBadge, dataQualityScore, getSchoolDataQuality } from '../lib/school-data-quality';
import {
  filterSchools,
  clipText,
  formatSchoolUpdate,
  getUpdateSortValue,
  getSchoolCategoryLabel,
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolSpecializationLabels,
  getSchoolTrainingDirections,
  getSchoolType
} from '../lib/site-utils';

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

function getOwnershipLabel(school) {
  const label = String(school?.schoolPropertyLabel || '').trim();
  return label || '—';
}

function getSchoolPositioning(school) {
  const desc = clipText(school?.description, 84);
  if (desc && desc !== '暂无') {
    return desc;
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
  initialCategory = 'all',
  initialTag = 'all',
  initialDirection = 'all',
  initialQuery = ''
}) {
  const [activeDistrict, setActiveDistrict] = useState(initialDistrict);
  const [activeStage, setActiveStage] = useState(initialStage);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [activeDirection, setActiveDirection] = useState(initialDirection);
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(
    initialCategory !== 'all' || initialTag !== 'all' || initialDirection !== 'all'
  );

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

  const categoryOptions = useMemo(() => {
    const map = new Map();
    for (const school of schools) {
      const tier = String(school?.tier || '').trim();
      if (tier && !map.has(tier)) {
        map.set(tier, { value: tier, label: tier });
      }
    }
    return [{ value: 'all', label: '全部类型' }, ...map.values()];
  }, [schools]);

  const filteredSchools = useMemo(
    () => {
      let result = filterSchools(schools, {
        district: activeDistrict,
        query: searchQuery,
        tag: activeTag,
        direction: activeDirection
      });
      if (activeStage !== 'all') {
        result = result.filter((school) => String(school?.schoolStageLabel || '').trim() === activeStage);
      }
      if (activeCategory !== 'all') {
        result = result.filter((school) => String(school?.tier || '').trim() === activeCategory);
      }
      return result;
    },
    [schools, activeDistrict, searchQuery, activeStage, activeCategory, activeTag, activeDirection]
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
      lines.push(`学段：${stageOptions.find((item) => item.value === activeStage)?.label || activeStage}`);
    }
    if (activeCategory !== 'all') {
      lines.push(`分类：${categoryOptions.find((item) => item.value === activeCategory)?.label || activeCategory}`);
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
  }, [activeDistrict, activeStage, activeTag, activeDirection, searchQuery, districts]);

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
    setActiveCategory('all');
    setActiveTag('all');
    setActiveDirection('all');
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
            <label>学校类型</label>
            <div className="schools-aerial-filter-stack">
              {categoryOptions.slice(1).map((option) => (
                <button key={option.value} type="button" className={activeCategory === option.value ? 'is-active' : ''} onClick={() => { setActiveCategory(activeCategory === option.value ? 'all' : option.value); setCurrentPage(1); }}>
                  {option.label}
                </button>
              ))}
            </div>
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
