import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import {
  SCHOOL_CATEGORY_LIST,
  getSchoolsByCategory,
  getSchoolCategoryId,
  getSchoolCategoryLabel
} from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海学校分类大全 - 四校八大市重点民办国际一览 | 考哪去',
  description: '按学校层级分类浏览上海初中、高中：四校、八大、四校分校、八大分校、市实验性示范性高中、市重点、市特色、区重点、一般高中、民办高中、国际化等。',
  keywords: ['上海学校分类', '上海四校', '上海八大', '市重点高中', '区重点高中', '民办高中', '国际课程班']
};

export const revalidate = 86400;

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function buildCategoryDescriptor(category, schools) {
  const subset = getSchoolsByCategory(schools, category.id);
  const stageGroups = subset.reduce(
    (acc, school) => {
      acc[school.schoolStage] = (acc[school.schoolStage] || 0) + 1;
      return acc;
    },
    { junior: 0, senior_high: 0, complete: 0 }
  );
  return {
    total: subset.length,
    junior: stageGroups.junior,
    seniorHigh: stageGroups.senior_high,
    complete: stageGroups.complete
  };
}

export default async function SchoolCategoriesPage() {
  const { schools, districts } = await loadDataStore();

  const summary = SCHOOL_CATEGORY_LIST.map((category) => ({
    ...category,
    stats: buildCategoryDescriptor(category, schools)
  })).filter((entry) => entry.stats.total > 0);

  const totalCategories = summary.length;
  const totalSchoolsCovered = summary.reduce((acc, item) => acc + item.stats.total, 0);
  const totalDistricts = districts.length;

  // 重点分类（按学校数量排序前 8）
  const featured = summary.slice().sort((a, b) => b.stats.total - a.stats.total).slice(0, 8);

  // 高中分类（按 sortOrder 排前）
  const seniorCategories = summary.filter((c) => ['si-fen', 'ba-da', 'si-fen-branch', 'ba-da-branch', 'shi-shi-fan', 'shi-zhongdian', 'shi-tese', 'qu-zhongdian', 'yiban-gaozhong', 'guoji-kecheng', 'minban-gaozhong'].includes(c.id));
  const juniorCategories = summary.filter((c) => ['gongban-chuzhong', 'minban-chuzhong', 'private-bilingual', 'foreign-international'].includes(c.id));

  return (
    <SiteShell
      hideKnowledgeNav
      breadcrumbItems={[
        { label: '学校信息', href: '/schools' },
        { label: '学校分类' }
      ]}
    >
      <header className="hero" id="top">
        <section className="district-datadesk-hero" aria-label="上海学校分类总览">
          <div className="district-datadesk-hero-grid">
            <div className="district-datadesk-hero-main">
              <p className="overview-label">School Categories</p>
              <h1>上海学校分类大全</h1>
              <p className="district-datadesk-subtitle">按层级和办学性质分类浏览上海初高中：四校八大、市重点、区重点、民办、国际课程。</p>
              <p className="district-datadesk-description">{formatNumber(schools.length)} 所学校按 {totalCategories} 个核心分类重组。</p>
              <div className="district-datadesk-inline-meta">
                <span>层级分类</span>
                <span>覆盖 16 区</span>
                <span>每个分类独立页面</span>
              </div>
              <div className="district-datadesk-hero-actions">
                <Link className="module-link" href="/schools">查看 16 区学校</Link>
                <Link className="module-link" href="/schools/groups">教育集团专题</Link>
                <Link className="module-link" href="/schools/simulator">志愿模拟</Link>
              </div>
            </div>

            <div className="district-datadesk-summary-grid">
              <article className="district-datadesk-summary-card district-datadesk-summary-card-strong">
                <span>分类数量</span>
                <strong>{totalCategories}</strong>
                <p>已建立的核心学校分类</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>覆盖学校</span>
                <strong>{formatNumber(schools.length)}</strong>
                <p>已分类的上海学校条目</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>覆盖区域</span>
                <strong>{totalDistricts}</strong>
                <p>上海 16 区学校检索</p>
              </article>
              <article className="district-datadesk-summary-card">
                <span>分类入口</span>
                <strong>{totalCategories}</strong>
                <p>每个分类有独立详情页</p>
              </article>
            </div>
          </div>
        </section>
      </header>

      <section className="district-datadesk-statusbar" aria-label="分类状态">
        <span className="district-datadesk-statuslabel">Category Status</span>
        <span>已分类 {formatNumber(totalSchoolsCovered)} / {formatNumber(schools.length)} 所学校</span>
      </section>

      <main className="layout district-datadesk-layout">
        <aside className="district-datadesk-sidebar">
          <section className="district-datadesk-panel district-datadesk-panel-dark">
            <div className="district-datadesk-panel-head">
              <p className="overview-label">分类导航</p>
              <span>全部 {totalCategories} 类</span>
            </div>
            <p className="district-datadesk-panel-copy">按分类查看学校列表，每类可看到该分类下的具体学校、所在区域与培养方向。</p>
            <div className="district-datadesk-stack">
              {summary.map((cat) => (
                <span key={cat.id}>{cat.shortLabel} {cat.stats.total}</span>
              ))}
            </div>
          </section>

          <section className="district-datadesk-panel">
            <div className="district-datadesk-panel-head">
              <p className="overview-label">相关入口</p>
              <span>横向查看</span>
            </div>
            <div className="district-datadesk-related">
              <Link className="district-datadesk-related-link" href="/schools">
                <strong>16 区学校专题</strong>
                <span>按区域浏览学校</span>
              </Link>
              <Link className="district-datadesk-related-link" href="/schools/groups">
                <strong>教育集团专题</strong>
                <span>按教育集团查看</span>
              </Link>
              <Link className="district-datadesk-related-link" href="/schools/compare">
                <strong>学校多维对比</strong>
                <span>支持多校横向对比</span>
              </Link>
            </div>
          </section>
        </aside>

        <section className="district-datadesk-results">
          <section className="district-datadesk-panel">
            <div className="district-datadesk-results-head">
              <div>
                <p className="overview-label">热门分类</p>
                <h2>学校数量最多的分类</h2>
              </div>
              <p>优先展示学校条目相对集中的分类，便于快速进入比较。</p>
            </div>
            <div className="district-datadesk-cardlist">
              {featured.map((cat) => (
                <Link key={cat.id} href={`/schools/category/${cat.slug}`} className="district-datadesk-card">
                  <div className="district-datadesk-cardhead">
                    <div>
                      <p className="district-datadesk-cardkicker">学校分类</p>
                      <h3>{cat.label}</h3>
                    </div>
                    <div className="district-datadesk-cardmeta">
                      <span>{cat.stats.total} 所</span>
                      <span>排序 {cat.sortOrder}</span>
                    </div>
                  </div>
                  <p className="district-datadesk-cardsummary">{cat.description}</p>
                  <div className="district-datadesk-cardfooter">
                    <div className="district-datadesk-cardtags">
                      <span className="district-datadesk-cardtag">高中 {cat.stats.seniorHigh}</span>
                      <span className="district-datadesk-cardtag">初中 {cat.stats.junior}</span>
                      <span className="district-datadesk-cardtag">完全中学 {cat.stats.complete}</span>
                    </div>
                    <span className="district-datadesk-cardlink">进入分类 →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {seniorCategories.length > 0 && (
            <section className="district-datadesk-panel">
              <div className="district-datadesk-results-head">
                <div>
                  <p className="overview-label">高中分类</p>
                  <h2>按层级浏览高中</h2>
                </div>
                <p>从四校八大到市特色、区重点、一般高中，按层级逐步下钻。</p>
              </div>
              <div className="district-datadesk-schoolgrid">
                {seniorCategories.map((cat) => (
                  <Link key={cat.id} href={`/schools/category/${cat.slug}`} className="district-datadesk-schoolitem">
                    <strong>{cat.label}</strong>
                    <span>{cat.stats.total} 所 · 高中 {cat.stats.seniorHigh} · 完全中学 {cat.stats.complete}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {juniorCategories.length > 0 && (
            <section className="district-datadesk-panel">
              <div className="district-datadesk-results-head">
                <div>
                  <p className="overview-label">初中分类</p>
                  <h2>按性质浏览初中</h2>
                </div>
                <p>公办、民办、双语、国际四类初中，覆盖对口入学与摇号入学路径。</p>
              </div>
              <div className="district-datadesk-schoolgrid">
                {juniorCategories.map((cat) => (
                  <Link key={cat.id} href={`/schools/category/${cat.slug}`} className="district-datadesk-schoolitem">
                    <strong>{cat.label}</strong>
                    <span>{cat.stats.total} 所 · 初中 {cat.stats.junior} · 完全中学 {cat.stats.complete}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="district-datadesk-panel">
            <div className="district-datadesk-results-head">
              <div>
                <p className="overview-label">全部分类</p>
                <h2>所有 {totalCategories} 个学校分类</h2>
              </div>
              <p>按 sortOrder 排序的完整分类列表。</p>
            </div>
            <div className="district-datadesk-schoolgrid">
              {summary.map((cat) => (
                <Link key={cat.id} href={`/schools/category/${cat.slug}`} className="district-datadesk-schoolitem">
                  <strong>{cat.label}</strong>
                  <span>{cat.stats.total} 所 · 排序 {cat.sortOrder}</span>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 分类专题</span>
        <span>{totalCategories} 分类 / {formatNumber(schools.length)} 学校 / {totalDistricts} 区</span>
      </footer>
    </SiteShell>
  );
}
