import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import {
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolHighlights,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolSuitableStudents,
  getSchoolTrainingDirections,
  getSchoolType
} from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '学校对比 | 考哪去',
  description: '把多所上海学校放在同一页中对比学段、类型、培养方向、特色和择校提醒。'
};

export const dynamic = 'force-dynamic';

export default async function SchoolComparePage({ searchParams }) {
  const { schools } = await loadDataStore();
  const params = await searchParams;
  const ids = typeof params?.ids === 'string'
    ? params.ids.split(',').map((item) => decodeURIComponent(item)).filter(Boolean)
    : [];
  const compareSchools = ids.map((id) => schools.find((school) => school.id === id)).filter(Boolean).slice(0, 4);

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero" id="top">
        <section className="search-panel editorial-intro-panel" aria-label="学校对比">
          <nav className="breadcrumb" aria-label="面包屑导航">
            <Link href="/">首页</Link>
            <span className="separator">/</span>
            <Link href="/schools">学校信息</Link>
            <span className="separator">/</span>
            <span>学校对比</span>
          </nav>
          <div className="search-panel-head editorial-intro-head">
            <div className="editorial-intro-copy">
              <span className="module-glyph module-glyph-schools module-glyph-large" aria-hidden="true"></span>
              <h1>学校对比</h1>
              <p>把 2 到 4 所学校放在同一屏里看，适合快速比较学段、培养方向、学校亮点和报考提醒。</p>
            </div>
            <div className="editorial-intro-metrics">
              <article><span>已选学校</span><strong>{compareSchools.length}</strong></article>
              <article><span>建议数量</span><strong>2-4</strong></article>
              <article><span>比较重点</span><strong>方向 / 提醒</strong></article>
            </div>
          </div>
        </section>
      </header>

      <main className="layout">
        <section className="panel main-panel">
          <div className="section-heading">
            <h2>对比结果</h2>
            <p>如果当前还没选择学校，可以先回到学校列表把学校加入对比。</p>
          </div>
          {compareSchools.length ? (
            <div className="compare-grid">
              {compareSchools.map((school) => (
                <article key={school.id} className="compare-card">
                  <div className="compare-card-head">
                    <h3>{school.name}</h3>
                    <p>{getSchoolDistrictName(school)} · {getSchoolStage(school)}</p>
                  </div>
                  <dl className="school-detail-facts">
                    <div><dt>办学性质</dt><dd>{getSchoolOwnershipLabel(school)}</dd></div>
                    <div><dt>学校类型</dt><dd>{getSchoolType(school)}</dd></div>
                    <div><dt>培养方向</dt><dd>{getSchoolTrainingDirections(school).join('、') || '待补充'}</dd></div>
                    <div><dt>电话</dt><dd>{school.phone || '暂无'}</dd></div>
                  </dl>
                  <p className="school-detail-note">{getSchoolAdmissionInfo(school)}</p>
                  <div className="school-direction-row school-direction-row-large">
                    {getSchoolTrainingDirections(school).map((item) => <span key={item} className="direction-chip">{item}</span>)}
                  </div>
                  <div className="compare-points">
                    <h4>学校亮点</h4>
                    <ul>
                      {(getSchoolHighlights(school).length ? getSchoolHighlights(school) : ['亮点信息待补充']).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="compare-points">
                    <h4>适合关注</h4>
                    <p>{getSchoolSuitableStudents(school) || '待补充'}</p>
                  </div>
                  <div className="compare-card-actions">
                    <Link className="text-link" href={`/schools/${school.id}`}>查看学校详情</Link>
                    <Link className="text-link" href={`/schools?district=${school.districtId}`}>回到该区列表</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>还没有学校进入对比</h3>
              <p>先去学校列表里把学校加入对比，再回来统一比较。</p>
              <Link className="module-link" href="/schools">去选择学校</Link>
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
