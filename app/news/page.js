import SiteShell from '../../components/site-shell';
import { createRequire } from 'module';
import NewsPageClient from '../../components/news-page-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

export const metadata = {
  title: '上海中考高考新闻政策汇总 | 考哪去',
  description: '汇总上海中考、高考最新新闻、关键时间节点和官方政策文件，方便家长与学生集中查看考试动态与制度变化。'
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

  return (
    <SiteShell>
      <header className="hero">
        <section className="search-panel page-intro-panel editorial-intro-panel">
          <nav className="breadcrumb" aria-label="面包屑导航">
            <a href="/">首页</a>
            <span className="separator">/</span>
            <span>新闻政策</span>
          </nav>
          <div className="search-panel-head editorial-intro-head">
            <div className="editorial-intro-copy">
              <span className="module-glyph module-glyph-news module-glyph-large" aria-hidden="true"></span>
              <h1>{currentYear} 上海教育资讯频道</h1>
              <p>这一版首页只聚焦 {currentYear} 年当年内容，把上海中考、高招、学校观察和政策深读按专业资讯频道的方式重新组织。</p>
            </div>
            <div className="editorial-intro-metrics">
              <article><span>当年新闻</span><strong>{currentYearNews.length}</strong></article>
              <article><span>当年政策</span><strong>{currentYearPolicies.length}</strong></article>
              <article><span>频道栏目</span><strong>6</strong></article>
            </div>
          </div>
        </section>
      </header>
      <NewsPageClient news={news} policies={policies} />
    </SiteShell>
  );
}
