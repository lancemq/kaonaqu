import Link from 'next/link';
import { createRequire } from 'module';
import NewsPageClient from '../../components/news-page-client';
import { getNewsCategoryLabel, filterNews, getNewsSection } from '../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadNewsList, loadSchoolNamesByIds } = require('../../shared/data-store');

export const metadata = {
  title: '上海中考高考新闻政策 | 考哪去',
  description: '上海中考、高考最新政策、考试安排、招生消息与学校动态聚合，帮你少翻信息，先抓重点。',
  keywords: ['上海中考新闻', '上海高考政策', '中招安排', '高招消息', '上海升学动态']
};

function getCurrentYear(news) {
  const years = news
    .map((item) => {
      const value = String(item?.publishedAt || item?.date || '');
      return Number(value.slice(0, 4)) || 0;
    })
    .filter(Boolean)
    .sort((a, b) => b - a);
  return years[0] || new Date().getFullYear();
}

function isCurrentYearItem(item, year) {
  const publishedYear = Number(String(item?.publishedAt || item?.date || '').slice(0, 4)) || 0;
  return publishedYear === year;
}

function isRenderablePolicy(policy, currentYear) {
  const title = String(policy?.title || '').trim();
  if (!title || title === '上海市教育委员会') return false;
  if (!isCurrentYearItem(policy, currentYear)) return false;
  return policy.source?.type === 'official' || String(policy.source?.name || '').includes('上海市教育委员会');
}

function SectionLabel({ children }) {
  return (
    <div className="channel-kicker">
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

// ---- 列表轻量视图模型：服务端预计算派生展示字段，避免把 content 等详情级大对象随列表下发 ----
function sanitizePolicyText(text, title = '') {
  let value = String(text || '');
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

function clipText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function getPolicyLabel(policy) {
  const title = String(policy.title || '');
  if (title.includes('义务教育')) return '义务教育';
  if (title.includes('普通高校') || title.includes('高考') || title.includes('春季考试')) return '高招政策';
  return '中招政策';
}

function getPolicySummaryText(policy) {
  const summary = sanitizePolicyText(policy.summary, policy.title);
  const contentText = Array.isArray(policy.content)
    ? policy.content.map((b) => b.text || (Array.isArray(b.items) ? b.items.join(' ') : '')).join(' ')
    : (policy.content || '');
  const content = sanitizePolicyText(contentText, policy.title);
  return clipText(summary || content || '查看政策原文与关键内容。', 130);
}

function getItemKicker(item) {
  if (item.newsType === 'policy') {
    return `${getPolicyLabel(item)} / 政策文件`;
  }
  return `${item.examType === 'zhongkao' ? '中招新闻' : item.examType === 'gaokao' ? '高招新闻' : '综合资讯'} / ${getNewsCategoryLabel(item)}`;
}

function toNewsListCard(item) {
  const itemType = item.newsType === 'policy' ? 'policy' : 'news';
  const summaryText = itemType === 'policy'
    ? getPolicySummaryText(item)
    : (item.summary || '进入详情查看完整内容。');
  return {
    id: item.id,
    title: item.title,
    itemType,
    newsType: item.newsType,
    examType: item.examType || '',
    category: item.category || '',
    sourceName: item.source?.name || '',
    publishedAt: item.publishedAt || '',
    date: item.date || '',
    summaryText,
    kicker: getItemKicker(item),
    section: getNewsSection(item),
    primarySchoolId: item.primarySchoolId || ''
  };
}

export default async function NewsPage({ searchParams }) {
  const news = await loadNewsList();
  const params = await searchParams;
  const activeFilter = typeof params?.filter === 'string' && params.filter !== 'all' ? params.filter : 'all';
  const requestedPage = parseInt(typeof params?.page === 'string' ? params.page : '1', 10);
  const requestedPageSafe = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const currentYear = getCurrentYear(news);
  const currentYearNews = news
    .filter((item) => isCurrentYearItem(item, currentYear))
    .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));
  const filteredNews = filterNews(currentYearNews, activeFilter);

  const NEWS_PER_PAGE = 7;
  const total = filteredNews.length;
  const totalPages = Math.max(1, Math.ceil(total / NEWS_PER_PAGE));
  const safePage = Math.min(requestedPageSafe, totalPages);
  const pageItems = filteredNews.slice((safePage - 1) * NEWS_PER_PAGE, safePage * NEWS_PER_PAGE);
  const newsCards = pageItems.map(toNewsListCard);

  const schoolIds = [...new Set(pageItems.map((n) => n.primarySchoolId).filter(Boolean))];
  const schoolNamesById = await loadSchoolNamesByIds(schoolIds);

  const currentYearPolicies = news.filter((item) => item.newsType === 'policy' && isRenderablePolicy(item, currentYear));
  const today = new Date().toISOString().slice(0, 10);
  const todayUpdates = currentYearNews.filter((item) => String(item.publishedAt || item.updatedAt || '').startsWith(today)).length;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '上海升学新闻政策列表',
    description: `${currentYear}年上海中考高考新闻政策汇总`,
    numberOfItems: news.length
  };

  return (
    <main className="news-aerial-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

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

      <header className="channel-hero">
        <section className="channel-hero-content" aria-label="新闻频道概览">
          <div className="channel-hero-copy">
            <SectionLabel>NEWS CHANNEL</SectionLabel>
            <h1>新闻动态</h1>
            <p>实时追踪上海中考、高考最新政策发布与升学新闻，一站式掌握关键信息动态。</p>
          </div>

          <aside className="channel-hero-stats" aria-label="新闻统计">
            <article>
              <span>新闻总数</span>
              <strong>{currentYearNews.length}</strong>
              <p>{currentYear} 年本地动态</p>
            </article>
            <article>
              <span>政策文件</span>
              <strong>{currentYearPolicies.length}</strong>
              <p>官方政策与通知</p>
            </article>
            <article>
              <span>今日更新</span>
              <strong>{todayUpdates}</strong>
              <p>最新同步条目</p>
            </article>
          </aside>
        </section>
      </header>

      <NewsPageClient
        news={newsCards}
        schoolNamesById={schoolNamesById}
        total={total}
        totalPages={totalPages}
        currentPage={safePage}
        activeFilter={activeFilter}
      />

      <div className="channel-color-bar" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <footer className="channel-footer">
        <div>
          <strong>考哪去</strong>
          <span>SHANGHAI EDUCATION PLATFORM</span>
        </div>
        <nav aria-label="页脚导航">
          <Link href="/">首页</Link>
          <Link href="/news">新闻</Link>
          <Link href="/schools">学校</Link>
          <Link href="/knowledge">知识</Link>
        </nav>
        <p>© 2026 考哪去</p>
      </footer>
    </main>
  );
}
