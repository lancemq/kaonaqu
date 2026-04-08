import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-09T00:05:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市奉贤区格致中学': {
    admissionNotes: '奉贤区高中，建议重点关注学校在奉贤区内的录取位次、区位通勤和学校管理节奏。',
    features: ['高中', '区域关注', '稳定办学'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市华东师范大学第一附属中学': {
    admissionNotes: '虹口区特色高中，建议重点关注华一体系、课程创新、自主招生和学生发展路径。',
    features: ['高校附属', '特色普通高中', '课程创新'],
    tags: ['高中', '市特色普通高中', '高校附属'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市复兴高级中学分校': {
    admissionNotes: '虹口区市重点分校，建议重点关注复兴体系资源、分校定位和区内高中整体比较。',
    features: ['市重点分校', '名校体系', '区域比较'],
    tags: ['高中', '市重点分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市虹口高级中学': {
    admissionNotes: '虹口区区重点高中，建议结合录取分数、学校管理和区位适配度一起比较。',
    features: ['区重点高中', '区域关注'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市鲁迅中学': {
    admissionNotes: '虹口区市重点高中，建议重点关注学校历史底蕴、人文气质和统一招生录取口径。',
    features: ['市重点高中', '人文底蕴', '稳定办学'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海师范大学附属虹口中学': {
    admissionNotes: '虹口区区重点高中，建议重点关注高校附属背景、区位通勤和升学适配度。',
    features: ['区重点高中', '高校附属', '区域关注'],
    tags: ['高中', '区重点', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区光明中学': {
    admissionNotes: '黄浦区高中，建议重点关注学校稳定办学、区位和录取表现。',
    features: ['高中', '区域关注', '稳定办学'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区大境中学': {
    admissionNotes: '黄浦区高中，建议结合区内高中梯队、通勤便利度和学校整体学风一起判断。',
    features: ['高中', '区域比较'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区敬业中学': {
    admissionNotes: '黄浦区高中，建议重点看学校管理、录取口径和区位适配度。',
    features: ['高中', '历史底蕴'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区格致初级中学': {
    admissionNotes: '黄浦区公办初中，建议重点关注格致体系背景、对口入学口径和区内优质初中比较。',
    features: ['公办初中', '名校体系'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定区安亭高级中学': {
    admissionNotes: '嘉定区高中，建议重点关注区域录取表现、学校管理和安亭片区就读便利度。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市延安中学新城分校': {
    admissionNotes: '嘉定区高中，建议重点关注延安体系资源、分校定位与区内高中比较。',
    features: ['名校分校', '高中', '体系资源'],
    tags: ['高中', '名校分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海师范大学附属中学嘉定新城分校': {
    admissionNotes: '嘉定区高中，建议重点关注高校附属资源、区位和学校整体培养节奏。',
    features: ['高校附属', '高中', '体系资源'],
    tags: ['高中', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '同济大学附属实验中学': {
    admissionNotes: '嘉定区公办初中，建议重点关注高校附属背景、对口入学口径和学校整体管理风格。',
    features: ['公办初中', '高校附属'],
    tags: ['初中', '公办', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市回民中学': {
    admissionNotes: '静安区完全中学，建议区分初高中学段，重点关注学校历史办学背景与校风管理。',
    features: ['完全中学', '历史办学'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市市西中学新城分校': {
    admissionNotes: '静安区体系学校，建议重点关注市西资源承接、分校定位与年度录取口径。',
    features: ['名校分校', '体系资源'],
    tags: ['高中', '名校分校'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市市西初级中学': {
    admissionNotes: '静安区公办初中，建议重点关注对口入学安排、市西体系背景与家长口碑。',
    features: ['公办初中', '名校体系'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区闸北第八中学': {
    admissionNotes: '静安区完全中学，建议区分初高中学段，重点关注学校稳定办学和片区适配度。',
    features: ['完全中学', '区域关注'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '同济大学附属七一中学': {
    admissionNotes: '静安区完全中学，建议重点关注高校附属背景、贯通培养和区域就读便利度。',
    features: ['完全中学', '高校附属', '贯通培养'],
    tags: ['完全中学', '公办', '高校附属'],
    trainingDirections: ['贯通培养', '科创竞赛', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市华师大三附中': {
    admissionNotes: '金山区高中，建议重点关注高校附属资源、区位适配度和学校整体录取口径。',
    features: ['高校附属', '高中', '区域关注'],
    tags: ['高中', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
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
