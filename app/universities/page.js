// 高校频道列表页：全局路由 /universities（无 region 前缀，所有地区同一系统）。
// **样式与结构完全对齐学校频道列表页** app/[region]/schools/page.js：同一套 schools-aerial-* 骨架
// + 同一批组件形态（卡片 / 筛选侧栏 / 搜索框 / 排序下拉），data-page 输出 "schools"
// （见 body-page-flag 与 app/layout.js 内联防 FOUC 脚本），由 styles/channels/schools.css +
// styles/pages/schools-detail.css 原样接管，本频道零自建 CSS。
// 筛选维度：层次(本科/专科) / tags(双一流/985/211/强基) / 省份 / 性质 / 隶属 + 搜索。
import { createRequire } from 'module';
import Link from 'next/link';
import Pager from '../../components/pager';
import UniversitiesCard from '../../components/universities-card';
import UniversitiesSearchBar from '../../components/universities-search-bar';
import UniversitiesFilterSidebar from '../../components/universities-filter-sidebar';
import UniversitiesSortSelect from '../../components/universities-sort-select';
import { RegionSelector } from '../../components/region-selector';
import { SiteMenuLinks } from '../../components/site-menu';
import {
  UNIVERSITIES_SORT_OPTIONS,
  filterUniversities,
  sortUniversities,
  parseUniversityFilters,
  buildUniversitiesHref,
  toUniversityCard
} from '../../lib/universities-list.mjs';
import '../../styles/channels/schools.css';
import '../../styles/pages/schools-detail.css';

const require = createRequire(import.meta.url);
const { loadUniversitiesList, getUniversitiesBySlugs } = require('../../shared/university-store');

const UNIVERSITIES_PER_PAGE = 10;

// 用于筛选摘要文案（取值 → 中文标签）
const LEVEL_LABELS = { all: '全部', undergrad: '本科', juniorCollege: '专科' };

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

export default async function UniversitiesPage({ searchParams }) {
  const params = await searchParams;
  const filters = parseUniversityFilters(params);
  const requestedPage = parseInt(typeof params?.page === 'string' ? params.page : '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const all = await loadUniversitiesList();
  const sorted = sortUniversities(filterUniversities(all, filters), filters.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / UNIVERSITIES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * UNIVERSITIES_PER_PAGE, safePage * UNIVERSITIES_PER_PAGE);

  // 列表查询是瘦列（无 content）；当前页 ≤10 张卡需要概览文案，单独按 slug 批量取完整行，
  // 与学校列表「loadSchoolsList 瘦 + getSchoolsByIds 全」同一策略。
  const fullPageItems = await getUniversitiesBySlugs(pageItems.map((u) => u.slug));
  const bySlug = new Map(fullPageItems.map((u) => [u.slug, u]));
  const cards = pageItems.map((u) => toUniversityCard(bySlug.get(u.slug) || u));

  const provincesInData = new Set(all.map((u) => u.province).filter(Boolean));
  const provinceOptions = PROVINCE_ORDER.filter((p) => provincesInData.has(p));

  const totalUndergrad = all.filter((u) => u.isUndergrad).length;
  const totalDouble = all.filter((u) => (u.tags || []).includes('双一流')).length;
  const total985 = all.filter((u) => (u.tags || []).includes('985')).length;
  const total211 = all.filter((u) => (u.tags || []).includes('211')).length;

  // 侧栏「工具与导航」快捷入口
  const quickLinks = [
    { label: '双一流高校', meta: `${totalDouble} 所`, href: buildUniversitiesHref('/universities', { ...filters, tags: ['双一流'] }, 1) },
    { label: '985 高校', meta: `${total985} 所`, href: buildUniversitiesHref('/universities', { ...filters, tags: ['985'] }, 1) },
    { label: '211 高校', meta: `${total211} 所`, href: buildUniversitiesHref('/universities', { ...filters, tags: ['211'] }, 1) },
    { label: '本科院校', meta: `${totalUndergrad} 所`, href: buildUniversitiesHref('/universities', { ...filters, level: 'undergrad' }, 1) }
  ];

  const summary = [];
  if (filters.level !== 'all') summary.push(`层次：${LEVEL_LABELS[filters.level] || filters.level}`);
  if (filters.tags.length) summary.push(`标签：${filters.tags.join('/')}`);
  if (filters.province !== 'all') summary.push(`省份：${filters.province}`);
  if (filters.nature !== 'all') summary.push(`性质：${filters.nature}`);
  if (filters.affiliation !== 'all') summary.push(`隶属：${filters.affiliation}`);
  if (filters.query) summary.push(`关键词：${filters.query}`);
  if (filters.sort !== 'priority') {
    const opt = UNIVERSITIES_SORT_OPTIONS.find((o) => o.value === filters.sort);
    if (opt) summary.push(`排序：${opt.label}`);
  }

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
            <SiteMenuLinks active="universities" />
            <RegionSelector />
          </div>
        </nav>

        <header className="channel-hero" id="top">
          <div className="channel-hero-content">
            <section className="channel-hero-copy" aria-label="高校频道概览">
              <div className="channel-kicker"><span aria-hidden="true"></span><p>UNIVERSITY DATABASE</p></div>
              <h1>全国高校数据库</h1>
              <p>收录全国 {all.length.toLocaleString('zh-CN')} 所普通高等学校（本科 {totalUndergrad} / 专科 {all.length - totalUndergrad}），按层次、标签、省份、隶属筛选，查看高校概况、学科实力与录取数据。</p>
              <UniversitiesSearchBar filters={filters} />
            </section>

            <aside className="channel-hero-stats" aria-label="高校数据统计">
              <article><strong>{all.length.toLocaleString('zh-CN')}</strong><span>收录高校</span></article>
              <article><strong>{provinceOptions.length}</strong><span>覆盖省市区</span></article>
              <article><strong>{totalDouble}</strong><span>双一流</span></article>
            </aside>
          </div>
        </header>

        <section className="schools-aerial-content">
          <UniversitiesFilterSidebar filters={filters} provinceOptions={provinceOptions} quickLinks={quickLinks} />

          <section className="schools-aerial-results" aria-label="高校检索结果">
            <header className="schools-aerial-results-head">
              <div>
                <span>{total}</span>
                <h2>所高校</h2>
              </div>
              <div className="schools-aerial-results-head-right">
                <label htmlFor="prototype-sort-filter" className="schools-aerial-sort-label">排序</label>
                <UniversitiesSortSelect filters={filters} />
              </div>
              <p>{summary.length ? summary.join(' · ') : '未筛选，展示全量结果。'}</p>
            </header>

            <div className="schools-aerial-cardlist">
              {cards.length === 0 ? (
                <div className="schools-aerial-empty">
                  <p>没有匹配的高校，请调整筛选条件。</p>
                </div>
              ) : cards.map((u) => (
                <UniversitiesCard key={u.slug} university={u} />
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
            <SiteMenuLinks />
          </nav>
          <p>© 2026 考哪去</p>
        </footer>
      </main>
    </>
  );
}
