import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T12:40:00+08:00';

const overrides = {
  '上海市向明中学浦江分校': {
    address: '上海市闵行区浦锦路138号',
    phone: '021-24066036',
    website: 'https://www.shmeea.edu.cn/download/20220629/01zzzs/11.pdf',
    admissionNotes: '闵行区市重点分校，建议重点关注统一招生、自主招生、向明体系培养逻辑和闵行区位适配度。',
    features: ['向明体系', '市重点分校', '研究性学习', '综合素养培养'],
    tags: ['高中', '市重点分校', '研究性学习'],
    trainingDirections: ['人文综合', '科创竞赛'],
    profileDepth: 'foundation',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20220629/01zzzs/11.pdf',
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
