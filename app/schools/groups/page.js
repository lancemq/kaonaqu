import SiteShell from '../../../components/site-shell';
import { createRequire } from 'module';
import GroupsPageClient from '../../../components/groups-page-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海教育集团大全 | 考哪去',
  description: '按教育集团检索上海初中、高中学校，了解各教育集团旗下成员校、分布区域、梯队构成，适合升学择校参考。'
};

export const dynamic = 'force-dynamic';

export default async function GroupsPage({ searchParams }) {
  const { districts, schools, news } = await loadDataStore();
  const params = await searchParams;
  const initialDistrict = typeof params?.district === 'string' ? params.district : 'all';
  const initialStage = typeof params?.stage === 'string' ? params.stage : 'all';
  const initialTier = typeof params?.tier === 'string' ? params.tier : 'all';
  const initialQuery = typeof params?.query === 'string' ? params.query : '';

  return (
    <SiteShell
      hideKnowledgeNav
      breadcrumbItems={[
        { label: '学校信息', href: '/schools' },
        { label: '教育集团' }
      ]}
    >
      <GroupsPageClient
        districts={districts}
        schools={schools}
        news={news}
        initialDistrict={initialDistrict}
        initialStage={initialStage}
        initialTier={initialTier}
        initialQuery={initialQuery}
      />
    </SiteShell>
  );
}
