import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import { getDistrictSchoolTopic } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海学校区域专题汇总 | 考哪去',
  description: '按上海各区查看学校专题入口，快速跳转到黄浦、徐汇、浦东等区域学校专题页。'
};

export const dynamic = 'force-dynamic';

function getLatestUpdate(schools) {
  const latest = schools
    .map((school) => String(school.updatedAt || '').trim())
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!latest) {
    return '持续整理';
  }

  const match = latest.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : latest;
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
        publicCount: districtSchools.filter((school) => school.schoolType === 'public').length,
        privateCount: districtSchools.filter((school) => school.schoolType === 'private').length,
        latestUpdated: getLatestUpdate(districtSchools),
        topic: getDistrictSchoolTopic(district)
      };
    })
    .sort((left, right) => Number(right.total || 0) - Number(left.total || 0));
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
  const topDistricts = districtRows.slice(0, 4);

  return (
    <SiteShell
      hideKnowledgeNav
      breadcrumbItems={[
        { label: '学校信息', href: '/schools' },
        { label: '区域专题' }
      ]}
    >
      <header className="hero" id="top">
        <section className="district-datadesk-hero district-index-hero" aria-label="上海学校区域专题汇总">
          <div className="district-datadesk-hero-grid">
            <div className="district-datadesk-hero-main">
              <p className="overview-label">District Topics</p>
              <h1>上海学校区域专题</h1>
              <p className="district-datadesk-subtitle">先从区域进入，再看这个区的学校结构、优先学校和学段分布。</p>
              <p className="district-datadesk-description">如果还没有明确目标学校，先按区浏览会更快：看学校密度、初高中结构和区域特点，再跳到对应区专题继续筛。</p>
              <div className="district-datadesk-inline-meta">
                <span>16 区入口</span>
                <span>区域专题直达</span>
                <span>学校结构一眼看清</span>
              </div>
              <div className="district-index-actions">
                <Link className="module-link" href="/schools">回到学校数据库</Link>
                <Link className="module-link module-link-secondary" href="/schools?stage=junior">先看初中</Link>
              </div>
            </div>

            <div className="district-datadesk-summary-grid">
              <article className="district-datadesk-summary-card district-datadesk-summary-card-strong">
                <span>覆盖区域</span>
                <strong>{totals.districts}</strong>
                <p>上海各区学校专题入口</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>学校总量</span>
                <strong>{totals.schools}</strong>
                <p>当前站内学校数据库记录</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>高中 / 初中</span>
                <strong>{totals.seniorHigh} / {totals.junior}</strong>
                <p>纯高中与纯初中记录</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>完全中学</span>
                <strong>{totals.complete}</strong>
                <p>适合关注贯通培养路径</p>
              </article>
            </div>
          </div>
        </section>
      </header>

      <section className="district-datadesk-statusbar" aria-label="区域专题状态">
        <span className="district-datadesk-statuslabel">District Index</span>
        <span>上海 {totals.districts} 区 / {totals.schools} 所学校 / 可跳转至各区专题页</span>
      </section>

      <main className="layout district-index-layout">
        <section className="district-datadesk-panel district-index-lead-panel">
          <div className="district-datadesk-results-head">
            <div>
              <p className="overview-label">先看哪里</p>
              <h2>学校记录最多的区域</h2>
            </div>
            <p>这些区域学校记录密度更高，适合先做横向比较。</p>
          </div>
          <div className="district-index-feature-grid">
            {topDistricts.map((district) => (
              <Link key={district.id} href={`/schools/district/${district.id}`} className="district-index-feature-card">
                <span>{district.name}</span>
                <strong>{district.total} 所学校</strong>
                <p>{district.topic}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="district-datadesk-panel">
          <div className="district-datadesk-results-head">
            <div>
              <p className="overview-label">区域专题</p>
              <h2>上海各区学校入口</h2>
            </div>
            <p>点击任一区域，进入对应学校专题页。</p>
          </div>

          <div className="district-index-grid">
            {districtRows.map((district) => (
              <Link key={district.id} href={`/schools/district/${district.id}`} className="district-index-card">
                <div className="district-index-card-head">
                  <div>
                    <p>{district.description || '区域学校专题'}</p>
                    <h3>{district.name}</h3>
                  </div>
                  <span>{district.total}</span>
                </div>
                <p className="district-index-card-topic">{district.topic}</p>
                <div className="district-index-card-metrics">
                  <span>高中 {district.seniorHigh}</span>
                  <span>初中 {district.junior}</span>
                  <span>完全中学 {district.complete}</span>
                </div>
                <div className="district-index-card-foot">
                  <span>公办 {district.publicCount} / 民办 {district.privateCount}</span>
                  <strong>进入专题</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 区域专题汇总</span>
        <span>16 区入口 / 区域结构 / 学校专题页</span>
      </footer>
    </SiteShell>
  );
}
