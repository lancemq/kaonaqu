import { createRequire } from 'module';
import SchoolsPageClient from '../../components/schools-page-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

export const metadata = {
  title: '上海初中高中学校库 - 按区查询学校信息 | 考哪去',
  description: '按区域检索上海初中、高中学校信息，查看16区学校介绍、类型、学段、特色标签与梯队说明，适合升学择校参考。',
  keywords: ['上海学校', '上海初中', '上海高中', '学校查询', '择校', '上海16区学校']
};

export const revalidate = 86400;

export default async function SchoolsPage({ searchParams }) {
  const { districts, schools, news } = await loadDataStore();
  const params = await searchParams;
  const initialDistrict = typeof params?.district === 'string' ? params.district : 'all';
  const initialStage = typeof params?.stage === 'string' ? params.stage : 'all';
  const initialProperty = typeof params?.property === 'string' ? params.property : 'all';
  const initialKeyLevel = typeof params?.keyLevel === 'string' ? params.keyLevel : 'all';
  const initialCohort = typeof params?.cohort === 'string' ? params.cohort : 'all';
  const initialQuery = typeof params?.query === 'string' ? params.query : '';

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': '上海初中高中学校列表',
    'description': '按区域检索上海初中、高中学校信息',
    'numberOfItems': schools.length
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <SchoolsPageClient
        districts={districts}
        schools={schools}
        news={news}
        initialDistrict={initialDistrict}
        initialStage={initialStage}
        initialProperty={initialProperty}
        initialKeyLevel={initialKeyLevel}
        initialCohort={initialCohort}
        initialQuery={initialQuery}
      />
    </>
  );
}
