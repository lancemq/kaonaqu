import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import { getSchoolDataQuality } from '../../../lib/school-data-quality';
import {
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolTags,
  getSchoolTrainingDirections
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

function renderInlineMarkdown(text) {
  const parts = [];
  const value = String(text || '');
  const regex = /\[([^\]]+)\]\(([^)]*)\)|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      parts.push(
        <a key={`link-${match.index}`} className="text-link" href={match[2]} target="_blank" rel="noreferrer">
          {match[1] || match[2]}
        </a>
      );
    } else {
      parts.push(<strong key={`strong-${match.index}`}>{match[3]}</strong>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
}

function formatSchoolMonth(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})[-/.](\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, '0')}` : text;
}

export async function generateMetadata({ params }) {
  const { schools } = await loadDataStore();
  const { id } = await params;
  const school = resolveSchoolById(schools, id);

  if (!school) {
    return { title: '学校详情 | 考哪去' };
  }

  const district = getSchoolDistrictName(school);
  const stage = getSchoolStage(school);
  const ownership = getSchoolOwnershipLabel(school);
  const features = getSchoolFeatures(school).slice(0, 3).join('、');

  return {
    title: `${school.name}（${district}${ownership}${stage}）招生联系方式 | 考哪去`,
    description: `${school.name}位于${district}，${ownership}${stage}。${features ? '特色：' + features : ''}查看学校画像、招生路径与择校提示。`,
    keywords: [school.name, district, stage, ownership, '上海学校', '招生', '择校'].filter(Boolean),
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      siteName: '考哪去',
      title: `${school.name}（${district}${ownership}${stage}）招生联系方式 | 考哪去`,
      description: `${school.name}位于${district}，${ownership}${stage}。查看学校画像、招生路径与择校提示。`
    }
  };
}

export const revalidate = 86400;

export default async function SchoolDetailPage({ params }) {
  const { schools } = await loadDataStore();
  const { id } = await params;
  const school = resolveSchoolById(schools, id);

  if (!school) {
    notFound();
  }

  const features = getSchoolFeatures(school);
  const trainingDirections = getSchoolTrainingDirections(school);
  const tags = getSchoolTags(school);
  const dataQuality = getSchoolDataQuality(school);
  const districtName = getSchoolDistrictName(school);
  const stageName = getSchoolStage(school);
  const ownershipName = getSchoolOwnershipLabel(school) || school.schoolType || '';
  const schoolAttribute = school.tier || ownershipName || '—';
  const schoolSummary = school.description || '';
  const admissionInfo = getSchoolAdmissionInfo(school);
  const updatedText = formatSchoolMonth(school.updatedAt);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'School',
    'name': school.name,
    'url': `https://kaonaqu.xyz/schools/${encodeURIComponent(school.id)}`,
    ...(schoolSummary ? { 'description': schoolSummary } : {}),
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': school.districtName,
      ...(dataQuality.hasRealAddress ? { 'streetAddress': school.address } : {})
    },
    ...(dataQuality.hasRealPhone ? { 'telephone': school.phone } : {}),
    'areaServed': school.districtName,
    ...(dataQuality.hasRealWebsite ? { 'sameAs': [school.website] } : {})
  };

  const chipItems = [
    districtName ? { text: districtName, type: 'district' } : null,
    stageName ? { text: stageName, type: 'stage' } : null,
    ownershipName ? { text: ownershipName, type: 'ownership' } : null,
    updatedText ? { text: `更新于 ${updatedText}`, type: 'updated' } : null
  ].filter(Boolean);
  const headerStats = [
    [school.foundingYear || '—', '建校时间'],
    [ownershipName || '—', '学校性质'],
    [stageName || '—', '学段'],
    [school.group || schoolAttribute || '—', '学校体系']
  ];
  const sections = [
    ['学校概览', school.description || admissionInfo || ''],
    ['办学成就', school.achievements || ''],
    ['办学特色', features.join('、') || trainingDirections.join('、') || ''],
    ['招生方式', admissionInfo || ''],
    ['升学出口', [
      school.qingbeiCount ? `清北录取：${school.qingbeiCount}` : '',
      school.fudanJiaodaCount ? `复旦交大：${school.fudanJiaodaCount}` : '',
      school.project985Rate ? `985高校：${school.project985Rate}` : '',
      school.firstTierRate ? `一本率：${school.firstTierRate}` : ''
    ].filter(Boolean).join('；')]
  ].filter(([, text]) => String(text || '').trim());
  const scoreRows = Array.isArray(school.scoreLines) && school.scoreLines.length
    ? school.scoreLines.slice(0, 3).map((row) => [row.year, row.score || row.minScore, row.plan || row.batch])
    : [
      ['2025年', school.score2025, school.plan2025],
      ['2024年', school.score2024, school.plan2024],
      ['2023年', school.score2023, school.plan2023]
    ].filter(([, score, plan]) => score || plan);
  const competitionRows = Array.isArray(school.competitions)
    ? school.competitions.slice(0, 5).map((item) => [item.name || item.title, item.count || item.result || item.level])
    : [];
  const courseRows = Array.isArray(school.courses)
    ? school.courses.slice(0, 3).map((item) => [item.name || item.title, item.description || item.desc])
    : [
      school.apCourses ? ['大学先修课程', school.apCourses] : null,
      trainingDirections.length ? ['培养方向', trainingDirections.join('、')] : null
    ].filter(Boolean);
  const featureTags = Array.from(new Set([...features, ...tags, ...trainingDirections])).filter(Boolean).slice(0, 6);
  const basicInfoRows = [
    ['办学属性', school.schoolTypeLabel || ''],
    ['学校类型', school.categoryName || school.category || school.tier],
    ['所在区域', districtName],
    ['学段', stageName],
    ['更新时间', updatedText]
  ].filter(([, value]) => String(value || '').trim());
  const admissionRows = [
    ['清北录取', school.qingbeiCount || school.topUniversityCount],
    ['复旦交大', school.fudanJiaodaCount || school.localTopUniversityCount],
    ['985高校', school.project985Rate || school.keyUniversityRate],
    ['一本率', school.firstTierRate || school.undergraduateRate]
  ].filter(([, value]) => String(value || '').trim());
  const districtHref = school.districtId ? `/schools/district/${school.districtId}` : '';

  return (
    <main className="school-detail-page is-pencil-school-detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="channel-nav" aria-label="顶部导航">
        <Link className="channel-brand" href="/" aria-label="考哪去首页"><strong>考哪去</strong><span>SHANGHAI EDUCATION</span></Link>
        <div className="channel-nav-links"><Link href="/">首页</Link><Link href="/news">新闻</Link><Link className="is-active" href="/schools">学校</Link><Link href="/knowledge">知识</Link></div>
      </nav>

      <nav className="school-pencil-breadcrumb" aria-label="面包屑">
        <Link href="/">首页</Link>
        <i aria-hidden="true">/</i>
        <Link href="/schools">学校</Link>
        <i aria-hidden="true">/</i>
        {districtHref ? (
          <Link href={districtHref}>{districtName}</Link>
        ) : (
          <span>{districtName}</span>
        )}
        <i aria-hidden="true">/</i>
        <span className="is-current">{school.name}</span>
      </nav>

      <header className="school-pencil-header" id="top">
        <div className="school-pencil-chip-row">
          {chipItems.map((item) => <span key={item.type} className={`chip-${item.type}`}>{item.text}</span>)}
        </div>
        <h1>{school.name}</h1>
        {schoolSummary ? <p>{renderInlineMarkdown(schoolSummary)}</p> : null}
        <div className="school-pencil-stats" aria-label="学校关键指标">
          {headerStats.map(([value, label]) => (
            <article key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </header>

      <section className="school-pencil-body">
        <article className="school-pencil-main">
          {sections.map(([title, text]) => (
            <section className="school-pencil-section" key={title}>
              <h2>{title}</h2>
              <p>{renderInlineMarkdown(text)}</p>
            </section>
          ))}

          {competitionRows.length ? (
            <section className="school-pencil-section">
              <h2>竞赛成绩</h2>
              <div className="school-pencil-rows">
                {competitionRows.map(([name, value]) => (
                  <div className="school-pencil-row" key={`${name}-${value}`}>
                    <strong>{name}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {featureTags.length ? (
            <div className="school-pencil-tags">
              <span>FEATURES</span>
              <div className="school-pencil-tags-list">
                {featureTags.map((tag) => <em key={tag}>{tag}</em>)}
              </div>
            </div>
          ) : null}
        </article>

        <aside className="school-pencil-sidebar">
          {basicInfoRows.length ? (
            <section className="school-pencil-card is-dark">
              <div className="school-pencil-kicker"><span></span><p>AT A GLANCE</p></div>
              <h2>基本信息</h2>
              <dl>
                {basicInfoRows.map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </section>
          ) : null}

          {scoreRows.length ? (
            <section className="school-pencil-score">
              <h2>历年分数线</h2>
              <div className="school-pencil-score-table">
                <div><span>年份</span><span>录取分数</span><span>招生计划</span></div>
                {scoreRows.map(([year, score, plan]) => (
                  <div key={`${year}-${score}-${plan}`}>
                    <strong>{year}</strong>
                    <b>{score || '—'}</b>
                    <em>{plan || '—'}</em>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {admissionRows.length ? (
            <section className="school-pencil-card">
              <div className="school-pencil-kicker"><span></span><p>ADMISSION</p></div>
              <h2>升学出口</h2>
              {admissionRows.map(([label, value]) => (
                <p key={label}><span>{label}</span><strong>{value}</strong></p>
              ))}
            </section>
          ) : null}

          {courseRows.length ? (
            <section className="school-pencil-card">
              <h2>特色课程</h2>
              {courseRows.map(([name, desc]) => (
                <article key={`${name}-${desc}`}>
                  <h3>{name}</h3>
                  {desc ? <p>{desc}</p> : null}
                </article>
              ))}
            </section>
          ) : null}
        </aside>
      </section>

      <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <footer className="school-detail-footer"><div><strong>考哪去</strong><span>SHANGHAI EDUCATION PLATFORM</span></div><p>© 2026 考哪去</p></footer>
    </main>
  );
}
