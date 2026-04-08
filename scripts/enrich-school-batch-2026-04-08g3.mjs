import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T22:50:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市长宁区延安中学': {
    address: '上海市长宁区茅台路1111号',
    phone: '021-62901188',
    website: 'https://shyahs.chneic.sh.cn/',
    admissionNotes: '长宁区市重点高中，建议重点关注延安体系、统一招生与自主招生口径，以及理科与外语见长的培养氛围。',
    features: ['市重点高中', '长宁头部高中', '外语与理科见长'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合', '科创竞赛', '外语特色'],
    profileDepth: 'foundation',
    source: { name: '学校官网', type: 'official', url: 'https://shyahs.chneic.sh.cn/', crawledAt: UPDATED_AT, confidence: 0.95 },
    updatedAt: UPDATED_AT
  },
  '上海实验学校东滩高级中学': {
    address: '上海市崇明区陈家镇雪雁路300号',
    phone: '021-39300269',
    website: 'https://jjc.shnu.edu.cn/8b/a0/c29206a756640/page.htm',
    admissionNotes: '崇明区实验系高中，建议重点关注生态岛定位、科创实践课程和寄宿管理体验。',
    features: ['实验学校体系', '生态科创', '寄宿管理'],
    tags: ['高中', '市重点', '实验'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开页面', type: 'official', url: 'https://jjc.shnu.edu.cn/8b/a0/c29206a756640/page.htm', crawledAt: UPDATED_AT, confidence: 0.9 },
    updatedAt: UPDATED_AT
  },
  '上海市崇明区城桥中学': {
    address: '上海市崇明区西门路498号',
    phone: '021-59611084',
    website: 'https://www.021school.cn/schools/16758',
    admissionNotes: '崇明区区重点高中，坐落于西门路，建议重点结合区域招生计划、统一招生分数与校风管理节奏判断。',
    features: ['区重点高中', '公办骨干', '区域教学骨干'],
    tags: ['高中', '公办', '区重点'],
    trainingDirections: ['文理兼顾', '区域研究'],
    profileDepth: 'foundation',
    source: {
      name: '上海校讯中心',
      type: 'directory',
      url: 'https://www.021school.cn/schools/16758',
      crawledAt: UPDATED_AT,
      confidence: 0.84
    },
    updatedAt: UPDATED_AT
  },
  '上海市崇明区民本中学': {
    admissionNotes: '崇明区区重点高中，建议结合区域生源结构、学校管理和往年录取情况一起判断。',
    features: ['区重点高中', '区域稳定办学'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海新纪元双语学校（高中部）': {
    admissionNotes: '崇明区民办双语高中，建议重点关注双语课程路径、升学方向和学费信息。',
    features: ['民办双语高中', '双语课程', '国际化表达'],
    tags: ['高中', '民办', '双语'],
    trainingDirections: ['国际课程', '外语特色'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤中学附属三官堂学校': {
    admissionNotes: '奉贤区完全中学，建议区分初中入学和高中培养口径，重点关注奉贤中学附属背景和贯通培养路径。',
    features: ['完全中学', '奉贤中学附属', '贯通培养'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤中学附属初中': {
    admissionNotes: '奉贤区公办初中，建议重点关注奉贤中学附属资源、对口入学口径和区内公办初中比较。',
    features: ['公办初中', '名校附属', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤区奉城高级中学': {
    admissionNotes: '奉贤区区重点高中，建议重点看统一招生录取口径、校风管理和区域适配度。',
    features: ['区重点高中', '区域稳定办学'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤区曙光中学': {
    admissionNotes: '奉贤区区重点高中，建议重点关注学校整体管理、区位通勤与往年录取表现。',
    features: ['区重点高中', '区域稳定办学'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海外国语大学附属外国语学校': {
    admissionNotes: '虹口区头部完全中学，建议重点关注外语特色、保送/推荐传统和不同学部培养路径。',
    features: ['外语特色', '完全中学', '上外附属'],
    tags: ['完全中学', '市重点', '外语特色'],
    trainingDirections: ['外语特色', '人文综合'],
    profileDepth: 'priority',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市北郊高级中学': {
    admissionNotes: '虹口区市重点高中，建议结合统一招生、自主招生和学校整体学风、管理节奏一起看。',
    features: ['市重点高中', '区域头部', '稳定办学'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市华东师范大学第一附属中学': {
    admissionNotes: '虹口区特色高中，建议重点关注华一体系、科创与人文并重的课程气质，以及自主招生路径。',
    features: ['特色普通高中', '高校附属', '课程创新'],
    tags: ['高中', '市特色普通高中', '高校附属'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市复兴高级中学分校': {
    admissionNotes: '虹口区市重点分校，建议重点关注复兴体系资源、分校定位和区内高中比较。',
    features: ['市重点分校', '复兴体系', '区域比较'],
    tags: ['高中', '市重点分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市虹口高级中学': {
    admissionNotes: '虹口区区重点高中，建议结合校风管理、区位通勤和录取分数变化一起判断。',
    features: ['区重点高中', '区域稳定办学'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市鲁迅中学': {
    admissionNotes: '虹口区市重点高中，建议重点关注学校历史底蕴、人文气质和统一招生录取口径。',
    features: ['市重点高中', '人文底蕴', '稳定办学'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海师范大学附属虹口中学': {
    admissionNotes: '虹口区区重点高中，建议重点关注高校附属背景、区域升学适配度和学校管理节奏。',
    features: ['区重点高中', '高校附属', '区域关注'],
    tags: ['高中', '区重点', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.7 },
    updatedAt: UPDATED_AT
  },
  '上海市储能中学': {
    admissionNotes: '黄浦区区重点高中，建议结合学校整体管理、历史底蕴和黄浦区内高中比较一起看。',
    features: ['区重点高中', '历史底蕴', '区域比较'],
    tags: ['高中', '区重点'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市卢湾高级中学': {
    admissionNotes: '黄浦区市重点高中，建议重点关注学校整体录取口径、区位通勤和往年分数表现。',
    features: ['市重点高中', '区域头部', '稳定办学'],
    tags: ['高中', '市重点'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市向明初级中学': {
    admissionNotes: '黄浦区公办初中，建议结合对口入学口径、向明体系背景和区内优质初中比较一起判断。',
    features: ['公办初中', '名校体系', '区域关注'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市大同中学分校': {
    admissionNotes: '黄浦区市重点分校，建议重点关注大同体系资源、分校定位和区内高中整体比较。',
    features: ['市重点分校', '大同体系', '区域比较'],
    tags: ['高中', '市重点分校'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: { name: '公开招生目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.72 },
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
