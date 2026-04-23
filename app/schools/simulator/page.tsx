import SiteShell from '../../../components/site-shell';
import SchoolsSimulatorClient from '../../../components/schools-simulator-client';

export const metadata = {
  title: '上海初升高志愿模拟 | 考哪去',
  description: '根据初中学校、目标区域和高中层级生成上海初升高志愿候选清单，辅助家庭做升学择校判断。'
};

export default function SimulatorPage() {
  return (
    <SiteShell hideKnowledgeNav breadcrumbItems={[{ label: '学校信息', href: '/schools' }, { label: '志愿模拟' }]}>
      <SchoolsSimulatorClient />
    </SiteShell>
  );
}
