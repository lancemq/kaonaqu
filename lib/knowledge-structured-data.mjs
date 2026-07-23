export const knowledgeStructuredPages = {
  index: {
    hero: {
      kicker: '知识体系频道',
      title: '按学段、按年级、按学科查看上海学习内容',
      summary: '从初一到高三，持续整理重点知识点、学习计划、实验内容、例题训练和专题复习入口。进入年级页后，可以继续按学科展开查看。',
      stats: [
        { label: '覆盖学段', value: '2', description: '初中、高中' },
        { label: '年级入口', value: '6', description: '七年级至高三' },
        { label: '学科档案', value: '40+', description: '主学科与高中选科持续补齐' }
      ]
    },
    ribbons: [
      { label: '初中学段', title: '七年级至九年级', description: '建立框架、完成衔接、进入中考导向复习。' },
      { label: '高中学段', title: '高一至高三', description: '从基础搭建走向专题深化，再进入总复习。' },
      { label: '阅读方式', title: '年级总览优先', description: '先看年级页，再进入语数英、理化生等单科学习档案。' }
    ],
    sections: [
      {
        id: 'reading-path',
        kicker: '阅读方法',
        type: 'overviewGrid',
        title: '年级阅读路径',
        cards: [
          { title: '起步阶段', description: '七年级建议先建立主学科框架和稳定的周复盘节奏，不要只盯题量。' },
          { title: '关键过渡', description: '八年级开始出现更明显的综合应用，理化内容和实验要求需要同步跟进。' },
          { title: '冲刺阶段', description: '九年级和高三更强调轮次复习、综合题突破和模考后调整。' },
          { title: '持续使用', description: '先看知识说明，再看例题和实验，最后回到错题整理，复习效率会更高。' }
        ]
      },
      {
        id: 'tips',
        kicker: '路径建议',
        type: 'list',
        title: '学习路径建议',
        items: [
          '初一阶段重在建立学科框架与习惯，避免只做零散题目。',
          '七年级已上线主学科详情页，可用于起步阶段建立学科框架、课堂习惯和复盘方法。',
          '八年级内容可继续用于知识衔接、专题整理与后续复习准备。',
          '高中阶段建议按高一基础、高二深化、高三冲刺三段推进。',
          '高中阶段可先进入对应年级总览，再选择当前要复习的学科专题。'
        ]
      }
    ]
  },
  'grade-8': {
    hero: {
      kicker: '八年级专题页',
      title: '上海八年级重点学科内容总览',
      summary: '八年级是从基础掌握走向综合应用的关键阶段。本页先给出整体节奏和重点方向，再进入各学科页查看知识点、实验、例题和学习计划。',
      stats: [
        { label: '重点学科', value: '7', description: '语数英理化史道法' },
        { label: '优先模块', value: '理化', description: '实验、例题和学习计划更完整' },
        { label: '当前目标', value: '过渡年', description: '为九年级复习提前搭框架' }
      ]
    },
    header: {
      title: '先搭结构，再按学科深入复习',
      description: '建议先用本页判断当前要补哪一门学科，再进入对应页面查看详细知识说明、关键点、易错点、实验要求和例题训练。',
      actions: [
        { label: '查看物理学习计划', href: '/knowledge/physics-grade8#physics-study-plan' },
        { label: '查看考试新闻政策', href: '/news' }
      ]
    },
    ribbons: [
      { label: '学科入口', title: '先看结构', description: '从本页进入单科页，先判断知识结构，再做题。' },
      { label: '复习顺序', title: '理化优先', description: '物理和化学建议先完成知识框架、实验和例题梳理。' },
      { label: '阶段任务', title: '衔接九年级', description: '八年级末要形成稳定的章节清单、错题清单和实验清单。' }
    ],
    sections: [
      {
        id: 'grade8-subjects',
        type: 'cardGrid',
        title: '八年级学科目录',
        cards: [
          { title: '语文', href: '/knowledge/chinese-grade8', description: '古诗文阅读、现代文阅读、写作技巧' },
          { title: '数学', href: '/knowledge/math-grade8', description: '几何代数、函数、方程与不等式' },
          { title: '英语', href: '/knowledge/english-grade8', description: '语法词汇、阅读理解、写作范文' },
          { title: '物理', href: '/knowledge/physics-grade8', description: '声、光、运动、力、压强浮力、简单机械与热现象' },
          { title: '化学', href: '/knowledge/chemistry-grade8', description: '化学入门、实验基础、空气氧气、水与微粒观、化学用语' },
          { title: '历史', href: '/knowledge/history-grade8', description: '中国近现代史、世界古代史' },
          { title: '道德与法治', href: '/knowledge/politics-grade8', description: '法治教育、公民素养、责任担当' }
        ]
      },
      {
        id: 'grade8-focus',
        type: 'overviewGrid',
        title: '八年级复习重点板块',
        cards: [
          { title: '语数英', description: '保持基础题稳定，同时逐步增加阅读、表达和综合应用训练，不要只刷单一题型。' },
          { title: '物理', description: '围绕教材章节建立概念、规律、实验和例题四条线，尤其重视测量、运动和力、压强浮力。' },
          { title: '化学', description: '重点整理实验操作、空气与水、微粒观、化学用语和质量守恒，注意现象与结论区分。' },
          { title: '历史与道法', description: '适合用专题小结和时政、史实结合的方法复盘，避免只看知识点不做表达训练。' }
        ]
      },
      {
        id: 'grade8-method',
        type: 'list',
        title: '八年级使用方式',
        items: [
          '先进入学科页查看“知识点 + 典型例题 + 资料入口”，再回到本页安排复习顺序。',
          '建议每个学科保留一份“章节重点 + 典型例题 + 错题”三栏清单。',
          '物理适合按专题滚动复盘，化学适合边做实验现象归纳边记化学用语。'
        ]
      },
      {
        id: 'grade8-tips',
        type: 'list',
        title: '八年级学习建议',
        items: [
          '八年级是从“基础掌握”过渡到“综合应用”的关键阶段，建议固定每周复盘一次。',
          '使用本页时优先点进学科页，不要只停留在入口卡片层。',
          '如果准备向九年级过渡，可先搭建各学科知识结构图，便于后续总复习接续。'
        ]
      }
    ]
  },
  'grade-7': {
    hero: {
      kicker: '七年级专题页',
      title: '上海七年级重点学科内容总览',
      summary: '七年级是初中起步阶段，重在夯实基础、培养学习习惯。本页先给出整体节奏，再进入各学科页查看知识点、例题与学习方法。',
      stats: [
        { label: '重点学科', value: '7', description: '语数英理化史道法+科学' },
        { label: '优先模块', value: '习惯', description: '框架、习惯与方法优先于题量' },
        { label: '当前目标', value: '起步', description: '建立主学科框架与复盘节奏' }
      ]
    },
    header: {
      title: '先建立框架，再逐步深入',
      description: '建议先用本页判断当前学科重点，再进入对应页面查看详细知识说明、典型例题和学习方法。',
      actions: [
        { label: '查看物理入门', href: '/knowledge/physics-grade7' },
        { label: '查看考试新闻政策', href: '/news' }
      ]
    },
    ribbons: [
      { label: '学科入口', title: '先看结构', description: '从本页进入单科页，先判断知识结构，再做题。' },
      { label: '复习顺序', title: '语数英优先', description: '语文、数学、英语先稳住基础，再进入物理与科学综合。' },
      { label: '阶段任务', title: '搭框架', description: '七年级末要形成稳定的章节清单与错题清单。' }
    ],
    sections: [
      {
        id: 'grade7-subjects',
        type: 'cardGrid',
        title: '七年级学科目录',
        cards: [
          { title: '语文', href: '/knowledge/chinese-grade7', description: '记叙文、古诗文启蒙、写作训练' },
          { title: '数学', href: '/knowledge/math-grade7', description: '有理数、一元一次方程、几何基础' },
          { title: '英语', href: '/knowledge/english-grade7', description: '词汇积累、语法基础、听力口语' },
          { title: '物理', href: '/knowledge/physics-grade7', description: '科学探究、声光热入门、实验基础' },
          { title: '历史', href: '/knowledge/history-grade7', description: '中国古代史、朝代脉络、文明演进' },
          { title: '道德与法治', href: '/knowledge/politics-grade7', description: '少年生活、规则意识、社会认知' },
          { title: '科学', href: '/knowledge/science-grade7', description: '科学综合、探究方法与跨学科启蒙' }
        ]
      },
      {
        id: 'grade7-focus',
        type: 'overviewGrid',
        title: '七年级复习重点板块',
        cards: [
          { title: '语数英', description: '保持基础题稳定，同步增加阅读、表达和综合应用训练，不要只刷单一题型。' },
          { title: '物理与科学', description: '围绕教材章节建立概念与实验两条线，尤其重视科学探究与测量基础。' },
          { title: '历史与道法', description: '适合用时间线和生活实例帮助理解，避免只背知识点不做表达训练。' }
        ]
      },
      {
        id: 'grade7-method',
        type: 'list',
        title: '七年级使用方式',
        items: [
          '先进入学科页查看“知识点 + 典型例题 + 资料入口”，再回到本页安排复习顺序。',
          '建议每个学科保留一份“章节重点 + 典型例题 + 错题”三栏清单。',
          '物理适合按专题滚动复盘，科学适合用探究实验带动概念理解。'
        ]
      },
      {
        id: 'grade7-tips',
        type: 'list',
        title: '七年级学习建议',
        items: [
          '七年级重在建立学科框架与习惯，避免只做零散题目。',
          '使用本页时优先点进学科页，不要只停留在入口卡片层。',
          '形成稳定的周复盘节奏，为八年级的衔接打好基础。'
        ]
      }
    ]
  },
  'grade-9': {
    hero: {
      kicker: '九年级专题页',
      title: '上海九年级中考复习内容总览',
      summary: '九年级进入中考冲刺阶段，重在系统复习、专题突破与模考订正。本页先给出整体节奏，再进入各学科页查看知识点、例题与冲刺方法。',
      stats: [
        { label: '重点学科', value: '7', description: '语数英理化史道法' },
        { label: '优先模块', value: '综合', description: '专题突破与综合题训练' },
        { label: '当前目标', value: '冲刺', description: '中考导向的系统复习' }
      ]
    },
    header: {
      title: '轮次复习，再按学科突破',
      description: '建议先用本页安排复习轮次，再进入对应页面查看知识说明、典型例题、易错点与冲刺方法。',
      actions: [
        { label: '查看数学压轴路径', href: '/knowledge/math-grade9' },
        { label: '查看考试新闻政策', href: '/news' }
      ]
    },
    ribbons: [
      { label: '学科入口', title: '先看结构', description: '从本页进入单科页，先判断知识结构，再做综合题。' },
      { label: '复习顺序', title: '专题优先', description: '数学压轴、物理综合、化学推断优先安排轮次。' },
      { label: '阶段任务', title: '模考订正', description: '九年级末要重视模考后的错题归因与专题回炉。' }
    ],
    sections: [
      {
        id: 'grade9-subjects',
        type: 'cardGrid',
        title: '九年级学科目录',
        cards: [
          { title: '语文', href: '/knowledge/chinese-grade9', description: '中考阅读、作文、古诗文精讲' },
          { title: '数学', href: '/knowledge/math-grade9', description: '二次函数、圆、综合压轴' },
          { title: '英语', href: '/knowledge/english-grade9', description: '中考听力、阅读写作、真题' },
          { title: '物理', href: '/knowledge/physics-grade9', description: '电学、力学综合、实验探究' },
          { title: '化学', href: '/knowledge/chemistry-grade9', description: '方程式配平、物质推断、计算' },
          { title: '历史', href: '/knowledge/history-grade9', description: '中考专题、材料分析' },
          { title: '道德与法治', href: '/knowledge/politics-grade9', description: '中考时政、答题模板' }
        ]
      },
      {
        id: 'grade9-focus',
        type: 'overviewGrid',
        title: '九年级复习重点板块',
        cards: [
          { title: '语数英', description: '保持基础题稳定，增加综合题与真题训练，作文和阅读要形成稳定输出模板。' },
          { title: '物理', description: '围绕电学、力学综合与实验探究做专题突破，重视过程表述与计算规范。' },
          { title: '化学', description: '重点整理方程式配平、物质推断与计算，注意实验现象与结论区分。' },
          { title: '历史与道法', description: '用专题小结和时政、史实结合的方法复盘，强化材料分析与答题模板。' }
        ]
      },
      {
        id: 'grade9-method',
        type: 'list',
        title: '九年级使用方式',
        items: [
          '先用本页安排“基础回炉 → 专题突破 → 模考订正”三轮复习。',
          '进入学科页后优先做典型例题与易错点清单，再回到真题综合。',
          '每轮复习后做错题归因，把重复错误对应的知识点回炉重练。'
        ]
      },
      {
        id: 'grade9-tips',
        type: 'list',
        title: '九年级学习建议',
        items: [
          '九年级是中考冲刺阶段，建议固定每周模考与订正节奏。',
          '使用本页时优先点进学科页，不要只停留在入口卡片层。',
          '临近中考以综合题和真题为主，保持基础题的稳定正确率。'
        ]
      }
    ]
  },
  'senior-1': {
    hero: {
      kicker: '高一专题页',
      title: '上海高一重点学科内容总览',
      summary: '高一重在适应高中节奏、完成初高衔接，为选科和等级考打基础。本页先给出整体节奏，再进入各学科页查看知识点、例题与学习方法。',
      stats: [
        { label: '重点学科', value: '6', description: '语数英物化生' },
        { label: '优先模块', value: '衔接', description: '初高衔接与体系搭建' },
        { label: '当前目标', value: '基础', description: '建立高中学习体系' }
      ]
    },
    header: {
      title: '完成衔接，搭建体系',
      description: '建议先用本页判断学科重点，再进入对应页面查看知识说明、典型例题和学习方法。',
      actions: [
        { label: '查看物理基础', href: '/knowledge/physics-senior1' },
        { label: '查看考试新闻政策', href: '/news' }
      ]
    },
    ribbons: [
      { label: '学科入口', title: '先看结构', description: '从本页进入单科页，先判断知识结构，再做题。' },
      { label: '复习顺序', title: '基础优先', description: '函数、力与运动等基础模块先打牢。' },
      { label: '阶段任务', title: '搭体系', description: '高一末要形成稳定的章节清单与错题清单。' }
    ],
    sections: [
      {
        id: 'senior1-subjects',
        type: 'cardGrid',
        title: '高一学科目录',
        cards: [
          { title: '语文', href: '/knowledge/chinese-senior1', description: '必修篇目、文言文、写作' },
          { title: '数学', href: '/knowledge/math-senior1', description: '函数、立体几何、集合逻辑' },
          { title: '英语', href: '/knowledge/english-senior1', description: '语法体系、阅读理解、写作' },
          { title: '物理', href: '/knowledge/physics-senior1', description: '运动、力、牛顿定律' },
          { title: '化学', href: '/knowledge/chemistry-senior1', description: '物质的量、氧化还原、实验' },
          { title: '生物', href: '/knowledge/biology-senior1', description: '细胞、遗传基础、生态' }
        ]
      },
      {
        id: 'senior1-focus',
        type: 'overviewGrid',
        title: '高一复习重点板块',
        cards: [
          { title: '语数英', description: '保持基础题稳定，同步增加阅读、表达和综合应用训练，适应高中难度。' },
          { title: '物化生', description: '围绕教材章节建立概念、规律与实验三条线，尤其重视力学与物质的量。' }
        ]
      },
      {
        id: 'senior1-method',
        type: 'list',
        title: '高一使用方式',
        items: [
          '先进入学科页查看“知识点 + 典型例题 + 资料入口”，再回到本页安排复习顺序。',
          '建议每个学科保留一份“章节重点 + 典型例题 + 错题”三栏清单。',
          '物理适合按专题滚动复盘，化学适合边做实验现象归纳边记化学用语。'
        ]
      },
      {
        id: 'senior1-tips',
        type: 'list',
        title: '高一学习建议',
        items: [
          '高一重在完成初高衔接与习惯养成，避免只做零散题目。',
          '使用本页时优先点进学科页，不要只停留在入口卡片层。',
          '提前了解选科要求，为高二专题深化和高三冲刺做准备。'
        ]
      }
    ]
  },
  'senior-2': {
    hero: {
      kicker: '高二专题页',
      title: '上海高二重点学科内容总览',
      summary: '高二重在专题深化、确定选科组合，并为高三前置准备。本页先给出整体节奏，再进入各学科页查看知识点、例题与学习方法。',
      stats: [
        { label: '重点学科', value: '6', description: '语数英物化生' },
        { label: '优先模块', value: '专题', description: '专题深化与选科推进' },
        { label: '当前目标', value: '深化', description: '确定选科并深化学习' }
      ]
    },
    header: {
      title: '专题深化，推进选科',
      description: '建议先用本页安排专题复习，再进入对应页面查看知识说明、典型例题与深化方法。',
      actions: [
        { label: '查看数学专题', href: '/knowledge/math-senior2' },
        { label: '查看考试新闻政策', href: '/news' }
      ]
    },
    ribbons: [
      { label: '学科入口', title: '先看结构', description: '从本页进入单科页，先判断知识结构，再做专题。' },
      { label: '复习顺序', title: '专题优先', description: '导数、电磁学、有机化学等专题优先安排。' },
      { label: '阶段任务', title: '选科推进', description: '高二末要确定选科组合，明确高三方向。' }
    ],
    sections: [
      {
        id: 'senior2-subjects',
        type: 'cardGrid',
        title: '高二学科目录',
        cards: [
          { title: '语文', href: '/knowledge/chinese-senior2', description: '选择性必修、古诗文、写作' },
          { title: '数学', href: '/knowledge/math-senior2', description: '导数、数列、圆锥曲线' },
          { title: '英语', href: '/knowledge/english-senior2', description: '概要写作、翻译、阅读' },
          { title: '物理', href: '/knowledge/physics-senior2', description: '电磁学、光学、近代物理' },
          { title: '化学', href: '/knowledge/chemistry-senior2', description: '反应原理、有机化学、实验' },
          { title: '生物', href: '/knowledge/biology-senior2', description: '遗传变异、稳态调节、生态' }
        ]
      },
      {
        id: 'senior2-focus',
        type: 'overviewGrid',
        title: '高二复习重点板块',
        cards: [
          { title: '语数英', description: '在基础之上做专题深化，作文与阅读形成稳定高分模板。' },
          { title: '物化生', description: '围绕专题建立概念网络，电磁学、有机化学与遗传变异是重点。' }
        ]
      },
      {
        id: 'senior2-method',
        type: 'list',
        title: '高二使用方式',
        items: [
          '先进入学科页查看“知识点 + 典型例题 + 资料入口”，再回到本页安排专题顺序。',
          '建议每个学科保留一份“专题重点 + 典型例题 + 错题”三栏清单。',
          '确定选科组合后，对非选考科目转为合格考导向的复习。'
        ]
      },
      {
        id: 'senior2-tips',
        type: 'list',
        title: '高二学习建议',
        items: [
          '高二重在专题深化与选科推进，避免平均用力。',
          '使用本页时优先点进学科页，不要只停留在入口卡片层。',
          '为高三冲刺提前搭好专题框架与错题体系。'
        ]
      }
    ]
  },
  'senior-3': {
    hero: {
      kicker: '高三专题页',
      title: '上海高三高考复习内容总览',
      summary: '高三进入高考冲刺，重在轮次复习、模考订正与志愿填报指导。本页先给出整体节奏，再进入各学科页查看知识点、例题与冲刺方法。',
      stats: [
        { label: '重点学科', value: '6', description: '语数英物化生' },
        { label: '优先模块', value: '综合', description: '轮次复习与综合突破' },
        { label: '当前目标', value: '冲刺', description: '高考导向系统复习' }
      ]
    },
    header: {
      title: '轮次复习，综合突破',
      description: '建议先用本页安排复习轮次，再进入对应页面查看知识说明、典型例题与冲刺方法。',
      actions: [
        { label: '查看数学压轴', href: '/knowledge/math-senior3' },
        { label: '查看考试新闻政策', href: '/news' }
      ]
    },
    ribbons: [
      { label: '学科入口', title: '先看结构', description: '从本页进入单科页，先判断知识结构，再做综合题。' },
      { label: '复习顺序', title: '专题优先', description: '压轴题、实验综合与有机推断优先安排轮次。' },
      { label: '阶段任务', title: '模考订正', description: '高三末要重视模考后的错题归因与志愿信息收集。' }
    ],
    sections: [
      {
        id: 'senior3-subjects',
        type: 'cardGrid',
        title: '高三学科目录',
        cards: [
          { title: '语文', href: '/knowledge/chinese-senior3', description: '高考专题、作文、古诗文' },
          { title: '数学', href: '/knowledge/math-senior3', description: '高考综合、压轴突破、真题' },
          { title: '英语', href: '/knowledge/english-senior3', description: '高考听力、阅读、写作' },
          { title: '物理', href: '/knowledge/physics-senior3', description: '高考综合、实验、压轴' },
          { title: '化学', href: '/knowledge/chemistry-senior3', description: '高考综合、有机推断、实验' },
          { title: '生物', href: '/knowledge/biology-senior3', description: '高考综合、遗传、实验' }
        ]
      },
      {
        id: 'senior3-focus',
        type: 'overviewGrid',
        title: '高三复习重点板块',
        cards: [
          { title: '语数英', description: '保持基础题稳定，增加综合题与真题训练，作文和阅读要形成稳定输出模板。' },
          { title: '物化生', description: '围绕高考综合题做专题突破，重视实验表述、有机推断与遗传计算。' }
        ]
      },
      {
        id: 'senior3-method',
        type: 'list',
        title: '高三使用方式',
        items: [
          '先用本页安排“基础回炉 → 专题突破 → 模考订正”三轮复习。',
          '进入学科页后优先做典型例题与易错点清单，再回到真题综合。',
          '每轮复习后做错题归因，把重复错误对应的知识点回炉重练。'
        ]
      },
      {
        id: 'senior3-tips',
        type: 'list',
        title: '高三学习建议',
        items: [
          '高三是高考冲刺阶段，建议固定每周模考与订正节奏。',
          '使用本页时优先点进学科页，不要只停留在入口卡片层。',
          '临近高考以综合题和真题为主，同时保持基础题的稳定正确率。'
        ]
      }
    ]
  }
};
