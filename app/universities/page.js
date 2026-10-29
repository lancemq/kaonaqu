// 高校频道列表页：全局路由 /universities（无 region 前缀，所有地区同一系统）。
// **样式完全复用学校频道专题皮肤**：页面结构/类名对齐 app/[region]/schools/page.js
// （schools-aerial-* 骨架），data-page 输出 "schools"（见 body-page-flag/layout 内联脚本），
// 由 styles/pages/schools-detail.css + styles/channels/schools.css 原样接管，本频道零自建 CSS。
// 筛选维度：层次(本科/专科) / tags(双一流/985/211/强基) / 省份 / 性质 / 隶属 + 搜索。
import { createRequire } from 'module';
import Link from 'next/link';
import Pager from '../../components/pager';
import {
  UNIVERSITIES_SORT_OPTIONS,
  filterUniversities,
  sortUniversities,
  parseUniversityFilters,
  buildUniversitiesHref
} from '../../lib/universities-list.mjs';
import '../../styles/channels/schools.css';
import '../../styles/pages/schools-detail.css';

const require = createRequire(import.meta.url);
const { loadUniversitiesList } = require('../../shared/university-store');

const UNIVERSITIES_PER_PAGE = 20;

const LEVEL_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'undergrad', label: '本科' },
  { value: 'juniorCollege', label: '专科' }
];

const TAG_OPTIONS = [
  { value: '双一流', label: '双一流' },
  { value: '985', label: '985' },
  { value: '211', label: '211' },
  { value: '强基计划', label: '强基' }
];

const NATURE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '公办', label: '公办' },
  { value: '民办', label: '民办' },
  { value: '中外合作', label: '中外合作' }
];

const AFFILIATION_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '教育部', label: '教育部' },
  { value: '工信部', label: '工信部' },
  { value: '其他部委', label: '其他部委' },
  { value: '省级', label: '省级' },
  { value: '市级', label: '市级' },
  { value: '军队', label: '军队' }
];

// 31 省市区标准序（华北→东北→华东→中南→西南→西北）
const PROVINCE_ORDER = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆'
];

export const metadata = {
  title: '全国高校库 - 大学信息/层次标签/录取数据 | 考哪去',
  description: '收录教育部名单全国普通高等学校（本科+专科），按双一流/985/211、省份、性质、隶属筛选，查看高校介绍与录取数据。',
  keywords: ['高校查询', '全国大学', '双一流', '985', '211', '大学名单', '高考志愿'],
  alternates: { canonical: '/universities' }
};

// 筛选小节：复用 schools-aerial-section 手风琴类名（<details> 原生开合，
// 样式由 schools-detail.css 提供，免 client 岛）
function FilterSection({ label, open = true, children }) {
  return (
    <details className="schools-aerial-filter-block schools-aerial-section is-open" open={open}>
      <summary className="schools-aerial-section-head">
        <span className="schools-aerial-section-title">{label}</span>
        <span className="schools-aerial-section-right"><i className="schools-aerial-section-chevron" aria-hidden="true" /></span>
      </summary>
      <div className="schools-aerial-section-body">{children}</div>
    </details>
  );
}

function FilterChips({ options, active, onHref }) {
  return (
    <div className="schools-aerial-feature-chips">
      {options.map((o) => (
        <Link key={o.value} className={active === o.value ? 'is-active' : ''} href={onHref(o.value)}>{o.label}</Link>
      ))}
    </div>
  );
}

