import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T22:55:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市市十中学': {
    admissionNotes: '黄浦区区重点高中，建议结合区内高中录取口径、学校稳定办学表现和通勤便利度一起判断。',
    features: ['区重点高中', '稳定办学'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市格致中学': {
    admissionNotes: '黄浦区市重点高中，建议重点关注格致历史底蕴、理科传统和统一招生/自招口径。',
    features: ['市重点高中', '历史名校', '理科传统'],
    tags: ['高中', '市重点'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区光明中学': {
    admissionNotes: '黄浦区区重点高中，建议结合区内高中比较、录取位次和学校管理节奏一起看。',
    features: ['区重点高中', '区域比较'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区大同初级中学': {
    admissionNotes: '黄浦区公办初中，建议重点关注对口入学安排、大同体系背景和初中阶段教学管理。',
    features: ['公办初中', '名校体系'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区大境中学': {
    admissionNotes: '黄浦区高中，建议重点关注学校录取口径、区域位置和往年升学表现。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区敬业中学': {
    admissionNotes: '黄浦区高中，建议重点关注学校整体办学稳定性、区位与录取走势。',
    features: ['高中', '稳定办学'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区格致初级中学': {
    admissionNotes: '黄浦区公办初中，建议重点关注初中入学口径、格致体系背景和家长实际口碑。',
    features: ['公办初中', '名校体系'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定一中': {
    admissionNotes: '嘉定区市重点高中，建议重点关注统一招生、自主招生口径和嘉定区位适配度。',
    features: ['市重点高中', '嘉定头部高中'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定二中': {
    admissionNotes: '嘉定区高中，建议重点关注区内高中梯队位置、录取分数和学校管理风格。',
    features: ['高中', '区域比较'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定区南翔中学': {
    admissionNotes: '嘉定区高中，建议结合南翔片区区位、录取分数变化和学校教学管理一起判断。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定区安亭中学': {
    admissionNotes: '嘉定区高中，建议结合安亭片区就读便利度、学校管理和录取表现一起看。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定区安亭高级中学': {
    admissionNotes: '嘉定区高中，建议重点关注录取口径、区域位置和学校整体稳定性。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市延安中学新城分校': {
    admissionNotes: '嘉定区高中，建议重点关注延安体系资源、分校定位和区内高中比较。',
    features: ['高中', '名校分校', '区域比较'],
    tags: ['高中', '名校分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市民办远东学校': {
    admissionNotes: '嘉定区民办学校，建议区分初中与高中学段，重点关注民办报名、课程特色和学费信息。',
    features: ['民办学校', '完全中学', '课程路径'],
    tags: ['民办', '完全中学'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海师范大学附属中学嘉定新城分校': {
    admissionNotes: '嘉定区高中，建议重点关注上师大附属背景、区位与录取口径，以及分校培养路径。',
    features: ['高中', '高校附属', '分校资源'],
    tags: ['高中', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市市西中学新城分校': {
    admissionNotes: '静安区体系学校，建议重点关注市西体系资源、分校定位和年度录取安排。',
    features: ['高中', '名校分校', '体系资源'],
    tags: ['高中', '名校分校'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区市西中学': {
    admissionNotes: '静安区市重点高中，建议重点关注统一招生、自主招生以及学校整体学风与课程强度。',
    features: ['市重点高中', '静安头部高中'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区新中高级中学': {
    admissionNotes: '静安区高中，建议结合区位、学校管理和往年录取口径一起比较。',
    features: ['高中', '区域关注'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区育才中学': {
    admissionNotes: '静安区高中，建议重点关注育才传统、区内高中比较和录取表现。',
    features: ['高中', '历史底蕴'],
    tags: ['高中'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市华师大三附中': {
    admissionNotes: '金山区高中，建议重点关注华师大系资源、区位适配度和学校整体录取口径。',
    features: ['高中', '高校附属', '区域关注'],
    tags: ['高中', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
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
