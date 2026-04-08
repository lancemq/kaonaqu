import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import { readSchoolMarkdownFile } from '../../../lib/school-content-files.mjs';
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

function getDistrictPeers(schools, current) {
  return schools
    .filter((school) => school.id !== current.id && school.districtId === current.districtId)
    .slice(0, 3);
}

function renderInlineMarkdown(text) {
  const parts = [];
  const value = String(text || '');
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }
    parts.push(
      <a key={`${match[2]}-${match.index}`} className="text-link" href={match[2]} target="_blank" rel="noreferrer">
        {match[1]}
      </a>
    );
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

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(
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
      nodes.push(<h3 key={`h3-${key++}`} className="news-detail-markdown-heading">{line.slice(3)}</h3>);
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      nodes.push(<h4 key={`h4-${key++}`} className="news-detail-markdown-subheading">{line.slice(4)}</h4>);
      continue;
    }
    if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();
    nodes.push(
      <p key={`p-${key++}`} className="news-detail-markdown-paragraph">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  flushList();
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

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero" id="top">
        <section className="school-datadesk-detail-hero" aria-label="学校详情">
          <div className="school-datadesk-detail-hero-grid">
            <div className="school-datadesk-detail-main">
              <p className="overview-label">
                学校库 / {getSchoolDistrictName(school)} / {getSchoolStage(school)} / {schoolAttribute}
              </p>
              <h1>{school.name}</h1>
              <p className="school-datadesk-detail-subtitle">
                {schoolSummary}
              </p>
              <div className="school-datadesk-detail-chiprow">
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
            <p>{schoolSummary || '学校基础信息已整理，可结合培养方向和招生路径继续判断。'}</p>
            <div className="school-datadesk-detail-highlightgrid">
              {summaryPoints.map((item, index) => (
                <article key={`${item}-${index}`} className="school-datadesk-detail-highlightcard">
                  <span>重点 {index + 1}</span>
                  <strong>{item}</strong>
                </article>
              ))}
            </div>
          </section>

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
              <>
                <Link className="school-datadesk-detail-peerlink" href={`/schools?district=${school.districtId}`}>
                  <strong>{getSchoolDistrictName(school)} 区学校列表</strong>
                  <span>返回该区学校数据库结果</span>
                </Link>
                <Link className="school-datadesk-detail-peerlink" href="/schools">
                  <strong>学校信息汇总页</strong>
                  <span>回到全市学校数据库</span>
                </Link>
              </>
            )}
          </section>
        </aside>
      </main>

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 学校详情页</span>
        <span>学校画像 / 招生口径 / 同区比较 / 正文判断</span>
      </footer>
    </SiteShell>
  );
}
