// 按远端新架构（regions.data.json 单一真源）接入 wuxi
const fs = require('fs');
const p = 'shared/regions.data.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
j.regions.wuxi = {
  label: '无锡',
  brandSuffix: 'WUXI EDUCATION',
  brandSuffixFull: 'WUXI EDUCATION PLATFORM',
  officialSourceName: '无锡市教育局',
  examTotal: { zhongkao: 750, gaokao: 750 },
  districtCatalog: [
    { id: 'liangxi', name: '梁溪区', description: '无锡中心城区，教育资源集聚' },
    { id: 'xishan', name: '锡山区', description: '天一中学所在地，教育强区' },
    { id: 'huishan', name: '惠山区', description: '锡山高级中学所在地' },
    { id: 'binhu', name: '滨湖区', description: '太湖新城拓展，教育快速发展' },
    { id: 'xinwu', name: '新吴区', description: '高新区，教育持续完善' },
    { id: 'jingkai', name: '经开区', description: '太湖新城核心区，新建学校集中' },
    { id: 'jiangyin', name: '江阴市', description: '县域教育高地，南菁中学所在地' },
    { id: 'yixing', name: '宜兴市', description: '县域教育强市，独立招生片区' }
  ],
  keyLevelPriority: {
    '市重点(高中)': 100,
    '顶级公办(初中)': 95,
    '顶级民办(初中)': 95,
    '区重点(高中)': 80,
    '强民办(初中)': 72,
    '强公办(初中)': 70,
    '一般高中': 60,
    '一般初中': 40
  },
  seo: {
    areaServed: '无锡',
    titleTemplate: '考哪去 | {label}中考高考政策与升学新闻',
    descriptionTemplate: '考哪去汇集{label}中考、高考政策与升学新闻。',
    keywords: ['{label}中考', '{label}高考', '{label}新闻', '升学政策', '中招', '高招', '{label}教育']
  },
  features: { schools: true, knowledge: false, compare: true, groups: false, district: true, scoreMatch: true },
  home: {
    newsSpecials: [],
    featuredSchoolNames: ['江苏省无锡市第一中学', '无锡市辅仁高级中学', '江苏省梅村高级中学', '江苏省天一中学', '江苏省锡山高级中学'],
    newsSpecialPages: [],
    quickLinks: [
      { label: '中考高考动态', href: '/news?filter=exam' },
      { label: '政策文件', href: '/news?filter=policy' }
    ]
  }
};
fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
console.log('wuxi 已加入 regions.data.json；regions:', Object.keys(j.regions).join(','));
