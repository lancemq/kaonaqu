import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import { getNewsSchoolCtaCopy, shouldShowNewsSchoolCta } from '../../../lib/news-channel-utils.mjs';
import { readNewsMarkdownFile } from '../../../lib/news-content-files.mjs';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { getNewsCategoryLabel, getNewsPriorityScore, getNewsSection, getPolicyExamType } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

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

function renderNewsMarkdown(markdown) {
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

function resolveNewsById(news, rawId) {
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const normalizedId = String(id || '');
  const decodedId = (() => {
    try {
      return decodeURIComponent(normalizedId);
    } catch {
      return normalizedId;
    }
  })();

  return news.find((item) => item.id === normalizedId) || news.find((item) => item.id === decodedId) || null;
}

function getExamTypeLabel(newsItem) {
  if (newsItem.examType === 'zhongkao') return '中招';
  if (newsItem.examType === 'gaokao') return '高招';
  return '综合';
}

function getActionReminder(item) {
  if (item.newsType === 'exam') {
    return '优先确认时间、地点、准考证、成绩或后续确认安排。';
  }
  if (item.newsType === 'admission') {
    return '优先确认资格条件、操作步骤、截止时间和是否需要本人确认。';
  }
  return '先把它当作学校观察线索，再回到正式招生政策和学校信息页交叉判断。';
}

function buildRelatedPolicies(policies, current) {
  return policies
    .filter((policy) => getPolicyExamType(policy) === current.examType)
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
    .slice(0, 4);
}

function buildRelatedNews(news, current) {
  return news
    .filter((item) => item.id !== current.id)
    .filter((item) => {
      if (current.examType) {
        return item.examType === current.examType;
      }
      return getNewsSection(item) === getNewsSection(current);
    })
    .sort((a, b) => {
      const scoreDiff = getNewsPriorityScore(b) - getNewsPriorityScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''));
    })
    .slice(0, 4);
}

function getStageLabel(item) {
  const text = `${item.title || ''} ${item.summary || ''}`;
  if (text.includes('成绩')) return '成绩公布';
  if (text.includes('准考证')) return '考前准备';
  if (text.includes('报名')) return '报名阶段';
  if (text.includes('志愿')) return '志愿填报';
  if (text.includes('录取')) return '录取阶段';
  if (text.includes('确认') || text.includes('缴费')) return '确认环节';
  if (item.newsType === 'school') return '学校观察';
  if (item.newsType === 'exam') return '考试节点';
  return '政策发布';
}

function getAudienceLabel(item) {
  if (item.newsType === 'school') return '关注上海学校与择校的家庭';
  if (item.examType === 'zhongkao') return '上海中考家庭';
  if (item.examType === 'gaokao') return '上海高考家庭';
  return '上海升学家庭';
}

function getNextStepLabel(item) {
  if (item.newsType === 'exam') return '先确认时间、地点、准考证或成绩使用方式，再看下一条时间线通知。';
  if (item.newsType === 'admission') return '先确认自己是否适用，再核对报名、志愿、确认或录取的具体截止时间。';
  return '把它当作学校观察线索，再回到学校详情页和正式招生政策交叉判断。';
}

export async function generateMetadata({ params }) {
  const { news } = await loadDataStore();
  const { id } = await params;
  const item = resolveNewsById(news, id);

  if (!item) {
    return { title: '新闻详情 | 考哪去' };
  }

  return {
    title: `${item.title} | 新闻详情 | 考哪去`,
    description: item.summary || '查看上海升学新闻与政策详情。'
  };
}

