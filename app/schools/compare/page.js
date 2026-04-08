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
        <section className="schools-datadesk-hero schools-compare-datadesk-hero" aria-label="学校对比">
          <nav className="breadcrumb" aria-label="面包屑导航">
            <Link href="/">首页</Link>
            <span className="separator">/</span>
            <Link href="/schools">学校信息</Link>
            <span className="separator">/</span>
            <span>学校对比</span>
          </nav>
          <div className="schools-datadesk-hero-grid schools-compare-datadesk-hero-grid">
            <div className="schools-datadesk-intro schools-compare-datadesk-intro">
              <h1>学校对比</h1>
              <p className="schools-datadesk-subtitle">把 2 到 4 所学校放在同一屏里看，优先比较学段、办学性质、培养方向和报考提醒。</p>
              <p className="schools-datadesk-description">这一页更适合已经缩到少量候选学校的家庭。先看方向和提醒，再决定回区页继续收窄，还是直接进入单校详情。</p>
              <div className="schools-datadesk-inline-meta">
                <span>Compare Desk</span>
                <span>建议控制在 2-4 所学校内</span>
              </div>
            </div>
            <div className="schools-datadesk-summary-grid schools-compare-datadesk-summary-grid">
              <article className="schools-datadesk-summary-card schools-datadesk-summary-card-strong">
                <span>已选学校</span>
                <strong>{compareSchools.length}</strong>
                <p>当前进入对比台的学校数量</p>
              </article>
              <article className="schools-datadesk-summary-card">
                <span>建议数量</span>
                <strong>2-4</strong>
                <p>方便在同屏内保持有效比较</p>
              </article>
              <article className="schools-datadesk-summary-card">
                <span>比较重点</span>
                <strong>方向 / 提醒</strong>
                <p>优先看培养和报考提醒，而不是只看标签</p>
              </article>
            </div>
          </div>
        </section>
      </header>

      <main className="layout schools-compare-datadesk-layout">
        <section className="schools-datadesk-panel schools-compare-datadesk-panel">
          <div className="schools-datadesk-results-head schools-compare-datadesk-head">
            <div>
              <span className="overview-label">Compare Result</span>
              <h2>对比结果</h2>
              <p>如果当前还没选择学校，可以先回到学校列表把学校加入对比。</p>
            </div>
            <div className="schools-datadesk-inline-meta">
              <span>同屏比较</span>
              <span>支持直接进入学校详情</span>
            </div>
          </div>
          {compareSchools.length ? (
            <div className="compare-grid schools-compare-datadesk-grid">
              {compareSchools.map((school) => (
                <Link key={school.id} className="compare-card compare-card-link schools-compare-datadesk-card" href={`/schools/${school.id}`}>
                  <div className="compare-card-head schools-compare-datadesk-cardhead">
                    <div>
                      <p className="schools-datadesk-cardkicker">{getSchoolDistrictName(school)} / {getSchoolStage(school)} / {getSchoolOwnershipLabel(school)}</p>
                      <h3>{school.name}</h3>
                    </div>
                    <div className="schools-datadesk-cardmeta">
                      <span>{getSchoolType(school)}</span>
                    </div>
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
                  <div className="compare-card-actions schools-compare-datadesk-actions">
                    <span className="school-card-footnote">{getSchoolDistrictName(school)} 学校列表</span>
                    <span className="school-card-footnote">学校详情</span>
                  </div>
                </Link>
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
