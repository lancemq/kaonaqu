import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import { getPolicyDetailHref, getPolicyMappedNewsId } from '../../../lib/policy-detail';
import { getNewsCategoryLabel, getNewsPriorityScore, getNewsSection, getPolicyExamType } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

// ===== news markdown 渲染 =====
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
    lastIndex = match.lastIndex;
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
  let skipping = false;

  // 这些 section 属于编辑口径的"导读"提示，无独立信息价值，整段跳过不渲染。
  const SKIP_SECTIONS = new Set([
    '这条信息为什么值得看',
    '适合谁先看',
    '适合谁看',
    '适合谁读'
  ]);

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
      const title = line.slice(3).trim();
      if (SKIP_SECTIONS.has(title)) {
        skipping = true;
        continue;
      }
      skipping = false;
      nodes.push(<h3 key={`h3-${key++}`} className="news-detail-markdown-heading">{title}</h3>);
      continue;
    }
    if (skipping) continue;
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

// ===== news block 渲染（结构化 JSON content）=====
// content 现为 block 数组：heading/paragraph/list/quote/divider。
// 旧 Markdown 字符串数据包装为 [{type:'markdown',text}] 走 renderNewsMarkdown 兼容。
// inline 格式（加粗/斜体/链接）复用 renderPolicyInlineMarkdown 解析。
function renderNewsBlocks(blocks) {
  if (!Array.isArray(blocks)) return null;
  // 跳过编辑口径导读 section（与原 renderNewsMarkdown 的 SKIP_SECTIONS 行为一致）
  const SKIP_SECTIONS = new Set([
    '这条信息为什么值得看',
    '适合谁先看',
    '适合谁看',
    '适合谁读'
  ]);
  const nodes = [];
  let skipping = false;

  blocks.forEach((block, i) => {
    // level<=2 的 heading 切换 skipping 状态
    if (block.type === 'heading' && block.level <= 2) {
      skipping = SKIP_SECTIONS.has(block.text);
    }
    if (skipping) return;

    const key = `block-${i}`;
    switch (block.type) {
      case 'heading': {
        const text = renderPolicyInlineMarkdown(block.text);
        // level 1/2 → h3（与原 ## 行为一致，避免比页面 h1 title 更突出）
        if (block.level <= 2) {
          nodes.push(<h3 key={key} className="news-detail-markdown-heading">{text}</h3>);
        } else {
          nodes.push(<h4 key={key} className="news-detail-markdown-subheading">{text}</h4>);
        }
        break;
      }
      case 'paragraph':
        nodes.push(<p key={key} className="news-detail-markdown-paragraph">{renderPolicyInlineMarkdown(block.text)}</p>);
        break;
      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul';
        nodes.push(
          <Tag key={key} className="news-detail-markdown-list">
            {(block.items || []).map((listItem, j) => (
              <li key={`${key}-${j}`}>{renderPolicyInlineMarkdown(listItem)}</li>
            ))}
          </Tag>
        );
        break;
      }
      case 'quote':
        nodes.push(<blockquote key={key} className="news-detail-markdown-quote">{renderPolicyInlineMarkdown(block.text)}</blockquote>);
        break;
      case 'divider':
        nodes.push(<hr key={key} className="news-detail-markdown-divider" />);
        break;
      case 'markdown':
        // 兼容旧 Markdown 字符串数据
        nodes.push(...(renderNewsMarkdown(block.text) || []));
        break;
      default:
        break;
    }
  });

  return nodes;
}

