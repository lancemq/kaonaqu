import SiteShell from '../../components/site-shell';
import { createRequire } from 'module';
import Link from 'next/link';
import NewsPageClient from '../../components/news-page-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

export const metadata = {
  title: '上海教育资讯频道 | 考哪去',
  description: '集中查看上海当年中招、高招、义务教育入学政策、考试安排、招生信息和学校动态，并进入政策专题继续阅读。'
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const { news, policies } = await loadDataStore();
  const currentYear = Math.max(
    ...news.map((item) => Number(String(item.publishedAt || '').slice(0, 4)) || 0),
    ...policies.map((item) => Number(item.year) || Number(String(item.publishedAt || '').slice(0, 4)) || 0),
    new Date().getFullYear()
  );
  const currentYearNews = news.filter((item) => Number(String(item.publishedAt || '').slice(0, 4)) === currentYear);
  const currentYearPolicies = policies.filter((item) => (Number(item.year) || Number(String(item.publishedAt || '').slice(0, 4))) === currentYear);
  const schoolCount = currentYearNews.filter((item) => item.newsType === 'school').length;
  const examCount = currentYearNews.filter((item) => item.newsType === 'exam').length;
  const admissionCount = currentYearNews.filter((item) => item.newsType === 'admission').length;
  const latestLocalHeadline = currentYearNews[0] || null;

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel news-channel-hero">
          <div className="news-channel-hero-grid">
            <div className="news-channel-hero-main">
              <p className="overview-label">上海升学新闻中心</p>
              <h1>{currentYear} 上海升学新闻与政策入口</h1>
              <p className="news-channel-subtitle">
                只汇总上海本地中招、高招、义务教育入学和学校动态，把更值得优先关注的考试安排、报名录取信息与政策专题放在同一页。
              </p>
              <p>先看本周重点和本市关键节点，再进入专题页继续看政策、术语、时间线和单条新闻详情。</p>
              <div className="news-channel-tag-row">
                <Link className="pill news-channel-tag-link" href="/news/zhongkao-special">上海中考</Link>
                <Link className="pill news-channel-tag-link" href="/news/gaokao-special">上海高考</Link>
                <Link className="pill news-channel-tag-link" href="/news/admission-timeline">本市时间线</Link>
                <Link className="pill news-channel-tag-link" href="/schools">上海学校</Link>
              </div>
            </div>
            <aside className="news-channel-hero-side">
              {latestLocalHeadline ? (
                <Link className="news-channel-focus-link" href={`/news/${latestLocalHeadline.id}`}>
                  <article className="news-channel-focus-card">
                    <span className="overview-label">本周最重要</span>
                    <h2>{latestLocalHeadline.title}</h2>
                    <p className="news-channel-focus-summary">{latestLocalHeadline.summary || '查看这条与当前上海升学节奏最相关的新闻。'}</p>
                    <div className="news-channel-focus-meta">
                      <span>{latestLocalHeadline.publishedAt || '暂无日期'}</span>
                      <span>进入详情</span>
                    </div>
                  </article>
                </Link>
              ) : null}
            </aside>
          </div>
        </section>
      </header>
      <NewsPageClient news={news} policies={policies} />

      <footer className="prototype-page-footer">
        <span>上海升学观察 / {currentYear} 新闻政策频道</span>
        <span>当年新闻 {currentYearNews.length} / 当年政策 {currentYearPolicies.length} / 学校动态 {schoolCount}</span>
      </footer>
    </SiteShell>
  );
}
