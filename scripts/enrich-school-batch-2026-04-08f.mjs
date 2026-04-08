import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T19:10:00+08:00';
const BAOSHAN_PUBLIC_SOURCE = 'https://edu.sh.gov.cn/gqzszc_bsq/20210430/89a2752c77f246ec9af09e0e5804150d.html';

const overrides = {
  '上海金瑞学校': {
    phone: '021-56127777',
    admissionNotes: '宝山区民办完全中学，建议同步关注义务教育阶段民办报名、中学部办学稳定性以及课程衔接安排。',
    features: ['完全中学', '民办', '校内衔接'],
    tags: ['完全中学', '民办'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: {
      name: '学校公开招生信息',
      type: 'directory',
      url: 'https://www.021school.cn/',
      crawledAt: UPDATED_AT,
      confidence: 0.72
    },
    updatedAt: UPDATED_AT
  },
  '上海民办行中中学': {
    phone: '021-56020128',
    admissionNotes: '宝山区民办高中，建议重点看学校当年招生简章、收费标准以及高中阶段培养方向。',
    features: ['民办高中', '区内招生关注', '办学稳定性'],
    tags: ['高中', '民办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: {
      name: '学校公开招生信息',
      type: 'directory',
      url: 'https://www.021school.cn/',
      crawledAt: UPDATED_AT,
      confidence: 0.72
    },
    updatedAt: UPDATED_AT
  },
  '上海师范大学附属宝山罗店中学': {
    admissionNotes: '宝山区公办高中，建议重点关注上师大附属资源、统一招生口径和罗店片区就读适配度。',
    features: ['公办高中', '高校附属资源', '区域升学关注'],
    tags: ['高中', '公办', '高校附属'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: {
      name: '学校公开招生信息',
      type: 'directory',
      url: 'https://www.021school.cn/',
      crawledAt: UPDATED_AT,
      confidence: 0.72
    },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区虎林中学': {
    address: '上海市宝山区虎林路565号',
    phone: '021-61735860',
    admissionNotes: '宝山区公办初中，建议结合对口入学安排、学校日常管理和区内公办初中比较一起看。',
    features: ['公办初中', '对口入学关注', '校风管理'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '上海市教育委员会', type: 'official', url: BAOSHAN_PUBLIC_SOURCE, crawledAt: UPDATED_AT, confidence: 0.94 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区教育学院附属学校': {
    address: '上海市宝山区宝杨路480号',
    phone: '021-56115217',
    admissionNotes: '宝山区完全中学，建议区分初中入学和高中培养口径，重点关注教育学院附属背景和贯通培养特点。',
    features: ['完全中学', '教育学院附属', '贯通培养'],
    tags: ['完全中学', '公办', '教育学院附属'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://sh.bendibao.com/edu/2021413/237284.shtm', crawledAt: UPDATED_AT, confidence: 0.76 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区教育学院实验学校': {
    address: '上海市宝山区东林路125号',
    admissionNotes: '宝山区完全中学，建议重点关注校内衔接、实验学校定位以及义务教育阶段入学口径。',
    features: ['完全中学', '实验学校', '教育学院系统'],
    tags: ['完全中学', '公办', '实验'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://sh.bendibao.com/edu/2021413/237284.shtm', crawledAt: UPDATED_AT, confidence: 0.76 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区罗店中学': {
    admissionNotes: '宝山区公办初中，建议重点看罗店片区入学口径、学校管理风格和区内公办初中对比。',
    features: ['公办初中', '片区入学关注', '基础教学'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '上海市教育委员会', type: 'official', url: BAOSHAN_PUBLIC_SOURCE, crawledAt: UPDATED_AT, confidence: 0.94 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区庙行中学': {
    admissionNotes: '宝山区公办初中，建议结合对口政策、校风管理和家长对学校稳定性的关注点一起看。',
    features: ['公办初中', '校风管理', '区域比较'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '上海市教育委员会', type: 'official', url: BAOSHAN_PUBLIC_SOURCE, crawledAt: UPDATED_AT, confidence: 0.88 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区泗塘中学': {
    address: '上海市宝山区长江西路1888号',
    phone: '021-56994351',
    admissionNotes: '宝山区公办初中，建议结合对口入学、学校管理和区内公办初中梯队认知一起判断。',
    features: ['公办初中', '区域稳定办学', '校风管理'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '上海市教育委员会', type: 'official', url: BAOSHAN_PUBLIC_SOURCE, crawledAt: UPDATED_AT, confidence: 0.94 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区淞谊实验学校': {
    website: 'https://school.bsedu.org.cn/syzx/',
    admissionNotes: '宝山区完全中学，建议重点关注学校实验特色、初高中衔接和区内贯通培养路径。',
    features: ['完全中学', '实验学校', '贯通培养'],
    tags: ['完全中学', '公办', '实验'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '上海市宝山区淞谊中学官网', type: 'official', url: 'https://school.bsedu.org.cn/syzx/', crawledAt: UPDATED_AT, confidence: 0.93 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区吴淞二中': {
    address: '上海市宝山区长江路860弄1号',
    phone: '021-56141800',
    admissionNotes: '宝山区公办初中，建议重点关注吴淞片区入学安排、学校稳定办学表现和家长实际口碑。',
    features: ['公办初中', '区域稳定办学', '基础教学'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '上海市教育委员会', type: 'official', url: BAOSHAN_PUBLIC_SOURCE, crawledAt: UPDATED_AT, confidence: 0.94 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区杨泰实验中学': {
    admissionNotes: '宝山区公办初中，建议重点看片区入学口径、实验中学定位和学校整体管理节奏。',
    features: ['公办初中', '实验中学', '片区入学关注'],
    tags: ['初中', '公办', '实验'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区月浦实验学校': {
    address: '上海市宝山区庆安路25号',
    admissionNotes: '宝山区完全中学，建议区分初中入学和高中培养路径，重点关注实验学校定位和校内衔接。',
    features: ['完全中学', '实验学校', '贯通培养'],
    tags: ['完全中学', '公办', '实验'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区张庙学校': {
    admissionNotes: '宝山区完全中学，建议重点关注九年一贯或贯通培养体验、校内衔接和片区就学便利度。',
    features: ['完全中学', '贯通培养', '区域办学'],
    tags: ['完全中学', '公办'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山实验学校': {
    admissionNotes: '宝山区完全中学，建议重点关注学校实验属性、贯通培养节奏和区内家长实际评价。',
    features: ['完全中学', '实验学校', '贯通培养'],
    tags: ['完全中学', '公办', '实验'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市顾村中学（初中部）': {
    admissionNotes: '宝山区公办初中，建议结合顾村片区入学政策、学校管理和初中教学稳定性一起判断。',
    features: ['公办初中', '片区入学关注', '基础教学'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '上海市教育委员会', type: 'official', url: BAOSHAN_PUBLIC_SOURCE, crawledAt: UPDATED_AT, confidence: 0.9 },
    updatedAt: UPDATED_AT
  },
  '上海市刘行新华实验学校（初中部）': {
    admissionNotes: '宝山区公办初中，建议重点关注学校实验属性、顾村片区入学安排和日常管理风格。',
    features: ['公办初中', '实验学校', '区域管理'],
    tags: ['初中', '公办', '实验'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区行知外国语学校（初中部）': {
    admissionNotes: '宝山区公办初中，建议重点关注外语特色课程、行知体系背景以及区内升学适配度。',
    features: ['公办初中', '外语特色', '行知体系'],
    tags: ['初中', '公办', '外语特色'],
    trainingDirections: ['外语特色', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市吴淞实验学校': {
    address: '上海市宝山区牡丹江路454弄100号',
    admissionNotes: '宝山区完全中学，建议区分初中与高中口径，重点关注实验学校定位和校内衔接质量。',
    features: ['完全中学', '实验学校', '贯通培养'],
    tags: ['完全中学', '公办', '实验'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.72 },
    updatedAt: UPDATED_AT
  },
  '上海市行知实验中学（初中部）': {
    admissionNotes: '宝山区公办初中，建议重点关注行知教育理念、区内对口安排和学校整体教学管理节奏。',
    features: ['公办初中', '行知教育理念', '基础教学'],
    tags: ['初中', '公办'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: { name: '学校公开招生信息', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.72 },
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
