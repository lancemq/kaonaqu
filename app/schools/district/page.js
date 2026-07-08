import Link from 'next/link';
import { createRequire } from 'module';
import {
  clipText,
  formatSchoolUpdate,
  getDistrictSchoolTopic,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolType
} from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海学校区域频道 - 16区学校结构与区域专题 | 考哪去',
  description: '按上海16区查看学校结构、区域教育特点、初高中分布与学校专题入口，适合按区比较上海学校资源。'
};

export const dynamic = 'force-dynamic';

function getLatestUpdate(schools) {
  const latest = schools
    .map((school) => String(school.updatedAt || '').trim())
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!latest) return '持续整理';

  const match = latest.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : formatSchoolUpdate(latest);
}

function countByStage(schools, stage) {
  return schools.filter((school) => school.schoolStage === stage).length;
}

function buildDistrictRows(districts, schools) {
  return districts
    .map((district) => {
      const districtSchools = schools.filter((school) => school.districtId === district.id);
      return {
        ...district,
        total: districtSchools.length,
        seniorHigh: countByStage(districtSchools, 'senior_high'),
        junior: countByStage(districtSchools, 'junior'),
        complete: countByStage(districtSchools, 'complete'),
        publicCount: districtSchools.filter((school) => school.schoolTypeLabel === '公办').length,
        privateCount: districtSchools.filter((school) => school.schoolTypeLabel === '民办').length,
        latestUpdated: getLatestUpdate(districtSchools),
        topic: getDistrictSchoolTopic(district),
        overview: district.districtOverview || district.description || '区域学校信息持续整理中。'
      };
    })
    .sort((left, right) => Number(right.total || 0) - Number(left.total || 0));
}

function getDistrictFeaturedSchool(district, schools) {
  return schools
    .filter((school) => school.districtId === district.id)
    .slice()
    .sort((left, right) => {
      const rightSignal = (right.features?.length || 0) + (right.tags?.length || 0);
      const leftSignal = (left.features?.length || 0) + (left.tags?.length || 0);
      return rightSignal - leftSignal;
    })
    .at(0);
}

