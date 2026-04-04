import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../../components/site-shell';
import {
  getDistrictSchoolTopic,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolTrainingDirections,
  getSchoolType
} from '../../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../../shared/data-store');

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { districts } = await loadDataStore();
  const { district } = await params;
  const districtInfo = districts.find((item) => item.id === district);
  if (!districtInfo) {
    return { title: '区级学校专题 | 考哪去' };
  }

  return {
    title: `${districtInfo.name}学校专题 | 考哪去`,
    description: `集中查看${districtInfo.name}的学校分布、重点学校和培养方向。`
  };
}

export default async function DistrictSchoolsPage({ params }) {
  const { districts, schools } = await loadDataStore();
  const { district } = await params;
  const districtInfo = districts.find((item) => item.id === district);

  if (!districtInfo) {
    notFound();
  }

  const districtSchools = schools.filter((school) => school.districtId === districtInfo.id);
  const stageBuckets = {
    junior: districtSchools.filter((school) => school.schoolStage === 'junior'),
    senior_high: districtSchools.filter((school) => school.schoolStage === 'senior_high'),
    complete: districtSchools.filter((school) => school.schoolStage === 'complete')
  };
  const featured = districtSchools
    .slice()
    .sort((left, right) => (right.features?.length || 0) - (left.features?.length || 0) || String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
    .slice(0, 6);

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero" id="top">
        <section className="search-panel editorial-intro-panel" aria-label="区级学校专题">
          <nav className="breadcrumb" aria-label="面包屑导航">
            <Link href="/">首页</Link>
            <span className="separator">/</span>
            <Link href="/schools">学校信息</Link>
            <span className="separator">/</span>
            <span>{districtInfo.name}</span>
          </nav>
          <div className="search-panel-head editorial-intro-head">
            <div className="editorial-intro-copy">
              <span className="module-glyph module-glyph-schools module-glyph-large" aria-hidden="true"></span>
              <h1>{districtInfo.name}学校专题</h1>
              <p>{getDistrictSchoolTopic(districtInfo)}</p>
            </div>
            <div className="editorial-intro-metrics">
              <article><span>学校总量</span><strong>{districtSchools.length}</strong></article>
              <article><span>纯初中</span><strong>{stageBuckets.junior.length}</strong></article>
              <article><span>纯高中 / 完中</span><strong>{stageBuckets.senior_high.length + stageBuckets.complete.length}</strong></article>
            </div>
          </div>
        </section>
      </header>

      <main className="layout">
        <section className="panel main-panel">
          <div className="section-heading">
            <h2>区域概览</h2>
            <p>先看这个区的学校分布，再决定要继续看初中、高中还是完全中学。</p>
          </div>
          <div className="tracker-grid">
            <article className="tracker-card"><span>纯初中</span><strong>{stageBuckets.junior.length}</strong><p>适合小升初和初中阶段择校。</p></article>
            <article className="tracker-card"><span>纯高中</span><strong>{stageBuckets.senior_high.length}</strong><p>适合中招阶段直接比较高中。</p></article>
            <article className="tracker-card"><span>完全中学</span><strong>{stageBuckets.complete.length}</strong><p>适合关注初高中贯通培养路径。</p></article>
          </div>
          <div className="district-card-actions" style={{ marginTop: 18 }}>
            <Link className="module-link" href={`/schools?district=${districtInfo.id}`}>进入该区检索结果</Link>
            <Link className="text-link" href="/schools">返回学校信息页</Link>
          </div>
        </section>

        <section className="panel main-panel">
          <div className="section-heading">
            <h2>本区优先阅读</h2>
            <p>优先展示信息相对完整、比较价值更高的学校，适合先做第一轮判断。</p>
          </div>
          <div className="school-grid">
            {featured.map((school) => (
              <Link key={school.id} href={`/schools/${school.id}`} className="school-card">
                <div className="school-card-header">
                  <div>
                    <h3>{school.name}</h3>
                    <p>{getSchoolDistrictName(school)}</p>
                  </div>
                  <div className="school-card-badges">
                    <span className="pill school-type-pill">{getSchoolType(school)}</span>
                  </div>
                </div>
                <p className="school-summary">{getSchoolAdmissionInfo(school)}</p>
                <div className="school-direction-row">
                  {getSchoolTrainingDirections(school).map((item) => <span key={item} className="direction-chip">{item}</span>)}
                </div>
                <div className="school-card-footer">
                  <span className="school-card-footnote">{getSchoolOwnershipLabel(school)} · {getSchoolStage(school)}</span>
                  <span className="school-card-enter">点击查看学校详情</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
