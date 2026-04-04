import SiteShell from '../../components/site-shell';
import { createRequire } from 'module';
import SchoolsPageClient from '../../components/schools-page-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

export const metadata = {
  title: '上海初中高中学校信息查询 | 考哪去',
  description: '按区域检索上海初中、高中学校信息，查看学校介绍、类型、阶段、特色标签与梯队说明，适合升学择校参考。'
};

export const dynamic = 'force-dynamic';

export default async function SchoolsPage({ searchParams }) {
  const { districts, schools, news } = await loadDataStore();
  const params = await searchParams;
  const initialDistrict = typeof params?.district === 'string' ? params.district : 'all';
  const initialStage = typeof params?.stage === 'string' ? params.stage : 'all';
  const initialOwnership = typeof params?.ownership === 'string' ? params.ownership : 'all';
  const initialTag = typeof params?.tag === 'string' ? params.tag : 'all';
  const initialDirection = typeof params?.direction === 'string' ? params.direction : 'all';
  const initialQuery = typeof params?.query === 'string' ? params.query : '';

  return (
    <SiteShell hideKnowledgeNav>
      <SchoolsPageClient
        districts={districts}
        schools={schools}
        news={news}
        initialDistrict={initialDistrict}
        initialStage={initialStage}
        initialOwnership={initialOwnership}
        initialTag={initialTag}
        initialDirection={initialDirection}
        initialQuery={initialQuery}
      />
    </SiteShell>
  );
}
