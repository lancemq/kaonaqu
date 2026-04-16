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
  const { schools } = await loadDataStore();

  return (
    <SiteShell hideKnowledgeNav breadcrumbItems={[
      { label: '首页', href: '/' },
      { label: '学校信息', href: '/schools' },
      { label: '数据可视化' }
    ]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 上海教育数据可视化</h1>
              <p className="text-sm text-gray-500 mt-1">直观展示教育集团分布与升学流向关系</p>
            </div>
            <div className="flex gap-2">
              <a href="/schools/compare" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                ← 对比工具
              </a>
              <a href="/schools" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                ← 学校列表
              </a>
            </div>
          </div>

          {/* Section 1: Group Graph */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">1. 教育集团关系图谱</h2>
              <p className="text-sm text-gray-600 mt-1">展示包含 3 所及以上成员校的教育集团及其成员分布。节点大小代表集团规模。</p>
            </div>
            <GroupGraphClient schools={schools} />
          </section>

          {/* Section 2: Admission Flow */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">2. 初升高对口升学流向图</h2>
              <p className="text-sm text-gray-600 mt-1">展示初中到高中的对口升学路径。左侧为初中，右侧为高中，线条粗细反映对口关系数量。</p>
            </div>
            <AdmissionFlowClient schools={schools} />
          </section>

        </div>
      </div>
    </SiteShell>
  );
}