export default async function NewsDetailPage({ params }) {
  const { news, policies, schools } = await loadDataStore();
  const { id } = await params;
  const item = resolveNewsById(news, id);

  if (!item) {
    notFound();
  }

  const relatedPolicies = buildRelatedPolicies(policies, item);
  const relatedNews = buildRelatedNews(news, item);
  const schoolsById = new Map(schools.map((school) => [school.id, school]));
  const linkedSchool = item.primarySchoolId ? schoolsById.get(item.primarySchoolId) || null : null;
  const schoolCta = getNewsSchoolCtaCopy(item);
  const shouldRenderSchoolBridge = shouldShowNewsSchoolCta(item) && linkedSchool && schoolCta;
  const sourceName = item.source?.name || '未知来源';
  const articleType = getNewsCategoryLabel(item);
  const articleBodyMarkdown = readNewsMarkdownFile(item);

  if (!articleBodyMarkdown) {
    notFound();
  }

  return (
    <SiteShell
      hideKnowledgeNav
      breadcrumbItems={[
        { label: '新闻政策', href: '/news' },
        { label: articleType },
        { label: item.title }
      ]}
    >
      <header className="hero" id="top">
        <section className="search-panel news-detail-article-hero news-detail-article-shell" aria-label="新闻详情">
          <div className="news-detail-article-head">
              <p className="overview-label">{getExamTypeLabel(item)} / {articleType}</p>
              <div className="news-detail-stage-row">
                <span className="pill">{getStageLabel(item)}</span>
                <span className="news-detail-stage-text">{getAudienceLabel(item)}</span>
              </div>
              <h1>{item.title}</h1>
              <p className="news-detail-article-summary">{item.summary || '暂无摘要'}</p>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-detail-prototype-stats news-detail-article-stats news-detail-article-shell">
        <article>
          <strong>{item.publishedAt || '暂无日期'}</strong>
          <span>发布日期</span>
        </article>
        <article>
          <strong>{getExamTypeLabel(item)}</strong>
          <span>适用考试线</span>
        </article>
        <article>
          <strong>{articleType}</strong>
          <span>栏目分类</span>
        </article>
        <article>
          <strong>{sourceName}</strong>
          <span>官方来源</span>
        </article>
      </section>

      <main className="layout news-detail-article-layout">
        <div className="news-detail-article-layout-with-side">
          <article className="news-detail-article-main">
            <section className="school-prototype-panel news-detail-article-panel" id="article-body">
              <h2>正文与解读</h2>
              <div className="news-detail-markdown">
                {renderNewsMarkdown(articleBodyMarkdown)}
              </div>
            </section>
          </article>

          <aside className="school-prototype-side news-detail-article-side" id="related-policies">
            <section className="school-prototype-side-card news-detail-side-card news-detail-side-card-dark">
              <p className="overview-label">这条新闻意味着什么</p>
              <p>{getStageLabel(item)} / {articleType}</p>
              <p>{getNextStepLabel(item)}</p>
            </section>

            <section className="school-prototype-side-card news-detail-side-card">
              <p className="overview-label">下一步建议</p>
              <p>{getAudienceLabel(item)}</p>
              <p>{getActionReminder(item)}</p>
            </section>

            {shouldRenderSchoolBridge ? (
              <section className="school-prototype-side-card news-detail-side-card news-detail-school-bridge">
                <p className="overview-label">关联学校</p>
                <div className="news-detail-school-bridge-copy">
                  <p className="news-detail-school-bridge-title">{schoolCta.title}</p>
                  <p className="news-detail-school-bridge-body">{schoolCta.body}</p>
                </div>
                <div className="news-detail-school-bridge-school">
                  <span className="news-detail-school-bridge-school-label">已关联学校</span>
                  <strong>{linkedSchool.name}</strong>
                </div>
                <Link className="button news-detail-school-bridge-link" href={`/schools/${linkedSchool.id}`}>
                  {schoolCta.action}
                </Link>
              </section>
            ) : null}

            {relatedPolicies.length ? (
              <section className="school-prototype-side-card news-detail-side-card">
                <p className="overview-label">相关政策</p>
                <div className="news-detail-policy-list">
                  {relatedPolicies.map((policy) => (
                    <a key={policy.id} className="school-prototype-side-link" href={getPolicyDetailHref(policy)}>
                      • {policy.title}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {relatedNews.length ? (
              <section className="school-prototype-side-card news-detail-side-card">
                <p className="overview-label">继续阅读</p>
                <div className="news-detail-policy-list">
                  {relatedNews.map((entry) => (
                    <a key={entry.id} className="school-prototype-side-link" href={`/news/${entry.id}`}>
                      • {entry.title}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 新闻正文详情页</span>
        <span>{sourceName} / {getActionReminder(item)}</span>
      </footer>
    </SiteShell>
  );
}
