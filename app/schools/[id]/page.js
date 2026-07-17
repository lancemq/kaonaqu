import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import { getSchoolDataQuality } from '../../../lib/school-data-quality';
import {
  getSchoolAdmissionStructured,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolOwnershipLabel,
  getSchoolStage,
  getSchoolTags,
  getSchoolTrainingDirections
} from '../../../lib/site-utils';
import { renderBlocks } from '../../../components/BlockRenderer';
import { getSchoolOverview } from '../../../lib/school-content';

const require = createRequire(import.meta.url);
const { loadDataStore, getSchoolById } = require('../../../shared/data-store');

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
  const { id } = await params;
  // 详情页需完整记录（content/scoreLines/admissionInfo），按 id 单校完整查询
  // （响应极小，经 Next Data Cache 按 id 缓存；loadDataStore 已瘦身去掉 content）。
  const school = await getSchoolById(id);

  if (!school) {
    notFound();
  }

  const features = getSchoolFeatures(school);
  const trainingDirections = getSchoolTrainingDirections(school);
  const tags = getSchoolTags(school);
  const dataQuality = getSchoolDataQuality(school);
  const districtName = getSchoolDistrictName(school);
  const stageName = getSchoolStage(school);
  const ownershipName = getSchoolOwnershipLabel(school) || school.schoolPropertyLabel || '';
  const schoolAttribute = school.schoolKeyLevel || ownershipName || '—';
  const schoolSummary = getSchoolOverview(school);
  const admissionInfo = getSchoolAdmissionStructured(school);
  const hasAdmission = Boolean(admissionInfo.code || admissionInfo.methods.length || admissionInfo.routes.length || admissionInfo.notes);

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
    ownershipName ? { text: ownershipName, type: 'ownership' } : null
  ].filter(Boolean);
  const headerStats = [
    [school.foundingYear || '—', '建校时间'],
    [ownershipName || '—', '学校性质'],
    [stageName || '—', '学段'],
    [school.group || schoolAttribute || '—', '学校体系']
  ];
  const sections = [
    ['办学特色', features.join('、') || trainingDirections.join('、') || '']
  ].filter(([, text]) => String(text || '').trim());
  const scoreLines = Array.isArray(school.scoreLines) ? school.scoreLines : [];
  const normalizeScoreYear = (y) => {
    const s = String(y || '').trim();
    return /^\d{4}$/.test(s) ? `${s}年` : (s || '—');
  };
  const scoreRows = scoreLines.length
    ? scoreLines.map((row) => [
        normalizeScoreYear(row.year),
        String(row.score ?? row.minScore ?? '').trim() || '—'
      ])
    : [
        ['2025年', school.score2025],
        ['2024年', school.score2024],
        ['2023年', school.score2023]
      ].filter(([, score]) => score);
  const scoreLineNote = (scoreLines.find((r) => r.note && String(r.note).trim()) || {}).note || '';
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
    ['办学属性', school.schoolPropertyLabel || ''],
    ['学校类型', school.categoryName || school.category || school.schoolKeyLevel || ''],
    ['所在区域', districtName],
    ['学段', stageName]
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
          {Array.isArray(school.content) && school.content.length
            ? renderBlocks(school.content, { sectionClass: 'school-pencil-section' })
            : null}

          {sections.map(([title, text]) => (
            <section className="school-pencil-section" key={title}>
              <h2>{title}</h2>
              <p>{renderInlineMarkdown(text)}</p>
            </section>
          ))}

          {hasAdmission ? (
            <section className="school-pencil-section school-pencil-admission" key="admission">
              <h2>招生信息</h2>
              {admissionInfo.code ? (
                <div className="school-pencil-admission-code">
                  <span>招生代码</span>
                  <strong>{admissionInfo.code}</strong>
                </div>
              ) : null}
              {admissionInfo.methods.length ? (
                <div className="school-pencil-admission-block">
                  <h3>招生方式</h3>
                  <ul className="school-pencil-admission-chips">
                    {admissionInfo.methods.map((m, i) => {
                      const label = typeof m === 'string' ? m : (m.route || m.name || m.label || m.type || '');
                      const tip = typeof m === 'object' ? (m.description || m.stage || '') : '';
                      return <li key={`${label}-${i}`} title={tip}>{label}</li>;
                    })}
                  </ul>
                </div>
              ) : null}
              {admissionInfo.routes.length ? (
                <div className="school-pencil-admission-block">
                  <h3>升学路径</h3>
                  <ul className="school-pencil-admission-chips">
                    {admissionInfo.routes.map((r, i) => {
                      const label = typeof r === 'string' ? r : (r.type || r.name || r.label || r.route || '');
                      const tip = typeof r === 'object' ? (r.description || (r.year ? `${r.year}年` : '') || '') : '';
                      return <li key={`${label}-${i}`} title={tip}>{label}</li>;
                    })}
                  </ul>
                </div>
              ) : null}
              {admissionInfo.notes ? (
                <p className="school-pencil-admission-notes">{admissionInfo.notes}</p>
              ) : null}
            </section>
          ) : (
            <section className="school-pencil-section school-pencil-admission is-empty" key="admission">
              <h2>招生信息</h2>
              <p className="school-pencil-admission-notes">该校招生信息以当年上海市及本区教育局发布的官方文件为准。</p>
            </section>
          )}

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
                <div className="score-head"><span>年份</span><span>录取分数</span></div>
                {scoreRows.map(([year, score]) => (
                  <div className="score-row" key={year}>
                    <strong>{year}</strong>
                    <b className={/^[0-9]/.test(score) ? '' : 'is-text'}>{score}</b>
                  </div>
                ))}
              </div>
              {scoreLineNote ? <p className="school-pencil-score-note">{scoreLineNote}</p> : null}
            </section>
          ) : null}

          {admissionRows.length ? (
            <section className="school-pencil-card">
              <div className="school-pencil-kicker"><span></span><p>OUTCOMES</p></div>
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
