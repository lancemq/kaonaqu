import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const UPDATED_AT = '2026-04-08T16:30:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';
const SOURCE = {
  name: '公开学校目录',
  type: 'directory',
  url: DIRECTORY_URL,
  crawledAt: UPDATED_AT,
  confidence: 0.66
};

const targetNames = new Set([
  '上海市宝山区杨行中学',
  '上海市华曜宝山实验学校',
  '上海市民办同洲模范学校',
  '上海市民办维尚高级中学',
  '上海市淞浦中学',
  '上海民办民一中学',
  '上海市崇明区堡镇中学',
  '上海市崇明区东门中学',
  '上海市崇明区港西中学',
  '上海市崇明区庙镇中学',
  '上海市崇明区竖河中学',
  '上海市崇明区向化中学',
  '上海市崇明区新河中学',
  '上海市崇明区扬子中学',
  '上海市崇明区育林中学',
  '上海市崇明区中兴中学',
  '上海美达菲学校',
  '上海市奉贤区古华中学',
  '上海市奉贤区弘文学校',
  '上海市奉贤区金汇学校',
  '上海市奉贤区南桥中学',
  '上海市奉贤区头桥中学',
  '上海市奉贤区肖塘中学',
  '上海市奉贤区致远中学',
  '上海博华美国高中',
  '上海市白玉兰学校',
  '上海市北虹初级中学',
  '上海市第五中学',
  '上海市海南中学',
  '上海市虹口中学'
]);

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
  if (schoolType === '民办') {
    features.push('民办办学');
  }
  if (/实验/.test(school.name || '')) {
    features.push('实验学校');
  }
  if (/外国语|双语/.test(`${school.name}${(school.tags || []).join('')}`)) {
    features.push('外语特色');
  }
  return Array.from(new Set(features)).slice(0, 3);
}

function buildDirections(school) {
  const directions = [];
  if (school.schoolStage === 'complete') {
    directions.push('贯通培养');
  }
  if (/外国语|双语/.test(`${school.name}${(school.tags || []).join('')}`)) {
    directions.push('外语特色');
  }
  if (directions.length === 0) {
    directions.push('人文综合');
  }
  return directions.slice(0, 2);
}

function appendBasicTags(school) {
  const tags = new Set((school.tags || []).filter(Boolean));
  if (school.schoolStage === 'junior') tags.add('初中');
  if (school.schoolStage === 'senior_high') tags.add('高中');
  if (school.schoolStage === 'complete') tags.add('完全中学');
  const schoolType = getType(school);
  if (schoolType === '公办' || schoolType === '民办') {
    tags.add(schoolType);
  }
  return Array.from(tags);
}

let updated = 0;
const names = [];

const nextSchools = schools.map((school) => {
  if (!targetNames.has(school.name)) return school;
  updated += 1;
  names.push(school.name);
  return {
    ...school,
    admissionNotes: buildAdmissionNotes(school),
    features: Array.from(new Set([...(school.features || []), ...buildFeatures(school)])),
    tags: appendBasicTags(school),
    trainingDirections: Array.from(new Set([...(school.trainingDirections || []), ...buildDirections(school)])),
    source: SOURCE,
    updatedAt: UPDATED_AT
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);
console.log(JSON.stringify({ updated, names }, null, 2));
