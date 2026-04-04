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

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel news-channel-hero">
          <div className="news-channel-hero-grid">
            <div className="news-channel-hero-main">
              <p className="overview-label">新闻政策</p>
              <h1>{currentYear} 上海教育资讯频道</h1>
              <p className="news-channel-subtitle">
                汇总当年上海中招、高招、入学政策和学校动态，把更值得优先关注的考试安排、报名录取信息和政策专题放在同一页。
              </p>
              <p>先看当年主线新闻，再进入专题页继续看政策、术语和时间线。</p>
              <div className="news-channel-tag-row">
                <Link className="pill news-channel-tag-link" href="/news">全部</Link>
                <Link className="pill news-channel-tag-link" href="/news/zhongkao-special">当年新闻</Link>
                <Link className="pill news-channel-tag-link" href="/news/policy-deep-dive">当年政策</Link>
                <Link className="pill news-channel-tag-link" href="/schools">学校观察</Link>
              </div>
            </div>
            <aside className="news-channel-hero-side">
              <Link className="news-channel-focus-link" href="/news/admission-timeline">
                <article className="news-channel-focus-card">
                  <span className="overview-label">官方招生日程</span>
                  <h2>报名、考试、确认、录取时间节点</h2>
                  <div className="news-channel-focus-meta">
                    <span>中招 / 高招 / 入学</span>
                    <span>按时间顺序查看</span>
                  </div>
                </article>
              </Link>
            </aside>
          </div>
          <div className="news-channel-status-bar">
            <span className="news-channel-status-label">最新统计</span>
            <span>考试新闻 {examCount} · 招生新闻 {admissionCount} · 学校动态 {schoolCount} · 政策文件 {currentYearPolicies.length}</span>
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
