const SCORE_SOURCE_2025 = {
  label: '2025 年上海高中 1-15 志愿分数线公开汇总',
  url: 'https://www.sohu.com/a/915786067_121124319',
  note: '第三方公开汇总；不同区、批次与计划类型口径不同，最终以当年市/区招考机构发布为准。'
};

const CORE_SCHOOL_PROFILES = {
  'xuhui-上海中学': {
    badge: '第一批核心学校',
    image: {
      url: '/school-images/shanghai-high-school.jpg',
      alt: '上海中学校园图像',
      caption: '校园图像来自学校官网公开页面'
    },
    history: [
      { year: '1865', text: '办学源流常被追溯至龙门书院。' },
      { year: '近现代', text: '逐步发展为上海基础教育体系中的代表性学校。' },
      { year: '1993', text: '创办国际部，学校信息需要区分本部与国际部口径。' }
    ],
    programs: [
      { title: '拔尖创新培养', text: '关注学术潜能识别、研究型课程与高阶学习任务。' },
      { title: '竞赛与大学先修', text: '适合学科基础强、能长期投入高强度训练的学生。' },
      { title: '本部与国际部资源', text: '阅读时要明确目标路径，避免把不同体系混在一起比较。' }
    ],
    notablePeople: [
      { name: '曾庆红', role: '公开资料列为上海中学初中阶段校友。' },
      { name: '院士与高校管理者群体', role: '学校公开校友叙事中常强调科研、教育与公共事务领域校友网络。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '707', scope: '委属 / 市重', source: SCORE_SOURCE_2025 }
    ],
    sources: [
      { label: '上海中学官网-学校概况', url: 'https://www.shs.cn/xxgk.htm' },
      { label: '上海中学官网-知名校友', url: 'https://www.shs.cn/xxgk/zmxy.htm' },
      { label: '维基百科-上海市上海中学', url: 'https://zh.wikipedia.org/wiki/%E4%B8%8A%E6%B5%B7%E5%B8%82%E4%B8%8A%E6%B5%B7%E4%B8%AD%E5%AD%A6' }
    ]
  },
  'pudong-华东师范大学第二附属中学': {
    badge: '第一批核心学校',
    image: {
      url: '/school-images/hsefz-campus.png',
      alt: '华东师范大学第二附属中学校园图像',
      caption: '图像来自学校官网公开内容'
    },
    history: [
      { year: '1958', text: '学校公开校史资料显示，华东师大二附中创办于 1958 年。' },
      { year: '示范高中建设期', text: '持续推进课程改革、创新人才培养和科技教育特色。' },
      { year: '近年', text: '围绕卓越学院、多校区协同等方向扩展拔尖创新培养平台。' }
    ],
    programs: [
      { title: '卓越教育体系', text: '强调立德与创新，适合目标明确、学习自驱力强的学生。' },
      { title: '学科竞赛与科创', text: '资源密度高，建议同时评估孩子承压能力与时间管理能力。' },
      { title: '多校区协同', text: '阅读招生与课程信息时要区分本部、分校区和项目口径。' }
    ],
    notablePeople: [
      { name: '科技创新人才群体', role: '学校公开介绍中长期强调科技教育与创新人才培养。' },
      { name: '校庆校友作者群', role: '65 周年校庆专题中持续更新校友回忆与校友文章。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '709.5', scope: '委属 / 市重', source: SCORE_SOURCE_2025 }
    ],
    sources: [
      { label: '华东师大二附中官网-学校概况', url: 'https://www.hsefz.cn/about/' },
      { label: '华东师大二附中-校史大事记', url: 'https://www.hsefz.cn/about/landmark2024/' },
      { label: '华东师大二附中 65 周年校庆专题', url: 'https://www.hsefz.cn/65anniversary/' }
    ]
  },
  'yangpu-复旦大学附属中学': {
    badge: '第一批核心学校',
    image: {
      url: '/school-images/fudan-fuzhong.jpg',
      alt: '复旦大学附属中学校园图像',
      caption: '校园图像来自 Wikimedia Commons 公开图片'
    },
    history: [
      { year: '20 世纪中叶', text: '公开资料普遍将学校创建时间放在 20 世纪中叶。' },
      { year: '实验性示范性高中建设期', text: '形成寄宿制高中、大学附属背景与国际化资源并存的办学格局。' },
      { year: '近年', text: '继续围绕学生自主发展、研究性学习与多路径升学进行课程建设。' }
    ],
    programs: [
      { title: '复旦大学合作背景', text: '适合重视大学资源、学术训练和人文底蕴的家庭。' },
      { title: '寄宿制管理', text: '需要同步评估学生独立生活、自我管理和节奏适应能力。' },
      { title: '人文与科技并重', text: '更适合基础扎实、愿意在综合探索中保持长期投入的学生。' }
    ],
    notablePeople: [
      { name: '复旦体系校友网络', role: '学校与复旦大学资源联系紧密，校友网络是家长常关注的信息点。' },
      { name: '学术竞赛学生群体', role: '公开介绍中多次提到研究性学习与创新竞赛成果。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '707.5', scope: '委属 / 市重', source: SCORE_SOURCE_2025 }
    ],
    sources: [
      { label: '复旦附中官网', url: 'http://www.fdfz.cn/' },
      { label: '新浪教育-复旦附中介绍', url: 'https://edu.sina.com.cn/zxx/2010-11-03/1830273450.shtml' },
      { label: '维基百科-复旦大学附属中学', url: 'https://zh.wikipedia.org/wiki/%E5%A4%8D%E6%97%A6%E5%A4%A7%E5%AD%A6%E9%99%84%E5%B1%9E%E4%B8%AD%E5%AD%A6' }
    ]
  },
  'yangpu-上海交通大学附属中学': {
    badge: '第一批核心学校',
    image: {
      url: '/school-images/jiaoda-fuzhong-campus.jpg',
      alt: '上海交通大学附属中学校园图像',
      caption: '图像来自学校官网公开页面'
    },
    history: [
      { year: '1954', text: '学校沿革页面记载，1954 年上海新办多所工农速成中学。' },
      { year: '1964', text: '公开校史显示，学校更名为上海交通大学附属中学。' },
      { year: '1985', text: '学校成为交大与市教育局双重领导的附属中学。' }
    ],
    programs: [
      { title: '工程科技底色', text: '适合理工兴趣明显、喜欢项目实践和系统训练的学生。' },
      { title: '研究性学习', text: '学校网站栏目中突出跨学科课题与探知工坊等学习场景。' },
      { title: '高校协同资源', text: '阅读时建议同时看课程、竞赛、学生支持与通勤成本。' }
    ],
    notablePeople: [
      { name: '张涌泉', role: '交大附中校友通讯中曾介绍其生物工程与产业化相关经历。' },
      { name: '校友会群体', role: '学校设有校友名录、交中记忆、校友动态等公开栏目。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '707', scope: '委属 / 市重', source: SCORE_SOURCE_2025 }
    ],
    sources: [
      { label: '交大附中官网-学校简介', url: 'https://fz.sjtu.edu.cn/gyxx/xxjj.htm' },
      { label: '交大附中官网-校史沿革', url: 'https://fz.sjtu.edu.cn/gyxx/xsyg.htm' },
      { label: '交大附中-校友通讯', url: 'https://fz.sjtu.edu.cn/info/1362/33695.htm' }
    ]
  },
  'minhang-上海市七宝中学': {
    badge: '第一批核心学校',
    image: {
      url: '/school-images/qibao-high-school.jpg',
      alt: '上海市七宝中学校园图像',
      caption: '校园图像来自学校官网公开页面'
    },
    history: [
      { year: '20 世纪中期', text: '公开校史资料显示，学校办学源流可追溯至 20 世纪中期。' },
      { year: '示范高中建设期', text: '逐步形成课程改革、研究性学习和综合素养培养特色。' },
      { year: '近年', text: '围绕校园文化、课程平台和学生发展持续更新办学表达。' }
    ],
    programs: [
      { title: '综合育人', text: '更强调学术基础与综合发展并重，适合长期成长型学生。' },
      { title: '研究性学习', text: '建议关注项目学习、活动参与和时间管理的匹配度。' },
      { title: '区域影响力', text: '在闵行区高关注度较高，适合与闵行中学、上师闵分等同区学校对比。' }
    ],
    notablePeople: [
      { name: '校友社群', role: '七宝中学校庆和校友活动公开报道较多，适合继续补充可核验人物条目。' },
      { name: '行知教育交流群体', role: '公开报道中常见其与教育交流、校庆活动相关的校友叙事。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '699', scope: '闵行 / 市重', source: SCORE_SOURCE_2025 }
    ],
    sources: [
      { label: '七宝中学官网', url: 'http://qbzx.icampus.cn/' },
      { label: '七宝中学-历史沿革', url: 'https://qbzx.icampus.cn/P/C/11695.htm' },
      { label: '文汇报-七宝中学专题报道', url: 'https://www.whb.cn/commonDetail/30524' }
    ]
  },
  'pudong-上海市建平中学': {
    badge: '第一批核心学校',
    image: {
      url: '/school-images/jianping-campus.png',
      alt: '上海市建平中学图像',
      caption: '图像来自学校官网公开页面'
    },
    history: [
      { year: '1944', text: '80 周年校庆公告等公开资料将其源流追溯至私立洋泾中小学。' },
      { year: '浦东发展期', text: '逐步发展为浦东核心公办高中之一。' },
      { year: '近年', text: '继续围绕课程选择、学生发展支持和综合素养培养更新办学体系。' }
    ],
    programs: [
      { title: '课程选择丰富', text: '适合希望在稳定体系中逐步拉升能力的学生。' },
      { title: '综合素养培养', text: '建议关注课程强度、活动参与和学生发展支持的真实匹配度。' },
      { title: '浦东核心公办高中', text: '适合与进才、洋泾、川沙等浦东高关注高中一起比较。' }
    ],
    notablePeople: [
      { name: '钱学森教育思想相关叙事', role: '公开文章提到钱学森曾肯定建平“先学会做人，后学会做学问”等教育表达。' },
      { name: '校园节目与公众人物到访', role: '建平中学曾因公开节目合作与校园文化报道获得较高社会关注。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '699.5', scope: '浦东 / 市重', source: SCORE_SOURCE_2025 }
    ],
    sources: [
      { label: '建平中学官网', url: 'https://www.jianping.com.cn/' },
      { label: '建平中学官网-学校介绍', url: 'https://www.jianping.com.cn/web/index1.html?cid=133&id=1411' },
      { label: '建平 80 周年校庆公告公开转载', url: 'https://www.10100.com/article/23988297' }
    ]
  }
};

export function getSchoolRichProfile(schoolId) {
  return CORE_SCHOOL_PROFILES[schoolId] || null;
}

export function getCoreSchoolProfileIds() {
  return Object.keys(CORE_SCHOOL_PROFILES);
}