export default async function UniversitiesPage({ searchParams }) {
  const params = await searchParams;
  const filters = parseUniversityFilters(params);
  const requestedPage = parseInt(typeof params?.page === 'string' ? params.page : '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const all = await loadUniversitiesList();
  const filtered = sortUniversities(filterUniversities(all, filters), filters.sort);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / UNIVERSITIES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * UNIVERSITIES_PER_PAGE, safePage * UNIVERSITIES_PER_PAGE);

  const provincesInData = new Set(all.map((u) => u.province).filter(Boolean));
  const provinceOptions = PROVINCE_ORDER.filter((p) => provincesInData.has(p));

  const totalUndergrad = all.filter((u) => u.isUndergrad).length;
  const totalDouble = all.filter((u) => (u.tags || []).includes('双一流')).length;

  const summary = [];
  if (filters.level !== 'all') summary.push(LEVEL_OPTIONS.find((o) => o.value === filters.level)?.label || '');
  if (filters.tags.length) summary.push(filters.tags.join('/'));
  if (filters.province !== 'all') summary.push(filters.province);
  if (filters.nature !== 'all') summary.push(filters.nature);
  if (filters.affiliation !== 'all') summary.push(filters.affiliation);
  if (filters.query) summary.push(`关键词：${filters.query}`);
  if (filters.sort !== 'priority') summary.push(`排序：${UNIVERSITIES_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label || ''}`);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '全国普通高等学校列表',
    description: '按层次、省份、性质、隶属筛选全国高校',
    numberOfItems: all.length
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <main className="schools-aerial-page">
        <nav className="channel-nav" aria-label="顶部导航">
          <Link className="channel-brand" href="/" aria-label="考哪去首页">
            <strong>考哪去</strong>
            <span>高校库</span>
          </Link>
          <div className="channel-nav-links">
            <Link href="/">首页</Link>
            <Link href="/news">新闻</Link>
            <Link href="/schools">学校</Link>
            <Link href="/knowledge">知识</Link>
            <Link className="is-active" href="/universities">高校</Link>
          </div>
        </nav>

        <header className="channel-hero" id="top">
          <div className="channel-hero-content">
            <section className="channel-hero-copy" aria-label="高校频道概览">
              <div className="channel-kicker"><span aria-hidden="true"></span><p>UNIVERSITY DATABASE</p></div>
              <h1>全国高校数据库</h1>
              <p>收录全国 {all.length.toLocaleString('zh-CN')} 所普通高等学校（本科 {totalUndergrad} / 专科 {all.length - totalUndergrad}），双一流 {totalDouble} 所，覆盖 31 个省市区。</p>
              <form className="schools-aerial-searchbar" action="/universities" method="GET" role="search">
                <span aria-hidden="true"></span>
                <input
                  id="prototype-university-search"
                  type="search"
                  name="query"
                  defaultValue={filters.query}
                  placeholder="搜索校名 / 简称 / 曾用名，如：清华、华政、哈工大"
                  aria-label="搜索高校"
                />
                <button type="submit">检索</button>
              </form>
            </section>

            <aside className="channel-hero-stats" aria-label="高校数据统计">
              <article><strong>{all.length.toLocaleString('zh-CN')}</strong><span>收录高校</span></article>
              <article><strong>{provinceOptions.length}</strong><span>覆盖省市区</span></article>
              <article><strong>{totalDouble}</strong><span>双一流</span></article>
            </aside>
          </div>
        </header>

        <section className="schools-aerial-content">
          <aside className="schools-aerial-sidebar" aria-label="筛选条件">
            <div className="schools-aerial-sidebar-head">
              <div className="channel-kicker"><span aria-hidden="true"></span><p>FILTER</p></div>
              <h2>筛选条件</h2>
            </div>

            <div className="schools-aerial-filter-stack">
              <FilterSection label="层次">
                <FilterChips
                  options={LEVEL_OPTIONS}
                  active={filters.level}
                  onHref={(v) => buildUniversitiesHref('/universities', { ...filters, level: v }, 1)}
                />
              </FilterSection>

              <FilterSection label="标签">
                <div className="schools-aerial-feature-chips">
                  <Link className={!filters.tags.length ? 'is-active' : ''} href={buildUniversitiesHref('/universities', { ...filters, tags: [] }, 1)}>全部</Link>
                  {TAG_OPTIONS.map((o) => {
                    const activeTag = filters.tags.includes(o.value);
                    const nextTags = activeTag ? filters.tags.filter((t) => t !== o.value) : [...filters.tags, o.value];
                    return (
                      <Link key={o.value} className={activeTag ? 'is-active' : ''} href={buildUniversitiesHref('/universities', { ...filters, tags: nextTags }, 1)}>{o.label}</Link>
                    );
                  })}
                </div>
              </FilterSection>

              <FilterSection label="省份" open={false}>
                <div className="schools-aerial-feature-chips">
                  <Link className={filters.province === 'all' ? 'is-active' : ''} href={buildUniversitiesHref('/universities', { ...filters, province: 'all' }, 1)}>全部</Link>
                  {provinceOptions.map((p) => (
                    <Link key={p} className={filters.province === p ? 'is-active' : ''} href={buildUniversitiesHref('/universities', { ...filters, province: p }, 1)}>{p}</Link>
                  ))}
                </div>
              </FilterSection>

              <FilterSection label="性质">
                <FilterChips
                  options={NATURE_OPTIONS}
                  active={filters.nature}
                  onHref={(v) => buildUniversitiesHref('/universities', { ...filters, nature: v }, 1)}
                />
              </FilterSection>

              <FilterSection label="隶属" open={false}>
                <FilterChips
                  options={AFFILIATION_OPTIONS}
                  active={filters.affiliation}
                  onHref={(v) => buildUniversitiesHref('/universities', { ...filters, affiliation: v }, 1)}
                />
              </FilterSection>
            </div>
          </aside>

          <section className="schools-aerial-results" aria-label="高校检索结果">
            <header className="schools-aerial-results-head">
              <div>
                <span>{total}</span>
                <h2>所高校</h2>
              </div>
              <div className="schools-aerial-results-head-right">
                <label htmlFor="prototype-sort-filter" className="schools-aerial-sort-label">排序</label>
                <form action="/universities" method="GET" className="schools-aerial-sort">
                  {filters.level !== 'all' && <input type="hidden" name="level" value={filters.level} />}
                  {filters.tags.length > 0 && <input type="hidden" name="tags" value={filters.tags.join(',')} />}
                  {filters.province !== 'all' && <input type="hidden" name="province" value={filters.province} />}
                  {filters.nature !== 'all' && <input type="hidden" name="nature" value={filters.nature} />}
                  {filters.affiliation !== 'all' && <input type="hidden" name="affiliation" value={filters.affiliation} />}
                  {filters.query && <input type="hidden" name="query" value={filters.query} />}
                  <select id="prototype-sort-filter" name="sort" defaultValue={filters.sort}>
                    {UNIVERSITIES_SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button type="submit">Go</button>
                </form>
              </div>
              <p>{summary.length ? summary.join(' · ') : '未筛选，展示全量结果。'}</p>
            </header>

            <div className="schools-aerial-cardlist">
              {pageItems.length === 0 ? (
                <div className="schools-aerial-empty">
                  <p>没有匹配的高校，请调整筛选条件。</p>
                </div>
              ) : pageItems.map((u) => (
                <article key={u.id} className="schools-aerial-card-wrap">
                  <Link href={`/universities/${encodeURIComponent(u.slug)}`} className="schools-aerial-card" prefetch={false}>
                    <div className="schools-aerial-card-main">
                      <p>{u.province}{u.city ? ` / ${u.city}` : ''} / {u.nature || '高校'}{u.isUndergrad ? ' / 本科' : ' / 专科'}</p>
                      <h3>{u.name}</h3>
                      <span>{u.aliases && u.aliases.length ? `简称：${u.aliases.slice(0, 3).join(' / ')}` : '查看高校概况、学科实力与录取数据。'}</span>
                      <div className="schools-aerial-card-tags">
                        {(u.tags || []).slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
                      </div>
                    </div>
                    <div className="schools-aerial-card-side">
                      <strong>{(u.tags || [])[0] || (u.isUndergrad ? '本科' : '专科')}</strong>
                      <b>查看详情 →</b>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            <Pager
              currentPage={safePage}
              totalPages={totalPages}
              route="/universities"
              params={{
                level: filters.level,
                tags: filters.tags,
                province: filters.province,
                nature: filters.nature,
                affiliation: filters.affiliation,
                query: filters.query,
                sort: filters.sort
              }}
            />
          </section>
        </section>

        <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <footer className="channel-footer">
          <div><strong>考哪去</strong><span>高校知识库</span></div>
          <nav aria-label="页脚导航">
            <Link href="/">首页</Link>
            <Link href="/news">新闻</Link>
            <Link href="/schools">学校</Link>
            <Link href="/knowledge">知识</Link>
            <Link href="/universities">高校</Link>
          </nav>
          <p>© 2026 考哪去</p>
        </footer>
      </main>
    </>
  );
}
