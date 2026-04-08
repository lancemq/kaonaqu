import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-09T00:40:00+08:00';
const DIRECTORY_URL = 'https://www.021school.cn/';

const overrides = {
  '上海市奉贤区格致中学': {
    phone: '021-57470870',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市华东师范大学第一附属中学': {
    phone: '021-65421650',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市复兴高级中学分校': {
    phone: '021-65603868',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市虹口高级中学': {
    phone: '021-56967029',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市鲁迅中学': {
    phone: '021-65610868',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海师范大学附属虹口中学': {
    phone: '021-55120908',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区光明中学': {
    phone: '021-63112487',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区大境中学': {
    phone: '021-63530822',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区敬业中学': {
    phone: '021-63268017',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区格致初级中学': {
    phone: '021-63280458',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定区安亭高级中学': {
    phone: '021-69578531',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市延安中学新城分校': {
    phone: '021-69960019',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海师范大学附属中学嘉定新城分校': {
    phone: '021-59500910',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '同济大学附属实验中学': {
    phone: '021-69517239',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市回民中学': {
    phone: '021-56631322',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市市西中学新城分校': {
    phone: '021-36366995',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市市西初级中学': {
    phone: '021-62580753',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市静安区闸北第八中学': {
    phone: '021-56622586',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '同济大学附属七一中学': {
    phone: '021-56628553',
    source: { name: '公开电话目录', type: 'directory', url: DIRECTORY_URL, crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市华师大三附中': {
    phone: '021-67267302',
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
