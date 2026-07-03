import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import { readSchoolMarkdownFile } from '../../../lib/school-content-files.mjs';
import { getSchoolDataQuality } from '../../../lib/school-data-quality';
import {
  getSchoolAdmissionInfo,
  formatSchoolUpdate,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolHighlights,
  getSchoolOwnershipLabel,
  getSchoolStage,
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

function getRelatedSchools(schools, current) {
  const schoolById = new Map(schools.map((school) => [school.id, school]));
  const curated = (Array.isArray(current.related_schools) ? current.related_schools : [])
    .map((id) => schoolById.get(id))
    .filter(Boolean)
    .filter((school) => school.id !== current.id);
  const fallback = schools
    .filter((school) => school.id !== current.id && school.districtId === current.districtId)
    .filter((school) => !curated.some((item) => item.id === school.id));

  return [...curated, ...fallback].slice(0, 4);
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

function renderSchoolMarkdown(markdown) {
  const lines = String(markdown || '').split('\n');
  const nodes = [];
  let listItems = [];
  let key = 0;

  // 这些 section 由长尾校的 enrich 模板生成，内容是对所有学校套同一句的空话，
  // 无独立信息价值，整段跳过不渲染（头部校人工内容不含这些标题，不受影响）。
  const SKIP_SECTIONS = new Set([
    '历史沿革（公开资料）',
    '办学特色（公开资料）',
    '课程与培养路径解读',
    '官方对口查询',
    '适合谁',
    '阅读提示',
    '公开信息入口'
  ]);

  // Section tracking for highlights
  let activeSectionType = null; // 'group' or null
  let currentSectionTitle = '';
  let currentSectionNodes = [];
  let skipping = false;

  const flushSection = () => {
    if (currentSectionNodes.length === 0) return;
    if (activeSectionType === 'group') {
      nodes.push(
        <div key={`group-section-${key++}`} className="highlight-card highlight-card-group">
          <div className="highlight-card-header">{currentSectionTitle}</div>
          <div className="highlight-card-content">
            {currentSectionNodes}
          </div>
        </div>
      );
    } else {
      nodes.push(...currentSectionNodes);
    }
    currentSectionNodes = [];
    currentSectionTitle = '';
    activeSectionType = null;
  };

  const pushToSection = (node) => currentSectionNodes.push(node);

  const flushList = () => {
    if (!listItems.length) return;
    pushToSection(
      <ul key={`list-${key++}`} className="news-detail-markdown-list">
        {listItems.map((item, index) => (
          <li key={`item-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      flushSection();

      const title = line.slice(3).trim();
      if (SKIP_SECTIONS.has(title)) {
        skipping = true;
        continue;
      }
      skipping = false;
      if (title.includes('教育集团')) {
        activeSectionType = 'group';
        currentSectionTitle = title;
        continue;
      } else {
        pushToSection(<h3 key={`h3-${key++}`} className="news-detail-markdown-heading">{title}</h3>);
        flushSection(); // Regular sections close immediately
      }
      continue;
    }
    if (skipping) continue;
    if (line.startsWith('### ')) {
      flushList();
      pushToSection(<h4 key={`h4-${key++}`} className="news-detail-markdown-subheading">{line.slice(4)}</h4>);
      continue;
    }
    if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();
    pushToSection(
      <p key={`p-${key++}`} className="news-detail-markdown-paragraph">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  flushList();
  flushSection();
  return nodes;
}

function extractSectionLines(markdown, heading) {
  const lines = String(markdown || '').split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return [];
  const result = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) break;
    if (!line) continue;
    result.push(line);
  }
  return result;
}

function extractArticleInsights(markdown) {
  const overviewLines = extractSectionLines(markdown, '学校概览');
  const highlightLines = extractSectionLines(markdown, '关注重点')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
  const directionLines = extractSectionLines(markdown, '培养方向');
  const directionText = directionLines.join(' ');
  const directionMatch = directionText.match(/培养方向包括：([^。]+)/);
  const keywordMatch = directionText.match(/关键词包括：([^。]+)/);

  return {
    overview: overviewLines.find((line) => !line.startsWith('- ')) || '',
    highlights: highlightLines,
    directions: directionMatch ? directionMatch[1].split('、').map((item) => item.trim()).filter(Boolean) : [],
    keywords: keywordMatch ? keywordMatch[1].split('、').map((item) => item.trim()).filter(Boolean) : []
  };
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

  const relatedSchools = getRelatedSchools(schools, school);
  const articleBodyMarkdown = readSchoolMarkdownFile(school);
  if (!articleBodyMarkdown) {
    notFound();
  }
  const articleInsights = extractArticleInsights(articleBodyMarkdown);
  const highlights = articleInsights.highlights.length ? articleInsights.highlights : getSchoolHighlights(school);
  const features = articleInsights.keywords.length ? articleInsights.keywords : getSchoolFeatures(school);
  const trainingDirections = articleInsights.directions.length ? articleInsights.directions : getSchoolTrainingDirections(school);
  const tags = getSchoolTags(school);
  const schoolSummary = articleInsights.overview || getSchoolAdmissionInfo(school) || '';

  const schoolAttribute = school.tier || getSchoolOwnershipLabel(school) || '—';
  const profileFacts = [
    ['办学属性', schoolAttribute],
    ['学校类型', getSchoolType(school)],
    ['所在区域', getSchoolDistrictName(school)],
    ['学段', getSchoolStage(school)],
    ['更新时间', formatSchoolUpdate(school.updatedAt)]
  ].filter(([, value]) => String(value || '').trim());
  const dataQuality = getSchoolDataQuality(school);

  // JSON-LD for School Schema —— 占位字段不输出，避免给搜索引擎"死链"。
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

  const admissionRows = [
    ['清北录取', school.qingbeiCount || school.topUniversityCount || '资料待补'],
    ['复旦交大', school.fudanJiaodaCount || school.localTopUniversityCount || '资料待补'],
    ['985高校', school.project985Rate || school.keyUniversityRate || '资料待补'],
    ['一本率', school.firstTierRate || school.undergraduateRate || '资料待补']
  ];
  const scoreRows = Array.isArray(school.scoreLines) && school.scoreLines.length
    ? school.scoreLines.slice(0, 3)
    : [
      { year: '2025年', score: school.score2025 || '资料待补', plan: school.plan2025 || '以当年招生计划为准', batch: '统一招生' },
      { year: '2024年', score: school.score2024 || '资料待补', plan: school.plan2024 || '以当年招生计划为准', batch: '统一招生' },
      { year: '2023年', score: school.score2023 || '资料待补', plan: school.plan2023 || '以当年招生计划为准', batch: '统一招生' }
    ];
  const competitionRows = [
    ['全国高中数学联赛', '公开资料待补', '国家级'],
    ['全国中学生物理竞赛', '公开资料待补', '国家级'],
    ['中国化学奥林匹克', '公开资料待补', '国家级'],
    ['全国青少年信息学奥赛', '公开资料待补', '国家级'],
    ['上海市青少年科技创新大赛', '公开资料待补', '市级']
  ];
  const courseRows = [
    ['大学先修课程', school.apCourses || '结合学校公开课程与招生简章核对。'],
    ['创新实验课程', trainingDirections.slice(0, 2).join('、') || '以项目式学习与综合实践为观察重点。'],
    ['国际理解课程', features.includes('国际化') || features.includes('国际课程') ? '关注国际课程、双语项目与升学路径。' : '公开资料待补。']
  ];
  const featureTags = Array.from(new Set([...features, ...tags, ...trainingDirections])).filter(Boolean).slice(0, 3);

  return (
    <main className="school-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="school-detail-nav" aria-label="顶部导航">
        <Link className="school-detail-brand" href="/" aria-label="考哪去首页"><strong>考哪去</strong><span>SHANGHAI EDUCATION</span></Link>
        <div className="school-detail-nav-links"><Link href="/">首页</Link><Link href="/news">新闻</Link><Link className="is-active" href="/schools">学校</Link><Link href="/knowledge">知识</Link></div>
      </nav>

      <header className="school-detail-header" id="top">
        <nav className="school-detail-breadcrumb" aria-label="面包屑"><Link href="/">首页</Link><span>/</span><Link href="/schools">学校</Link><span>/</span><Link href={'/schools/district/' + school.districtId}>{getSchoolDistrictName(school)}</Link><span>/</span><strong>{school.name}</strong></nav>
        <div className="school-detail-chipline"><span>{getSchoolDistrictName(school)}</span><span>{getSchoolStage(school)}</span><span>{schoolAttribute}</span><em>{formatSchoolUpdate(school.updatedAt)}</em></div>
        <h1>{school.name}</h1>
        <p>{schoolSummary ? renderInlineMarkdown(schoolSummary) : '查看学校画像、招生路径与择校提示。'}</p>
        <div className="school-detail-statline">
          <article><strong>{school.foundingYear || '—'}</strong><span>建校时间</span></article>
          <article><strong>{getSchoolOwnershipLabel(school) || '—'}</strong><span>学校性质</span></article>
          <article><strong>{getSchoolStage(school)}</strong><span>学段</span></article>
          <article><strong>{school.group || schoolAttribute}</strong><span>学校体系</span></article>
        </div>
      </header>

      <section className="school-detail-body">
        <article className="school-detail-main">
          <section className="school-detail-section"><h2>学校概览</h2><p>{schoolSummary ? renderInlineMarkdown(schoolSummary) : '公开资料仍在整理，建议结合学校官网、区教育局和当年招生文件核对。'}</p></section>
          <section className="school-detail-section"><h2>办学特色</h2><p>{highlights.slice(0, 2).join('。') || getSchoolAdmissionInfo(school) || '关注课程结构、师资资源、升学路径与家庭节奏适配。'}</p></section>
          <section className="school-detail-section"><h2>招生方式</h2><p>{getSchoolAdmissionInfo(school) || '招生方式以当年上海市及各区教育局公布为准。'}</p></section>
          <section className="school-detail-section"><h2>升学出口</h2><p>以下为公开资料整理口径，具体录取结果与招生计划以当年官方发布为准。</p><div className="school-detail-score-list">{scoreRows.map((row) => (<div key={row.year} className="school-detail-score-row"><strong>{row.year}</strong><span>{row.score || row.minScore || '资料待补'}</span><span>{row.plan || row.batch || '以官方为准'}</span></div>))}</div></section>
          <section className="school-detail-section"><h2>竞赛成绩</h2><div className="school-detail-competition-list">{competitionRows.map(([name, count, level]) => (<div key={name}><strong>{name}</strong><span>{count}</span><em>{level}</em></div>))}</div></section>
          <section className="school-detail-section"><h2>所属教育集团</h2><div className="school-detail-groupbox"><p><strong>集团名称</strong>{school.group || '公开资料待补'}</p><p><strong>成员学校</strong>{relatedSchools.map((peer) => peer.name).join(' · ') || '公开资料待补'}</p><p><strong>集团特色</strong>资源共享 · 课程共建 · 联合教研</p></div></section>
          <section className="school-detail-section"><h2>特色课程</h2><div className="school-detail-course-list">{courseRows.map(([name, desc]) => (<div key={name}><strong>{name}</strong><p>{desc}</p></div>))}</div></section>
          <section className="school-detail-section school-detail-markdown-section"><h2>正文资料</h2><div className="news-detail-markdown school-datadesk-detail-article">{renderSchoolMarkdown(articleBodyMarkdown)}</div></section>
          <div className="school-detail-tags"><span>FEATURES</span>{(featureTags.length ? featureTags : ['学校画像']).map((tag) => <em key={tag}>{tag}</em>)}</div>
        </article>

        <aside className="school-detail-sidebar">
          <section className="school-detail-side-card is-dark"><div className="school-detail-kicker"><span></span><p>AT A GLANCE</p></div><h2>基本信息</h2><dl>{profileFacts.slice(0, 5).map(([label, value]) => (<div key={label}><dt>{label}</dt><dd>{value}</dd></div>))}</dl></section>
          <section className="school-detail-side-card"><div className="school-detail-kicker"><span></span><p>ADMISSION</p></div><h2>升学出口</h2>{admissionRows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</section>
          <section className="school-detail-side-card"><div className="school-detail-kicker"><span></span><p>SIMILAR SCHOOLS</p></div>{relatedSchools.slice(0, 3).map((peer) => (<Link key={peer.id} href={'/schools/' + peer.id}><span>{peer.name}</span><i>→</i></Link>))}</section>
        </aside>
      </section>

      <div className="schools-color-block-row" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <footer className="school-detail-footer"><div><strong>考哪去</strong><span>SHANGHAI EDUCATION PLATFORM</span></div><p>© 2026 考哪去</p></footer>
    </main>
  );
}
