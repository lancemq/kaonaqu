import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T10:30:00+08:00';

const overrides = {
  '上海大学附属中学': {
    address: '上海市宝山区上大路688号',
    phone: '15316390761',
    website: 'https://sdfz.shu.edu.cn/',
    admissionNotes: '宝山区市重点高中，学校为实验性示范性寄宿制高中，建议同步关注统一招生、自主招生、寄宿条件和资优培养项目。',
    features: ['实验性示范性高中', '寄宿制高中', '资优培养', '高校合作课程'],
    tags: ['高中', '市重点', '实验性示范性高中', '寄宿'],
    trainingDirections: ['科创竞赛', '人文综合', '国际课程'],
    profileDepth: 'priority',
    source: {
      name: '上海大学附属中学官网',
      type: 'official',
      url: 'https://sdfz.shu.edu.cn/xxgk/xxjj.htm',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市复兴高级中学': {
    address: '上海市虹口区车站南路28号',
    phone: '65426658',
    website: 'https://www.fuxing.sh.cn/',
    admissionNotes: '虹口区市重点高中，现代化寄宿制高中，建议关注统一招生、自主招生、同济实验班和部分住宿资源。',
    features: ['实验性示范性高中', '现代化寄宿制高中', '同济实验班', '科技创新培养'],
    tags: ['高中', '市重点', '实验性示范性高中', '寄宿'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20240530/42.pdf',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市位育中学': {
    address: '上海市徐汇区位育路1号',
    phone: '021-64960808',
    website: 'https://weiyu.xhedu.sh.cn/',
    admissionNotes: '徐汇区市重点高中，首批实验性示范性高中，建议重点关注自主发展理念、科技教育、寄宿管理和自主招生口径。',
    features: ['实验性示范性高中', '现代化寄宿制高中', '自主发展', '科技教育'],
    tags: ['高中', '市重点', '实验性示范性高中', '寄宿'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: {
      name: '上海市位育中学官网',
      type: 'official',
      url: 'https://weiyu.xhedu.sh.cn/cms/app/info/doc/index.php/88',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市大同中学': {
    address: '上海市黄浦区南车站路353号',
    phone: '63162590',
    website: 'https://dt.hpe.cn/',
    admissionNotes: '黄浦区市重点高中，可住宿，建议重点关注统一招生、自主招生、CIE课程链和科学教育特色。',
    features: ['实验性示范性高中', '科学教育实验校', 'CIE课程链', '可住宿'],
    tags: ['高中', '市重点', '实验性示范性高中', '寄宿'],
    trainingDirections: ['科创竞赛', '人文综合', '国际课程'],
    profileDepth: 'priority',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20240530/8.pdf',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市向明中学': {
    address: '上海市黄浦区瑞金一路151号',
    phone: '53063368转211',
    website: 'https://xiangming.hpe.cn/',
    admissionNotes: '黄浦区市重点高中，全部走读，建议重点关注创造教育特色、自主招生和研究性学习能力要求。',
    features: ['实验性示范性高中', '创造教育', '研究性学习', '全部走读'],
    tags: ['高中', '市重点', '实验性示范性高中'],
    trainingDirections: ['人文综合', '科创竞赛', '艺术特色'],
    profileDepth: 'priority',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20220629/01zzzs/10.pdf',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市格致中学奉贤校区': {
    address: '上海市奉贤区德学路66号',
    phone: '67157666转5041',
    website: 'http://www.gezhi.sh.cn',
    admissionNotes: '奉贤区市重点高中校区，现代化全寄宿制高中，建议重点关注统一招生、自主招生和格致体系的一体化培养路径。',
    features: ['实验性示范性高中', '全寄宿制高中', '格致体系', '创新培养'],
    tags: ['高中', '市重点', '实验性示范性高中', '寄宿'],
    trainingDirections: ['科创竞赛', '人文综合'],
    profileDepth: 'priority',
    source: {
      name: '上海市教育考试院',
      type: 'official',
      url: 'https://www.shmeea.edu.cn/download/20210420/01/08.pdf',
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
