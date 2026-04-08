import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T18:20:00+08:00';

const overrides = {
  '上海宝山区世外学校': {
    address: '上海市宝山区云上路29号',
    phone: '021-33711888',
    website: 'https://bs.shwfl.edu.cn/',
    admissionNotes: '宝山区十二年一贯制民办学校，建议同步关注义务教育阶段民办报名、高中国内部招生安排，以及住宿和课程路径的具体说明。',
    features: ['十二年一贯制', '世外教育集团', '外语特色', '科技特色'],
    tags: ['完全中学', '民办', '国际化', '双语'],
    trainingDirections: ['外语特色', '国际课程', '科创竞赛'],
    profileDepth: 'priority',
    source: {
      name: '上海宝山区世外学校官网',
      type: 'official',
      url: 'https://bs.shwfl.edu.cn/',
      crawledAt: UPDATED_AT,
      confidence: 0.96
    },
    updatedAt: UPDATED_AT
  },
  '上海市宝钢新世纪学校': {
    address: '上海市宝山区盘古路528号',
    phone: '021-56693191',
    website: 'https://school.bsedu.org.cn/bgxsj/',
    admissionNotes: '宝山区公办九年一贯制学校，建议重点关注对口入学范围、中学部质量口碑以及“新优质学校”办学特色。',
    features: ['九年一贯制', '新优质学校', '公办', '文明单位'],
    tags: ['完全中学', '公办', '新优质学校'],
    trainingDirections: ['贯通培养', '人文综合'],
    profileDepth: 'foundation',
    source: {
      name: '上海市宝钢新世纪学校官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/bgxsj/',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区大场中学': {
    address: '上海市宝山区南陈路259号',
    phone: '021-66740133',
    website: 'https://school.bsedu.org.cn/dcms/',
    admissionNotes: '宝山区公办初中，建议结合对口政策、学校足球特色和日常教学管理口径一起判断。',
    features: ['公办初中', '校园足球', '素质教育示范校'],
    tags: ['初中', '公办', '足球特色'],
    trainingDirections: ['人文综合'],
    profileDepth: 'foundation',
    source: {
      name: '上海市大场中学官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/dcms/',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区高境第三中学': {
    address: '上海市宝山区国权北路468号',
    phone: '021-55031646',
    website: 'https://school.bsedu.org.cn/gaojing3000/',
    admissionNotes: '宝山区公办初中，建议重点关注科技创新特色、交大附中委托管理背景以及对口入学安排。',
    features: ['公办初中', '科技教育特色', '新优质学校', '交大附中委托管理'],
    tags: ['初中', '公办', '科技特色', '新优质学校'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'foundation',
    source: {
      name: '上海市宝山区高境镇第三中学官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/gaojing3000/app/info/doc/index.php/197',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市宝山区海滨中学': {
    address: '上海市宝山区海滨五村10号',
    phone: '021-56163655',
    website: 'https://school.bsedu.org.cn/hbez/',
    admissionNotes: '宝山区公办初中，建议结合对口入学口径、中考质量表现和学校科技活动特色一起比较。',
    features: ['公办初中', '科技活动', '文明校园'],
    tags: ['初中', '公办', '科创活动'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'foundation',
    source: {
      name: '上海市海滨第二中学官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/hbez/',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
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
