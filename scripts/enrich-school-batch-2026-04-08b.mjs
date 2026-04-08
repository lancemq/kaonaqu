import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T11:20:00+08:00';

const overrides = {
  '上海市南洋模范中学': {
    address: '上海市徐汇区零陵路453号',
    phone: '021-34690246',
    website: 'https://nmzx.xhedu.sh.cn/',
    admissionNotes: '徐汇区市重点高中，全国文明单位、实验性示范性高中，建议重点关注统一招生、自主招生、科创竞赛和南模特色课程体系。',
    features: ['实验性示范性高中', '全国文明单位', '科创竞赛强', '南模特色课程'],
    tags: ['高中', '市重点', '实验性示范性高中', '科创竞赛'],
    trainingDirections: ['科创竞赛', '人文综合', '艺术特色'],
    profileDepth: 'priority',
    source: {
      name: '上海市南洋模范中学官网',
      type: 'official',
      url: 'https://nmzx.xhedu.sh.cn/cms/app/info/doc/index.php/18',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市控江中学': {
    address: '上海市杨浦区双阳路388号',
    phone: '021-65193808',
    website: 'https://jwgl.shkjzx.cn/',
    admissionNotes: '杨浦区市重点高中，实验性示范性高中，建议重点关注自主发展教育、创新人才培养项目和统一招生、自主招生口径。',
    features: ['实验性示范性高中', '自主发展教育', '创新人才培养', '科技教育特色'],
    tags: ['高中', '市重点', '实验性示范性高中', '科创竞赛'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/page/03200/20060417/3334.html',
      crawledAt: UPDATED_AT,
      confidence: 0.92
    },
    updatedAt: UPDATED_AT
  },
  '上海市晋元高级中学': {
    address: '上海市普陀区新村路2169号',
    phone: '021-66095553',
    website: 'https://hsjy.pte.sh.cn/',
    admissionNotes: '普陀区市重点高中，全部住宿，建议重点关注统一招生、自主招生、选择教育和寄宿制管理。',
    features: ['实验性示范性高中', '全部住宿', '选择教育', '心理健康教育特色'],
    tags: ['高中', '市重点', '实验性示范性高中', '寄宿'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'priority',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20250527/35.pdf',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海交通大学附属中学嘉定分校': {
    address: '上海市嘉定区云谷路1660号',
    phone: '021-59103621',
    website: 'https://www.jiading.gov.cn/jiaoyu/bmfw/xxcx/gz/content_551005',
    admissionNotes: '嘉定区实验性示范性高中，寄宿制高中，建议重点关注统一招生、自主招生、交附体系培养和科创、艺术项目。',
    features: ['实验性示范性高中', '寄宿制高中', '交附体系', '科技创新教育'],
    tags: ['高中', '公办', '实验性示范性高中', '寄宿'],
    trainingDirections: ['科创竞赛', '人文综合', '艺术特色'],
    profileDepth: 'priority',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20250527/62.pdf',
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
    tags: Array.from(new Set([...(school.tags || []), ...(override.tags || [])]))
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);
console.log(JSON.stringify({ updated: Object.keys(overrides).length, names: Object.keys(overrides) }, null, 2));
