import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T12:10:00+08:00';

const overrides = {
  '上海市曹杨第二中学': {
    address: '上海市普陀区梅川路160号',
    phone: '62548645',
    website: 'https://web-hscyez.pte.sh.cn/',
    admissionNotes: '普陀区市重点高中，实验性示范性高中，建议重点关注统一招生、自主招生、国际课程班及艺术、体育特色项目。',
    features: ['实验性示范性高中', '国际课程班', '体育艺术特色', '部分住宿'],
    tags: ['高中', '市重点', '实验性示范性高中', '国际课程'],
    trainingDirections: ['科创竞赛', '人文综合', '国际课程'],
    profileDepth: 'priority',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20250527/36.pdf',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市市北中学': {
    address: '上海市静安区永兴路365号',
    phone: '56636054',
    website: 'https://www.jingan.gov.cn/rmtzx/003001/20251023/f8a08fb7-57da-4f69-9227-c5ffd5fe3f2c.html',
    admissionNotes: '静安区市重点高中，首批实验性示范性高中，建议重点关注学校“勤、恕、勇”校训体系、排球与合唱特色以及科技教育平台。',
    features: ['实验性示范性高中', '百年名校', '排球传统强校', '合唱艺术特色'],
    tags: ['高中', '市重点', '实验性示范性高中', '百年老校'],
    trainingDirections: ['人文综合', '科创竞赛', '艺术特色'],
    profileDepth: 'priority',
    source: {
      name: '静安区人民政府',
      type: 'official',
      url: 'https://www.jingan.gov.cn/rmtzx/003001/20251023/f8a08fb7-57da-4f69-9227-c5ffd5fe3f2c.html',
      crawledAt: UPDATED_AT,
      confidence: 0.94
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
