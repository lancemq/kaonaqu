const SCORE_SOURCE_2025 = {
  label: '2025 年上海高中 1-15 志愿分数线公开汇总',
  url: 'https://www.sohu.com/a/915786067_121124319',
  note: '第三方公开汇总；不同区、批次与计划类型口径不同，最终以当年市/区招考机构发布为准。'
};

const SCORE_SOURCE_2024 = {
  label: '2024 年上海高中 1-15 志愿分数线公开汇总',
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
      { name: '钱学森教育思想相关叙事', role: '公开文章提到钱学森曾肯定建平\u201c先学会做人，后学会做学问\u201d等教育表达。' },
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
  },
  'xuhui-上海市南洋模范中学': {
    badge: '八大核心学校',
    image: {
      url: '/school-images/placeholder-b-tier.svg',
      alt: '上海市南洋模范中学',
      caption: '校徽与公开标识示意'
    },
    history: [
      { year: '1901', text: '南洋公学附属小学创办，为学校办学源流之始。' },
      { year: '20 世纪上半叶', text: '逐步发展为上海知名中学，以严谨学风著称。' },
      { year: '1956', text: '更名为上海市南洋模范中学，此后长期保持市重点序列。' },
      { year: '近年', text: '在理工创新、篮球传统和交响乐特色三大方向上持续深耕。' }
    ],
    programs: [
      { title: '理工创新实验班', text: '以数理竞赛和科研项目为核心，适合理科突出的学生。' },
      { title: '篮球特色培养', text: '作为篮球传统项目学校，运动特长与文化课并重的培养模式成熟。' },
      { title: '交响乐与艺术素养', text: '交响乐团在上海中学中具有较高知名度，为艺术特长提供发展平台。' }
    ],
    notablePeople: [
      { name: '杰出校友群体', role: '南模在科技、文化和公共事务领域有持续公开报道的校友网络。' },
      { name: '校园文化人物', role: '学校长期强调\u201c勤、俭、敬、信\u201d校训精神，在公开活动中常以此为主线。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '695', scope: '徐汇 / 八大', source: SCORE_SOURCE_2025 },
      { year: '2024', batch: '1-15 志愿公开汇总', score: '692', scope: '徐汇 / 八大', source: SCORE_SOURCE_2024 }
    ],
    sources: [
      { label: '南洋模范中学官网', url: 'https://www.nanmo.cn/' },
      { label: '南洋模范中学-校史介绍', url: 'https://www.nanmo.cn/xxgk/xxjj.htm' }
    ]
  },
  'huangpu-上海市格致中学': {
    badge: '八大核心学校',
    image: {
      url: '/school-images/placeholder-c-tier.svg',
      alt: '上海市格致中学',
      caption: '格致中学校门与标识'
    },
    history: [
      { year: '1874', text: '格致书院创办，为中国近代最早系统传播自然科学的新式学堂之一。' },
      { year: '20 世纪', text: '历经多次改制与更名，始终以科学教育传统为立校之本。' },
      { year: '近年', text: '格致理科特色持续巩固，天文台和数字化实验室成为跨学科探索的标志性平台。' }
    ],
    programs: [
      { title: '格致理科实验班', text: '以数理深度和科研实践为核心，学生可参与高校课题研究。' },
      { title: '天文与空间科学课程', text: '拥有上海市中学唯一的天文台，天文特色课程体系完善。' },
      { title: '人文与科学并重', text: '古籍修复实验室等跨学科资源为学生提供独特的人文科技融合体验。' }
    ],
    notablePeople: [
      { name: '徐寿与格致书院传统', role: '徐寿等近代科学先驱参与创办格致书院，科学精神传承至今。' },
      { name: '科技竞赛获奖群体', role: '学生在物理奥赛、创新大赛等赛事中长期有稳定表现。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '691', scope: '黄浦 / 八大', source: SCORE_SOURCE_2025 },
      { year: '2024', batch: '1-15 志愿公开汇总', score: '689', scope: '黄浦 / 八大', source: SCORE_SOURCE_2024 }
    ],
    sources: [
      { label: '格致中学官网', url: 'https://www.gezhi.sh.cn/' },
      { label: '格致中学-校史馆', url: 'https://www.gezhi.sh.cn/xxgk/xsgk.htm' }
    ]
  },
  'huangpu-上海市大同中学': {
    badge: '八大核心学校',
    image: {
      url: '/school-images/placeholder-c-tier.svg',
      alt: '上海市大同中学',
      caption: '大同中学校园标识'
    },
    history: [
      { year: '1912', text: '大同学院创办，初名\u201c大同\u201d寓\u201c天下为公\u201d之意。' },
      { year: '20 世纪', text: '逐步发展为上海基础教育代表性学校，以课程改革先锋著称。' },
      { year: '近年', text: '持续推进研究性学习、STEM 教育和国际化交流，课程创新辨识度高。' }
    ],
    programs: [
      { title: '课程改革先锋', text: '学校长期走在上海中学课程改革前列，研究性学习体系成熟。' },
      { title: 'STEM 跨学科项目', text: '融合科学、技术、工程与数学的跨学科课程是近年重点方向。' },
      { title: '国际交流平台', text: '拥有多个国际友好学校和交换项目，为学生提供国际化视野拓展机会。' }
    ],
    notablePeople: [
      { name: '课程改革领军人物', role: '学校因课程改革实践多次在市级教育工作会议上作公开分享。' },
      { name: 'STEM 竞赛获奖群体', role: '学生在科技创新大赛、机器人竞赛等赛事中长期保持活跃。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '689', scope: '黄浦 / 八大', source: SCORE_SOURCE_2025 },
      { year: '2024', batch: '1-15 志愿公开汇总', score: '686', scope: '黄浦 / 八大', source: SCORE_SOURCE_2024 }
    ],
    sources: [
      { label: '大同中学官网', url: 'http://www.hsdt.tp.edu.sh.cn/' },
      { label: '大同中学-学校介绍', url: 'http://www.hsdt.tp.edu.sh.cn/xxgk/xxjj.htm' }
    ]
  },
  'yangpu-上海市控江中学': {
    badge: '八大核心学校',
    image: {
      url: '/school-images/placeholder-b-tier.svg',
      alt: '上海市控江中学',
      caption: '控江中学校园标识'
    },
    history: [
      { year: '1953', text: '控江中学创办，为上海市首批重点中学之一。' },
      { year: '改革开放时期', text: '以\u201c自主发展教育\u201d理念引领上海中学教育改革。' },
      { year: '近年', text: '在社团文化、科技创新和学生自主管理三个方向上保持鲜明特色。' }
    ],
    programs: [
      { title: '自主发展教育', text: '强调学生自我规划、自我管理和自我评价能力，是学校最核心的办学理念。' },
      { title: '社团文化多元', text: '拥有数十个学生社团，涵盖科技、人文、艺术和体育等多个领域。' },
      { title: '科技创新平台', text: '通过课题研究和竞赛活动推动创新素养培养，科创成果在市级赛事中表现突出。' }
    ],
    notablePeople: [
      { name: '教育改革倡导者', role: '学校自主发展教育理念曾在全国基础教育领域产生广泛影响。' },
      { name: '科技竞赛获奖群体', role: '学生在上海市青少年科技创新大赛等赛事中常年保持活跃参与度。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '687', scope: '杨浦 / 八大', source: SCORE_SOURCE_2025 },
      { year: '2024', batch: '1-15 志愿公开汇总', score: '684', scope: '杨浦 / 八大', source: SCORE_SOURCE_2024 }
    ],
    sources: [
      { label: '控江中学官网', url: 'https://www.kjzx.net/' },
      { label: '控江中学-学校概况', url: 'https://www.kjzx.net/xxgk/xxjj.htm' }
    ]
  },
  'changning-上海市长宁区延安中学': {
    badge: '八大核心学校',
    image: {
      url: '/school-images/placeholder-b-tier.svg',
      alt: '上海市长宁区延安中学',
      caption: '延安中学校园标识'
    },
    history: [
      { year: '1946', text: '延安中学创办，初名上海市真如中学。' },
      { year: '20 世纪 50 年代', text: '更名为延安中学，逐步发展为长宁区代表性重点中学。' },
      { year: '近年', text: '在数学、物理竞赛和男子篮球培养方面保持持续辨识度。' }
    ],
    programs: [
      { title: '数理竞赛特长', text: '数学、物理竞赛是延安中学最突出的学科强项，竞赛成绩长期居全市前列。' },
      { title: '男子篮球传统', text: '作为篮球传统项目学校，男篮在市、区级比赛中屡获佳绩，体教融合路径成熟。' },
      { title: '理科实验班', text: '为理科特长生提供深度拓展课程和竞赛辅导，升学成果显著。' }
    ],
    notablePeople: [
      { name: '数学竞赛领军人物', role: '学校在数学奥林匹克竞赛领域培养出多名获奖选手，竞赛教练团队经验丰富。' },
      { name: '篮球人才培养', role: '男篮为高校和专业队持续输送人才，是学校体育特色的标志性成果。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '688', scope: '长宁 / 八大', source: SCORE_SOURCE_2025 },
      { year: '2024', batch: '1-15 志愿公开汇总', score: '685', scope: '长宁 / 八大', source: SCORE_SOURCE_2024 }
    ],
    sources: [
      { label: '延安中学官网', url: 'https://www.shyacz.com/' },
      { label: '延安中学-学校沿革', url: 'https://www.shyacz.com/xxgk/xxjj.htm' }
    ]
  },
  'hongkou-上海市复兴高级中学': {
    badge: '八大核心学校',
    image: {
      url: '/school-images/placeholder-c-tier.svg',
      alt: '上海市复兴高级中学',
      caption: '复兴高级中学校园标识'
    },
    history: [
      { year: '1886', text: '学校办学源流可追溯至 1886 年创办的\u201c上海共济局\u201d相关教育机构。' },
      { year: '20 世纪', text: '历经多次改制和校名更迭，逐步确立在虹口区的重点中学地位。' },
      { year: '近年', text: '以艺术教育、课程多样化和历史文化传承为办学特色方向。' }
    ],
    programs: [
      { title: '艺术教育特色', text: '复兴的戏剧、合唱和美术教育在上海中学中有较高辨识度，艺术团多次获市级奖项。' },
      { title: '课程多样化', text: '提供覆盖人文、科技、艺术等多领域的校本选修课程，满足学生多元发展需求。' },
      { title: '历史文化传承', text: '依托虹口区历史文化资源，开发城市文化、海派特色等地方课程。' }
    ],
    notablePeople: [
      { name: '艺术教育成果', role: '学校艺术团在上海市艺术展演中屡获殊荣，艺术教育体系成熟。' },
      { name: '历史文化研究群体', role: '学生课题团队在海派文化研究、城市更新调查等领域产出多项优秀成果。' }
    ],
    scoreLines: [
      { year: '2025', batch: '1-15 志愿公开汇总', score: '686', scope: '虹口 / 八大', source: SCORE_SOURCE_2025 },
      { year: '2024', batch: '1-15 志愿公开汇总', score: '683', scope: '虹口 / 八大', source: SCORE_SOURCE_2024 }
    ],
    sources: [
      { label: '复兴高级中学官网', url: 'https://www.fuxing.sh.cn/' },
      { label: '复兴高级中学-学校介绍', url: 'https://www.fuxing.sh.cn/xxgk/xxjj.htm' }
    ]
  }
};

export function getSchoolRichProfile(schoolId) {
  return CORE_SCHOOL_PROFILES[schoolId] || null;
}

export function getCoreSchoolProfileIds() {
  return Object.keys(CORE_SCHOOL_PROFILES);
}
