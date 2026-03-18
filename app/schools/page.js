import SiteShell from '../../components/site-shell';
import { createRequire } from 'module';
import SchoolsPageClient from '../../components/schools-page-client';

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
        <section className="search-panel" aria-label="搜索与筛选">
          <nav className="breadcrumb" aria-label="面包屑导航">
            <a href="/">首页</a>
            <span className="separator">/</span>
            <span>学校信息</span>
          </nav>
          <div className="search-panel-head">
            <span className="module-glyph module-glyph-schools module-glyph-large" aria-hidden="true"></span>
            <p>按区域筛选学校，查看学校介绍、阶段、类型、特色标签以及来源信息。</p>
          </div>
        </section>
      </header>
      <SchoolsPageClient districts={districts} schools={schools} news={news} />
    </SiteShell>
  );
}
