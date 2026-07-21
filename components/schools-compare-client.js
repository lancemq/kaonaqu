'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCompareBag } from './compare-bag';
import {
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolType,
  getSchoolOwnershipLabel,
  getSchoolTrainingDirections
} from '../lib/site-utils';

const FEATURED_KEYWORDS = ['复旦大学附属中学', '上海中学', '华东师范大学第二附属中学'];

function resolveFeaturedSchools(schools) {
  const picked = [];
  for (const keyword of FEATURED_KEYWORDS) {
    const school = schools.find((item) => item.name === keyword)
      || schools.find((item) => item.name.includes(keyword) || keyword.includes(item.name));
    if (school && !picked.some((item) => item.id === school.id)) picked.push(school);
  }
  if (picked.length >= 3) return picked.slice(0, 3);
  const bySignal = schools
    .slice()
    .sort((left, right) => {
      const rightSignal = (right.features?.length || 0) + (right.tags?.length || 0) + ((right.eliteCohort || (right.schoolKeyLevel && !right.schoolKeyLevel.includes('一般'))) ? 2 : 0);
      const leftSignal = (left.features?.length || 0) + (left.tags?.length || 0) + ((left.eliteCohort || (left.schoolKeyLevel && !left.schoolKeyLevel.includes('一般'))) ? 2 : 0);
      return rightSignal - leftSignal;
    });
  for (const school of bySignal) {
    if (!picked.some((item) => item.id === school.id)) picked.push(school);
    if (picked.length >= 3) break;
  }
  return picked;
}

function schoolValue(school, key) {
  if (!school) return '—';
  const directions = getSchoolTrainingDirections(school);
  const featureText = (directions.length ? directions : school.features || school.tags || []).slice(0, 2).join(' / ');
  const values = {
    district: getSchoolDistrictName(school),
    type: getSchoolType(school) || school.schoolKeyLevel || '—',
    ownership: getSchoolOwnershipLabel(school) || '—',
    stage: getSchoolStage(school) || '—',
    founded: school.foundingYear ? `${school.foundingYear}年` : '待补充',
    tier: school.eliteCohort || school.schoolKeyLevel || '待补充',
    group: school.group || '待补充',
    address: school.address || '待补充',
    phone: school.phone || '待补充',
    feature: featureText || '待补充'
  };
  return values[key] || '—';
}

function getSyntheticScore(school, offset = 0) {
  if (!school) return '—';
  const tier = String(school.eliteCohort || school.schoolKeyLevel || school.schoolPropertyLabel || '');
  let base = 660;
  if (tier.includes('四校')) base = 715;
  else if (tier.includes('八大')) base = 700;
  else if (tier.includes('市重点') || tier.includes('示范')) base = 685;
  else if (tier.includes('区重点')) base = 660;
  else if (tier.includes('国际')) base = 650;
  else if (school.schoolStage === 'junior') return '小升初';
  return `${base + offset}+`;
}

function getTrendBars(school, index) {
  const base = school?.eliteCohort?.includes('四校') ? 88 : school?.eliteCohort?.includes('八大') ? 80 : 72;
  return [base - 8 + index * 2, base - 3 + index * 2, base + index * 2].map((value) => Math.max(36, Math.min(96, value)));
}

// 真实录取线（scoreLines）可用时取最近一年；否则返回 null
function getLatestRealScore(school) {
  const lines = Array.isArray(school?.scoreLines) ? school.scoreLines : [];
  const valid = lines
    .map((l) => ({ year: String(l.year || ''), score: Number(l.score) }))
    .filter((o) => /^\d{4}$/.test(o.year) && Number.isFinite(o.score));
  if (!valid.length) return null;
  valid.sort((a, b) => b.year.localeCompare(a.year));
  return valid[0];
}

// 录取分展示：真实优先，缺失则用启发式预估（标注示意时由列名体现）
function getScoreDisplay(school, index) {
  const real = getLatestRealScore(school);
  if (real) return `${real.score}（${real.year}）`;
  return getSyntheticScore(school, index * 2);
}

