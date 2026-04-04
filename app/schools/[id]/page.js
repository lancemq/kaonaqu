import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import {
  getSchoolAdmissionInfo,
  getSchoolApplicationTips,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolHighlights,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolSuitableStudents,
  getSchoolTags,
  getSchoolTrainingDirections,
  getSchoolType
} from '../../../lib/site-utils';

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

  return schools.find((item) => item.id === normalizedId) || schools.find((item) => item.id === decodedId) || null;
}

function getDistrictPeers(schools, current) {
  return schools
    .filter((school) => school.id !== current.id && school.districtId === current.districtId)
    .slice(0, 3);
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
    description: `${school.name}学校详情页，查看学校画像、招生路径、课程结构和择校提示。`
  };
}

export default async function SchoolDetailPage({ params }) {
  const { schools } = await loadDataStore();
  const { id } = await params;
  const school = resolveSchoolById(schools, id);

  if (!school) {
    notFound();
  }

  const districtPeers = getDistrictPeers(schools, school);
  const highlights = getSchoolHighlights(school);
  const features = getSchoolFeatures(school);
  const trainingDirections = getSchoolTrainingDirections(school);
  const suitableStudents = getSchoolSuitableStudents(school);
  const applicationTips = getSchoolApplicationTips(school);
  const tags = getSchoolTags(school);

  const schoolAttribute = school.tier || getSchoolOwnershipLabel(school) || '学校属性待补充';
  const schoolTemperament = trainingDirections[0] || '综合型';
  const schoolHeat = tags.length >= 4 ? '高关注' : '持续关注';
  const summaryPoints = [highlights[0], highlights[1], trainingDirections[0] || features[0]].filter(Boolean).slice(0, 3);

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero" id="top">
        <section className="search-panel school-prototype-hero" aria-label="学校详情">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">
                学校库 / {getSchoolDistrictName(school)} / {getSchoolStage(school)} / {schoolAttribute}
              </p>
              <h1>{school.name}</h1>
              <p className="school-prototype-subtitle">
                {school.schoolDescription || getSchoolAdmissionInfo(school) || '学术强校、课程体系与校园节奏兼具，是上海家长高频检索的学校之一。'}
              </p>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">学校定位</p>
                <h2>
                  {highlights[0]
                    || '重学术、强课程、节奏快。更适合自驱力强、目标清晰、能承受高密度学习环境的学生。'}
                </h2>
                <p>
                  先看招生路径和课程方向，再判断学校节奏、竞争环境和孩子的适配度。
                </p>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats">
        <article>
          <strong>{schoolAttribute}</strong>
          <span>学校属性</span>
        </article>
        <article>
          <strong>{getSchoolDistrictName(school)}</strong>
          <span>所在区域</span>
        </article>
        <article>
          <strong>{schoolTemperament}</strong>
          <span>培养气质</span>
        </article>
        <article>
          <strong>{schoolHeat}</strong>
          <span>家长检索热度</span>
        </article>
      </section>

      <main className="layout school-prototype-layout">
        <section className="school-prototype-main">
          <section className="school-prototype-panel">
            <p className="overview-label">学校概览</p>
            <h2>{school.name}</h2>
            <p>{school.schoolDescription || getSchoolAdmissionInfo(school) || '学校基础信息已整理，可结合培养方向和招生路径继续判断。'}</p>
            <div className="school-prototype-highlight-grid">
              {summaryPoints.map((item, index) => (
                <article key={`${item}-${index}`} className="school-prototype-highlight-card">
                  <span>重点 {index + 1}</span>
                  <strong>{item}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="school-prototype-panel" id="admission-path">
            <p className="overview-label">招生要求</p>
            <h2>先确认进入路径，再判断学校节奏是否匹配。</h2>
            <p>{getSchoolAdmissionInfo(school) || '当前已收录这所学校的基础招生信息，建议结合区域政策和学校节奏一起判断。'}</p>
            <p>{applicationTips || '建议把通勤距离、孩子适应节奏和学校课程方向一起考虑，不要只看学校名气。'}</p>
          </section>

          <section className="school-prototype-panel">
            <p className="overview-label">适合谁</p>
            <p>适合：{suitableStudents || '自驱力强、学术兴趣稳定、能适应高标准同伴环境的学生。'}</p>
            <p>谨慎考虑：{applicationTips || '更需要松弛节奏、对竞争氛围敏感，或尚未找到明确学习目标的学生。'}</p>
          </section>
        </section>

        <aside className="school-prototype-side">
          <section className="school-prototype-side-card">
            <p className="overview-label">学校速览</p>
            <p>办学属性：{schoolAttribute}</p>
            <p>培养方向：{trainingDirections.slice(0, 2).join('、') || '综合培养'}</p>
            <p>核心关键词：{[...features.slice(0, 2), ...tags.slice(0, 2)].filter(Boolean).join('、') || '课程深度、校园节奏、区域关注'}</p>
          </section>

          <section className="school-prototype-side-card school-prototype-side-dark">
            <p className="overview-label">同区学校</p>
            {districtPeers.length ? districtPeers.map((peer) => (
              <Link key={peer.id} className="school-prototype-side-link" href={`/schools/${peer.id}`}>
                • {peer.name}
              </Link>
            )) : (
              <>
                <Link className="school-prototype-side-link" href={`/schools?district=${school.districtId}`}>• {getSchoolDistrictName(school)} 区学校列表</Link>
                <Link className="school-prototype-side-link" href="/schools">• 返回学校信息汇总页</Link>
              </>
            )}
          </section>
        </aside>
      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 学校信息详情页</span>
        <span>学校画像 / 招生路径 / 课程结构 / FAQ</span>
      </footer>
    </SiteShell>
  );
}
