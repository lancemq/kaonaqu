import { redirect } from 'next/navigation';
import ScoreMatchClient from '../../../../components/score-match-client';
import { getRegionContextFromParams } from '../../../../lib/region-server.mjs';

const { loadSchoolsMinimal } = require('../../../../shared/data-store');

export async function generateMetadata({ params }) {
  const { region, config } = await getRegionContextFromParams(params);
  if (config.features.schools === false) redirect(`/${region}/news`);
  const label = config.label;
  return {
    title: `${label}估分择校 | 考哪去`,
    description: '输入中考/高考成绩与所在区域，按学校层级参考区间给出冲刺、匹配、保底三档可填报高中建议。',
    alternates: { canonical: `/${region}/schools/score-match` }
  };
}

// 学校数据经 Next Data Cache 缓存（revalidate: 300s（SUPABASE_REVALIDATE_SECONDS 可调），tags: ['supabase-data']），
// 写操作后 revalidateTag 立即失效，保证评分匹配使用的数据不过时。

export default async function ScoreMatchPage({ params }) {
  const { region, config } = await getRegionContextFromParams(params);
  if (config.features.schools === false) redirect(`/${region}/news`);
  const matchSchools = await loadSchoolsMinimal(region);

  return (
    <main className="schools-aerial-page score-match-aerial-page">
      <ScoreMatchClient schools={matchSchools} />
    </main>
  );
}
