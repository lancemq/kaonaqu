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
const { getSchoolById } = require('../../../shared/data-store');

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
  const { id } = await params;
  const school = await getSchoolById(id);

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

export default async function SchoolDetailPage({ params }) {
  const { id } = await params;
  // 详情页需完整记录（content/scoreLines/admissionInfo），按 id 单校完整查询
  // （响应极小，经 Next Data Cache 按 id 缓存）。
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
  // 同年可能含 统招线 + 名额分配线（已用 plan 区分）；按年份倒序、统招优先排列
  const planRank = (p) => ((p && String(p).includes('统一招生')) ? 0 : 1);
  const scoreRows = scoreLines.length
    ? scoreLines
        .map((row) => ({
          year: normalizeScoreYear(row.year),
          yearNum: Number(row.year) || 0,
          score: String(row.score ?? row.minScore ?? '').trim() || '—',
          plan: row.plan ? String(row.plan).trim() : '',
          note: row.note ? String(row.note).trim() : ''
        }))
        .sort((a, b) => (b.yearNum - a.yearNum) || (planRank(a.plan) - planRank(b.plan)))
    : [
        { year: '2025年', score: school.score2025, plan: '', note: '' },
        { year: '2024年', score: school.score2024, plan: '', note: '' },
        { year: '2023年', score: school.score2023, plan: '', note: '' }
      ].filter((r) => r.score);
  const scoreLineNote = (scoreLines.find((r) => r.note && String(r.note).trim()) || {}).note || '';
  const hasPerRowNote = scoreRows.some((r) => r.note);
  // 高考办学成果（outcome_stats）：按年合并 综评 + 喜报
  const outcomeStats = Array.isArray(school.outcomeStats) ? school.outcomeStats : [];
  const gaokaoEntries = outcomeStats.filter((entry) => entry.exam === '高考');
  const outcomeByYearMap = {};
  gaokaoEntries.forEach((entry) => {
    const yearKey = entry.year;
    if (!outcomeByYearMap[yearKey]) outcomeByYearMap[yearKey] = { year: yearKey, verified: true, entries: [] };
    outcomeByYearMap[yearKey].entries.push(entry);
    if (!entry.verified) outcomeByYearMap[yearKey].verified = false;
  });
  const outcomeYearRows = Object.keys(outcomeByYearMap)
    .sort((a, b) => String(b).localeCompare(String(a)))
    .map((yearKey) => {
      const group = outcomeByYearMap[yearKey];
      const zongping = group.entries.find((e) => e.kind === '综评' && e.metrics && typeof e.metrics.zongpingTotal === 'number');
      const fuJiao = group.entries.find((e) => e.kind === '综评' && e.metrics && typeof e.metrics.fuJiao === 'number');
      const xibao = group.entries.find((e) => e.kind === '喜报');
      const xbMetrics = xibao && xibao.metrics ? xibao.metrics : {};
      return {
        year: yearKey,
        verified: group.verified,
        zongpingTotal: zongping ? zongping.metrics.zongpingTotal : null,
        fuJiao: fuJiao ? fuJiao.metrics.fuJiao : null,
        fuJiaoQB: typeof xbMetrics.fuJiaoQB === 'number' ? xbMetrics.fuJiaoQB : null,
        qingbei: typeof xbMetrics.qingbei === 'number' ? xbMetrics.qingbei : null,
        score600plus: typeof xbMetrics.score600plus === 'number' ? xbMetrics.score600plus : null,
        topScore: typeof xbMetrics.topScore === 'number' ? xbMetrics.topScore : null,
        note: (xibao && xibao.note) || (zongping && zongping.note) || ''
      };
    });
  const hasOutcome = outcomeYearRows.length > 0;
  const latestOutcome = outcomeYearRows[0] || null;
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

          {hasOutcome ? (
            <section className="school-pencil-section school-pencil-outcome" key="outcome">
              <h2>近年高考办学成果</h2>
              <p className="school-pencil-outcome-intro">
                下列数据基于<strong>上海市教育考试院</strong>公布的<strong>综合评价录取生源高中分布</strong>（综评合计、复交综评批），以及各校公开发布的办学喜报（清北、复交总计、600+ 人数）。综评类数据来源官方、标注「已核验」；喜报类来自媒体整理、标注「待核实」。
              </p>
              <div className="school-pencil-outcome-table">
                <div className="outcome-head">
                  <span>年份</span>
                  <span>综评合计</span>
                  <span>复交（综评批）</span>
                  <span>清北</span>
                  <span>600+ 人数</span>
                </div>
                {outcomeYearRows.map((row) => (
                  <div className="outcome-row" key={row.year}>
                    <strong>
                      {row.year}年
                      {row.verified ? (
                        <em className="is-verified">已核验</em>
                      ) : (
                        <em className="is-unverified">待核实</em>
                      )}
                    </strong>
                    <b>{row.zongpingTotal != null ? row.zongpingTotal : '—'}</b>
                    <span>{row.fuJiao != null ? row.fuJiao : (row.fuJiaoQB != null ? `${row.fuJiaoQB}（总）` : '—')}</span>
                    <span>{row.qingbei != null ? row.qingbei : '—'}</span>
                    <span>{row.score600plus != null ? row.score600plus : '—'}</span>
                  </div>
                ))}
              </div>
              <p className="school-pencil-outcome-note">
                说明：综评合计 = 通过综合评价批次被复旦、交大、同济、华师、华理、上财、上外、东华、上中医、上大等 11 所上海高校录取的总人数；复交（综评批）仅含复旦 + 交大综合评价批次；清北 / 600+ 取自喜报，可能含强基、普通批，跨源口径略有差异，仅供参考。
              </p>
            </section>
          ) : null}

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
                {scoreRows.map((r) => (
                  <div className="score-row" key={`${r.year}-${r.plan}`}>
                    <strong className="score-year">{r.year}</strong>
                    <b className={/^[0-9]/.test(r.score) ? 'score-val' : 'score-val is-text'}>{r.score}</b>
                    {r.plan ? <span className="score-plan">{r.plan}</span> : null}
                    {r.note ? <span className="score-note">{r.note}</span> : null}
                  </div>
                ))}
              </div>
              {scoreLineNote && !hasPerRowNote ? <p className="school-pencil-score-note">{scoreLineNote}</p> : null}
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

          {latestOutcome ? (
            <section className="school-pencil-card school-pencil-outcome-card">
              <div className="school-pencil-kicker"><span></span><p>OUTCOMES · {latestOutcome.year}年</p></div>
              <h2>高考办学成果</h2>
              <dl>
                {latestOutcome.zongpingTotal != null ? <div><dt>综评合计</dt><dd>{latestOutcome.zongpingTotal} 人</dd></div> : null}
                {latestOutcome.fuJiao != null ? <div><dt>复交（综评批）</dt><dd>{latestOutcome.fuJiao} 人</dd></div> : null}
                {latestOutcome.fuJiaoQB != null ? <div><dt>复交（总计）</dt><dd>{latestOutcome.fuJiaoQB} 人</dd></div> : null}
                {latestOutcome.qingbei != null ? <div><dt>清北录取</dt><dd>{latestOutcome.qingbei} 人</dd></div> : null}
                {latestOutcome.score600plus != null ? <div><dt>600+ 人数</dt><dd>{latestOutcome.score600plus} 人</dd></div> : null}
                {latestOutcome.topScore != null ? <div><dt>最高分</dt><dd>{latestOutcome.topScore}</dd></div> : null}
              </dl>
              <p className="school-pencil-outcome-source">
                {latestOutcome.verified ? '综评数据已核验（上海市教育考试院公示）' : '含喜报类数据，待核实，仅供参考'}
                {latestOutcome.note ? ` · ${latestOutcome.note}` : ''}
              </p>
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
