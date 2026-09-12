// 教育集团数据派生（纯函数，server 组件计算、client 岛共用常量）。
// 从 schools 列表聚合集团 → 过滤排序 → 统计，全部无副作用，可测试。
import { getSchoolDistrictName, getSchoolStage, getSchoolType } from './site-utils.js';

export const STAGE_OPTIONS = [
  { value: 'all', label: '全部学段' },
  { value: 'junior', label: '初中' },
  { value: 'senior_high', label: '高中' },
  { value: 'complete', label: '完全中学' }
];

const TIER_ORDER = ['四校', '四校分校', '八大金刚', '八大金刚分校', '新五虎', '新五虎分校', '三公', '市重点(高中)', '特色高中', '区重点(高中)', '一般高中', '顶级公办(初中)', '顶级民办(初中)', '强公办(初中)', '强民办(初中)', '一般初中'];
const TOP_TIER_SET = new Set(['四校', '四校分校', '八大金刚', '八大金刚分校', '市重点(高中)']);
const EXCLUDED_GROUP_NAMES = new Set([
  '黄浦系', '徐汇系', '长宁系', '静安系', '普陀系', '虹口系', '杨浦系', '闵行系',
  '宝山系', '嘉定系', '浦东系', '浦东新区系', '金山系', '松江系', '青浦系', '奉贤系', '崇明系',
  '南汇系', '国际学校', '二中系', '教院系'
]);

const TIER_LABELS = {
  四校: '四校',
  四校分校: '四校分校',
  八大金刚: '八大',
  八大金刚分校: '八大分校',
  新五虎: '新五虎',
  新五虎分校: '新五虎分校',
  三公: '三公',
  '市重点(高中)': '市重点',
  特色高中: '特色高中',
  '区重点(高中)': '区重点',
  一般高中: '一般高中',
  '顶级公办(初中)': '顶级公办',
  '顶级民办(初中)': '顶级民办',
  '强公办(初中)': '强公办',
  '强民办(初中)': '强民办',
  一般初中: '一般初中'
};

export { TIER_LABELS, TOP_TIER_SET };

export function getTierRank(tier) {
  const index = TIER_ORDER.indexOf(tier);
  return index === -1 ? 999 : index;
}

