import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-09T00:20:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海协和古北学校': {
    admissionNotes: '闵行区双语学校，建议重点关注课程体系、英语环境和民办报名口径。',
    features: ['双语学校', '民办', '课程融合'],
    tags: ['完全中学', '民办', '双语'],
    trainingDirections: ['外语特色', '国际课程'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市民办协和古北学校': {
    admissionNotes: '闵行区民办双语学校，建议重点关注双语课程路径、学费与升学承接。',
    features: ['民办双语学校', '课程融合', '国际表达'],
    tags: ['完全中学', '民办', '双语'],
    trainingDirections: ['外语特色', '国际课程'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '华东师范大学第二附属中学紫竹校区': {
    admissionNotes: '闵行区高中，建议重点关注华二体系资源、紫竹园区科创氛围和自招口径。',
    features: ['名校体系', '科创氛围', '园区资源'],
    tags: ['高中', '名校体系'],
    trainingDirections: ['科创竞赛', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '华东理工大学附属闵行梅陇实验学校': {
    admissionNotes: '闵行区完全中学，建议区分初高中学段，重点关注高校附属背景与贯通培养路径。',
    features: ['完全中学', '高校附属', '贯通培养'],
    tags: ['完全中学', '公办', '高校附属'],
    trainingDirections: ['贯通培养', '科创竞赛', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海哈罗外籍人员子女学校': {
    admissionNotes: '浦东新区国际学校，建议重点关注外籍身份要求、课程体系、学费和国际升学方向。',
    features: ['国际学校', '外籍学校', '国际课程'],
    tags: ['完全中学', '外籍学校', '国际课程'],
    trainingDirections: ['国际课程', '外语特色'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市川沙中学': {
    admissionNotes: '浦东新区高中，建议重点关注区域录取位次、学校管理风格和区位通勤便利度。',
    features: ['高中', '区域关注', '稳定办学'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市民办平和学校': {
    admissionNotes: '浦东新区民办学校，建议区分学段，重点关注课程体系、双语环境与学费结构。',
    features: ['民办学校', '双语课程', '国际表达'],
    tags: ['高中', '民办', '双语'],
    trainingDirections: ['国际课程', '外语特色'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
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
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市洋泾中学': {
    admissionNotes: '浦东新区高中，建议重点关注录取分数、学校管理和浦东区位适配度。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区东昌中学': {
    admissionNotes: '浦东新区高中，建议重点关注学校稳定办学、区域位置和往年录取走势。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区交大附中浦东分校': {
    admissionNotes: '浦东新区高中，建议重点关注交附体系资源、分校定位和区内高中对比。',
    features: ['高校附属', '名校分校', '体系资源'],
    tags: ['高中', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市建平中学筠溪分校': {
    admissionNotes: '浦东新区高中，建议重点关注建平体系资源、分校定位和区域高中比较。',
    features: ['名校分校', '体系资源', '区域比较'],
    tags: ['高中', '名校分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办金苹果学校': {
    admissionNotes: '浦东新区民办学校，建议区分初高中学段，重点关注课程路径、学费和稳定办学表现。',
    features: ['民办学校', '课程路径', '稳定办学'],
    tags: ['完全中学', '民办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '学校官网/公开目录', type: 'official', url: 'https://www.appleschool.cn/', crawledAt: UPDATED_AT, confidence: 0.82 },
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
