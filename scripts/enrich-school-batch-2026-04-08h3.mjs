import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T23:50:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市静安区市西中学': {
    phone: '021-62587712',
    admissionNotes: '静安区市重点高中，建议重点关注统一招生、自主招生和学校整体学风节奏。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区新中高级中学': {
    phone: '021-56628568',
    admissionNotes: '静安区高中，建议结合录取口径、区位和学校稳定办学表现综合判断。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区育才中学': {
    phone: '021-56630990',
    admissionNotes: '静安区高中，建议重点看育才传统、学校管理与区内高中整体比较。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区亭林中学': {
    phone: '021-57233833',
    admissionNotes: '金山区高中，建议重点关注区域录取口径、学校稳定办学与通勤便利度。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区朱泾中学': {
    phone: '021-57317387',
    admissionNotes: '金山区高中，建议结合区位、录取分数和学校管理节奏一起比较。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区枫泾中学': {
    phone: '021-57351063',
    admissionNotes: '金山区高中，建议重点看学校稳定办学、区域位置和往年录取表现。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市金山区金教院附属学校': {
    phone: '021-57331819',
    admissionNotes: '金山区完全中学，建议区分初中入学和高中培养口径，重点关注教研院附属背景与贯通培养。',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市七宝中学浦江分校': {
    phone: '021-54330367',
    admissionNotes: '闵行区高中，建议重点关注七宝体系资源、分校定位和区内高中比较。',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市莘庄中学': {
    phone: '021-64922619',
    admissionNotes: '闵行区高中，建议重点关注区位、录取走势与学校整体学风管理。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行中学': {
    phone: '021-64922300',
    admissionNotes: '闵行区高中，建议重点关注头部公办高中竞争格局、统一招生和课程强度。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市闵行区第三中学': {
    phone: '021-64981680',
    admissionNotes: '闵行区高中，建议重点看区位适配度、学校稳定性和录取口径变化。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海新加坡外籍人员子女学校（高中部）': {
    phone: '021-62211445',
    website: 'https://www.ssis.asia/',
    admissionNotes: '闵行区国际学校，建议重点关注外籍身份要求、课程体系、学费和国际升学路径。',
    source: { name: '学校官网', type: 'official', url: 'https://www.ssis.asia/', crawledAt: UPDATED_AT, confidence: 0.9 },
    updatedAt: UPDATED_AT
  },
  '上海星河湾双语学校（初中）': {
    phone: '021-64758887',
    website: 'https://www.star-river.com/school/shanghai',
    admissionNotes: '闵行区双语初中，建议重点关注双语课程、民办报名口径和升学承接。',
    source: { name: '学校官网', type: 'official', url: 'https://www.star-river.com/school/shanghai', crawledAt: UPDATED_AT, confidence: 0.86 },
    updatedAt: UPDATED_AT
  },
  '上海闵行区万科双语学校（初中）': {
    phone: '021-61968000',
    website: 'https://shvbs.vkis.cn/',
    admissionNotes: '闵行区双语初中，建议重点关注双语课程、寄宿安排和学校整体升学方向。',
    source: { name: '学校官网', type: 'official', url: 'https://shvbs.vkis.cn/', crawledAt: UPDATED_AT, confidence: 0.86 },
    updatedAt: UPDATED_AT
  },
  '上海闵行区协和双语教科学校': {
    phone: '021-24066699',
    website: 'https://www.suis.com.cn/',
    admissionNotes: '闵行区双语学校，建议重点关注课程体系、英语环境和不同学段升学承接。',
    source: { name: '协和教育官网', type: 'official', url: 'https://www.suis.com.cn/', crawledAt: UPDATED_AT, confidence: 0.82 },
    updatedAt: UPDATED_AT
  },
  '上海市建平中学筠溪分校': {
    phone: '021-58997181',
    admissionNotes: '浦东新区高中，建议重点关注建平体系资源、分校定位和区域高中比较。',
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市民办金苹果学校': {
    phone: '021-58504600',
    website: 'https://www.appleschool.cn/',
    admissionNotes: '浦东新区民办学校，建议区分初高中学段，重点关注课程路径、学费和稳定办学表现。',
    source: { name: '学校官网', type: 'official', url: 'https://www.appleschool.cn/', crawledAt: UPDATED_AT, confidence: 0.86 },
    updatedAt: UPDATED_AT
  },
  '上海市洋泾中学': {
    phone: '021-58810668',
    admissionNotes: '浦东新区高中，建议重点关注录取分数、学校管理和浦东区位适配度。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区东昌中学': {
    phone: '021-58816733',
    admissionNotes: '浦东新区高中，建议重点关注学校稳定办学、区域位置和往年录取走势。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区交大附中浦东分校': {
    phone: '021-50308523',
    admissionNotes: '浦东新区高中，建议重点关注交附体系资源、分校定位和区内高中对比。',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  }
};

const nextSchools = schools.map((school) => {
  const override = overrides[school.name];
  if (!override) return school;
  return {
    ...school,
    ...override
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);
console.log(JSON.stringify({ updated: Object.keys(overrides).length, names: Object.keys(overrides) }, null, 2));
