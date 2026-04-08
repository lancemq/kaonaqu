import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-09T01:30:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市金山区亭林中学': {
    admissionNotes: '金山区高中，建议重点关注区域录取口径、学校稳定办学与通勤便利度。',
    features: ['高中', '区域稳定办学'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区朱泾中学': {
    admissionNotes: '金山区高中，建议结合区位、录取分数和学校管理节奏一起比较。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区枫泾中学': {
    admissionNotes: '金山区高中，建议重点看学校稳定办学、区域位置和往年录取表现。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区吴泾中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学口径、学校管理和家长口碑。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区杜行中学': {
    admissionNotes: '闵行区公办初中，建议结合对口安排、学校管理与区域适配度一起判断。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区江川路学校': {
    admissionNotes: '闵行区完全中学，建议区分初高中学段，重点关注校内衔接和片区就学便利度。',
    features: ['完全中学', '贯通培养'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区浦江第一中学': {
    admissionNotes: '闵行区公办初中，建议重点关注浦江片区入学安排和学校管理风格。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区浦江第三中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学口径、学校管理与家长实际口碑。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区浦江第二中学': {
    admissionNotes: '闵行区公办初中，建议重点看浦江片区入学安排、学校管理与区域适配度。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区第三中学': {
    admissionNotes: '闵行区高中，建议重点看区位、学校稳定办学与录取口径变化。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区陈行学校': {
    admissionNotes: '闵行区完全中学，建议区分初高中学段，重点关注校内衔接和片区适配度。',
    features: ['完全中学', '贯通培养'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区颛桥中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学安排、学校管理和区内初中比较。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区马桥实验学校': {
    admissionNotes: '闵行区完全中学，建议重点关注实验学校定位、贯通培养和区域适配度。',
    features: ['完全中学', '实验学校', '贯通培养'],
    tags: ['完全中学', '公办', '实验'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区鲁汇中学': {
    admissionNotes: '闵行区公办初中，建议重点看片区入学口径、学校管理与家长实际口碑。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市马桥中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学安排、学校管理与实验资源。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市鹤北中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区就学便利度、学校管理与基础教学。',
    features: ['公办初中', '基础教学'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市龙南中学': {
    admissionNotes: '闵行区公办初中，建议结合片区入学安排、学校管理和区内公办初中比较一起判断。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市龙柏中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学安排、学校管理和通勤便利度。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海闵行区汇点高中': {
    admissionNotes: '闵行区高中，建议重点关注课程定位、学校管理和升学路径匹配度。',
    features: ['高中', '课程定位'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海韩国学校': {
    admissionNotes: '闵行区国际学校，建议重点关注身份要求、课程体系和国际升学路径。',
    features: ['国际学校', '外籍学校', '国际课程'],
    tags: ['完全中学', '外籍学校', '国际课程'],
    trainingDirections: ['国际课程', '外语特色'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  }
};

const nextSchools = schools.map((school) => {
  const override = overrides[school.name];
  if (!override) return school;
  return {
    ...school,
    ...override,
    features: Array.from(new Set([...(school.features || []), ...(override.features || [])])),
    tags: Array.from(new Set([...(school.tags || []), ...(override.tags || [])])),
    trainingDirections: Array.from(new Set([...(school.trainingDirections || []), ...(override.trainingDirections || [])]))
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);
console.log(JSON.stringify({ updated: Object.keys(overrides).length, names: Object.keys(overrides) }, null, 2));
