import SiteShell from '../../components/site-shell';
import { createRequire } from 'module';
import SchoolsPageClient from '../../components/schools-page-client';
import schoolOpenDays from '../../lib/school-open-days';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

export const metadata = {
  title: '上海初中高中学校信息查询 | 考哪去',
  description: '按区域检索上海初中、高中学校信息，查看学校介绍、类型、阶段、特色标签、梯队与来源说明，适合升学择校参考。'
};

export const dynamic = 'force-dynamic';

export default async function SchoolsPage() {
  const { districts, schools, news } = await loadDataStore();

  return (
    <SiteShell>
      <header className="hero" id="top">
        <section className="search-panel editorial-intro-panel" aria-label="搜索与筛选">
          <nav className="breadcrumb" aria-label="面包屑导航">
            <a href="/">首页</a>
            <span className="separator">/</span>
            <span>学校信息</span>
          </nav>
          <div className="search-panel-head editorial-intro-head">
            <div className="editorial-intro-copy">
              <span className="module-glyph module-glyph-schools module-glyph-large" aria-hidden="true"></span>
              <h1>学校数据库</h1>
              <p>把上海学校信息做成更像资讯数据库的检索页。你可以按区域、学段、办学性质和特色标签交叉筛选，不必在零散帖子里反复找线索。</p>
            </div>
            <div className="editorial-intro-metrics">
              <article><span>学校总量</span><strong>{schools.length}</strong></article>
              <article><span>覆盖区域</span><strong>{districts.length}</strong></article>
              <article><span>关联动态</span><strong>{news.length}</strong></article>
            </div>
          </div>
        </section>
      </header>
      <SchoolsPageClient districts={districts} schools={schools} news={news} openDays={schoolOpenDays} />
    </SiteShell>
  );
}