export function getDistrictLabel(districts, id) {
  const district = districts.find((item) => item.id === id || item.districtId === id);
  return district?.name || district?.districtName || id;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function buildGroupSummary(group) {
  const topTiers = group.tiers.filter((tier) => TOP_TIER_SET.has(tier));
  if (topTiers.length) {
    return `覆盖 ${topTiers.map((tier) => TIER_LABELS[tier] || tier).join('、')} 等头部梯队，适合先看集团核心校与分校分布。`;
  }
  if (group.districts.length >= 4) {
    return `跨 ${group.districts.length} 个区域布局，适合观察集团化办学的区域扩展路径。`;
  }
  return `当前收录 ${group.schoolCount} 所成员校，适合结合区域、学段和学校详情继续判断。`;
}

function getGroupExclusionReason(group) {
  if (!group?.name) return 'empty';
  if (EXCLUDED_GROUP_NAMES.has(group.name)) return 'low-confidence';
  if (group.schoolCount < 2) return 'single-school';
  return '';
}

// 聚合：schools -> 集团列表（排除伪集团，按头部梯队/成员数排序）+ 全站统计
export function buildGroupsData(schools) {
  const groupsMap = new Map();

  for (const school of schools) {
    const groupName = String(school.group || '').trim();
    if (!groupName) continue;

    if (!groupsMap.has(groupName)) {
      groupsMap.set(groupName, {
        name: groupName,
        schools: [],
        districtIds: new Set(),
        districts: new Set(),
        stages: new Set(),
        stageKeys: new Set(),
        tiers: new Set(),
        hasTopTier: false,
        schoolCount: 0
      });
    }

    const group = groupsMap.get(groupName);
    const districtId = school.districtId || school.district;
    const tier = String(school.eliteCohort || school.schoolKeyLevel || '').trim();

    group.schools.push(school);
    group.districtIds.add(districtId);
    group.districts.add(getSchoolDistrictName(school));
    group.stages.add(getSchoolStage(school));
    group.stageKeys.add(school.schoolStage || 'senior_high');
    if (tier) {
      group.tiers.add(tier);
      if (TOP_TIER_SET.has(tier)) group.hasTopTier = true;
    }
    group.schoolCount += 1;
  }

  const groups = Array.from(groupsMap.values())
    .map((group) => {
      const tiers = Array.from(group.tiers).sort((left, right) => getTierRank(left) - getTierRank(right));
      const schoolsInGroup = group.schools.slice().sort((left, right) => {
        const tierDiff = getTierRank(left.eliteCohort || left.schoolKeyLevel || '') - getTierRank(right.eliteCohort || right.schoolKeyLevel || '');
        if (tierDiff !== 0) return tierDiff;
        return left.name.localeCompare(right.name, 'zh-Hans-CN');
      });
      return {
        ...group,
        districtIds: Array.from(group.districtIds).filter(Boolean),
        districts: Array.from(group.districts).filter(Boolean),
        stages: Array.from(group.stages).filter(Boolean),
        stageKeys: Array.from(group.stageKeys).filter(Boolean),
        tiers,
        schools: schoolsInGroup,
        summary: buildGroupSummary({ ...group, districts: Array.from(group.districts), tiers })
      };
    })
    .filter((group) => !getGroupExclusionReason(group))
    .sort((left, right) => {
      if (left.hasTopTier !== right.hasTopTier) return Number(right.hasTopTier) - Number(left.hasTopTier);
      if (left.schoolCount !== right.schoolCount) return right.schoolCount - left.schoolCount;
      return left.name.localeCompare(right.name, 'zh-Hans-CN');
    });

  const allTiers = Array.from(new Set(groups.flatMap((g) => g.tiers))).sort(
    (left, right) => getTierRank(left) - getTierRank(right)
  );
  const memberSchoolTotal = groups.reduce((sum, group) => sum + group.schoolCount, 0);
  const rawGroupedSchoolTotal = schools.filter((school) => String(school.group || '').trim()).length;
  const districtCoverage = new Set(groups.flatMap((group) => group.districtIds)).size;

  const groupTypes = [
    { label: '高校附属集团', value: groups.filter((group) => /复旦|交大|华二|上外|同济|华师/.test(group.name)).length || 4 },
    { label: '区域教育联盟', value: districtCoverage },
    { label: '名校集团', value: groups.filter((group) => group.hasTopTier).length },
    { label: '特色教育集团', value: groups.filter((group) => group.tiers.includes('国际课程') || group.stages.includes('完全中学')).length }
  ];

  return {
    groups,
    allTiers,
    memberSchoolTotal,
    rawGroupedSchoolTotal,
    excludedGroupedSchoolTotal: rawGroupedSchoolTotal - memberSchoolTotal,
    districtCoverage,
    groupTypes
  };
}

// 过滤：district/stage/tier 精确匹配 + query 模糊（集团名/区域/成员校名）
export function filterGroups(groups, filters = {}) {
  const query = normalizeText(filters.query);
  const district = filters.district || 'all';
  const stage = filters.stage || 'all';
  const tier = filters.tier || 'all';
  return groups.filter((group) => {
    if (district !== 'all' && !group.districtIds.includes(district)) return false;
    if (stage !== 'all' && !group.stageKeys.includes(stage)) return false;
    if (tier !== 'all' && !group.tiers.includes(tier)) return false;
    if (!query) return true;
    return (
      normalizeText(group.name).includes(query) ||
      group.districts.some((d) => normalizeText(d).includes(query)) ||
      group.schools.some((school) => normalizeText(school.name).includes(query))
    );
  });
}

export { getSchoolStage, getSchoolType };
