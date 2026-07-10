import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import {
  clipText,
  formatSchoolUpdate,
  getDistrictSchoolTopic,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolTrainingDirections,
  getSchoolType
} from '../../../../lib/site-utils';
import { getSchoolOverview } from '../../../../lib/school-content';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../../shared/data-store');

export const revalidate = 86400;

function buildCardTags(school) {
  const values = [
    ...(school.tags || []),
    ...(school.features || []),
    ...getSchoolTrainingDirections(school)
  ].filter(Boolean);
  return Array.from(new Set(values)).slice(0, 4);
}

function sortSchoolsBySignal(list) {
  return list
    .slice()
    .sort((left, right) => {
      const rightSignal = (right.features?.length || 0) + (right.tags?.length || 0);
      const leftSignal = (left.features?.length || 0) + (left.tags?.length || 0);
      return rightSignal - leftSignal || String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
    });
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

export async function generateMetadata({ params }) {
  const { districts } = await loadDataStore();
  const { district } = await params;
  const districtInfo = districts.find((item) => item.id === district);
  if (!districtInfo) {
    return { title: '区级学校专题 | 考哪去' };
  }

  return {
    title: `${districtInfo.name}初中高中学校名单 - 上海16区学校查询 | 考哪去`,
    description: `查看${districtInfo.name}学校分布、${districtInfo.name}重点初中高中名单、办学类型与培养方向，上海升学择校参考。`,
    keywords: [districtInfo.name, '上海学校', '初中', '高中', '择校', `${districtInfo.name}教育`],
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      siteName: '考哪去',
      title: `${districtInfo.name}初中高中学校名单 - 上海16区学校查询 | 考哪去`,
      description: `查看${districtInfo.name}学校分布、重点初中高中与培养方向。`
    }
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
  const sortedSchools = sortSchoolsBySignal(districtSchools);
  const stageBuckets = {
    junior: sortedSchools.filter((school) => school.schoolStage === 'junior'),
    senior_high: sortedSchools.filter((school) => school.schoolStage === 'senior_high'),
    complete: sortedSchools.filter((school) => school.schoolStage === 'complete')
  };
  const featured = sortedSchools.slice(0, 6);
  const latestUpdated = formatSchoolUpdate(sortedSchools[0]?.updatedAt);
  const relatedDistricts = districts
    .filter((item) => item.id !== districtInfo.id)
    .slice()
    .sort((left, right) => Number(right.schoolCount || 0) - Number(left.schoolCount || 0))
    .slice(0, 5);
  const stageGroups = [
    { id: 'senior_high', label: '高中', items: stageBuckets.senior_high, note: '适合中招阶段直接比较高中。' },
    { id: 'junior', label: '初中', items: stageBuckets.junior, note: '适合小升初与初中阶段择校。' },
    { id: 'complete', label: '完全中学', items: stageBuckets.complete, note: '适合关注初高中贯通培养路径。' }
  ].filter((group) => group.items.length);
  const topStage = stageGroups.slice().sort((left, right) => right.items.length - left.items.length)[0];
  const districtOverview = districtInfo.districtOverview || `${districtInfo.name}学校信息持续整理中，可先按学段和办学性质查看区内学校结构。`;
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${districtInfo.name}学校列表`,
    description: `${districtInfo.name}初中高中学校信息`,
    numberOfItems: districtSchools.length
  };

  return (
    <main className="schools-aerial-page district-channel-page district-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <SiteNav />

      <header className="channel-hero district-detail-hero" id="top">
        <div className="channel-hero-content">
          <section className="channel-hero-copy" aria-label={`${districtInfo.name}学校专题概览`}>
            <div className="district-channel-breadcrumb"><Link href="/schools">学校</Link><span>/</span><Link href="/schools/district">区域频道</Link><span>/</span><strong>{districtInfo.name}</strong></div>
            <SectionKicker>DISTRICT DATABASE</SectionKicker>
            <h1>{districtInfo.name}学校专题</h1>
            <p>{getDistrictSchoolTopic(districtInfo)}</p>
          </section>

          <aside className="channel-hero-stats" aria-label={`${districtInfo.name}学校统计`}>
            <article><strong>{districtSchools.length}</strong><span>学校总量</span></article>
            <article><strong>{stageBuckets.senior_high.length}</strong><span>高中样本</span></article>
            <article><strong>{stageBuckets.junior.length}</strong><span>初中样本</span></article>
            <article><strong>{stageBuckets.complete.length}</strong><span>完全中学</span></article>
          </aside>
        </div>
      </header>

      <section className="district-channel-overview" aria-label={`${districtInfo.name}区域概况`}>
        <div>
          <h2>区域概况</h2>
          <p>{districtOverview}</p>
        </div>
        <div className="district-channel-overview-stats">
          <article><strong>{latestUpdated}</strong><span>最近更新</span></article>
          <article><strong>{topStage?.label || '学段'}</strong><span>主要学段</span></article>
          <article><strong>{districtSchools.filter((school) => school.schoolPropertyLabel === '民办').length}</strong><span>民办记录</span></article>
        </div>
      </section>

      {featured.length ? (
        <section className="district-channel-section district-channel-highlights" aria-label={`${districtInfo.name}优先学校`}>
          <SectionKicker>HIGHLIGHTS</SectionKicker>
          <h2>{districtInfo.name}优先学校</h2>
          <div className="district-channel-featured-grid">
            {featured.slice(0, 3).map((school) => (
              <Link className="district-channel-featured-card" href={`/schools/${school.id}`} key={school.id}>
                <div><span>{getSchoolStage(school)}</span><em>{getSchoolType(school) || '学校档案'}</em></div>
                <strong>{school.name}</strong>
                <p>{clipText(getSchoolAdmissionInfo(school) || getSchoolOverview(school) || '学校信息持续整理中。', 46)}</p>
                <b>进入 →</b>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="district-channel-schools" aria-label={`${districtInfo.name}学校列表`}>
        <div className="district-channel-main-list">
          <div className="district-channel-list-head">
            <div>
              <SectionKicker>SCHOOLS</SectionKicker>
              <h2>{districtInfo.name}学校列表</h2>
            </div>
            <p>按资料完整度和特色标签优先展示，点击进入学校详情。</p>
          </div>

          <div className="district-channel-row-list">
            {sortedSchools.map((school) => {
              const tags = buildCardTags(school);
              return (
                <Link className="district-channel-row district-detail-school-row" href={`/schools/${school.id}`} key={school.id}>
                  <div className="district-channel-row-info">
                    <strong>{school.name}</strong>
                    <span>{getSchoolDistrictName(school)} / {getSchoolStage(school)} / {getSchoolOwnershipLabel(school) || '学校信息'}</span>
                    <em>{clipText(getSchoolAdmissionInfo(school) || getSchoolOverview(school) || '学校信息持续整理中。', 62)}</em>
                    {tags.length ? <small>{tags.join(' · ')}</small> : null}
                  </div>
                  <div className="district-channel-row-score">
                    <strong>{getSchoolType(school) || '—'}</strong>
                    <span>{formatSchoolUpdate(school.updatedAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="district-channel-sidebar" aria-label={`${districtInfo.name}侧栏`}>
          <section className="channel-side-card">
            <SectionKicker>STAGE</SectionKicker>
            <h2>学段分布</h2>
            {stageGroups.map((group, index) => (
              <Link className={index === 0 ? 'is-active' : undefined} href={`/schools?district=${districtInfo.id}&stage=${group.id}`} key={group.id}>
                <span>{group.label} · {group.items.length} 所</span>
                <i>→</i>
              </Link>
            ))}
          </section>

          <section className="channel-side-card">
            <SectionKicker>RELATED</SectionKicker>
            <h2>周边区域</h2>
            {relatedDistricts.map((item) => (
              <Link href={`/schools/district/${item.id}`} key={item.id}>
                <span>{item.name} · {item.schoolCount || 0} 所</span>
                <i>→</i>
              </Link>
            ))}
          </section>

          <section className="channel-side-card is-dark">
            <SectionKicker>TOOLS</SectionKicker>
            <h2>区域工具</h2>
            <Link href="/schools"><span>学校数据库</span><i>→</i></Link>
            <Link href="/schools/compare"><span>学校对比</span><i>→</i></Link>
            <Link href="/schools/score-match"><span>分数匹配</span><i>→</i></Link>
          </section>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
