import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import Link from 'next/link';
import SiteShell from '../../../../components/site-shell';
import { readPolicyMarkdownFile } from '../../../../lib/policy-content-files.mjs';
import { getPolicyMappedNewsId, getPolicyDetailHref } from '../../../../lib/policy-detail';
import { getPolicyExamType } from '../../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../../shared/data-store');

function resolvePolicyById(policies, rawId) {
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const normalizedId = String(id || '');
  const decodedId = (() => {
    try {
      return decodeURIComponent(normalizedId);
    } catch {
      return normalizedId;
    }
  })();

  return policies.find((item) => item.id === normalizedId) || policies.find((item) => item.id === decodedId) || null;
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

function renderMarkdown(markdown) {
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

function cleanPolicyText(text, title = '') {
  let value = String(text || '').trim();
  if (!value) return '';

  value = value
    .replace(/无障碍 首页[\s\S]*?内容概述\s*/g, '')
    .replace(/索取号：[^。]*?/g, '')
    .replace(/发布日期：\d{4}-\d{2}-\d{2}/g, '')
    .replace(/字体 \[ 大 中 小 ]/g, '')
    .replace(/查阅全文[\s\S]*$/g, '')
    .replace(/\[返回上一页][\s\S]*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (title && value.startsWith(title)) {
    value = value.slice(title.length).trim();
  }

  return value;
}

function getExamTypeLabel(policy) {
  const type = getPolicyExamType(policy);
  if (type === 'zhongkao') return '中招';
  if (type === 'gaokao') return '高招';
  return '综合';
}

export async function generateMetadata({ params }) {
  const { policies } = await loadDataStore();
  const { id } = await params;
  const item = resolvePolicyById(policies, id);

  if (!item) {
    return { title: '政策详情 | 考哪去' };
  }

  return {
    title: `${item.title} | 政策详情 | 考哪去`,
    description: item.summary || '查看上海升学政策详情。'
  };
}

export default async function PolicyDetailPage({ params }) {
  const { policies, news } = await loadDataStore();
  const { id } = await params;
  const item = resolvePolicyById(policies, id);

  if (!item) {
    notFound();
  }

  const mappedNewsId = getPolicyMappedNewsId(item);
  const mappedNews = mappedNewsId ? news.find((entry) => entry.id === mappedNewsId) : null;
  const articleBodyMarkdown = readPolicyMarkdownFile(item);
  const sourceName = item.source?.name || '官方来源';
  const examTypeLabel = getExamTypeLabel(item);
  const summaryText = cleanPolicyText(item.summary, item.title) || '暂无摘要';
  const relatedPolicies = policies
    .filter((policy) => policy.id !== item.id)
    .filter((policy) => getPolicyExamType(policy) === getPolicyExamType(item))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
    .slice(0, 4);

  if (!articleBodyMarkdown) {
    notFound();
  }

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero" id="top">
        <section className="search-panel news-detail-article-hero news-detail-article-shell" aria-label="政策详情">
          <div className="news-detail-article-head">
            <p className="overview-label">{examTypeLabel} / 政策详情</p>
            <div className="news-detail-stage-row">
              <span className="pill">官方文件</span>
              <span className="news-detail-stage-text">上海升学家庭</span>
            </div>
            <h1>{item.title}</h1>
            <p className="news-detail-article-summary">{summaryText}</p>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-detail-prototype-stats news-detail-article-stats news-detail-article-shell">
        <article>
          <strong>{item.publishedAt || item.year || '暂无日期'}</strong>
          <span>发布日期</span>
        </article>
        <article>
          <strong>{examTypeLabel}</strong>
          <span>适用考试线</span>
        </article>
        <article>
          <strong>官方政策</strong>
          <span>页面内可直接阅读</span>
        </article>
        <article>
          <strong>{sourceName}</strong>
          <span>原始来源</span>
        </article>
      </section>

      <main className="layout news-detail-article-layout">
        <div className="news-detail-article-layout-with-side">
          <article className="news-detail-article-main">
            <section className="school-prototype-panel news-detail-article-panel" id="article-body">
              <h2>正文与解读</h2>
              <div className="news-detail-markdown">
                {renderMarkdown(articleBodyMarkdown)}
              </div>
            </section>
          </article>

          <aside className="school-prototype-side news-detail-article-side">
            <section className="school-prototype-side-card news-detail-side-card news-detail-side-card-dark">
              <p className="overview-label">阅读建议</p>
              <p>这类政策更适合先看适用对象、关键时间和操作顺序，再去看学校方案或单条通知。</p>
            </section>

            {mappedNews ? (
              <section className="school-prototype-side-card news-detail-side-card">
                <p className="overview-label">对应新闻稿</p>
                <Link className="school-prototype-side-link" href={`/news/${mappedNews.id}`}>查看新闻版解读</Link>
              </section>
            ) : null}

            {relatedPolicies.length ? (
              <section className="school-prototype-side-card news-detail-side-card">
                <p className="overview-label">相关政策</p>
                <div className="news-detail-policy-list">
                  {relatedPolicies.map((policy) => (
                    <Link key={policy.id} className="school-prototype-side-link" href={getPolicyDetailHref(policy)}>
                      • {policy.title}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="school-prototype-side-card news-detail-side-card">
              <p className="overview-label">继续阅读</p>
              <Link className="school-prototype-side-link" href="/news/zhongkao-special">返回中招专题</Link>
              <Link className="school-prototype-side-link" href="/news/admission-timeline">查看官方招生日程</Link>
            </section>
          </aside>
        </div>
      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 政策详情页</span>
        <span>{sourceName} / 官方口径</span>
      </footer>
    </SiteShell>
  );
}
