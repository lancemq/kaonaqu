import Link from 'next/link';
import { createRequire } from 'module';
import NewsPageClient from '../../components/news-page-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

export const metadata = {
  title: '上海中考高考新闻政策 | 考哪去',
  description: '上海中考、高考最新政策、考试安排、招生消息与学校动态聚合，帮你少翻信息，先抓重点。',
  keywords: ['上海中考新闻', '上海高考政策', '中招安排', '高招消息', '上海升学动态']
};

export const revalidate = 3600;

function getCurrentYear(news, policies) {
  const years = [...news, ...policies]
    .map((item) => {
      const value = String(item?.publishedAt || item?.date || '');
      return Number(value.slice(0, 4)) || Number(item?.year) || 0;
    })
    .filter(Boolean)
    .sort((a, b) => b - a);
  return years[0] || new Date().getFullYear();
}

function isCurrentYearItem(item, year) {
  const publishedYear = Number(String(item?.publishedAt || item?.date || '').slice(0, 4)) || Number(item?.year) || 0;
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

export default async function NewsPage() {
  const { news, policies, schools } = await loadDataStore();
  const schoolNamesById = Object.fromEntries(schools.map((school) => [school.id, school.name || '']));
  const currentYear = getCurrentYear(news, policies);
  const currentYearNews = news.filter((item) => isCurrentYearItem(item, currentYear));
  const currentYearPolicies = policies.filter((item) => isRenderablePolicy(item, currentYear));
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

      <header className="news-hero-slab">
        <section className="news-hero-content" aria-label="新闻频道概览">
          <div className="news-hero-copy">
            <SectionLabel>NEWS CHANNEL</SectionLabel>
            <h1>新闻动态</h1>
            <p>实时追踪上海中考、高考最新政策发布与升学新闻，一站式掌握关键信息动态。</p>
          </div>

          <aside className="news-hero-stats" aria-label="新闻统计">
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
        news={news}
        policies={policies}
        schoolNamesById={schoolNamesById}
        currentYear={currentYear}
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
