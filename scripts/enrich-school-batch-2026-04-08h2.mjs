import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T23:35:00+08:00';

const overrides = {
  '上海市西延安中学': {
    address: '上海市长宁区茅台路1111号',
    phone: '021-62901188',
    source: { name: '长宁区教育公开信息', type: 'official', url: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html', crawledAt: UPDATED_AT, confidence: 0.82 },
    updatedAt: UPDATED_AT
  },
  '上海外国语大学附属外国语学校': {
    address: '上海市虹口区中山北一路295号',
    phone: '021-65423105',
    website: 'https://www.sfls.cn/',
    updatedAt: UPDATED_AT
  },
  '上海市北郊高级中学': {
    address: '上海市虹口区曲阳路497号',
    phone: '021-65073555',
    source: { name: '公开电话目录', type: 'directory', url: 'https://tw.chahaoba.com/021-65073555', crawledAt: UPDATED_AT, confidence: 0.74 },
    updatedAt: UPDATED_AT
  },
  '上海市格致中学': {
    address: '上海市黄浦区广西北路66号',
    phone: '021-63510228',
    website: 'https://gezhi.hpe.cn/',
    source: { name: '格致中学官网', type: 'official', url: 'https://gezhi.hpe.cn/', crawledAt: UPDATED_AT, confidence: 0.9 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定一中': {
    address: '上海市嘉定区嘉行公路701号',
    phone: '021-69983668',
    website: 'http://www.jdyz.com/',
    source: { name: '上海校讯中心', type: 'directory', url: 'https://www.021school.cn/schools/16662', crawledAt: UPDATED_AT, confidence: 0.88 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定二中': {
    phone: '021-59531931',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定区南翔中学': {
    phone: '021-59122225',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市嘉定区安亭中学': {
    phone: '021-59579615',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.68 },
    updatedAt: UPDATED_AT
  },
  '上海市崇明区城桥中学': {
    phone: '021-59611550',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市崇明区民本中学': {
    phone: '021-59622819',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤中学附属三官堂学校': {
    phone: '021-33611096',
    source: { name: '公开学校目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤中学附属初中': {
    phone: '021-37192020',
    source: { name: '公开学校目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤区奉城高级中学': {
    phone: '021-57522810',
    source: { name: '公开学校目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市奉贤区曙光中学': {
    phone: '021-57123665',
    source: { name: '公开学校目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市储能中学': {
    phone: '021-63281242',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市卢湾高级中学': {
    phone: '021-63014127',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市市十中学': {
    phone: '021-63210616',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市向明初级中学': {
    phone: '021-63866642',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市大同中学分校': {
    phone: '021-63031800',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
    updatedAt: UPDATED_AT
  },
  '上海市黄浦区大同初级中学': {
    phone: '021-63130018',
    source: { name: '公开电话目录', type: 'directory', url: 'https://www.021school.cn/', crawledAt: UPDATED_AT, confidence: 0.66 },
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
