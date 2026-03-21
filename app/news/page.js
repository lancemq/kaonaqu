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
              <h1>新闻政策版</h1>
              <p>按资讯站的阅读逻辑组织上海中考、高考动态，把考试新闻、招生新闻、学校动态和政策解释集中在一个版面里浏览。</p>
            </div>
            <div className="editorial-intro-metrics">
              <article><span>新闻条数</span><strong>{news.length}</strong></article>
              <article><span>政策文件</span><strong>{policies.length}</strong></article>
              <article><span>重点栏目</span><strong>3</strong></article>
            </div>
          </div>
        </section>
      </header>
      <NewsPageClient news={news} policies={policies} />
    </SiteShell>
  );
}