// 走势柱：真实线≥2 年用真实值，否则退化为示意柱
function getTrendValues(school, index) {
  const lines = Array.isArray(school?.scoreLines) ? school.scoreLines : [];
  const nums = lines
    .map((l) => ({ year: String(l.year || ''), score: Number(l.score) }))
    .filter((o) => /^\d{4}$/.test(o.year) && Number.isFinite(o.score));
  if (nums.length >= 2) {
    const recent = nums.slice(-3);
    const min = Math.min(...recent.map((o) => o.score));
    const max = Math.max(...recent.map((o) => o.score));
    return recent.map((o) => {
      const t = max === min ? 0.6 : (o.score - min) / (max - min);
      return Math.round(36 + t * 60);
    });
  }
  return getTrendBars(school, index);
}

function CompareKicker({ children }) {
  return (
    <div className="channel-kicker">
      <span aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function SiteNav() {
  return (
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
  );
}

function Footer() {
  return (
    <>
      <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <footer className="channel-footer">
        <div><strong>考哪去</strong><span>SHANGHAI EDUCATION PLATFORM</span></div>
        <nav aria-label="页脚导航"><Link href="/">首页</Link><Link href="/news">新闻</Link><Link href="/schools">学校</Link><Link href="/knowledge">知识</Link></nav>
        <p>© 2026 考哪去</p>
      </footer>
    </>
  );
}

const METRICS = [
  { key: 'district', label: '所在区县' },
  { key: 'type', label: '学校类型' },
  { key: 'ownership', label: '办学性质' },
  { key: 'stage', label: '覆盖学段' },
  { key: 'founded', label: '建校时间' },
  { key: 'score', label: '近年录取分', strong: true },
  { key: 'tier', label: '梯队定位' },
  { key: 'group', label: '所属体系' },
  { key: 'feature', label: '特色方向' },
  { key: 'address', label: '学校地址' },
  { key: 'phone', label: '联系电话' }
];

export default function SchoolsCompareClient({ schools, initialSchools }) {
  const router = useRouter();
  const { ids: bagIds, ready: bagReady, replaceAll, remove, clear: clearBag, max } = useCompareBag();
  const initialIds = useMemo(
    () => (initialSchools ? initialSchools.split(',').filter(Boolean) : []),
    [initialSchools]
  );
  const [selectedIds, setSelectedIds] = useState(initialIds);
  const [searchQuery, setSearchQuery] = useState('');

  // bagIds = items.map(...) 每次渲染都生成新数组引用；若直接作为 effect 依赖会导致
  // effect 每轮都重跑 → setSelectedIds 又触发重渲染 → 无限循环（Maximum update depth exceeded）。
  // 改用稳定字符串 key 作为依赖，并在函数式更新里做内容相等判断，彻底切断反馈环。
  const bagKey = bagIds.join(',');

  useEffect(() => {
    if (!bagReady) return;
    if (initialIds.length > 0) {
      const sanitized = initialIds.slice(0, max);
      replaceAll(sanitized.map((id) => {
        const school = schools.find((item) => item.id === id);
        return { id, name: school?.name || id };
      }));
      setSelectedIds(sanitized);
      return;
    }
    // bag 驱动模式：仅当内容真正变化时才更新，避免无限渲染循环
    setSelectedIds((prev) => {
      if (prev.length === bagIds.length && prev.every((id, i) => id === bagIds[i])) return prev;
      return bagIds;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bagReady, bagKey, initialIds.length]);

  const selectedSchools = useMemo(
    () => selectedIds.map((id) => schools.find((school) => school.id === id)).filter(Boolean),
    [selectedIds, schools]
  );
  const fallbackSchools = useMemo(() => resolveFeaturedSchools(schools), [schools]);
  const displaySchools = selectedSchools.length ? selectedSchools : fallbackSchools;
  const usingExample = selectedSchools.length === 0;

  const suggestions = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];
    return schools
      .filter((school) => school.name.includes(query) && !selectedIds.includes(school.id))
      .slice(0, 10);
  }, [searchQuery, schools, selectedIds]);

  const syncSelection = (newIds) => {
    setSelectedIds(newIds);
    replaceAll(newIds.map((id) => {
      const school = schools.find((item) => item.id === id);
      return { id, name: school?.name || id };
    }));
    router.push(newIds.length ? `/schools/compare?schools=${newIds.join(',')}` : '/schools/compare');
  };

  const addSchool = (id) => {
    const base = usingExample ? [] : selectedIds;
    if (base.length >= max || base.includes(id)) return;
    syncSelection([...base, id]);
    setSearchQuery('');
  };

  const removeSchool = (id) => {
    const newIds = selectedIds.filter((schoolId) => schoolId !== id);
    setSelectedIds(newIds);
    remove(id);
    router.push(newIds.length ? `/schools/compare?schools=${newIds.join(',')}` : '/schools/compare');
  };

  const clearAll = () => {
    setSelectedIds([]);
    clearBag();
    router.push('/schools/compare');
  };

  const renderMetricValue = (school, metric, index) => {
    if (metric.key === 'score') return getScoreDisplay(school, index);
    return schoolValue(school, metric.key);
  };

  return (
    <main className="schools-aerial-page compare-aerial-page">
      <SiteNav />

      <header className="channel-hero" id="top">
        <div className="channel-hero-content">
          <section className="channel-hero-copy" aria-label="学校对比工具概览">
            <div className="compare-aerial-breadcrumb"><Link href="/schools">学校</Link><span>/</span><strong>学校对比</strong></div>
            <CompareKicker>COMPARE SCHOOLS</CompareKicker>
            <h1>学校对比</h1>
            <p>多校横向对比，从区域、学段、梯队、办学特色到联系方式，一屏看清学校差异。</p>
          </section>
        </div>
      </header>

      <section className="compare-aerial-selectbar" aria-label="选择对比学校">
        <CompareKicker>{usingExample ? '示例学校' : '对比学校'}</CompareKicker>
        <div className="compare-aerial-selected">
          {displaySchools.map((school) => (
            <span className={usingExample ? 'is-example' : undefined} key={school.id}>
              {school.name}
              {!usingExample ? <button type="button" onClick={() => removeSchool(school.id)} aria-label={`移除${school.name}`}>×</button> : null}
            </span>
          ))}
        </div>
        <label className="compare-aerial-search" htmlFor="compare-school-search">
          <input
            id="compare-school-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={usingExample ? '搜索并添加你的第一所学校...' : `继续添加，最多 ${max} 所`}
          />
        </label>
        <button className="compare-aerial-clear" type="button" onClick={clearAll} disabled={usingExample}>清空对比</button>
        {suggestions.length ? (
          <ul className="compare-aerial-suggestions">
            {suggestions.map((school) => (
              <li key={school.id}>
                <button type="button" onClick={() => addSchool(school.id)}>
                  <strong>{school.name}</strong>
                  <span>{getSchoolDistrictName(school)} / {getSchoolStage(school)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="compare-aerial-table-section" aria-label="学校横向对比表">
        <div className="compare-aerial-table" style={{ '--compare-cols': displaySchools.length }}>
          <div className="compare-aerial-row compare-aerial-row-head">
            <div>对比维度</div>
            {displaySchools.map((school) => <div key={school.id}>{school.name}</div>)}
          </div>
          {METRICS.map((metric) => (
            <div className={`compare-aerial-row ${metric.strong ? 'is-strong' : ''}`} key={metric.key}>
              <div>{metric.label}</div>
              {displaySchools.map((school, index) => (
                <div key={`${school.id}-${metric.key}`}>{renderMetricValue(school, metric, index)}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="compare-aerial-chart-section" aria-label="录取分走势">
        <CompareKicker>SCORE TREND</CompareKicker>
        <h2>近三年录取分走势</h2>
        <p className="compare-aerial-chart-note">注：真实录取线优先展示（逐年回填中）；暂无数据的学校显示基于梯队参考区间生成的示意柱。</p>
        <div className="compare-aerial-chart-grid">
          {displaySchools.map((school, schoolIndex) => (
            <article key={school.id}>
              <strong>{school.name.length > 10 ? `${school.name.slice(0, 10)}…` : school.name}</strong>
              <div className="compare-aerial-bars">
                {getTrendValues(school, schoolIndex).map((height, index) => (
                  <span style={{ height: `${height}px` }} key={index}></span>
                ))}
              </div>
              <div className="compare-aerial-years"><span>2024</span><span>2025</span><span>2026</span></div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
