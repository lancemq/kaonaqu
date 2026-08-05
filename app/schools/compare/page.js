import { createRequire } from 'module';
import SchoolsCompareClient from '../../../components/schools-compare-client';
import { getRegionContext } from '../../../lib/region-server.mjs';

const require = createRequire(import.meta.url);
const { loadSchoolsList } = require('../../../shared/data-store');

export async function generateMetadata() {
  const { region, config } = await getRegionContext();
  const label = config.label;
  return {
    title: `${label}学校信息对比工具 | 考哪去`,
    description: `横向对比${label}初高中学校的梯队、集团、招生政策与特色标签，一屏看清差异。`,
    alternates: { canonical: `/${region}/schools/compare` }
  };
}


export default async function SchoolsComparePage({ searchParams }) {
  const { region } = await getRegionContext();
  const schools = await loadSchoolsList(region);
  const params = await searchParams;
  const initialSchools = typeof params?.schools === 'string' ? params.schools : '';

  return (
    <SchoolsCompareClient
      schools={schools}
      initialSchools={initialSchools}
    />
  );
}
