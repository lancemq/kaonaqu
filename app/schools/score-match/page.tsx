import SiteShell from '../../../components/site-shell';
import ScoreMatchClient from '../../../components/score-match-client';

export const metadata = {
  title: '上海估分择校 | 考哪去',
  description: '输入中考/高考成绩与所在区域，按学校层级参考区间给出冲刺、匹配、保底三档可填报高中建议。'
};

export default function ScoreMatchPage() {
  return (
    <SiteShell hideKnowledgeNav breadcrumbItems={[{ label: '学校信息', href: '/schools' }, { label: '估分择校' }]}>
      <ScoreMatchClient />
    </SiteShell>
  );
}
