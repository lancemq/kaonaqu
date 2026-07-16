import { createRequire } from 'module';
import SchoolsPageClient from '../../components/schools-page-client';
import { getSchoolOverview } from '../../lib/school-content';
import {
  getSchoolTrainingDirections,
  getSchoolSpecializationLabels,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolAdmissionInfo,
  getSchoolStage,
  getSchoolType,
  clipText
} from '../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

// 列表卡只需轻量字段：服务端用完整 school 对象预计算 content 衍生值，
// 避免把 content / scoreLines / admissionInfo / address 等"详情级大对象"全量下发。
// 实测全量序列化约 1.93MB，轻量模型约数百 KB（降数倍），筛选交互逻辑保持不变。
function buildSchoolSearchText(school) {
  const haystack = [
    school.name,
    getSchoolDistrictName(school),
    getSchoolStage(school),
    getSchoolType(school),
    school.schoolKeyLevel,
    school.eliteCohort,
    school.address,
    getSchoolAdmissionInfo(school),
    ...getSchoolTrainingDirections(school),
    ...getSchoolFeatures(school)
  ].join(' ').toLowerCase();
  return haystack;
}

function getSchoolPositioning(school) {
  const desc = clipText(getSchoolOverview(school), 84);
  if (desc && desc !== '暂无') return desc;
  const directions = getSchoolTrainingDirections(school);
  if (directions.length) return `培养方向：${directions.slice(0, 2).join('、')}`;
  return '';
}

function buildCardTags(school) {
  const values = [
    ...getSchoolSpecializationLabels(school),
    ...getSchoolFeatures(school),
    ...getSchoolTrainingDirections(school)
  ].filter(Boolean);
  return Array.from(new Set(values)).slice(0, 4);
}

function toSchoolListCard(school) {
  return {
    id: school.id,
    name: school.name,
    districtId: school.districtId || '',
    districtName: getSchoolDistrictName(school),
    schoolStageLabel: school.schoolStageLabel || '',
    schoolPropertyLabel: school.schoolPropertyLabel || '',
    schoolKeyLevel: school.schoolKeyLevel || '',
    eliteCohort: school.eliteCohort || '',
    updatedAt: school.updatedAt || '',
    schoolStage: school.schoolStage || '',
    positioning: getSchoolPositioning(school),
    tags: buildCardTags(school),
    searchText: buildSchoolSearchText(school)
  };
}

export const metadata = {
  title: '上海初中高中学校库 - 按区查询学校信息 | 考哪去',
  description: '按区域检索上海初中、高中学校信息，查看16区学校介绍、类型、学段、特色标签与梯队说明，适合升学择校参考。',
  keywords: ['上海学校', '上海初中', '上海高中', '学校查询', '择校', '上海16区学校']
};

export const revalidate = 86400;

export default async function SchoolsPage({ searchParams }) {
  const { districts, schools } = await loadDataStore();
  const listSchools = schools.map(toSchoolListCard);
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
        schools={listSchools}
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
