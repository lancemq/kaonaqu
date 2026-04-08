import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T23:20:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市崇明区城桥中学': {
    admissionNotes: '崇明区区重点高中，建议重点关注区域生源结构、录取口径与学校整体管理节奏。',
    features: ['区重点高中', '区域稳定办学'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市崇明区民本中学': {
    admissionNotes: '崇明区区重点高中，建议结合区位、录取分数和学校管理风格综合判断。',
    features: ['区重点高中', '区域关注'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤中学附属三官堂学校': {
    admissionNotes: '奉贤区完全中学，建议区分初中入学与高中培养口径，重点关注奉贤中学附属背景与贯通培养路径。',
    features: ['完全中学', '名校附属', '贯通培养'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤中学附属初中': {
    admissionNotes: '奉贤区公办初中，建议重点关注名校附属资源、对口入学口径与区域适配度。',
    features: ['公办初中', '名校附属'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开学校目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤区奉城高级中学': {
    admissionNotes: '奉贤区区重点高中，建议重点关注统一招生口径、寄宿条件与区位通勤便利度。',
    features: ['区重点高中', '区域稳定办学'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤区曙光中学': {
    admissionNotes: '奉贤区区重点高中，建议重点看学校管理节奏、录取表现和区位适配度。',
    features: ['区重点高中', '区域关注'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海外国语大学附属外国语学校': {
    phone: '021-65423105',
    website: 'https://www.sfls.cn/',
    admissionNotes: '虹口区头部完全中学，建议重点关注外语特色、保送/推荐传统、寄宿管理与不同学部培养路径。',
    features: ['外语特色', '寄宿制', '上外附属', '完全中学'],
    tags: ['完全中学', '市重点', '外语特色', '寄宿'],
    trainingDirections: ['外语特色', '人文综合'],
    profileDepth: 'priority',
    source: { name: '上外附中官网', type: 'official', url: 'https://www.sfls.cn/', crawledAt: UPDATED_AT, confidence: 0.9 },
    updatedAt: UPDATED_AT
  },
  '上海市北郊高级中学': {
    phone: '021-65073555',
    admissionNotes: '虹口区市重点高中，建议重点关注统一招生、自主招生和学校整体学风与课程节奏。',
    features: ['市重点高中', '区域头部', '稳定办学'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开电话目录', type: 'directory', url: 'https://tw.chahaoba.com/021-65073555', crawledAt: UPDATED_AT, confidence: 0.74 },
    updatedAt: UPDATED_AT
  },
  '上海市华东师范大学第一附属中学': {
    admissionNotes: '虹口区特色高中，建议重点关注华一体系资源、课程创新和自主招生路径。',
    features: ['高校附属', '特色普通高中', '课程创新'],
    tags: ['高中', '市特色普通高中', '高校附属'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市复兴高级中学分校': {
    admissionNotes: '虹口区市重点分校，建议重点关注复兴体系资源、分校定位和区内高中比较。',
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
    admissionNotes: '虹口区区重点高中，建议重点关注高校附属背景、区域升学适配度和学校管理节奏。',
    features: ['区重点高中', '高校附属', '区域关注'],
    tags: ['高中', '区重点', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市储能中学': {
    admissionNotes: '黄浦区区重点高中，建议重点关注区内高中比较、录取表现和学校稳定办学节奏。',
    features: ['区重点高中', '区域比较'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市卢湾高级中学': {
    admissionNotes: '黄浦区市重点高中，建议重点看区位通勤、录取走势和学校整体课程节奏。',
    features: ['市重点高中', '区域头部'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市向明初级中学': {
    admissionNotes: '黄浦区公办初中，建议结合对口入学安排、向明体系背景和区内优质初中比较一起判断。',
    features: ['公办初中', '名校体系'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市大同中学分校': {
    admissionNotes: '黄浦区市重点分校，建议重点关注大同体系资源、分校定位和区内高中整体比较。',
    features: ['市重点分校', '名校体系'],
    tags: ['高中', '市重点分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市市十中学': {
    admissionNotes: '黄浦区区重点高中，建议结合区内高中比较、录取口径和学校管理风格一起判断。',
    features: ['区重点高中', '稳定办学'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市格致中学': {
    address: '上海市黄浦区广西北路66号',
    phone: '021-63510228',
    website: 'https://gezhi.hpe.cn/',
    admissionNotes: '黄浦区市重点高中，建议重点关注理科传统、竞赛培养与统一招生/自招口径。',
    features: ['市重点高中', '理科传统', '历史名校'],
    tags: ['高中', '市重点'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: { name: '学校官网/公开联系方式', type: 'official', url: 'https://gezhi.hpe.cn/', crawledAt: UPDATED_AT, confidence: 0.9 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定一中': {
    address: '上海市嘉定区嘉行公路701号',
    phone: '021-69983668',
    website: 'http://www.jdyz.com/',
    admissionNotes: '嘉定区市重点高中，建议重点关注实验性示范性高中定位、统一招生与学校整体课程强度。',
    features: ['市重点高中', '实验性示范性高中', '现代化校园'],
    tags: ['高中', '市重点', '实验性示范性高中'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: { name: '上海校讯中心/学校公开信息', type: 'official', url: 'https://www.021school.cn/schools/16662', crawledAt: UPDATED_AT, confidence: 0.9 },
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