// ===== policy markdown 渲染（含表格 / 引用 / 有序列表 / 加粗 / 斜体）=====
function renderPolicyInlineMarkdown(text) {
  const parts = [];
  const value = String(text || '');
  const regex = /\[([^\]]+)\]\(([^)]*)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
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
    } else if (match[3] !== undefined) {
      parts.push(<strong key={`strong-${match.index}`}>{match[3]}</strong>);
    } else {
      parts.push(<em key={`em-${match.index}`}>{match[4]}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
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

// ===== 解析 =====
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

// ===== 标签 =====
function getExamTypeLabel(newsItem) {
  if (newsItem.examType === 'zhongkao') return '中招';
  if (newsItem.examType === 'gaokao') return '高招';
  return '综合';
}

function getPolicyExamTypeLabel(policy) {
  const type = getPolicyExamType(policy);
  if (type === 'zhongkao') return '中招';
  if (type === 'gaokao') return '高招';
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

function buildRelatedPoliciesForPolicy(policies, current) {
  return policies
    .filter((policy) => policy.id !== current.id)
    .filter((policy) => getPolicyExamType(policy) === getPolicyExamType(current))
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

function buildRelatedSchools(schools, current) {
  const linkedSchool = current.primarySchoolId
    ? schools.find((school) => school.id === current.primarySchoolId)
    : null;
  const candidates = [
    linkedSchool,
    ...schools.filter((school) => school.id !== linkedSchool?.id)
  ].filter(Boolean);

  return candidates
    .filter((school) => String(school.name || '').trim())
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

function formatArticleDate(value) {
  const text = String(value || '').trim();
  if (!text) return '暂无日期';
  return text.slice(0, 10).replaceAll('-', '.');
}

function SectionKicker({ children, inverse = false }) {
  return (
    <div className={`channel-kicker${inverse ? ' is-inverse' : ''}`}>
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

function NewsDetailNav() {
  return (
    <nav className="channel-nav" aria-label="顶部导航">
      <Link className="channel-brand" href="/" aria-label="考哪去首页">
        <strong>考哪去</strong>
        <span>SHANGHAI EDUCATION</span>
      </Link>
      <div className="channel-nav-links">
        <Link href="/">首页</Link>
        <Link className="is-active" href="/news">新闻</Link>
        <Link href="/schools">学校</Link>
        <Link href="/knowledge">知识</Link>
      </div>
    </nav>
  );
}

function NewsDetailFooter() {
  return (
    <>
      <div className="channel-color-bar" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <footer className="news-detail-footer">
        <div>
          <strong>考哪去</strong>
          <span>SHANGHAI EDUCATION PLATFORM</span>
        </div>
        <p>© 2026 考哪去</p>
      </footer>
    </>
  );
}

function SidebarList({ items, getHref, getLabel }) {
  return (
    <div className="news-detail-sidebar-list">
      {items.map((item) => (
        <Link key={item.id || getLabel(item)} href={getHref(item)}>
          <span>{getLabel(item)}</span>
          <i aria-hidden="true">→</i>
        </Link>
      ))}
    </div>
  );
}

const KNOWLEDGE_TOPICS = [
  { id: 'admission-guide', title: '中考志愿填报指南', href: '/knowledge' },
  { id: 'quality-review', title: '综合素质评价详解', href: '/knowledge' },
  { id: 'sports-test', title: '体育中考备考攻略', href: '/knowledge' },
  { id: 'admission-batch', title: '高中招生批次解读', href: '/knowledge' }
];

export async function generateMetadata({ params }) {
  const { news } = await loadDataStore();
  const { id } = await params;
  const newsItem = resolveNewsById(news, id);

  if (newsItem) {
    const isPolicy = newsItem.newsType === 'policy';
    const examType = isPolicy
      ? getPolicyExamType(newsItem)
      : (newsItem.examType === 'zhongkao' ? '中考' : newsItem.examType === 'gaokao' ? '高考' : '上海升学');
    const examLabel = isPolicy
      ? (examType === 'zhongkao' ? '中考' : examType === 'gaokao' ? '高考' : '升学')
      : examType;
    const titleSuffix = isPolicy ? `上海${examLabel}政策原文` : `${examType}政策解读`;
    return {
      title: `${newsItem.title} - ${titleSuffix} | 考哪去`,
      description: newsItem.summary || '查看上海升学新闻与政策详情。',
      keywords: [examLabel, '上海升学', '政策解读', isPolicy ? '政策' : newsItem.newsType === 'exam' ? '考试' : '招生'],
      openGraph: {
        type: 'article',
        locale: 'zh_CN',
        siteName: '考哪去',
        title: `${newsItem.title} - ${titleSuffix} | 考哪去`,
        description: newsItem.summary || '查看上海升学新闻与政策详情。'
      }
    };
  }

  return { title: '新闻详情 | 考哪去' };
}

export const revalidate = 3600;

export default async function NewsDetailPage({ params }) {
  const { news, schools } = await loadDataStore();
  const { id } = await params;
  const newsItem = resolveNewsById(news, id);
  if (!newsItem) {
    notFound();
  }
  if (newsItem.newsType === 'policy') {
    return renderPolicyDetail(newsItem, news);
  }
  return renderNewsDetail(newsItem, news, schools);
}

function renderNewsDetail(item, news, schools) {
  const policyNews = news.filter((n) => n.newsType === 'policy');
  const relatedPolicies = buildRelatedPolicies(policyNews, item);
  const relatedNews = buildRelatedNews(news, item);
  const relatedSchools = buildRelatedSchools(schools, item);
  const sourceName = item.source?.name || '未知来源';
  const articleType = getNewsCategoryLabel(item);
  const articleBodyMarkdown = item.content || '';
  const displayDate = formatArticleDate(item.publishedAt || item.updatedAt);
  const tags = [
    getExamTypeLabel(item),
    articleType,
    getStageLabel(item),
    item.newsType === 'school' ? '学校观察' : '招生政策'
  ].filter(Boolean);

  if (!articleBodyMarkdown || (Array.isArray(articleBodyMarkdown) && !articleBodyMarkdown.length)) {
    notFound();
  }

  // JSON-LD for NewsArticle Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": item.title,
    "description": item.summary || item.title,
    "datePublished": item.publishedAt || '',
    "dateModified": item.updatedAt || item.publishedAt || '',
    "image": [],
    "author": {
      "@type": "Organization",
      "name": sourceName,
      "url": item.source?.url || 'https://kaonaqu.xyz'
    },
    "publisher": {
      "@type": "Organization",
      "name": "考哪去",
      "url": "https://kaonaqu.xyz"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://kaonaqu.xyz/news/${encodeURIComponent(item.id)}`
    }
  };

  return (
    <main className="news-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsDetailNav />

      <header className="news-detail-header" id="top">
        <nav className="news-detail-breadcrumb" aria-label="面包屑">
          <Link href="/">首页</Link>
          <span>/</span>
          <Link href="/news">新闻</Link>
          <span>/</span>
          <strong>{articleType}</strong>
        </nav>

        <div className="news-detail-meta-row">
          <span className="news-detail-category">{articleType}</span>
          <time dateTime={item.publishedAt || item.updatedAt || ''}>{displayDate}</time>
          <span>{sourceName}</span>
        </div>

        <h1>{item.title}</h1>
        <p>{item.summary || '暂无摘要'}</p>
      </header>

      <section className="news-detail-body">
        <article className="news-detail-main" id="article-body">
          <div className="news-detail-markdown">
            {renderNewsBlocks(articleBodyMarkdown)}
          </div>

          <div className="news-detail-tags" aria-label="文章标签">
            <span>TAGS</span>
            {tags.map((tag) => (
              <em key={tag}>{tag}</em>
            ))}
          </div>
        </article>

        <aside className="news-detail-sidebar" id="related-policies">
          {relatedNews.length ? (
            <section className="news-detail-sidebar-card is-dark">
              <SectionKicker inverse>RELATED</SectionKicker>
              <h2>相关文章</h2>
              <div className="news-detail-related-text">
                {relatedNews.map((entry) => (
                  <Link key={entry.id} href={`/news/${entry.id}`}>{entry.title}</Link>
                ))}
              </div>
            </section>
          ) : null}

          {relatedSchools.length ? (
            <section className="news-detail-sidebar-card">
              <SectionKicker>RELATED SCHOOLS</SectionKicker>
              <h2>相关学校</h2>
              <SidebarList
                items={relatedSchools}
                getHref={(school) => `/schools/${school.id}`}
                getLabel={(school) => school.name}
              />
            </section>
          ) : null}

          <section className="news-detail-sidebar-card">
            <SectionKicker>KNOWLEDGE</SectionKicker>
            <h2>知识专题</h2>
            <SidebarList
              items={KNOWLEDGE_TOPICS}
              getHref={(topic) => topic.href}
              getLabel={(topic) => topic.title}
            />
          </section>

          <section className="news-detail-sidebar-card">
            <SectionKicker>SHARE</SectionKicker>
            <div className="news-detail-share-row">
              <button type="button">微信</button>
              <button type="button">链接</button>
            </div>
          </section>

          {relatedPolicies.length ? (
            <section className="news-detail-sidebar-card">
              <SectionKicker>POLICY</SectionKicker>
              <h2>相关政策</h2>
              <div className="news-detail-related-text is-light">
                {relatedPolicies.map((policy) => (
                  <Link key={policy.id} href={getPolicyDetailHref(policy)}>{policy.title}</Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </section>

      <NewsDetailFooter />
    </main>
  );
}

function renderPolicyDetail(item, news) {
  const mappedNewsId = getPolicyMappedNewsId(item);
  const mappedNews = mappedNewsId ? news.find((entry) => entry.id === mappedNewsId) : null;
  const articleBodyMarkdown = item.content || '';
  const sourceName = item.source?.name || '官方来源';
  const examTypeLabel = getPolicyExamTypeLabel(item);
  const summaryText = cleanPolicyText(item.summary, item.title) || '暂无摘要';
  const policyNews = news.filter((n) => n.newsType === 'policy');
  const relatedPolicies = buildRelatedPoliciesForPolicy(policyNews, item);
  const displayDate = formatArticleDate(item.publishedAt || item.year);

  if (!articleBodyMarkdown || (Array.isArray(articleBodyMarkdown) && !articleBodyMarkdown.length)) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": item.title,
    "description": item.summary || item.title,
    "datePublished": item.publishedAt || '',
    "dateModified": item.publishedAt || '',
    "image": [],
    "author": {
      "@type": "Organization",
      "name": sourceName,
      "url": item.source?.url || 'https://kaonaqu.xyz'
    },
    "publisher": {
      "@type": "Organization",
      "name": "考哪去",
      "url": "https://kaonaqu.xyz"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://kaonaqu.xyz/news/${encodeURIComponent(item.id)}`
    }
  };

  const tags = [examTypeLabel, '官方文件', '政策原文'].filter(Boolean);
  const policyKnowledgeTopics = [
    { id: 'zhongkao-special', title: '进入中招专题', href: '/news/zhongkao-special' },
    { id: 'admission-timeline', title: '查看官方招生日程', href: '/news/admission-timeline' },
    { id: 'policy-glossary', title: '政策概念速查', href: '/news/policy-glossary' },
    { id: 'policy-faq', title: '高频政策问答', href: '/news/policy-faq' }
  ];

  return (
    <main className="news-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsDetailNav />

      <header className="news-detail-header" id="top">
        <nav className="news-detail-breadcrumb" aria-label="面包屑">
          <Link href="/">首页</Link>
          <span>/</span>
          <Link href="/news">新闻</Link>
          <span>/</span>
          <strong>政策</strong>
        </nav>

        <div className="news-detail-meta-row">
          <span className="news-detail-category">政策</span>
          <time dateTime={item.publishedAt || ''}>{displayDate}</time>
          <span>{sourceName}</span>
        </div>

        <h1>{item.title}</h1>
        <p>{summaryText}</p>
      </header>

      <section className="news-detail-body">
        <article className="news-detail-main" id="article-body">
          <div className="news-detail-markdown">
            {renderNewsBlocks(articleBodyMarkdown)}
          </div>

          <div className="news-detail-tags" aria-label="文章标签">
            <span>TAGS</span>
            {tags.map((tag) => (
              <em key={tag}>{tag}</em>
            ))}
          </div>
        </article>

        <aside className="news-detail-sidebar">
          {mappedNews ? (
            <section className="news-detail-sidebar-card is-dark">
              <SectionKicker inverse>RELATED</SectionKicker>
              <h2>对应新闻稿</h2>
              <div className="news-detail-related-text">
                <Link href={`/news/${mappedNews.id}`}>{mappedNews.title}</Link>
              </div>
            </section>
          ) : null}

          {relatedPolicies.length ? (
            <section className="news-detail-sidebar-card">
              <SectionKicker>POLICY</SectionKicker>
              <h2>相关政策</h2>
              <div className="news-detail-related-text is-light">
                {relatedPolicies.map((policy) => (
                  <Link key={policy.id} href={getPolicyDetailHref(policy)}>{policy.title}</Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="news-detail-sidebar-card">
            <SectionKicker>KNOWLEDGE</SectionKicker>
            <h2>知识专题</h2>
            <SidebarList
              items={policyKnowledgeTopics}
              getHref={(topic) => topic.href}
              getLabel={(topic) => topic.title}
            />
          </section>

          <section className="news-detail-sidebar-card">
            <SectionKicker>SHARE</SectionKicker>
            <div className="news-detail-share-row">
              <button type="button">微信</button>
              <button type="button">链接</button>
            </div>
          </section>
        </aside>
      </section>

      <NewsDetailFooter />
    </main>
  );
}
