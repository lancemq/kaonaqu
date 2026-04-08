import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-09T01:10:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市金山区金教院附属学校': {
    admissionNotes: '金山区完全中学，建议区分初高中学段，重点关注教研院附属背景与贯通培养路径。',
    features: ['完全中学', '教育学院附属', '贯通培养'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市明星学校': {
    admissionNotes: '闵行区完全中学，建议区分初高中学段，重点关注校内衔接、学校管理和区域适配度。',
    features: ['完全中学', '校内衔接', '区域关注'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市民办七宝德怀特高级中学': {
    admissionNotes: '闵行区民办国际课程高中，建议重点关注双文凭课程、学费与海外升学方向。',
    features: ['国际课程', '双文凭', '民办高中'],
    tags: ['高中', '民办', '国际课程'],
    trainingDirections: ['国际课程', '外语特色'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市民办交华中学': {
    admissionNotes: '闵行区民办初中，建议重点关注民办报名口径、学校管理和家长实际口碑。',
    features: ['民办初中', '稳定办学'],
    tags: ['初中', '民办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办华漕学校': {
    admissionNotes: '闵行区民办学校，建议区分学段，重点关注课程路径、学费和学校管理风格。',
    features: ['民办学校', '课程路径'],
    tags: ['完全中学', '民办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办协和古北学校': {
    admissionNotes: '闵行区民办双语学校，建议重点关注双语课程体系、英语环境与不同学段升学承接。',
    features: ['民办双语学校', '课程融合', '国际表达'],
    tags: ['完全中学', '民办', '双语'],
    trainingDirections: ['外语特色', '国际课程'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市民办博华外国语学校': {
    admissionNotes: '闵行区民办外语学校，建议重点关注外语课程、民办报名和学校整体稳定性。',
    features: ['民办学校', '外语特色'],
    tags: ['完全中学', '民办', '外语特色'],
    trainingDirections: ['外语特色', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办圣华紫竹学校': {
    admissionNotes: '闵行区民办双语学校，建议重点关注课程体系、外语环境和学段承接。',
    features: ['民办双语学校', '课程融合'],
    tags: ['完全中学', '民办', '双语'],
    trainingDirections: ['外语特色', '国际课程'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办文来中学': {
    admissionNotes: '闵行区民办初中，建议重点关注文来体系、民办报名和区内热门初中竞争格局。',
    features: ['民办初中', '文来体系', '热门初中'],
    tags: ['初中', '民办'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市民办文绮中学': {
    admissionNotes: '闵行区民办高中，建议重点关注学校整体管理、课程方向和学费成本。',
    features: ['民办高中', '稳定办学'],
    tags: ['高中', '民办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办莘松中学': {
    admissionNotes: '闵行区民办初中，建议重点关注民办报名口径、学校管理与区内初中比较。',
    features: ['民办初中', '区域比较'],
    tags: ['初中', '民办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办诺美学校': {
    admissionNotes: '闵行区国际课程高中，建议重点关注课程体系、学费和海外升学路径。',
    features: ['国际课程', '民办高中', '海外升学'],
    tags: ['高中', '民办', '国际课程'],
    trainingDirections: ['国际课程', '外语特色'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市航华中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学安排、学校管理与区内公办初中比较。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市莘庄中学': {
    admissionNotes: '闵行区高中，建议重点关注区位、录取走势与学校整体学风管理。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市莘松中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学安排、学校管理和家长实际口碑。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市虹桥中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学口径、学校管理与家长口碑。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市诺美学校': {
    admissionNotes: '闵行区国际课程高中，建议重点关注课程体系、学费和国际升学方向。',
    features: ['国际课程', '民办高中'],
    tags: ['高中', '民办', '国际课程'],
    trainingDirections: ['国际课程', '外语特色'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市金汇实验学校': {
    admissionNotes: '闵行区完全中学，建议区分初高中学段，重点关注实验学校定位和校内衔接。',
    features: ['完全中学', '实验学校', '贯通培养'],
    tags: ['完全中学', '公办', '实验'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行中学': {
    admissionNotes: '闵行区高中，建议重点关注头部公办高中竞争格局、统一招生和课程强度。',
    features: ['高中', '区域头部', '稳定办学'],
    tags: ['高中'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区上虹中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学安排、学校管理与区域适配度。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
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
