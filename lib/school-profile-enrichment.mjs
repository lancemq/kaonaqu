import {
  getDistrictTopicIntro,
  getSchoolRelationMetaByName,
  inferTrainingDirections,
  matchSchoolSystem
} from './school-curation.js';

const ROUTE_LABELS = {
  district_allocation: '名额分配到区',
  school_allocation: '名额分配到校',
  self_recruitment: '自主招生',
  unified_exam: '统一招生',
  recommendation: '推荐生',
  quota: '名额分配'
};

const PRIORITY_TIERS = new Set(['市重点', '区重点', '示范性高中', '实验性示范性高中']);

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function unique(items, limit = Infinity) {
  const seen = new Set();
  const result = [];

  for (const item of items.flat(Infinity)) {
    const value = cleanText(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
    if (result.length >= limit) break;
  }

  return result;
}

function getStageLabel(school) {
  return cleanText(school.schoolStageLabel)
    || ({ primary: '小学', junior_high: '初中', senior_high: '高中', complete: '完全中学' }[school.schoolStage])
    || '学校';
}

function getOwnershipLabel(school) {
  const text = cleanText(school.schoolTypeLabel || school.schoolType || school.tier);
  if (text.includes('民办')) return '民办';
  if (text.includes('国际') || text.includes('双语')) return '国际/双语';
  if (text.includes('公办')) return '公办';
  return text || '办学属性待补充';
}

function routeLabels(school) {
  const methodLabels = (Array.isArray(school.admissionMethods) ? school.admissionMethods : []).map((item) => {
    if (typeof item === 'string') return ROUTE_LABELS[item] || item;
    if (item && typeof item === 'object') return cleanText(item.route || item.name || item.label || item.type);
    return '';
  });

  return unique([
    methodLabels,
    ...(Array.isArray(school.admissionRoutes) && school.admissionRoutes.length ? ['名额分配去向'] : [])
  ], 5);
}

function getSystemLabel(school) {
  return cleanText(school.group) || matchSchoolSystem(school)?.name || '';
}

function hasSpecificSystemLabel(school) {
  const system = matchSchoolSystem(school);
  if (system) return true;

  const group = cleanText(school.group);
  const districtBase = cleanText(school.districtName).replace(/(新区|区|县)$/u, '');
  if (!group) return false;
  if (districtBase && group.includes(districtBase)) return false;
  return true;
}

function getNameAliases(name) {
  const text = cleanText(name);
  if (!text) return [];

  return unique([
    text,
    text.replace(/^上海市?/, ''),
    text.replace(/^上海市?/, '').replace(/中学$/, ''),
    text.replace(/^上海市?/, '').replace(/学校$/, '')
  ], 4);
}

export function buildDecisionTags(school) {
  const ownership = getOwnershipLabel(school);
  const stage = getStageLabel(school);
  const routes = routeLabels(school);
  const directions = Array.isArray(school.trainingDirections) && school.trainingDirections.length
    ? school.trainingDirections
    : inferTrainingDirections(school);
  const relation = getSchoolRelationMetaByName(school.name);
  const tags = [];

  if (stage.includes('高中') || stage.includes('完全')) tags.push('中考路径');
  if (routes.some((item) => item.includes('名额分配'))) tags.push('名额分配');
  if (routes.some((item) => item.includes('自主招生'))) tags.push('自主招生');
  if (String(school.admissionNotes || '').includes('对口') || String(school.admissionNotes || '').includes('学区')) tags.push('对口入学');
  if (directions.includes('国际课程') || ownership.includes('国际')) tags.push('国际课程');
  if (directions.includes('寄宿管理') || school.isBoarding) tags.push('寄宿管理');
  if (directions.includes('科创竞赛')) tags.push('科创竞赛');
  if (directions.includes('外语特色')) tags.push('外语特色');
  if (directions.includes('贯通培养') || stage.includes('完全')) tags.push('贯通培养');
  if (hasSpecificSystemLabel(school)) tags.push('集团/体系校');
  if (relation.relation !== 'main') tags.push(relation.label);
  if (Array.isArray(school.admissionRoutes) && school.admissionRoutes.length) tags.push('有升学流向');

  return unique(tags, 7);
}

export function buildSearchKeywords(school) {
  const system = matchSchoolSystem(school);
  const directions = Array.isArray(school.trainingDirections) && school.trainingDirections.length
    ? school.trainingDirections
    : inferTrainingDirections(school);

  return unique([
    getNameAliases(school.name),
    school.districtName,
    school.districtId,
    getStageLabel(school),
    getOwnershipLabel(school),
    school.schoolTypeLabel,
    school.schoolType,
    school.tier,
    school.admissionCode ? `招生代码${school.admissionCode}` : '',
    school.admissionCode,
    getSystemLabel(school),
    system?.id,
    getSchoolRelationMetaByName(school.name).label,
    routeLabels(school),
    directions,
    school.features,
    school.tags,
    buildDecisionTags(school)
  ], 32).filter((item) => item.length >= 2 && item !== '中学' && item !== '学校');
}

export function buildProfileSignals(school) {
  const system = matchSchoolSystem(school);
  const directions = Array.isArray(school.trainingDirections) && school.trainingDirections.length
    ? school.trainingDirections
    : inferTrainingDirections(school);
  const completenessScore = [
    school.address,
    school.phone,
    school.website,
    school.admissionNotes,
    school.admissionCode,
    Array.isArray(school.features) && school.features.length,
    Array.isArray(school.tags) && school.tags.length,
    Array.isArray(directions) && directions.length,
    Array.isArray(school.admissionRoutes) && school.admissionRoutes.length,
    school.contentFile
  ].filter(Boolean).length * 10;
  const score = Math.min(100, Math.max(20, completenessScore));

  return {
    stage: getStageLabel(school),
    ownership: getOwnershipLabel(school),
    relation: getSchoolRelationMetaByName(school.name).label,
    system: getSystemLabel(school),
    systemId: system?.id || '',
    routeFocus: routeLabels(school),
    districtContext: getDistrictTopicIntro(school.districtId),
    completenessScore: score,
    comparePriority: score >= 80 || PRIORITY_TIERS.has(cleanText(school.tier)) ? 'high' : score >= 60 ? 'medium' : 'foundation',
    hasAdmissionRoutes: Array.isArray(school.admissionRoutes) && school.admissionRoutes.length > 0,
    hasOfficialCode: Boolean(cleanText(school.admissionCode)),
    dataSourceType: cleanText(school.source?.type || school.source || '')
  };
}

function scoreRelatedCandidate(current, candidate) {
  let score = 0;
  if (candidate.id === current.id) return -Infinity;
  if (getSystemLabel(current) && getSystemLabel(current) === getSystemLabel(candidate)) score += 80;
  if (current.districtId && current.districtId === candidate.districtId) score += 35;
  if (current.schoolStage && current.schoolStage === candidate.schoolStage) score += 24;
  if (getOwnershipLabel(current) === getOwnershipLabel(candidate)) score += 14;
  if (current.tier && current.tier === candidate.tier) score += 10;
  if (matchSchoolSystem(current)?.id && matchSchoolSystem(current)?.id === matchSchoolSystem(candidate)?.id) score += 50;

  const currentDirections = new Set(Array.isArray(current.trainingDirections) ? current.trainingDirections : []);
  const sharedDirections = (candidate.trainingDirections || []).filter((item) => currentDirections.has(item)).length;
  score += sharedDirections * 8;

  return score;
}

export function buildRelatedSchoolIds(school, allSchools, limit = 6) {
  const existing = Array.isArray(school.related_schools) ? school.related_schools : [];
  const candidates = allSchools
    .filter((item) => item.id !== school.id)
    .map((item) => ({ id: item.id, score: scoreRelatedCandidate(school, item), name: item.name }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh-Hans-CN'))
    .map((item) => item.id);

  return unique([existing, candidates], limit);
}

export function enrichSchoolProfiles(schools) {
  const enriched = schools.map((school) => {
    const profileSignals = buildProfileSignals(school);
    return {
      ...school,
      profileSignals,
      decisionTags: buildDecisionTags(school),
      searchKeywords: buildSearchKeywords(school),
      related_schools: buildRelatedSchoolIds(school, schools)
    };
  });

  const stats = {
    total: enriched.length,
    withProfileSignals: enriched.filter((school) => school.profileSignals).length,
    withDecisionTags: enriched.filter((school) => school.decisionTags?.length).length,
    withSearchKeywords: enriched.filter((school) => school.searchKeywords?.length).length,
    withRelatedSchools: enriched.filter((school) => school.related_schools?.length).length
  };

  return { schools: enriched, stats };
}
