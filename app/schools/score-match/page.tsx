import ScoreMatchClient from '../../../components/score-match-client';
import { getRegionContext } from '../../../lib/region-server.mjs';

const { loadSchoolsMinimal } = require('../../../shared/data-store');

export async function generateMetadata() {
  const { config } = await getRegionContext();
  const label = config.label;
  return {
    title: `${label}估分择校 | 考哪去`,
    description: '输入中考/高考成绩与所在区域，按学校层级参考区间给出冲刺、匹配、保底三档可填报高中建议。'
  };
}

// 学校数据经 Next Data Cache 缓存（revalidate: 60s，tags: ['supabase-data']），
// 写操作后 revalidateTag 立即失效，保证评分匹配使用的数据不过时。

export default async function ScoreMatchPage() {
  const { region } = await getRegionContext();
  const matchSchools = await loadSchoolsMinimal(region);

  return (
    <main className="schools-aerial-page score-match-aerial-page">
      <ScoreMatchClient schools={matchSchools} />
    </main>
  );
}
