import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import {
  getSchoolApplicationTips,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolHighlights,
  getSchoolOwnershipLabel,
  getSchoolRelationMeta,
  getSchoolStage,
  getSchoolSuitableStudents,
  getSchoolSystem,
  getSchoolTags,
  getSchoolTrainingDirections,
  getSchoolType
} from '../../../lib/site-utils';
import schoolOpenDays from '../../../lib/school-open-days';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

function resolveSchoolById(schools, rawId) {
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const normalizedId = String(id || '');
  const decodedId = (() => {
    try {
      return decodeURIComponent(normalizedId);
    } catch {
      return normalizedId;
    }
  })();

  return (
    schools.find((item) => item.id === normalizedId)
    || schools.find((item) => item.id === decodedId)
    || null
  );
}

function buildSystemPeers(schools, current) {
  const system = getSchoolSystem(current);
  if (!system?.id) return [];

  return schools
    .filter((school) => school.id !== current.id && getSchoolSystem(school)?.id === system.id)
    .slice(0, 8);
}

function getDistrictPeers(schools, current) {
  return schools
    .filter((school) => school.id !== current.id && school.districtId === current.districtId)
    .slice(0, 6);
}

export async function generateMetadata({ params }) {
  const { schools } = await loadDataStore();
  const { id } = await params;
  const school = resolveSchoolById(schools, id);

  if (!school) {
    return { title: '学校详情 | 考哪去' };
  }

  return {
    title: `${school.name} | 学校详情 | 考哪去`,
    description: `${school.name}学校详情页，查看学段、办学性质、标签、特色、招生说明和官网信息。`
  };
}

