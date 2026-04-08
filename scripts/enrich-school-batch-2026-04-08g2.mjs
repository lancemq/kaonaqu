import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const UPDATED_AT = '2026-04-08T22:30:00+08:00';

const overrides = {
  '世外中学': {
    address: '上海市徐汇区虹漕南路602号',
    phone: '021-54190200',
    website: 'https://www.wflms.cn/',
    admissionNotes: '民办双语与项目化生态并行，DP/IB、AI实验室与寄宿资源同步推进，建议结合官网招生简章和DP/国际项目曝光判断学段衔接与寄宿安排。',
    features: ['双语项目化学习', 'IB/DP与美国课程', 'AI与STEAM实验', '寄宿与走读并行'],
    tags: ['高中', '双语', '民办', '国际课程', '寄宿'],
    trainingDirections: ['跨学科项目研习', '科技与AI探索', '国际升学 (DP/AP)'],
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
  '西南位育中学': {
    address: '上海市徐汇区宜山路671号',
    phone: '021-64705469',
    website: 'https://xnwygjb.xhedu.sh.cn/cms/app/info/doc/index.php/375',
    admissionNotes: '西南位育国际部融合AP/IB、双语科研平台与公办管理体系，建议同步以校方与教育局自招公告确认年度课程与语言测试节奏。',
    features: ['AP/IB混合课程', '双语科研小组', '公办实验型', '国际交流'],
    tags: ['高中', '国际部', '双语', '公办'],
    trainingDirections: ['AP/STEM', '国际交流与人文', '艺术/体育特色'],
    profileDepth: 'priority',
    source: {
      name: '西南位育中学国际部官网',
      type: 'official',
      url: 'https://xnwygjb.xhedu.sh.cn/cms/app/info/doc/index.php/375',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海外国语大学附属双语学校': {
    address: '上海市杨浦区永吉路351号',
    phone: '18019454771',
    website: 'https://www.shyp.gov.cn/shypq/yqyw-wb-jyjzl-ypzs/20240407/452021.html',
    admissionNotes: '上外附属双语（原民办上外）在杨浦以高校联动与IB/DP项目为抓手，双语+高校资源并行，建议同时关注区教育局与学校官网公布的语言测试与面试流程。',
    features: ['高校附属双语', 'IB/DP+A-Level', '海外研学', '走读/寄宿'],
    tags: ['双语', '国际课程', '民办', '高校附属'],
    trainingDirections: ['IBDP/国际议题', '跨文化沟通', '高阶语言与社科'],
    profileDepth: 'priority',
    source: {
      name: '杨浦区教育局招生公示',
      type: 'official',
      url: 'https://www.shyp.gov.cn/shypq/yqyw-wb-jyjzl-ypzs/20240407/452021.html',
      crawledAt: UPDATED_AT,
      confidence: 0.92
    },
    updatedAt: UPDATED_AT
  },
  '上海市存志中学': {
    address: '上海市宝山苏家浜路211号',
    phone: '400-688-0112',
    website: 'https://www.peixunsj.cn/8248/campus.html',
    admissionNotes: '存志高级中学推动DSE、A-Level与融合部课程组合，全天候管理与国际研学并行，建议通过官网招生通道或热线确认课程组与学籍安排。',
    features: ['DSE/A-Level/融合部', '全天候精细化管理', '双语+国际实践', '生涯规划'],
    tags: ['民办', '国际课程', '双语', '融合部'],
    trainingDirections: ['香港DSE', 'A-Level', '国际化路径'],
    profileDepth: 'priority',
    source: {
      name: '上海存志高级中学官网',
      type: 'official',
      url: 'https://www.peixunsj.cn/8248/campus.html',
      crawledAt: UPDATED_AT,
      confidence: 0.88
    },
    updatedAt: UPDATED_AT
  },
  '上海市兰生复旦中学': {
    address: '上海市杨浦区世界路8号',
    phone: '021-65561661',
    website: 'https://xuexiao.chahaoba.com/xuexiao_details/75459',
    admissionNotes: '兰生复旦依托复旦大学资源，围绕双语、人文与理科交叉体系构建研学社群，建议结合学校及高校合作公告了解跨学科培养节奏。',
    features: ['复旦协作', '双语人文与理科', '研学社群', '写作与推理训练'],
    tags: ['民办', '高校合作', '双语', '人文+理科'],
    trainingDirections: ['人文与写作', '科学与数据', '全球议题研学'],
    profileDepth: 'priority',
    source: {
      name: '查号吧学校名录',
      type: 'directory',
      url: 'https://xuexiao.chahaoba.com/xuexiao_details/75459',
      crawledAt: UPDATED_AT,
      confidence: 0.78
    },
    updatedAt: UPDATED_AT
  },
  '民办上外双语学校': {
    address: '上海市杨浦区永吉路351号',
    phone: '18019454771',
    website: 'https://www.shyp.gov.cn/shypq/yqyw-wb-jyjzl-ypzs/20240407/452021.html',
    admissionNotes: '民办上外双语延续上外附属的双语+国际项目，文理一体与高校资源并行，建议同步关注区教育局自招与招生说明书确定语言等级与面试流程。',
    features: ['双语国际班', '高校附属资源', 'IB/DP', '跨语言拓展'],
    tags: ['双语', '国际课程', '民办', '高校附属'],
    trainingDirections: ['IBDP', '语境写作与跨文化交流', '全球视野'],
    profileDepth: 'priority',
    source: {
      name: '杨浦区教育局招生公示',
      type: 'official',
      url: 'https://www.shyp.gov.cn/shypq/yqyw-wb-jyjzl-ypzs/20240407/452021.html',
      crawledAt: UPDATED_AT,
      confidence: 0.92
    },
    updatedAt: UPDATED_AT
  },
  '上海博华双语学校': {
    address: '上海市奉贤区八字桥路686号',
    phone: '021-67100588',
    website: 'https://www.125school.com/xuexiao279/lianxi.html',
    admissionNotes: '博华双语(帕丁顿)是一所12年一贯制寄宿学校，AP/IB、STEAM与艺术/体育并行，建议配合招生简章和住宿档次说明评估。',
    features: ['寄宿制', '三体系国际课程', 'STEAM与艺术', '中西文化融合'],
    tags: ['民办', '寄宿', '国际课程', '双语'],
    trainingDirections: ['AP/IB', 'STEAM/工程', '艺术与体育'],
    profileDepth: 'priority',
    source: {
      name: '125国际教育-上海奉贤区博华双语学校',
      type: 'directory',
      url: 'https://www.125school.com/xuexiao279/lianxi.html',
      crawledAt: UPDATED_AT,
      confidence: 0.78
    },
    updatedAt: UPDATED_AT
  },
  '上海哈罗国际学校': {
    address: '浦东新区高西路588号',
    phone: '+86 21 6881 8282',
    website: 'https://www.harrowshanghai.cn/zh/the-school-cn/contact-us-cn/',
    admissionNotes: '哈罗上海承袭哈罗公学英式课程与全日制寄宿，IGCSE/MYP/DP与艺术、户外+领导力并行，建议通过官网招生/国际学生办公室资料确认签证和住宿服务。',
    features: ['英式课程', '寄宿+走读', '领导力与户外', '跨学科项目'],
    tags: ['国际', '英式', '寄宿', '外籍学生'],
    trainingDirections: ['IGCSE/DP', '全球领导力', '创意写作与演讲'],
    profileDepth: 'priority',
    source: {
      name: '哈罗国际学校上海校区官网',
      type: 'official',
      url: 'https://www.harrowshanghai.cn/zh/the-school-cn/contact-us-cn/',
      crawledAt: UPDATED_AT,
      confidence: 0.94
    },
    updatedAt: UPDATED_AT
  },
  '平和双语学校': {
    address: '浦东新区黄杨路261号',
    phone: '021-50310791',
    website: 'https://www.pinghe.org/',
    admissionNotes: '平和双语以“轻负担高质量”为底色，IBDP/OSSD融入素质教育与中英文沉浸，建议参考官网与招生热线确认国际课程与文理衔接。',
    features: ['IBDP/OSSD', '双语沉浸', '素质教育', '中美加通道'],
    tags: ['双语', '民办', '国际课程', '浦东'],
    trainingDirections: ['IBDP', 'OSSD', '语言与艺术'],
    profileDepth: 'priority',
    source: {
      name: '本地宝-上海市平和双语学校',
      type: 'directory',
      url: 'https://m.sh.bendibao.com/wangdian/dian/5446016.shtm',
      crawledAt: UPDATED_AT,
      confidence: 0.77
    },
    updatedAt: UPDATED_AT
  },
  '上海美高双语学校（高中部）': {
    address: '闵行区华漕镇纪友路688号',
    phone: '021-62968877',
    website: 'https://www.peixunsj.cn/1885/',
    admissionNotes: '美高双语高中部用AP/A-Level+中国课程的双轨式融合，强调项目式探究与国际化升学，可结合招生简章及AP课程安排理解推优节奏。',
    features: ['AP/ALevel', '中美双轨', '小班化教学', 'STEAM/商业'],
    tags: ['民办', 'AP', 'A-Level', '双语'],
    trainingDirections: ['AP/美高', 'A-Level', 'STEAM/商业'],
    profileDepth: 'priority',
    source: {
      name: '上海美高双语学校官网',
      type: 'directory',
      url: 'https://www.peixunsj.cn/1885/',
      crawledAt: UPDATED_AT,
      confidence: 0.77
    },
    updatedAt: UPDATED_AT
  },
  '上海市民办中芯学校（高中部）': {
    address: '浦东新区青桐路169号',
    phone: '021-20332588',
    website: 'https://www.021school.cn/schools/15911',
    admissionNotes: '张江高科的中芯学校国际部以STEM、WASC、AP+科研项目为主轴，适合产业家庭。建议以官方招生通道、国际部公告和021-2033-2588核实开放日与申请节奏。',
    features: ['STEM与AP', 'WASC认证', '中英文双轨', '产业连接'],
    tags: ['民办', 'STEM', 'AP', '国际'],
    trainingDirections: ['AP/CS', '工程与机器人', '科学研究'],
    profileDepth: 'priority',
    source: {
      name: '上海校讯中心-民办中芯学校',
      type: 'directory',
      url: 'https://www.021school.cn/schools/15911',
      crawledAt: UPDATED_AT,
      confidence: 0.74
    },
    updatedAt: UPDATED_AT
  },
  '上海青浦平和双语学校（初中）': {
    address: '上海市青浦区朱家角路6号',
    phone: '021-59750808',
    website: 'https://www.pinghe.org/',
    admissionNotes: '青浦平和双语初中聚焦前置双语与跨学科项目，配合青浦特色研学，建议参考集团官网及青浦区招生材料确认衔接方案。',
    features: ['初中双语', '项目化学习', '研学+生态', 'Pinghe文化'],
    tags: ['初中', '双语', '民办', '青浦'],
    trainingDirections: ['跨学科项目', '中英文写作', '全球研学'],
    profileDepth: 'priority',
    source: {
      name: '平和教育集团官网',
      type: 'official',
      url: 'https://www.pinghe.org/',
      crawledAt: UPDATED_AT,
      confidence: 0.79
    },
    updatedAt: UPDATED_AT
  },
  '上海杨浦双语学校': {
    address: '上海市杨浦区永吉路351号',
    phone: '18019454771',
    website: 'https://www.shyp.gov.cn/shypq/yqyw-wb-jyjzl-ypzs/20240407/452021.html',
    admissionNotes: '杨浦双语(上外附属)注重IB/DP与多语素养，强调中英双语和高校资源，建议同步参考教育局和校方最新招生信息。',
    features: ['IB/DP', '高校附属', '中英双语', '国际研学'],
    tags: ['双语', '国际课程', '高校附属', '民办'],
    trainingDirections: ['IBDP', '跨文化沟通', '艺术与人文'],
    profileDepth: 'priority',
    source: {
      name: '杨浦区教育局招生公示',
      type: 'official',
      url: 'https://www.shyp.gov.cn/shypq/yqyw-wb-jyjzl-ypzs/20240407/452021.html',
      crawledAt: UPDATED_AT,
      confidence: 0.92
    },
    updatedAt: UPDATED_AT
  },
  '上海师范大学附属宝山罗店中学': {
    address: '上海市宝山区罗新路707号',
    phone: '56863091-1334',
    website: 'https://school.bsedu.org.cn/ldzx/',
    admissionNotes: '宝山罗店中学侧重美育+管乐与高校附属资源，实验性示范定位，建议按官网公布的寄宿/走读、艺术项目与招生政策综合判断。',
    features: ['实验性示范', '高校附属', '美育与管乐', '寄宿'],
    tags: ['高中', '公办', '艺术', '附属'],
    trainingDirections: ['美育', '人文综合', '科创竞赛'],
    profileDepth: 'priority',
    source: {
      name: '上海师范大学附属罗店中学官网',
      type: 'official',
      url: 'https://school.bsedu.org.cn/ldzx/',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海民办行中中学': {
    address: '月浦镇塘南街52号',
    phone: '(021)56195474',
    website: 'https://www.applysquare.com/institute-cn/S3431000141/',
    admissionNotes: '宝山区民办行中以人文与科技兼具的课程为主，建议对照教育局和学校公布的招生简章与收费说明，结合选课/课外、寄宿需求综合判断。',
    features: ['民办完全中学', '学术与综合拓展', '区域衔接', '多元社团'],
    tags: ['民办', '高中', '区域重点'],
    trainingDirections: ['人文综合', '科创竞技', '升学规划'],
    profileDepth: 'priority',
    source: {
      name: 'ApplySquare-上海民办行中中学',
      type: 'directory',
      url: 'https://www.applysquare.com/institute-cn/S3431000141/',
      crawledAt: UPDATED_AT,
      confidence: 0.7
    },
    updatedAt: UPDATED_AT
  },
  '上海市复旦初级中学': {
    address: '华山路1580号',
    phone: '62800694',
    website: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
    admissionNotes: '复旦初级中学作为复旦资源的初中阶段，强调基础学力与学术潜能，建议参考长宁区教育局的通讯信息表与简章判断能力测评与升学走向。',
    features: ['复旦资源', '基础训练', '公办', '科研兴趣支持'],
    tags: ['初中', '公办', '复旦'],
    trainingDirections: ['人文', '数学与科学', '英语与论文写作'],
    profileDepth: 'priority',
    source: {
      name: '长宁区教育局通讯信息表',
      type: 'official',
      url: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海市第三女子中学': {
    address: '江苏路155号',
    phone: '62526860',
    website: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
    admissionNotes: '市三女中是全市唯一公办女子重点高中，强调艺术/人文与女性领导力，建议结合校方自主招生系统与区教育局公布的择优/艺术专班资料进行判断。',
    features: ['女子教育', '艺术与人文', '市示范', '社会实践'],
    tags: ['公办', '女子', '重点', '艺术'],
    trainingDirections: ['艺术与人文', '领导力', '素质拓展'],
    profileDepth: 'priority',
    source: {
      name: '长宁区教育局通讯信息表',
      type: 'official',
      url: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海市长宁区仙霞高级中学': {
    address: '水城路450弄1号',
    phone: '62590198',
    website: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
    admissionNotes: '仙霞高级中学作为长宁公办重点，侧重素质教育与项目化管理，建议以教育局通讯信息表和校园公开日资料核实课程节奏与招生口径。',
    features: ['公办品质', '项目化教学', '素质教育', '社区结合'],
    tags: ['公办', '长宁', '高中'],
    trainingDirections: ['综合素养', '体育与艺术', '社会服务'],
    profileDepth: 'priority',
    source: {
      name: '长宁区教育局通讯信息表',
      type: 'official',
      url: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海市长宁区复旦中学': {
    address: '华山路1626号',
    phone: '62800172',
    website: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
    admissionNotes: '长宁复旦中学结合哲学教育与数理/人文双轨，强调市示范标准与创新课程，建议通过长宁区教育局最新通讯数据确认占位与面试安排。',
    features: ['哲学教育', '数理训练', '市示范', '高校串联'],
    tags: ['公办', '市示范', '复旦'],
    trainingDirections: ['哲学/数理', '科技/人文融合', '全球视野'],
    profileDepth: 'priority',
    source: {
      name: '长宁区教育局通讯信息表',
      type: 'official',
      url: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
      crawledAt: UPDATED_AT,
      confidence: 0.9
    },
    updatedAt: UPDATED_AT
  },
  '上海市长宁区市三女中': {
    address: '江苏路155号',
    phone: '62526860',
    website: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
    admissionNotes: '市三女中（区命名）延续女子教育基因，艺术+学术共进，建议结合区级通讯信息与自主招生系统确认专业班与选拔节奏。',
    features: ['女子教育', '艺术与人文', '市示范', '女性发展'],
    tags: ['公办', '女子', '重点', '长宁'],
    trainingDirections: ['艺术与人文', '领导力与素质', '社会研究'],
    profileDepth: 'priority',
    source: {
      name: '长宁区教育局通讯信息表',
      type: 'official',
      url: 'https://zwgk.shcn.gov.cn/xxgk/xsdw-jyj/2023/286/70433.html',
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
    tags: Array.from(new Set([...(school.tags || []), ...(override.tags || [])]))
  };
});

fs.writeFileSync(filePath, `${JSON.stringify(nextSchools, null, 2)}\n`);
console.log(JSON.stringify({ updated: Object.keys(overrides).length, names: Object.keys(overrides) }, null, 2));
