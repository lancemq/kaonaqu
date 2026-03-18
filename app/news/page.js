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
        <section className="search-panel page-intro-panel">
          <nav className="breadcrumb" aria-label="面包屑导航">
            <a href="/">首页</a>
            <span className="separator">/</span>
            <span>新闻政策</span>
          </nav>
          <div className="search-panel-head">
            <span className="module-glyph module-glyph-news module-glyph-large" aria-hidden="true"></span>
            <p>集中查看上海中考、高考的考试动态、关键时间节点和官方政策文件，适合作为家长和学生的最新信息入口。</p>
          </div>
        </section>
      </header>
      <NewsPageClient news={news} policies={policies} />
    </SiteShell>
  );
}
