import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import { readSchoolMarkdownFile } from '../../../lib/school-content-files.mjs';
import { getSchoolRichProfile } from '../../../lib/school-rich-profiles';
import {
  getSchoolAdmissionInfo,
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

function formatSchoolUpdate(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '时间待补充';
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!match) {
    return text;
  }
  const [, year, month, day, hour, minute] = match;
  if (hour && minute) {
    return `${year}.${month}.${day} ${hour}:${minute}`;
  }
  return `${year}.${month}.${day}`;
}

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

function getAdmissionRoutes(school) {
  const routes = school.admissionRoutes || [];
  if (routes.length === 0) return null;
  
  // Sort by year desc, then count desc
  return routes.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.count - a.count;
  });
}

function getDistrictPeers(schools, current) {
  return schools
    .filter((school) => school.id !== current.id && school.districtId === current.districtId)
    .slice(0, 3);
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
  
  // Section tracking for highlights
  let activeSectionType = null; // 'catchment', 'group', or null
  let currentSectionTitle = '';
  let currentSectionNodes = [];

  const flushSection = () => {
    if (currentSectionNodes.length === 0) return;
    if (activeSectionType === 'catchment') {
      nodes.push(
        <div key={`catchment-section-${key++}`} className="highlight-card highlight-card-catchment">
          <div className="highlight-card-header">{currentSectionTitle}</div>
          <div className="highlight-card-content">
            {currentSectionNodes}
          </div>
        </div>
      );
    } else if (activeSectionType === 'group') {
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
      
      const title = line.slice(3);
      if (title.includes('官方对口查询')) {
        activeSectionType = 'catchment';
        currentSectionTitle = title;
        continue;
      } else if (title.includes('教育集团')) {
        activeSectionType = 'group';
        currentSectionTitle = title;
        continue;
      } else {
        pushToSection(<h3 key={`h3-${key++}`} className="news-detail-markdown-heading">{title}</h3>);
        flushSection(); // Regular sections close immediately
      }
      continue;
    }
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
  const articleBodyMarkdown = readSchoolMarkdownFile(school);
  if (!articleBodyMarkdown) {
    notFound();
  }
  const articleInsights = extractArticleInsights(articleBodyMarkdown);
  const highlights = articleInsights.highlights.length ? articleInsights.highlights : getSchoolHighlights(school);
  const features = articleInsights.keywords.length ? articleInsights.keywords : getSchoolFeatures(school);
  const trainingDirections = articleInsights.directions.length ? articleInsights.directions : getSchoolTrainingDirections(school);
  const tags = getSchoolTags(school);
  const richProfile = getSchoolRichProfile(school.id);
  const schoolSummary = articleInsights.overview || getSchoolAdmissionInfo(school) || '学术强校、课程体系与校园节奏兼具，是上海家长高频检索的学校之一。';

  const schoolAttribute = school.tier || getSchoolOwnershipLabel(school) || '学校属性待补充';
  const schoolTemperament = trainingDirections[0] || '综合型';
  const schoolHeat = tags.length >= 4 ? '高关注' : '持续关注';
  const summaryPoints = [highlights[0], highlights[1], trainingDirections[0] || features[0]].filter(Boolean).slice(0, 3);
  const quickTags = Array.from(new Set([...tags, ...features, ...trainingDirections])).filter(Boolean).slice(0, 6);
  const profileFacts = [
    ['办学属性', schoolAttribute],
    ['学校类型', getSchoolType(school)],
    ['所在区域', getSchoolDistrictName(school)],
    ['学段', getSchoolStage(school)],
    ['更新时间', formatSchoolUpdate(school.updatedAt)]
  ].filter(([, value]) => String(value || '').trim());
  const serviceFacts = [
    ['地址', school.address],
    ['电话', school.phone],
    ['官网', school.website]
  ].filter(([, value]) => String(value || '').trim());

  // JSON-LD for School Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    "name": school.name,
    "url": `https://kaonaqu.com/schools/${encodeURIComponent(school.id)}`,
    "description": schoolSummary,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": school.districtName,
      "streetAddress": school.address || '待补充'
    },
    "telephone": school.phone || '',
    "url": school.website || '',
    "areaServed": school.districtName,
    "sameAs": school.website ? [school.website] : []
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteShell
        hideKnowledgeNav
        breadcrumbItems={[
          { label: '学校信息', href: '/schools' },
          { label: getSchoolDistrictName(school), href: `/schools/district/${school.districtId}` },
          { label: school.name }
        ]}
      >
        <header className="hero" id="top">
          <section className="school-datadesk-detail-hero" aria-label="学校详情">
            <div className="school-datadesk-detail-hero-grid">
              <div className="school-datadesk-detail-main">
                <p className="overview-label">
                  学校库 / {getSchoolDistrictName(school)} / {getSchoolStage(school)} / {schoolAttribute}
                </p>
                <h1>{school.name}</h1>
                <p className="school-datadesk-detail-subtitle">
                  {renderInlineMarkdown(schoolSummary)}
                </p>
                <div className="school-datadesk-detail-chiprow">
                  {richProfile?.badge ? (
                    <span className="school-datadesk-detail-chip school-datadesk-detail-chip-strong">{richProfile.badge}</span>
                  ) : null}
                  {quickTags.length ? quickTags.map((item) => (
                    <span key={item} className="school-datadesk-detail-chip">{item}</span>
                  )) : (
                    <span className="school-datadesk-detail-chip">信息持续补充中</span>
                  )}
                </div>
              </div>
            <aside className="school-datadesk-detail-sidehead">
              <article className="school-datadesk-detail-sidecard school-datadesk-detail-sidecard-strong">
                <span>学校定位</span>
                <strong>{highlights[0] || '适合先用课程、招生与培养方向来判断学校节奏。'}</strong>
                <p>先确认招生口径，再看课程方向、校园节奏和家庭适配度。</p>
              </article>
              <article className="school-datadesk-detail-sidecard">
                <span>最近更新时间</span>
                <strong>{formatSchoolUpdate(school.updatedAt)}</strong>
                <p>详情页与数据库索引统一按本地收录时间展示。</p>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <div className="school-datadesk-detail-gap" aria-hidden="true" />

      {richProfile ? (
        <section className="school-rich-visual" aria-label={`${school.name}核心资料`}>
          <figure className="school-rich-image-card">
            <img src={richProfile.image.url} alt={richProfile.image.alt} loading="lazy" />
            <figcaption>{richProfile.image.caption}</figcaption>
          </figure>
          <div className="school-rich-brief">
            <p className="overview-label">核心资料包</p>
            <h2>历史、特色、校友与录取参考</h2>
            <p>这部分优先整理头部学校的公开信息。分数线为录取参考，不同年份、区、批次和计划类型口径不同，填报前仍要回到当年官方发布核对。</p>
          </div>
        </section>
      ) : null}

      <section className="school-datadesk-detail-stats">
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

      <div className="school-datadesk-detail-main-gap" aria-hidden="true" />

      <main className="layout school-datadesk-detail-layout">
        <section className="school-datadesk-detail-maincol">
          <section className="school-datadesk-detail-panel">
            <p className="overview-label">学校概览</p>
            <h2>{school.name}</h2>
            <p>{renderInlineMarkdown(schoolSummary || '学校基础信息已整理，可结合培养方向和招生路径继续判断。')}</p>
            <div className="school-datadesk-detail-highlightgrid">
              {summaryPoints.map((item, index) => (
                <article key={`${item}-${index}`} className="school-datadesk-detail-highlightcard">
                  <span>重点 {index + 1}</span>
                  <strong>{item}</strong>
                </article>
              ))}
            </div>
          </section>

          {richProfile ? (
            <section className="school-rich-panel" id="school-rich-profile">
              <div className="school-rich-panel-head">
                <p className="overview-label">深度资料</p>
                <h2>{school.name}核心信息</h2>
              </div>

              <div className="school-rich-history">
                {richProfile.history.map((item) => (
                  <article key={`${item.year}-${item.text}`}>
                    <span>{item.year}</span>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>

              <div className="school-rich-card-grid">
                {richProfile.programs.map((item) => (
                  <article key={item.title} className="school-rich-card">
                    <span>办学特色</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>

              <div className="school-rich-two-column">
                <section>
                  <div className="school-rich-subhead">
                    <p className="overview-label">相关名人与校友线索</p>
                    <span>公开资料口径</span>
                  </div>
                  <div className="school-rich-people-list">
                    {richProfile.notablePeople.map((item) => (
                      <article key={item.name}>
                        <strong>{item.name}</strong>
                        <p>{item.role}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="school-rich-subhead">
                    <p className="overview-label">历年入学分数线</p>
                    <span>录取参考</span>
                  </div>
                  <div className="school-rich-score-table" role="table" aria-label={`${school.name}录取参考分数线`}>
                    <div role="row" className="school-rich-score-row school-rich-score-head">
                      <span role="columnheader">年份</span>
                      <span role="columnheader">批次</span>
                      <span role="columnheader">分数</span>
                    </div>
                    {richProfile.scoreLines.map((item) => (
                      <div key={`${item.year}-${item.batch}`} role="row" className="school-rich-score-row">
                        <span role="cell">{item.year}</span>
                        <span role="cell">{item.batch}<small>{item.scope}</small></span>
                        <strong role="cell">{item.score}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="school-rich-note">{richProfile.scoreLines[0]?.source?.note}</p>
                </section>
              </div>

              <div className="school-rich-source-list">
                <span>资料入口</span>
                {richProfile.sources.map((item) => (
                  <a key={item.url} href={item.url} target="_blank" rel="noreferrer">{item.label}</a>
                ))}
                {richProfile.scoreLines[0]?.source ? (
                  <a href={richProfile.scoreLines[0].source.url} target="_blank" rel="noreferrer">
                    {richProfile.scoreLines[0].source.label}
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="school-datadesk-detail-panel" id="school-article">
            <p className="overview-label">正文与判断</p>
            <h2>学校详情正文</h2>
            <div className="news-detail-markdown school-datadesk-detail-article">
              {renderSchoolMarkdown(articleBodyMarkdown)}
            </div>
          </section>
        </section>

        <aside className="school-datadesk-detail-sidebar">
          <section className="school-datadesk-detail-panel school-datadesk-detail-panel-dark">
            <div className="school-datadesk-detail-sectionhead">
              <p className="overview-label">学校速览</p>
              <span>核心口径</span>
            </div>
            <dl className="school-datadesk-detail-facts">
              {profileFacts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd><span className="school-datadesk-detail-fact-value">{value}</span></dd>
                </div>
              ))}
            </dl>
          </section>

          {school.group && (
            <section className="school-datadesk-detail-panel">
              <div className="school-datadesk-detail-sectionhead">
                <p className="overview-label">教育集团</p>
                <span>集团化办学</span>
              </div>
              <div className="group-badge-container">
                <div className="group-badge-text">
                  <span className="group-badge-label">所属集团</span>
                  <span className="group-badge-value">{school.group}</span>
                </div>
              </div>
            </section>
          )}

          {getAdmissionRoutes(school) && (
            <section className="school-datadesk-detail-panel">
              <div className="school-datadesk-detail-sectionhead">
                <p className="overview-label">名额分配去向</p>
                <span>升学出口</span>
              </div>
              <div className="quota-list">
                {getAdmissionRoutes(school).slice(0, 5).map((route) => (
                  <div key={`${route.high_school_id}-${route.year}`} className="quota-item">
                    <div className="quota-info">
                      <Link href={`/schools/${route.high_school_id}`} className="quota-link">
                        {route.high_school_name}
                      </Link>
                      <span className="quota-type">{route.type}</span>
                    </div>
                    <div className="quota-count">
                      <span className="quota-year">{route.year}</span>
                      <span className="quota-number">{route.count}人</span>
                    </div>
                  </div>
                ))}
                <p className="quota-note">数据仅供参考，实际以当年官方公布为准</p>
              </div>
            </section>
          )}

          <section className="school-datadesk-detail-panel">
            <div className="school-datadesk-detail-sectionhead">
              <p className="overview-label">培养与检索</p>
              <span>数据库摘要</span>
            </div>
            <p className="school-datadesk-detail-sidecopy">培养方向：{trainingDirections.slice(0, 2).join('、') || '综合培养'}</p>
            <p className="school-datadesk-detail-sidecopy">核心关键词：{[...features.slice(0, 2), ...tags.slice(0, 2)].filter(Boolean).join('、') || '课程深度、校园节奏、区域关注'}</p>
            {serviceFacts.length ? (
              <dl className="school-datadesk-detail-facts school-datadesk-detail-facts-compact">
                {serviceFacts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{label === '官网'
                      ? <a className="text-link" href={value} target="_blank" rel="noreferrer">{value}</a>
                      : <span className="school-datadesk-detail-fact-value">{value}</span>}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>

          <section className="school-datadesk-detail-panel">
            <div className="school-datadesk-detail-sectionhead">
              <p className="overview-label">同区学校</p>
              <span>{getSchoolDistrictName(school)}</span>
            </div>
            {districtPeers.length ? districtPeers.map((peer) => (
              <Link key={peer.id} className="school-datadesk-detail-peerlink" href={`/schools/${peer.id}`}>
                <strong>{peer.name}</strong>
                <span>{getSchoolStage(peer)} / {getSchoolOwnershipLabel(peer) || '学校信息'}</span>
              </Link>
            )) : (
              <p className="school-datadesk-detail-empty">同区学校信息持续补充中，可通过上方路径进入区级专题继续查看。</p>
            )}
          </section>
        </aside>
      </main>

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 学校详情页</span>
        <span>学校画像 / 招生口径 / 同区比较 / 正文判断</span>
      </footer>
    </SiteShell>
    </>
  );
}
