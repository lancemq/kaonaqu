// 高校频道列表页：全局路由 /universities（无 region 前缀，所有地区同一系统）。
// 筛选维度：层次(本科/专科) / tags(双一流/985/211/强基) / 省份 / 性质 / 隶属 + 搜索。
// URL query 即状态；读 searchParams 动态渲染 + proxy 边缘缓存（Fluid CPU 同 schools 列表）。
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
import '../../styles/channels/universities.css';

const require = createRequire(import.meta.url);
const { loadUniversitiesList } = require('../../shared/university-store');

const UNIVERSITIES_PER_PAGE = 20;

const LEVEL_OPTIONS = [
  { value: 'all', label: '全部层次' },
  { value: 'undergrad', label: '本科' },
  { value: 'juniorCollege', label: '专科（高职）' }
];

const TAG_OPTIONS = [
  { value: '双一流', label: '双一流' },
  { value: '985', label: '985' },
  { value: '211', label: '211' },
  { value: '强基计划', label: '强基计划' }
];

const NATURE_OPTIONS = [
  { value: 'all', label: '全部性质' },
  { value: '公办', label: '公办' },
  { value: '民办', label: '民办' },
  { value: '中外合作', label: '中外合作' }
];

const AFFILIATION_OPTIONS = [
  { value: 'all', label: '全部隶属' },
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

function tagBadgeClass(tag) {
  if (tag === '双一流') return 'uni-badge double';
  if (tag === '985') return 'uni-badge c985';
  if (tag === '211') return 'uni-badge c211';
  return 'uni-badge';
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

  // 筛选选项：省份从数据派生（导入范围可能不含港澳台），按标准序排列
  const provincesInData = new Set(all.map((u) => u.province).filter(Boolean));
  const provinceOptions = [
    { value: 'all', label: '全国' },
    ...PROVINCE_ORDER.filter((p) => provincesInData.has(p)).map((p) => ({ value: p, label: p }))
  ];

  const totalUndergrad = all.filter((u) => u.isUndergrad).length;
  const totalDouble = all.filter((u) => (u.tags || []).includes('双一流')).length;

  // 汇总当前筛选状态（results head 展示）
  const summary = [];
  if (filters.level !== 'all') summary.push(LEVEL_OPTIONS.find((o) => o.value === filters.level)?.label || '');
  if (filters.tags.length) summary.push(filters.tags.join('/'));
  if (filters.province !== 'all') summary.push(filters.province);
  if (filters.nature !== 'all') summary.push(filters.nature);
  if (filters.affiliation !== 'all') summary.push(filters.affiliation);
  if (filters.query) summary.push(`关键词：${filters.query}`);

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
      <main className="uni-aerial-page">
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
              <p>收录全国 {all.length.toLocaleString('zh-CN')} 所普通高等学校（本科 {totalUndergrad} / 专科 {all.length - totalUndergrad}），双一流 {totalDouble} 所。全国维度，各地区共用。</p>
              <form className="uni-search" action="/universities" method="GET" role="search">
                <input
                  type="search"
                  name="query"
                  defaultValue={filters.query}
                  placeholder="搜索校名 / 简称 / 曾用名，如：清华、华政、哈工大"
                  aria-label="搜索高校"
                />
                <button type="submit">搜索</button>
              </form>
            </section>
            <aside className="channel-hero-stats" aria-label="高校数据统计">
              <article><strong>{all.length}</strong><span>收录高校</span></article>
              <article><strong>{provinceOptions.length - 1}</strong><span>覆盖省市区</span></article>
              <article><strong>{totalDouble}</strong><span>双一流</span></article>
            </aside>
          </div>
        </header>

        <section className="uni-aerial-content">
          <aside className="uni-filter-sidebar" aria-label="筛选条件">
            <div className="uni-filter-group">
              <h3>层次</h3>
              <div className="uni-filter-links">
                {LEVEL_OPTIONS.map((o) => (
                  <Link
                    key={o.value}
                    className={filters.level === o.value ? 'is-active' : ''}
                    href={buildUniversitiesHref('/universities', { ...filters, level: o.value }, 1)}
                  >{o.label}</Link>
                ))}
              </div>
            </div>
            <div className="uni-filter-group">
              <h3>标签</h3>
              <div className="uni-filter-links">
                <Link className={!filters.tags.length ? 'is-active' : ''} href={buildUniversitiesHref('/universities', { ...filters, tags: [] }, 1)}>全部</Link>
                {TAG_OPTIONS.map((o) => (
                  <Link
                    key={o.value}
                    className={filters.tags.includes(o.value) ? 'is-active' : ''}
                    href={buildUniversitiesHref('/universities', {
                      ...filters,
                      tags: filters.tags.includes(o.value)
                        ? filters.tags.filter((t) => t !== o.value)
                        : [...filters.tags, o.value]
                    }, 1)}
                  >{o.label}</Link>
                ))}
              </div>
            </div>
            <div className="uni-filter-group">
              <h3>省份</h3>
              <div className="uni-filter-links uni-filter-provinces">
                {provinceOptions.map((o) => (
                  <Link
                    key={o.value}
                    className={filters.province === o.value ? 'is-active' : ''}
                    href={buildUniversitiesHref('/universities', { ...filters, province: o.value }, 1)}
                  >{o.label}</Link>
                ))}
              </div>
            </div>
            <div className="uni-filter-group">
              <h3>性质</h3>
              <div className="uni-filter-links">
                {NATURE_OPTIONS.map((o) => (
                  <Link
                    key={o.value}
                    className={filters.nature === o.value ? 'is-active' : ''}
                    href={buildUniversitiesHref('/universities', { ...filters, nature: o.value }, 1)}
                  >{o.label}</Link>
                ))}
              </div>
            </div>
            <div className="uni-filter-group">
              <h3>隶属</h3>
              <div className="uni-filter-links">
                {AFFILIATION_OPTIONS.map((o) => (
                  <Link
                    key={o.value}
                    className={filters.affiliation === o.value ? 'is-active' : ''}
                    href={buildUniversitiesHref('/universities', { ...filters, affiliation: o.value }, 1)}
                  >{o.label}</Link>
                ))}
              </div>
            </div>
          </aside>

          <section className="uni-aerial-results" aria-label="高校检索结果">
            <header className="uni-aerial-results-head">
              <div>
                <span>{total}</span>
                <h2>所高校</h2>
              </div>
              <div className="uni-aerial-results-head-right">
                <label htmlFor="uni-sort" className="uni-sort-label">排序</label>
                <form action="/universities" method="GET" className="uni-sort-form">
                  {/* 保住既有筛选再排序：隐藏字段回填当前状态 */}
                  {filters.level !== 'all' && <input type="hidden" name="level" value={filters.level} />}
                  {filters.tags.length > 0 && <input type="hidden" name="tags" value={filters.tags.join(',')} />}
                  {filters.province !== 'all' && <input type="hidden" name="province" value={filters.province} />}
                  {filters.nature !== 'all' && <input type="hidden" name="nature" value={filters.nature} />}
                  {filters.affiliation !== 'all' && <input type="hidden" name="affiliation" value={filters.affiliation} />}
                  {filters.query && <input type="hidden" name="query" value={filters.query} />}
                  <select id="uni-sort" name="sort" defaultValue={filters.sort}>
                    {UNIVERSITIES_SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button type="submit" className="uni-sort-go">Go</button>
                </form>
              </div>
              <p className="uni-summary">{summary.length ? summary.join(' · ') : '未筛选，展示全量结果。'}</p>
            </header>

            <div className="uni-cardlist">
              {pageItems.length === 0 ? (
                <div className="uni-empty"><p>没有匹配的高校，请调整筛选条件。</p></div>
              ) : pageItems.map((u) => (
                <Link key={u.id} className="uni-card" href={`/universities/${encodeURIComponent(u.slug)}`}>
                  <div className="uni-card-head">
                    <h3>{u.name}</h3>
                    <div className="uni-card-badges">
                      {(u.tags || []).map((t) => <span key={t} className={tagBadgeClass(t)}>{t}</span>)}
                      {!u.isUndergrad && <span className="uni-badge jc">专科</span>}
                    </div>
                  </div>
                  <p className="uni-card-meta">
                    {u.province}{u.city ? ` · ${u.city}` : ''}
                    {u.affiliation ? ` · ${u.affiliation}直属` : ''}
                    {u.nature ? ` · ${u.nature}` : ''}
                    {u.foundingYear ? ` · 建校 ${u.foundingYear}` : ''}
                  </p>
                  {u.aliases && u.aliases.length > 0 && (
                    <p className="uni-card-aliases">简称：{u.aliases.slice(0, 3).join(' / ')}</p>
                  )}
                </Link>
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
