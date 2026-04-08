import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-09T00:55:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市奉贤区明德外国语小学': {
    admissionNotes: '奉贤区外语特色学校，建议重点关注外语课程、学段衔接和区域就学便利度。',
    features: ['外语特色', '课程融合'],
    tags: ['完全中学', '公办', '外语特色'],
    trainingDirections: ['外语特色', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤区阳光外国语学校': {
    admissionNotes: '奉贤区外语特色学校，建议重点关注双语表达、学校管理和学段承接。',
    features: ['外语特色', '课程融合'],
    tags: ['完全中学', '公办', '外语特色'],
    trainingDirections: ['外语特色', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上外立泰剑桥': {
    admissionNotes: '虹口区国际课程高中，建议重点关注 A-Level/国际课程路径、语言要求和学费成本。',
    features: ['国际课程', 'A-Level', '上外体系'],
    tags: ['高中', '国际课程', '外语特色'],
    trainingDirections: ['国际课程', '外语特色'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市民办克勒外国语学校': {
    admissionNotes: '虹口区民办外语学校，建议重点关注外语课程、民办报名和课程稳定性。',
    features: ['民办学校', '外语特色'],
    tags: ['完全中学', '民办', '外语特色'],
    trainingDirections: ['外语特色', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办扬波外国语中学': {
    admissionNotes: '静安区民办外语初中，建议重点关注外语课程、民办报名和区内初中比较。',
    features: ['民办初中', '外语特色'],
    tags: ['初中', '民办', '外语特色'],
    trainingDirections: ['外语特色', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区市西中学': {
    admissionNotes: '静安区市重点高中，建议重点关注统一招生、自主招生和学校整体学风节奏。',
    features: ['市重点高中', '静安头部高中'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区新中高级中学': {
    admissionNotes: '静安区高中，建议结合录取口径、区位和学校稳定办学表现综合判断。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区育才中学': {
    admissionNotes: '静安区高中，建议重点看育才传统、学校管理与区内高中整体比较。',
    features: ['高中', '历史底蕴'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '静安外国语中学': {
    admissionNotes: '静安区外语特色初中，建议重点关注对口/民办路径、外语课程和学校管理风格。',
    features: ['外语特色', '初中'],
    tags: ['初中', '外语特色'],
    trainingDirections: ['外语特色', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区世界外国语学校': {
    admissionNotes: '金山区民办双语学校，建议重点关注双语课程路径、民办报名口径和学费信息。',
    features: ['民办双语学校', '外语特色', '课程融合'],
    tags: ['完全中学', '民办', '双语'],
    trainingDirections: ['外语特色', '国际课程'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
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
  '上海协和古北学校': {
    admissionNotes: '闵行区双语学校，建议重点关注课程体系、英语环境和民办报名口径。',
    features: ['双语学校', '民办', '课程融合'],
    tags: ['完全中学', '民办', '双语'],
    trainingDirections: ['外语特色', '国际课程'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市七宝中学浦江分校': {
    admissionNotes: '闵行区高中，建议重点关注七宝体系资源、分校定位和区内高中比较。',
    features: ['名校分校', '体系资源'],
    tags: ['高中', '名校分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市七宝实验中学': {
    admissionNotes: '闵行区初中，建议重点关注七宝体系背景、对口入学口径和学校整体学风。',
    features: ['初中', '名校体系'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市七宝德怀特高级中学': {
    admissionNotes: '闵行区国际课程高中，建议重点关注国际课程路径、学费与双文凭升学方向。',
    features: ['国际课程', '双文凭', '民办高中'],
    tags: ['高中', '民办', '国际课程'],
    trainingDirections: ['国际课程', '外语特色'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市北桥中学': {
    admissionNotes: '闵行区公办初中，建议结合片区入学口径、学校管理风格和家长实际口碑一起判断。',
    features: ['公办初中', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市圣华紫竹学校': {
    admissionNotes: '闵行区双语学校，建议重点关注课程体系、外语环境和学段承接。',
    features: ['双语学校', '课程融合'],
    tags: ['完全中学', '民办', '双语'],
    trainingDirections: ['外语特色', '国际课程'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市塘湾中学': {
    admissionNotes: '闵行区公办初中，建议重点关注片区入学安排、学校管理与区内公办初中比较。',
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
