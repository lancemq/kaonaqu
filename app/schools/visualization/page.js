import SiteShell from '../../../components/site-shell';
import { createRequire } from 'module';
import GroupGraphClient from '../../../components/group-graph';
import AdmissionFlowClient from '../../../components/admission-flow';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海教育数据可视化 | 考哪去',
  description: '通过教育集团关系图谱和初升高升学流向桑基图，直观了解上海学校分布与对口关系。'
};

export const dynamic = 'force-dynamic';

export default async function VisualizationPage() {
  const { schools, districts } = await loadDataStore();

  return (
    <SiteShell hideKnowledgeNav breadcrumbItems={[
      { label: '首页', href: '/' },
      { label: '学校信息', href: '/schools' },
      { label: '数据可视化' }
    ]}>
      <header className="hero" id="top">
        <section className="schools-visualization-hero" aria-label="数据可视化">
          <div className="schools-visualization-hero-grid">
            <div className="schools-visualization-intro">
              <p className="overview-label">Data Visualization</p>
              <h1>上海教育数据可视化</h1>
              <p className="schools-visualization-subtitle">通过教育集团关系图谱和初升高升学流向桑基图，直观了解上海学校分布与对口关系。</p>
              <div className="schools-visualization-actions">
                <a className="schools-visualization-link" href="/schools/compare">学校多维对比 →</a>
                <a className="schools-visualization-link" href="/schools/groups">教育集团专题 →</a>
                <a className="schools-visualization-link" href="/schools">学校列表 →</a>
              </div>
            </div>

            <div className="schools-visualization-summary-grid">
              <article className="schools-visualization-summary-card">
                <span>收录学校</span>
                <strong>{schools.length}</strong>
                <p>当前数据库可检索学校</p>
              </article>
              <article className="schools-visualization-summary-card">
                <span>覆盖区域</span>
                <strong>{districts.length}</strong>
                <p>上海 16 区学校覆盖</p>
              </article>
              <article className="schools-visualization-summary-card">
                <span>教育集团</span>
                <strong>{new Set(schools.filter(s => s.group).map(s => s.group)).size}</strong>
                <p>已收录教育集团数量</p>
              </article>
              <article className="schools-visualization-summary-card">
                <span>升学路线</span>
                <strong>{schools.reduce((sum, s) => sum + (s.admissionRoutes?.length || 0), 0)}</strong>
                <p>初升高对口升学路径</p>
              </article>
            </div>
          </div>
        </section>
      </header>

      <section className="schools-visualization-statusbar" aria-label="可视化说明">
        <span className="schools-visualization-statuslabel">Visualization Guide</span>
        <span>下方包含两个交互式图表：集团关系图谱（力导向布局）与 升学流向桑基图（节点流向），支持拖拽、缩放与高亮交互。</span>
      </section>

      <main className="schools-visualization-results">
        {/* Section 1: Group Graph */}
        <section className="schools-visualization-panel" aria-label="教育集团关系图谱">
          <div className="schools-visualization-panel-head">
            <div>
              <p className="overview-label">Group Graph</p>
              <h2>1. 教育集团关系图谱</h2>
            </div>
            <p>展示包含 3 所及以上成员校的教育集团及其成员分布。节点大小代表集团规模，支持拖拽与缩放交互。</p>
          </div>
          <GroupGraphClient schools={schools} />
        </section>

        {/* Section 2: Admission Flow */}
        <section className="schools-visualization-panel" aria-label="初升高对口升学流向图">
          <div className="schools-visualization-panel-head">
            <div>
              <p className="overview-label">Admission Flow</p>
              <h2>2. 初升高对口升学流向图</h2>
            </div>
            <p>展示初中到高中的对口升学路径。左侧为初中，右侧为高中，线条粗细反映对口关系数量。</p>
          </div>
          <AdmissionFlowClient schools={schools} />
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 数据可视化</span>
        <span>集团关系图谱 / 升学流向桑基图 / {schools.length} 所学校</span>
      </footer>
    </SiteShell>
  );
}
