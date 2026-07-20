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
const { loadSchoolsList, getSchoolsByIds } = require('../../shared/data-store');
const { buildDistricts } = require('../../shared/data-schema');

const SCHOOLS_PER_PAGE = 10;

// 仅服务端用于 query 匹配，绝不随列表下发客户端
function buildSearchText(school) {
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

// 仅展示所需字段（不含 searchText），只对被筛选出的 ≤10 所调用，
// 因此服务端 content 解析/概览/训练方向开销从 888× 降到 10×。
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
    schoolStage: school.schoolStage || '',
    positioning: getSchoolPositioning(school),
    tags: buildCardTags(school),
    scoreLines: Array.isArray(school.scoreLines) ? school.scoreLines : []
  };
}

function filterSchools(schools, filters) {
  const q = (filters.query || '').trim().toLowerCase();
  return schools.filter((s) => {
    if (filters.district !== 'all' && s.districtId !== filters.district) return false;
    if (filters.stage !== 'all' && (s.schoolStageLabel || '') !== filters.stage) return false;
    if (filters.property !== 'all' && (s.schoolPropertyLabel || '') !== filters.property) return false;
    if (filters.keyLevel !== 'all' && (s.schoolKeyLevel || '') !== filters.keyLevel) return false;
    if (filters.cohort !== 'all' && (s.eliteCohort || '') !== filters.cohort) return false;
    if (filters.boarding !== 'all') {
      const wantBoarding = filters.boarding === 'boarding';
      if (!!s.isBoarding !== wantBoarding) return false;
    }
    if (filters.international !== 'all') {
      const wantIntl = filters.international === 'international';
      if (!!s.isInternational !== wantIntl) return false;
    }
    if (q && !buildSearchText(s).includes(q)) return false;
    return true;
  });
}

function distinctLabels(schools, pick) {
  const set = new Set();
  for (const s of schools) {
    const v = pick(s);
    if (v) set.add(v);
  }
  return Array.from(set);
}

// 排序用的层级权重（与 data-store 的 KEY_LEVEL_PRIORITY 对齐，仅用于列表排序）
const KEY_LEVEL_SORT = {
  '市重点': 100, '三公': 95, '区重点': 80, '顶级民办': 70,
  '优质公办': 65, '一般高中': 60, '顶级公办(初中)': 58, '强公办(初中)': 55,
  '顶级民办(初中)': 48, '强民办(初中)': 50, '一般初中': 40
};

function getLatestScoreLine(school) {
  const lines = Array.isArray(school.scoreLines) ? school.scoreLines : [];
  if (!lines.length) return null;
  let best = lines[0];
  for (const line of lines) {
    if (Number(line.year) > Number(best.year)) best = line;
  }
  return best;
}

function scoreValue(line) {
  if (!line) return -1;
  const n = parseFloat(String(line.score == null ? '' : line.score).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : -1;
}

function sortByPriority(list) {
  return list.slice().sort((a, b) => {
    const aCohort = String(a.eliteCohort || '').trim() ? 1 : 0;
    const bCohort = String(b.eliteCohort || '').trim() ? 1 : 0;
    if (aCohort !== bCohort) return bCohort - aCohort;
    const aLevel = KEY_LEVEL_SORT[String(a.schoolKeyLevel || '').trim()] || 0;
    const bLevel = KEY_LEVEL_SORT[String(b.schoolKeyLevel || '').trim()] || 0;
    if (aLevel !== bLevel) return bLevel - aLevel;
    return String(a.districtName || '').localeCompare(String(b.districtName || ''), 'zh');
  });
}

function sortSchools(schools, sort) {
  const list = schools.slice();
  switch (sort) {
    case 'level':
      return list.sort((a, b) => (KEY_LEVEL_SORT[String(b.schoolKeyLevel || '').trim()] || 0) - (KEY_LEVEL_SORT[String(a.schoolKeyLevel || '').trim()] || 0));
    case 'district':
      return list.sort((a, b) => String(a.districtName || '').localeCompare(String(b.districtName || ''), 'zh'));
    case 'year':
      return list.sort((a, b) => (Number(a.foundingYear) || 0) - (Number(b.foundingYear) || 0));
    case 'score':
      // 轻量列表无 scoreLines，先按 priority 近似；当前页完整数据在下方按分数重排
      return sortByPriority(list);
    case 'priority':
    default:
      return sortByPriority(list);
  }
}

export const metadata = {
  title: '上海初中高中学校库 - 按区查询学校信息 | 考哪去',
  description: '按区域检索上海初中、高中学校信息，查看16区学校介绍、类型、学段、特色标签与梯队说明，适合升学择校参考。',
  keywords: ['上海学校', '上海初中', '上海高中', '学校查询', '择校', '上海16区学校']
};

// searchParams 自动使页面动态渲染；fetchCache 由 app/layout.js 统一设为 force-cache，
// Supabase 查询经 Next Data Cache 缓存（revalidate: 60s，tags: ['supabase-data']）。

export default async function SchoolsPage({ searchParams }) {
  const schools = await loadSchoolsList();
  const districts = buildDistricts(schools, []);
  const params = await searchParams;

  const filters = {
    district: typeof params?.district === 'string' ? params.district : 'all',
    stage: typeof params?.stage === 'string' ? params.stage : 'all',
    property: typeof params?.property === 'string' ? params.property : 'all',
    keyLevel: typeof params?.keyLevel === 'string' ? params.keyLevel : 'all',
    cohort: typeof params?.cohort === 'string' ? params.cohort : 'all',
    boarding: typeof params?.boarding === 'string' ? params.boarding : 'all',
    international: typeof params?.international === 'string' ? params.international : 'all',
    sort: typeof params?.sort === 'string' ? params.sort : 'priority',
    query: typeof params?.query === 'string' ? params.query : ''
  };
  const requestedPage = parseInt(typeof params?.page === 'string' ? params.page : '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const sorted = sortSchools(filterSchools(schools, filters), filters.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / SCHOOLS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * SCHOOLS_PER_PAGE, safePage * SCHOOLS_PER_PAGE);
  // 列表筛选/搜索基于瘦身后的全量（slim，无 content）；当前页 ≤10 张卡需 content 概览，
  // 单独按 id 批量取完整（getSchoolsByIds，经 Next Data Cache 缓存）。
  let fullPageSchools = await getSchoolsByIds(pageItems.map((s) => s.id));
  // 按录取分数线排序时，当前页用完整数据的分数重排（仅 ≤10 所，开销可忽略）
  if (filters.sort === 'score') {
    fullPageSchools = fullPageSchools.slice().sort(
      (a, b) => scoreValue(getLatestScoreLine(b)) - scoreValue(getLatestScoreLine(a))
    );
  }
  const cards = fullPageSchools.map(toSchoolListCard);

  const filterOptions = {
    stage: distinctLabels(schools, (s) => (s.schoolStageLabel || '').trim()),
    property: distinctLabels(schools, (s) => (s.schoolPropertyLabel || '').trim()),
    keyLevel: distinctLabels(schools, (s) => (s.schoolKeyLevel || '').trim()),
    cohort: distinctLabels(schools, (s) => (s.eliteCohort || '').trim())
  };

  const stageTotals = { junior: 0, senior_high: 0, complete: 0 };
  for (const s of schools) {
    if (stageTotals[s.schoolStage] !== undefined) stageTotals[s.schoolStage] += 1;
  }

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
        schools={cards}
        total={total}
        totalPages={totalPages}
        currentPage={safePage}
        filters={filters}
        filterOptions={filterOptions}
        stageTotals={stageTotals}
      />
    </>
  );
}
