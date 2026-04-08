import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T23:00:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市金山区亭林中学': {
    admissionNotes: '金山区高中，建议重点关注区域录取口径、学校稳定办学和区位通勤便利度。',
    features: ['高中', '区域稳定办学'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区朱泾中学': {
    admissionNotes: '金山区高中，建议结合录取表现、区位与学校整体管理风格一起比较。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区枫泾中学': {
    admissionNotes: '金山区高中，建议重点关注学校稳定办学、区位适配度与往年录取情况。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区金教院附属学校': {
    admissionNotes: '金山区完全中学，建议区分初中入学和高中培养口径，重点关注教研院附属背景和贯通培养路径。',
    features: ['完全中学', '教育学院附属', '贯通培养'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市七宝中学浦江分校': {
    admissionNotes: '闵行区高中，建议重点关注七宝体系资源、分校定位和区内高中整体比较。',
    features: ['高中', '名校分校', '体系资源'],
    tags: ['高中', '名校分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市燎原双语学校（高中部）': {
    admissionNotes: '闵行区双语高中，建议重点关注双语课程路径、国际升学方向和学费成本。',
    features: ['双语高中', '国际课程', '民办'],
    tags: ['高中', '民办', '双语'],
    trainingDirections: ['国际课程', '外语特色'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市莘庄中学': {
    admissionNotes: '闵行区高中，建议重点关注区位、录取分数变化和学校整体学风管理。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行中学': {
    admissionNotes: '闵行区高中，建议重点关注闵行区头部公办高中竞争格局、统一招生和学校管理节奏。',
    features: ['高中', '区域头部', '稳定办学'],
    tags: ['高中'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区第三中学': {
    admissionNotes: '闵行区高中，建议重点关注区位适配度、学校稳定性和录取口径变化。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海新加坡外籍人员子女学校（高中部）': {
    admissionNotes: '闵行区国际学校，建议重点关注外籍身份要求、课程体系、学费和国际升学路径。',
    features: ['国际学校', '外籍学校', '国际课程'],
    tags: ['高中', '外籍学校', '国际课程'],
    trainingDirections: ['国际课程', '外语特色'],
    profileDepth: 'foundation',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海星河湾双语学校（初中）': {
    admissionNotes: '闵行区双语初中，建议重点关注双语课程、升学路径和民办报名口径。',
    features: ['双语初中', '民办', '课程融合'],
    tags: ['初中', '民办', '双语'],
    trainingDirections: ['外语特色', '国际课程'],
    profileDepth: 'foundation',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海闵行区万科双语学校（初中）': {
    admissionNotes: '闵行区双语初中，建议重点关注双语课程、寄宿安排和学校整体升学方向。',
    features: ['双语初中', '民办', '寄宿管理'],
    tags: ['初中', '民办', '双语', '寄宿'],
    trainingDirections: ['外语特色', '国际课程'],
    profileDepth: 'foundation',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海闵行区协和双语教科学校': {
    admissionNotes: '闵行区双语学校，建议重点关注课程体系、英语环境和不同学段的升学承接。',
    features: ['双语学校', '民办', '课程融合'],
    tags: ['民办', '双语', '完全中学'],
    trainingDirections: ['外语特色', '国际课程'],
    profileDepth: 'foundation',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市建平中学筠溪分校': {
    admissionNotes: '浦东新区高中，建议重点关注建平体系资源、分校定位和区内高中整体比较。',
    features: ['高中', '名校分校', '体系资源'],
    tags: ['高中', '名校分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市民办金苹果学校': {
    admissionNotes: '浦东新区民办学校，建议区分初高中学段，重点关注课程路径、学费和学校稳定办学表现。',
    features: ['民办学校', '完全中学', '课程路径'],
    tags: ['民办', '完全中学'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市洋泾中学': {
    admissionNotes: '浦东新区高中，建议重点关注录取分数、学校管理和浦东区位适配度。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区东昌中学': {
    admissionNotes: '浦东新区高中，建议重点关注学校稳定办学、区位和往年录取走势。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区交大附中浦东分校': {
    admissionNotes: '浦东新区高中，建议重点关注交附体系资源、分校定位和区内高中对比。',
    features: ['高中', '高校附属', '体系资源'],
    tags: ['高中', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区华师大二附中前滩学校': {
    admissionNotes: '浦东新区完全中学，建议重点关注华二体系资源、前滩区位和校内贯通培养路径。',
    features: ['完全中学', '华二体系', '贯通培养'],
    tags: ['完全中学', '名校体系'],
    trainingDirections: ['贯通培养', '科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区南汇中学': {
    admissionNotes: '浦东新区高中，建议重点关注区位、录取口径和学校稳定办学表现。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
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