function SectionKicker({ children }) {
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

export default async function DistrictIndexPage() {
  const { districts, schools } = await loadDataStore();
  const districtRows = buildDistrictRows(districts, schools);
  const totals = {
    districts: districtRows.length,
    schools: schools.length,
    junior: countByStage(schools, 'junior'),
    seniorHigh: countByStage(schools, 'senior_high'),
    complete: countByStage(schools, 'complete')
  };
  const leadDistrict = districtRows[0];
  const zoneDistricts = districtRows.slice(0, 6);
  const highlightedDistricts = districtRows.slice(0, 3);
  const featuredSchools = highlightedDistricts
    .map((district) => ({ district, school: getDistrictFeaturedSchool(district, schools) }))
    .filter((item) => item.school);
  const relatedTools = [
    { label: '学校数据库', href: '/schools' },
    { label: '学校对比', href: '/schools/compare' },
    { label: '分数匹配', href: '/schools/score-match' }
  ];

  return (
    <main className="schools-aerial-page district-channel-page">
      <SiteNav />

      <header className="channel-hero" id="top">
        <div className="channel-hero-content">
          <section className="channel-hero-copy" aria-label="上海学校区域频道概览">
            <div className="district-channel-breadcrumb"><Link href="/schools">学校</Link><span>/</span><strong>区域频道</strong></div>
            <SectionKicker>DISTRICT CHANNEL</SectionKicker>
            <h1>上海学校区域频道</h1>
            <p>从区域进入，先看各区学校密度、初高中结构和区域教育特点，再进入具体区县专题和学校详情。</p>
          </section>

          <aside className="channel-hero-stats" aria-label="区域频道数据统计">
            <article><strong>{totals.districts}</strong><span>覆盖区域</span></article>
            <article><strong>{totals.schools}</strong><span>收录学校</span></article>
            <article><strong>{totals.seniorHigh}</strong><span>高中样本</span></article>
            <article><strong>{totals.complete}</strong><span>完全中学</span></article>
          </aside>
        </div>
      </header>

      <section className="district-channel-overview" aria-label="区域频道概况">
        <div>
          <h2>区域概况</h2>
          <p>上海学校资源在中心城区、近郊新城和远郊生态区之间差异明显。按区浏览可以先判断学校密度、通勤范围、头部学校和学段结构，再进入具体学校做细分比较。</p>
        </div>
        <div className="district-channel-overview-stats">
          <article><strong>{leadDistrict?.name || '浦东新区'}</strong><span>学校记录最多</span></article>
          <article><strong>{totals.junior}</strong><span>初中记录</span></article>
          <article><strong>{getLatestUpdate(schools)}</strong><span>最近更新</span></article>
        </div>
      </section>

      <section className="district-channel-section district-channel-zones" aria-label="学校密集区域">
        <SectionKicker>SCHOOL ZONES</SectionKicker>
        <h2>学校密集区域</h2>
        <p>先从学校记录更多、结构更丰富的区域切入，适合做第一轮横向比较。</p>
        <div className="district-channel-zone-grid">
          {zoneDistricts.map((district) => (
            <Link className="district-channel-zone-card" href={`/schools/district/${district.id}`} key={district.id}>
              <div>
                <strong>{district.name}</strong>
                <span>{district.total} 所</span>
              </div>
              <p>{clipText(district.topic, 42)}</p>
              <em>高中 {district.seniorHigh} · 初中 {district.junior}</em>
            </Link>
          ))}
        </div>
      </section>

      <section className="district-channel-section district-channel-highlights" aria-label="区域名校">
        <SectionKicker>HIGHLIGHTS</SectionKicker>
        <h2>区域名校</h2>
        <div className="district-channel-featured-grid">
          {featuredSchools.map(({ district, school }) => (
            <Link className="district-channel-featured-card" href={`/schools/${school.id}`} key={school.id}>
              <div><span>{district.name}</span><em>{getSchoolType(school) || '学校档案'}</em></div>
              <strong>{school.name}</strong>
              <p>{clipText(getSchoolAdmissionInfo(school) || school.schoolDescription || '学校信息持续整理中。', 46)}</p>
              <b>进入 →</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="district-channel-schools" aria-label="上海各区学校入口">
        <div className="district-channel-main-list">
          <div className="district-channel-list-head">
            <div>
              <SectionKicker>ALL DISTRICTS</SectionKicker>
              <h2>上海各区入口</h2>
            </div>
            <p>按学校数量排序，点击进入对应区级学校专题。</p>
          </div>

          <div className="district-channel-row-list">
            {districtRows.map((district) => (
              <Link className="district-channel-row" href={`/schools/district/${district.id}`} key={district.id}>
                <div className="district-channel-row-info">
                  <strong>{district.name}</strong>
                  <span>{clipText(district.overview, 54)}</span>
                </div>
                <div className="district-channel-row-score">
                  <strong>{district.total}</strong>
                  <span>学校</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="district-channel-sidebar" aria-label="区域频道侧栏">
          <section className="channel-side-card">
            <SectionKicker>QUICK FILTER</SectionKicker>
            <h2>快速筛选</h2>
            <Link className="is-active" href="/schools?stage=senior_high">高中学校</Link>
            <Link href="/schools?stage=junior">初中学校</Link>
            <Link href="/schools?stage=complete">完全中学</Link>
            <Link href="/schools?ownership=private">民办学校</Link>
          </section>

          <section className="channel-side-card">
            <SectionKicker>TOP AREAS</SectionKicker>
            <h2>热门区域</h2>
            {zoneDistricts.slice(0, 5).map((district) => (
              <Link href={`/schools/district/${district.id}`} key={district.id}>
                <span>{district.name} · {district.total} 所</span>
                <i>→</i>
              </Link>
            ))}
          </section>

          <section className="channel-side-card is-dark">
            <SectionKicker>TOOLS</SectionKicker>
            <h2>区域工具</h2>
            {relatedTools.map((tool) => (
              <Link href={tool.href} key={tool.href}>
                <span>{tool.label}</span>
                <i>→</i>
              </Link>
            ))}
          </section>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