export default async function SchoolDetailPage({ params }) {
  const { schools, news } = await loadDataStore();
  const { id } = await params;
  const school = resolveSchoolById(schools, id);

  if (!school) {
    notFound();
  }

  const systemPeers = buildSystemPeers(schools, school);
  const districtPeers = getDistrictPeers(schools, school);
  const schoolSystem = getSchoolSystem(school);
  const relatedOpenDays = schoolOpenDays.filter((item) => item.schoolName.includes(school.name) || school.name.includes(item.schoolName)).slice(0, 3);
  const relatedNews = news
    .filter((item) => {
      const title = `${item.title || ''} ${item.summary || ''}`;
      return school.name.includes(title) || title.includes(school.name.replace(/^上海市?/, ''));
    })
    .slice(0, 3);

  return (
    <SiteShell>
      <header className="hero" id="top">
        <section className="search-panel editorial-intro-panel school-detail-hero" aria-label="学校详情">
          <nav className="breadcrumb" aria-label="面包屑导航">
            <Link href="/">首页</Link>
            <span className="separator">/</span>
            <Link href="/schools">学校信息</Link>
            <span className="separator">/</span>
            <span>{school.name}</span>
          </nav>
          <div className="school-detail-head">
            <div className="school-detail-copy">
              <div className="school-detail-kicker-row">
                <span className="stage-badge stage-badge-complete">{getSchoolStage(school)}</span>
                <span className={getSchoolRelationMeta(school).className}>{getSchoolRelationMeta(school).label}</span>
                <span className="pill school-type-pill">{getSchoolType(school)}</span>
              </div>
              <h1>{school.name}</h1>
              <p>{getSchoolAdmissionInfo(school)}</p>
              <div className="featured-school-meta school-detail-meta-row">
                <span>{getSchoolDistrictName(school)}</span>
                <span>{getSchoolOwnershipLabel(school)}</span>
                <span>{school.tier ? `${school.tier} 梯队` : '梯队待补充'}</span>
              </div>
            </div>
            <div className="school-detail-metrics">
              <article>
                <span>学校标签</span>
                <strong>{getSchoolTags(school).length}</strong>
              </article>
              <article>
                <span>学校特色</span>
                <strong>{getSchoolFeatures(school).length}</strong>
              </article>
              <article>
                <span>培养方向</span>
                <strong>{getSchoolTrainingDirections(school).length}</strong>
              </article>
            </div>
          </div>
        </section>
      </header>

      <main className="layout school-detail-layout">
        <section className="content-main">
          <section className="panel main-panel">
            <div className="section-heading">
              <h2>学校概览</h2>
              <p>整理学校的学段、办学性质、基础信息、标签和特色，便于快速判断是否值得继续跟进。</p>
            </div>
            <div className="school-detail-fact-grid">
              <article className="school-detail-fact-card">
                <h3>基础信息</h3>
                <dl className="school-detail-facts">
                  <div><dt>区域</dt><dd>{getSchoolDistrictName(school)}</dd></div>
                  <div><dt>学段</dt><dd>{getSchoolStage(school)}</dd></div>
                  <div><dt>办学性质</dt><dd>{getSchoolOwnershipLabel(school)}</dd></div>
                  <div><dt>学校类型</dt><dd>{getSchoolType(school)}</dd></div>
                  <div><dt>地址</dt><dd>{school.address || '暂无'}</dd></div>
                  <div><dt>电话</dt><dd>{school.phone || '暂无'}</dd></div>
                </dl>
              </article>
              <article className="school-detail-fact-card">
                <h3>学校描述</h3>
                <p className="school-detail-note">{school.schoolDescription || getSchoolAdmissionInfo(school)}</p>
              </article>
              <article className="school-detail-fact-card">
                <h3>招生要求</h3>
                <p className="school-detail-note">{school.admissionRequirements || getSchoolAdmissionInfo(school)}</p>
                <div className="school-detail-action-row">
                  {school.website ? <a className="text-link" href={school.website} target="_blank" rel="noreferrer">查看学校官网</a> : null}
                  <Link className="text-link" href={`/schools/compare?ids=${encodeURIComponent(school.id)}`}>加入学校对比</Link>
                  <Link className="text-link" href="/schools">返回学校列表</Link>
                </div>
              </article>
            </div>
          </section>

          <section className="panel main-panel">
            <div className="section-heading">
              <h2>择校参考</h2>
              <p>把这所学校更值得快速判断的内容拆成亮点、适合关注人群和报考提醒，方便连续阅读。</p>
            </div>
            <div className="school-detail-fact-grid">
              <article className="school-detail-fact-card">
                <h3>学校亮点</h3>
                <div className="school-detail-feature-grid">
                  {getSchoolHighlights(school).length ? getSchoolHighlights(school).map((item) => (
                    <article key={item} className="school-detail-feature-card">
                      <p>{item}</p>
                    </article>
                  )) : (
                    <p className="school-detail-note">这所学校的结构化亮点还在继续补充中。</p>
                  )}
                </div>
              </article>
              <article className="school-detail-fact-card">
                <h3>适合关注</h3>
                <p className="school-detail-note">{getSchoolSuitableStudents(school) || '这所学校的适合人群画像还在继续补充中。'}</p>
              </article>
              <article className="school-detail-fact-card">
                <h3>报考提醒</h3>
                <p className="school-detail-note">{getSchoolApplicationTips(school) || '这所学校的报考提醒还在继续补充中。'}</p>
              </article>
            </div>
          </section>

          <section className="panel main-panel">
            <div className="section-heading">
              <h2>培养方向</h2>
              <p>把这所学校更适合从哪条路线理解单独拆出来，方便快速判断是否值得继续深看。</p>
            </div>
            <div className="school-direction-row school-direction-row-large">
              {getSchoolTrainingDirections(school).length
                ? getSchoolTrainingDirections(school).map((item) => <span key={item} className="direction-chip">{item}</span>)
                : <span className="direction-chip direction-chip-muted">培养方向待补充</span>}
            </div>
          </section>

          <section className="panel main-panel">
              <div className="section-heading">
                <h2>标签与特色</h2>
                <p>把前台检索用标签和学校画像分开展示，方便你判断这所学校真正的辨识度。</p>
              </div>
            <div className="school-detail-chip-group">
              {getSchoolTags(school).length
                ? getSchoolTags(school).map((tag) => <span key={tag} className="meta-chip">{tag}</span>)
                : <span className="meta-chip meta-chip-muted">暂无标签</span>}
            </div>
            <div className="school-detail-feature-grid">
              {getSchoolFeatures(school).length ? getSchoolFeatures(school).map((feature) => (
                <article key={feature} className="school-detail-feature-card">
                  <h3>{feature}</h3>
                  <p>已纳入当前学校条目的重点画像，后续还可以继续补充课程、开放日和招生方向信息。</p>
                </article>
              )) : (
                <div className="empty-state">
                  <h3>特色待补充</h3>
                  <p>这所学校当前的特色信息还比较少，可以继续补充课程、项目和招生线索。</p>
                </div>
              )}
            </div>
          </section>

          {systemPeers.length ? (
            <section className="panel main-panel">
              <div className="section-heading">
                <h2>同体系学校</h2>
                <p>如果这所学校属于同一教育体系、主校或分校链路，可以在这里继续横向比较。</p>
              </div>
              <div className="school-detail-related-grid">
                {systemPeers.map((peer) => (
                  <Link key={peer.id} className="district-preview-card school-detail-related-card" href={`/schools/${peer.id}`}>
                    <h3>{peer.name}</h3>
                    <p>{peer.districtName} · {getSchoolStage(peer)} · {getSchoolType(peer)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>

        <aside className="content-side">
          {schoolSystem?.id ? (
            <section className="panel side-panel">
              <div className="section-heading">
                <h2>学校体系</h2>
                <p>如果这所学校属于明确的主校、分校或校区链路，可以从这里继续扩展比较。</p>
              </div>
              <div className="district-card">
                <div className="district-card-header">
                  <h3>{schoolSystem.name}</h3>
                  <span>{getSchoolRelationMeta(school).label}</span>
                </div>
                <p>{schoolSystem.description || '适合结合主校、分校和校区一起判断。'}</p>
              </div>
            </section>
          ) : null}

          {relatedOpenDays.length ? (
            <section className="panel side-panel">
              <div className="section-heading">
                <h2>开放日与招简</h2>
                <p>这所学校当前可查的招生简章或开放日入口会集中放在这里。</p>
              </div>
              <div className="open-day-list">
                {relatedOpenDays.map((item) => (
                  <article key={item.id} className="open-day-card">
                    <div className="open-day-meta">
                      <span className="pill">{item.tag}</span>
                      <span>{item.window}</span>
                    </div>
                    <h3>{item.schoolName}</h3>
                    <p>{item.summary}</p>
                    <p className="open-day-note">{item.detail}</p>
                    <a className="text-link" href={item.href} target="_blank" rel="noreferrer">查看原页</a>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {districtPeers.length ? (
            <section className="panel side-panel">
              <div className="section-heading">
                <h2>同区域学校</h2>
                <p>从同一区域里再看几所学校，适合做横向比较。</p>
              </div>
              <div className="district-card-actions" style={{ marginBottom: 16 }}>
                <Link className="text-link" href={`/schools/district/${school.districtId}`}>进入{getSchoolDistrictName(school)}专题</Link>
                <Link className="text-link" href={`/schools?district=${school.districtId}`}>回到该区列表</Link>
              </div>
              <div className="district-grid">
                {districtPeers.map((peer) => (
                  <Link key={peer.id} className="district-card" href={`/schools/${peer.id}`}>
                    <div className="district-card-header">
                      <h3>{peer.name}</h3>
                      <span>{getSchoolStage(peer)}</span>
                    </div>
                    <p>{getSchoolType(peer)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {relatedNews.length ? (
            <section className="panel side-panel">
              <div className="section-heading">
                <h2>相关动态</h2>
                <p>如果新闻库里已有这所学校的公开动态，会在这里给出入口。</p>
              </div>
              <div className="open-day-list">
                {relatedNews.map((item) => (
                  <article key={item.id} className="open-day-card">
                    <div className="open-day-meta">
                      <span className="pill">{item.category || item.newsType}</span>
                      <span>{item.publishedAt || '暂无日期'}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary || '暂无摘要'}</p>
                    {item.source?.url ? <a className="text-link" href={item.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </main>
    </SiteShell>
  );
}
