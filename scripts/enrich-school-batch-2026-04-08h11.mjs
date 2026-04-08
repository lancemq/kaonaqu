import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const UPDATED_AT = '2026-04-08T20:55:00+08:00';
const DEFAULT_SOURCE = {
  name: '公开学校目录',
  type: 'directory',
  url: 'https://www.021school.cn/',
  crawledAt: UPDATED_AT,
  confidence: 0.66
};
const LIMIT = 40;

function hasMeaningfulSource(school) {
  const name = String(school?.source?.name || '').trim();
  return Boolean(name) && name !== '[object Object]';
}

function isGenericNotes(text) {
  const value = String(text || '').trim();
  if (!value) return true;
  if (/^根据维基百科上海学校公开条目整理/.test(value)) return true;
  return /^(上海|上海市)?[^，。；]{0,20}(区|新区)?\s*(初中|高中|完全中学)\s*(公办|民办|区重点|市重点|市重点分校|一般高中|学校公开条目)?$/.test(value);
}

function isIncomplete(school) {
  const notes = String(school.admissionNotes || '').trim();
  const features = (school.features || []).filter(Boolean);
  const tags = (school.tags || []).filter(Boolean);
  return (
    notes.length < 10
    || features.length === 0
    || tags.length === 0
    || !hasMeaningfulSource(school)
    || isGenericNotes(notes)
  );
}

function getType(school) {
  const type = String(school.schoolTypeLabel || '');
  const tags = school.tags || [];
  if (type.includes('民办') || tags.includes('民办')) return '民办';
  if (type.includes('外籍')) return '外籍';
  return '公办';
}

function buildAdmissionNotes(school) {
  const district = school.districtName || '所在区';
  const stage = school.schoolStage;
  const schoolType = getType(school);
  if (stage === 'complete') {
    return `${district}完全中学（${schoolType}），建议区分初高中学段查看入学与录取口径，重点关注校内衔接与区域通勤。`;
  }
  if (stage === 'junior') {
    return `${district}${schoolType}初中，建议重点关注片区入学安排、学校管理节奏和近年家长关注点。`;
  }
  if (schoolType === '民办') {
    return `${district}民办高中，建议重点核对课程路径、招生计划与费用结构，结合家庭升学方向做比较。`;
  }
  return `${district}高中，建议结合区位、招生口径与学校稳定办学情况综合判断。`;
}

function buildFeatures(school) {
  const features = [];
  const stage = school.schoolStage;
  const schoolType = getType(school);

  if (stage === 'complete') {
    features.push('完全中学', '贯通培养');
  } else if (stage === 'junior') {
    features.push(`${schoolType}初中`, '区域关注');
  } else {
    features.push('高中', '区域关注');
  }

  if (schoolType === '民办') features.push('民办办学');
  if (/实验/.test(school.name || '')) features.push('实验学校');
  if (/外国语|双语/.test(`${school.name}${(school.tags || []).join('')}`)) features.push('外语特色');
  if (/职业/.test(school.name || '')) features.push('职业教育');

  return Array.from(new Set(features)).slice(0, 3);
}

function buildDirections(school, features) {
  const directions = new Set((school.trainingDirections || []).filter(Boolean));
  const text = `${school.name} ${(school.tags || []).join(' ')} ${features.join(' ')}`;
  if (school.schoolStage === 'complete') directions.add('贯通培养');
  if (/外国语|双语/.test(text)) directions.add('外语特色');
  if (/职业/.test(text)) directions.add('人文综合');
  if (directions.size === 0) directions.add('人文综合');
  return Array.from(directions).slice(0, 3);
}

function appendBasicTags(school) {
  const tags = new Set((school.tags || []).filter(Boolean));
  if (school.schoolStage === 'junior') tags.add('初中');
  if (school.schoolStage === 'senior_high') tags.add('高中');
  if (school.schoolStage === 'complete') tags.add('完全中学');
  const schoolType = getType(school);
  if (schoolType === '公办' || schoolType === '民办') tags.add(schoolType);
  return Array.from(tags);
}

const targets = schools.filter(isIncomplete).slice(0, LIMIT).map((item) => item.name);
const targetNameSet = new Set(targets);
const touched = [];

const nextSchools = schools.map((school) => {
  if (!targetNameSet.has(school.name)) return school;

  const nextFeatures = Array.from(new Set([...(school.features || []), ...buildFeatures(school)]));
  const nextNotes = isGenericNotes(school.admissionNotes) || String(school.admissionNotes || '').trim().length < 10
    ? buildAdmissionNotes(school)
    : String(school.admissionNotes || '').trim();
  const nextSource = hasMeaningfulSource(school) ? school.source : DEFAULT_SOURCE;
  const nextTrainingDirections = buildDirections(school, nextFeatures);

  touched.push(school.name);
  return {
    ...school,
    admissionNotes: nextNotes,
    features: nextFeatures,
    tags: appendBasicTags(school),
    trainingDirections: nextTrainingDirections,
    source: nextSource,
    updatedAt: UPDATED_AT
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);
console.log(JSON.stringify({ updated: touched.length, names: touched }, null, 2));
