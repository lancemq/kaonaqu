import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T21:40:00+08:00';

const overrides = {
  '上海市存志附属宝山实验学校': {
    address: '上海市宝山区岭南路1249弄288号',
    phone: '021-56812128',
    website: 'https://www.021school.cn/schools/16981/',
    admissionNotes: '存志教育集团在宝山打造的实验校区，依托九年一贯和科技活动课程，兼顾双语表达与中高贯通衔接。',
    features: ['九年一贯制', '存志教育集团', 'STEAM实验', '双语融合'],
    tags: ['完全中学', '公办', '存志系'],
    trainingDirections: ['贯通培养', '科创竞赛', '外语强化'],
    profileDepth: 'foundation',
    source: {
      name: '上海市校讯中心',
      type: 'official',
      url: 'https://www.021school.cn/schools/16981/',
      crawledAt: UPDATED_AT,
      confidence: 0.93
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办存志高级中学': {
    address: '上海市宝山区苏家浜路211号',
    phone: '021-56699551',
    website: 'https://www.peixunsj.cn/8248/',
    admissionNotes: '存志教育旗下的民办高中，强调高考与国际课程双轨并行、双语强化与班级分层，配套升学咨询与学生成长档案。',
    features: ['民办高中', '存志教育', '高考+国际班', '双语课程'],
    tags: ['高中', '民办', '升学'],
    trainingDirections: ['高考强化', '国际升学', '外语深化'],
    profileDepth: 'foundation',
    source: {
      name: '上海校讯中心 · 课程中心',
      type: 'directory',
      url: 'https://www.peixunsj.cn/8248/',
      crawledAt: UPDATED_AT,
      confidence: 0.79
    },
    updatedAt: UPDATED_AT
  },
  '上外贤达贤德国际课程中心': {
    address: '上海市虹口区东体育会路390号',
    phone: '400-9609-559',
    website: 'https://www.guojixuexiao.org/school/swxd/',
    admissionNotes: '上海外国语大学贤达学院整体运营的国际课程中心，以A-Level、AP、BC与日本EJU为主轴，并为国内外升学提供贯通式指导。',
    features: ['A-Level', 'AP', 'BC课程', '日本EJU'],
    tags: ['国际课程', '双语', '升学通道'],
    trainingDirections: ['A-Level', 'EJU', '升学规划'],
    profileDepth: 'foundation',
    source: {
      name: '国际教育联盟 / 课程中心介绍',
      type: 'directory',
      url: 'https://www.guojixuexiao.org/school/swxd/',
      crawledAt: UPDATED_AT,
      confidence: 0.8
    },
    updatedAt: UPDATED_AT
  },
  '上实双语学校': {
    address: '上海市闵行区田林十三村1号',
    phone: '021-64701913',
    website: 'https://www.sesedu.cn/',
    admissionNotes: '上海市实验学校国际部打造的双语项目，结合IB/IGCSE和国家课程，强调强师资、语言浸润以及文本深度阅读。',
    features: ['双语融合', 'IB/IGCSE', '科技+人文'],
    tags: ['双语', '公办', '国际'],
    trainingDirections: ['IB', 'IGCSE', '外语表达'],
    profileDepth: 'foundation',
    source: {
      name: '上海市实验学校官网',
      type: 'official',
      url: 'https://www.ses.pudong-edu.sh.cn/web/syxy/5190019-5190000005598.htm',
      crawledAt: UPDATED_AT,
      confidence: 0.88
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办万科双语学校': {
    address: '上海市闵行区七莘路3568号',
    phone: '021-62216956',
    website: 'https://vkbs.dtd-edu.cn/contact-us',
    admissionNotes: '万科德英乐教育倾力打造，提供十二年一贯制双语通道，以5C5R素养与体验式学习推动学术、社会与领导力并重。',
    features: ['万科德英乐', '双语项目', '体验式学习', 'STEAM课题'],
    tags: ['民办', '双语', '完全中学'],
    trainingDirections: ['IB', '跨学科项目', '国际视野'],
    profileDepth: 'foundation',
    source: {
      name: '万科双语学校官网',
      type: 'official',
      url: 'https://vkbs.dtd-edu.cn/contact-us',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办协和双语学校': {
    address: '上海市闵行区虹泉路999号',
    phone: '021-34310090',
    website: 'https://www.021school.cn/schools/16982/',
    admissionNotes: '协和教育2003年起开办的旗舰九年一贯项目，融合中西课程体系、Cognia认证和多样化选修，强调文化沉淀与跨文化沟通。',
    features: ['中西融合课程', 'Cognia认证', '双语选班'],
    tags: ['九年一贯', '双语', '民办'],
    trainingDirections: ['A-Level', 'IB', '升学规划'],
    profileDepth: 'foundation',
    source: {
      name: '上海市校讯中心',
      type: 'official',
      url: 'https://www.021school.cn/schools/16982/',
      crawledAt: UPDATED_AT,
      confidence: 0.92
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办协和双语教科学校': {
    address: '上海市闵行区万源路55号',
    phone: '021-54933272',
    website: 'https://www.021school.cn/schools/16639/',
    admissionNotes: '协和教科学校坚持精英寄宿+多元选修，强调国际课程、艺术与科技活动，并由协和教育中心提供师资与课程体系支撑。',
    features: ['寄宿制', '多元课程', '科技与艺术'],
    tags: ['完全中学', '双语', '寄宿'],
    trainingDirections: ['科技', '艺术', '全球视野'],
    profileDepth: 'foundation',
    source: {
      name: '上海市校讯中心',
      type: 'official',
      url: 'https://www.021school.cn/schools/16639/',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办复旦万科实验学校': {
    address: '上海市闵行区星站路263号',
    phone: '021-64197597',
    website: 'https://www.021school.cn/schools/14948/',
    admissionNotes: '1996年由复旦附中和万科联合创办，A/B/C三个班型兼顾国内核心课程与国际化拓展，持续强调科技、艺术与心理成长。',
    features: ['九年一贯', 'A/B/C班', '科技艺术节', '双语'],
    tags: ['民办', '双语', '跨平台'],
    trainingDirections: ['STEM', '艺术', '外语'],
    profileDepth: 'foundation',
    source: {
      name: '上海市校讯中心',
      type: 'official',
      url: 'https://www.021school.cn/schools/14948/',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办燎原双语学校': {
    address: '上海市闵行区平阳路150号',
    phone: '021-64806128',
    website: 'https://www.liaoyuanedu.org/',
    admissionNotes: '上海育莘教育旗下老牌私校，IBO授权、A-Level与艺术中心并行，强调“全球视野+国学底色”的综合素养训练。',
    features: ['IBO授权', 'A-Level', '艺术中心', '寄宿'],
    tags: ['双语', '民办', '国际课程'],
    trainingDirections: ['IB', 'A-Level', '艺术创新'],
    profileDepth: 'foundation',
    source: {
      name: '上海市校讯中心',
      type: 'official',
      url: 'https://www.021school.cn/schools/16640/',
      crawledAt: UPDATED_AT,
      confidence: 0.91
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办燎原双语高级中学': {
    address: '上海市闵行区平阳路150号',
    phone: '021-64806128',
    website: 'https://www.liaoyuanedu.org/',
    admissionNotes: '高中部提供国内高中轨与国际课程班，A-Level、IB、AP并行，艺术、科技与研学活动丰富，寄宿+走读灵活。',
    features: ['A-Level', 'IB', 'AP', '艺术创新'],
    tags: ['双语', '国际课程', '高中'],
    trainingDirections: ['IB', 'A-Level', 'STEAM'],
    profileDepth: 'priority',
    source: {
      name: '上海市校讯中心',
      type: 'official',
      url: 'https://www.021school.cn/schools/16640/',
      crawledAt: UPDATED_AT,
      confidence: 0.92
    },
    updatedAt: UPDATED_AT
  },
  '上海加拿大国际学校': {
    address: '上海市长宁区虹桥路1161号',
    phone: '+86 21 6261 4338',
    website: 'https://www.scis-china.org/',
    admissionNotes: 'SCIS三校区提供从ECE到高中完整的IB课程，融合AP、LanguageOne语言项目和社区服务，强调全球公民与加拿大文化传承。',
    features: ['IB continuum', 'AP/Capstone', 'LanguageOne', 'Service & Leadership'],
    tags: ['国际学校', 'IB', '加拿大教育'],
    trainingDirections: ['IBDP', 'AP', 'Service & Leadership'],
    profileDepth: 'priority',
    source: {
      name: 'Shanghai Community International School',
      type: 'official',
      url: 'https://www.scis-china.org/contact-us',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区民办华二初级中学': {
    address: '上海市嘉定新城宝塔路1166号',
    phone: '021-60831507',
    website: 'https://www.vsxue.com/1835.html',
    admissionNotes: '隶属华东师范大学第二附属中学的民办初中，强调竞赛选拔、科学实验与双语基础，配套华二“精英+成长”管理机制。',
    features: ['华东师范大学资源', '竞赛培训', '双语基础'],
    tags: ['初中', '民办', '华二系'],
    trainingDirections: ['学科竞赛', '核心素养'],
    profileDepth: 'foundation',
    source: {
      name: '均瑶教育资源目录',
      type: 'directory',
      url: 'https://www.vsxue.com/1835.html',
      crawledAt: UPDATED_AT,
      confidence: 0.78
    },
    updatedAt: UPDATED_AT
  },
  '上海市浦东新区民办华二紫竹双语学校': {
    address: '上海市浦东新区雪野路48号',
    phone: '021-58869990',
    website: 'https://www.021school.cn/schools/14693/',
    admissionNotes: '靠近世博园区的协和系旗舰，融合华二与协和育人体系，聚焦A-Level/IB等国际课程与双语科技实践。',
    features: ['华二+协和资源', '双语科技', '国际课程'],
    tags: ['双语', '民办', '协和系'],
    trainingDirections: ['A-Level', 'IB', 'STEAM'],
    profileDepth: 'foundation',
    source: {
      name: '上海市校讯中心',
      type: 'official',
      url: 'https://www.021school.cn/schools/14693/',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海新加坡国际学校': {
    address: '上海市闵行区诸建路301号',
    phone: '+86 21 6221 9288',
    website: 'https://www.ssis.asia/about-us/contact-us/',
    admissionNotes: '1996年创办，提供新加坡雨果式、IGCSE与IB Diploma三段式课程，强调全球公民与素养、丰富的课外体验与社会实践。',
    features: ['新加坡课程', 'IGCSE', 'IB Diploma', 'Global Citizenship'],
    tags: ['国际学校', 'IB', '双语'],
    trainingDirections: ['IBDP', 'Singapore & IGCSE', '全球公民'],
    profileDepth: 'priority',
    source: {
      name: 'Shanghai Singapore International School',
      type: 'official',
      url: 'https://www.ssis.asia/about-us/contact-us/',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海澳大利亚国际高中': {
    address: '上海市浦东新区巨峰路1555号A座6层',
    phone: '400-822-1988',
    website: 'https://www.ieduglobe.com/xuexiao/shais/',
    admissionNotes: '由西澳大利亚教育部授权的澳洲国际高中，主打法学WACE与A-Level、AQA课程，保持澳式教学特色和中国大学双向升学对接。',
    features: ['WACE', 'A-Level', '澳洲教育部授权', '大学衔接'],
    tags: ['国际课程', '澳洲', '高中'],
    trainingDirections: ['WACE', 'A-Level', '升学规划'],
    profileDepth: 'priority',
    source: {
      name: '国际教育前线 · 学校库',
      type: 'directory',
      url: 'https://www.ieduglobe.com/xuexiao/shais/',
      crawledAt: UPDATED_AT,
      confidence: 0.78
    },
    updatedAt: UPDATED_AT
  },
  '上海青浦世外学校': {
    address: '上海市青浦区蟠文路455号',
    phone: '021-60829355',
    website: 'https://qphs.shwfl.edu.cn/',
    admissionNotes: '世外教育青浦分校以“4+1”课程体系衔接幼小初高，整合IB、AP与校本主题课程，注重全球视野与本土文化的融合。',
    features: ['世外教育体系', 'IB/AP', '融合探索课程'],
    tags: ['民办', '九年一贯', '国际化'],
    trainingDirections: ['IBDP', 'AP', '中国+国际融合'],
    profileDepth: 'priority',
    source: {
      name: '上海青浦区世外学校官网',
      type: 'official',
      url: 'https://qphs.shwfl.edu.cn/english/2024/0815/c2311a13603/page.htm',
      crawledAt: UPDATED_AT,
      confidence: 0.94
    },
    updatedAt: UPDATED_AT
  },
  '上海青浦区协和双语学校': {
    address: '上海市青浦区赵巷镇业锦路32号',
    phone: '021-59788662',
    website: 'https://www.shqp.gov.cn/edu/eduzwgk/lm/jy/zs/qt/20240828/1196037.html',
    admissionNotes: '协和集团2019年在青浦落地的旗舰校园，83亩现代化园区融合科技、艺术、戏剧与户外课程，双语场景贯穿小学至高中。',
    features: ['协和双语', '83亩园区', '科技+艺术'],
    tags: ['双语', '民办', '协和系'],
    trainingDirections: ['双语艺术', '国际视野', 'STEAM'],
    profileDepth: 'foundation',
    source: {
      name: '上海青浦区教育局',
      type: 'official',
      url: 'https://www.shqp.gov.cn/edu/eduzwgk/lm/jy/zs/qt/20240828/1196037.html',
      crawledAt: UPDATED_AT,
      confidence: 0.92
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办世外中学': {
    address: '上海市徐汇区虹漕南路602号',
    phone: '021-54190200',
    website: 'https://www.wflms.cn/',
    admissionNotes: '上海世外教育的旗舰中学，早在2008年成为IBO官方授权学校，通过IB、A-Level、各类探究与科技实践项目保持高录取和美本拓展。',
    features: ['IBDP', 'A-Level', '科技+人文', '研究型课题'],
    tags: ['国际化', '民办', '完全中学'],
    trainingDirections: ['IBDP', 'A-Level', '项目式学习'],
    profileDepth: 'priority',
    source: {
      name: '上海市世外中学官网',
      type: 'official',
      url: 'https://www.wflms.cn/',
      crawledAt: UPDATED_AT,
      confidence: 0.95
    },
    updatedAt: UPDATED_AT
  },
  '上海市西南位育实验学校': {
    address: '上海市徐汇区宜山路671号',
    phone: '021-64758361',
    website: 'https://xnwygjb.xhedu.sh.cn/cms/app/info/doc/index.php/679',
    admissionNotes: '1993年转制的民办完全中学，聚焦科技、艺术与体育，拥有国际班/双语课程，强调探索型学习与素养评价。',
    features: ['转制民办', '科技+艺术', '国际班'],
    tags: ['民办', '完全中学', '科技'],
    trainingDirections: ['STEM', '文体融合', '国际课程'],
    profileDepth: 'foundation',
    source: {
      name: '上海市西南位育中学国际部官网',
      type: 'official',
      url: 'https://xnwygjb.xhedu.sh.cn/cms/app/info/doc/index.php/679',
      crawledAt: UPDATED_AT,
      confidence: 0.88
    },
    updatedAt: UPDATED_AT
  },
  '上海民办位育中学': {
    address: '上海市徐汇区位育路1号',
    phone: '021-64960808',
    website: 'https://guoji.shxhd.cn/mbwy/',
    admissionNotes: '位育教育集团的国际高中，以IBDP、A-Level和OSSD并行、升学指导精细化著称，同时延续位育传统的学科与德育素养。',
    features: ['IBDP', 'A-Level', 'OSSD', '精细化升学指导'],
    tags: ['民办', '国际课程', '高中'],
    trainingDirections: ['IBDP', 'A-Level', 'OSSD'],
    profileDepth: 'foundation',
    source: {
      name: '位育国际部官网',
      type: 'official',
      url: 'https://guoji.shxhd.cn/mbwy/',
      crawledAt: UPDATED_AT,
      confidence: 0.9
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
