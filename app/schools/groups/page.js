import { createRequire } from 'module';
import GroupsPageClient from '../../../components/groups-page-client';
import { getRegionContext } from '../../../lib/region-server.mjs';

const require = createRequire(import.meta.url);
const { loadSchoolsList } = require('../../../shared/data-store');
const { DISTRICT_CATALOG } = require('../../../shared/data-schema');

export async function generateMetadata() {
  const { config } = await getRegionContext();
  const label = config.label;
  return {
    title: `${label}教育集团大全 | 考哪去`,
    description: `按教育集团检索${label}初中、高中学校，了解各教育集团旗下成员校、分布区域、梯队构成，适合升学择校参考。`
  };
}


export default async function GroupsPage({ searchParams }) {
  const { region } = await getRegionContext();
  const schools = await loadSchoolsList(region);
  const districts = DISTRICT_CATALOG;
  const params = await searchParams;
  const initialDistrict = typeof params?.district === 'string' ? params.district : 'all';
  const initialStage = typeof params?.stage === 'string' ? params.stage : 'all';
  const initialTier = typeof params?.tier === 'string' ? params.tier : 'all';
  const initialQuery = typeof params?.query === 'string' ? params.query : '';

  return (
    <main className="schools-aerial-page school-groups-aerial-page">
      <GroupsPageClient
        districts={districts}
        schools={schools}
        initialDistrict={initialDistrict}
        initialStage={initialStage}
        initialTier={initialTier}
        initialQuery={initialQuery}
      />
    </main>
  );
}
