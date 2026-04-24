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
      ],
      routes: [
        { label: '起步', title: '七年级学习框架', href: '/knowledge/grade-7', description: '先搭语数英和科学综合的基础清单。' },
        { label: '重点', title: '八年级理化衔接', href: '/knowledge/grade-8', description: '从物理、化学实验和例题开始做结构化复盘。' },
        { label: '高中', title: '高中三段路径', href: '/knowledge/senior-1', description: '按高一基础、高二专题、高三冲刺逐步进入。' }
      ]
    },
    leadCards: [
      {
        title: '如何使用知识体系',
        description: '先进入对应年级判断阶段任务，再切到单科学习说明。复习时建议固定使用“章节重点 + 典型例题 + 错题原因”三栏方式。'
      },
      {
        title: '当前阅读方式',
        list: [
          '先选学段，快速判断当前阶段的核心任务。',
          '再进年级页，按学科挑选要复习的专题。',
          '最后进入单科页，针对知识点、实验和例题做深入训练。'
        ]
      }
    ],
    ribbons: [
      { label: '初中学段', title: '七年级至九年级', description: '建立框架、完成衔接、进入中考导向复习。' },
      { label: '高中学段', title: '高一至高三', description: '从基础搭建走向专题深化，再进入总复习。' },
      { label: '阅读方式', title: '年级总览优先', description: '先看年级页，再进入语数英、理化生等单科学习档案。' }
    ],
    sections: [
      {
        id: 'junior',
        type: 'cardGrid',
        title: '初中学段',
        cards: [
          { title: '七年级', status: '已上线', href: '/knowledge/grade-7', description: '已补充语文、数学、英语、科学与综合入口，适合先建立主学科框架和周复盘节奏。' },
          { title: '八年级', status: '已上线', href: '/knowledge/grade-8', description: '涵盖主要学科知识点与学习计划，理化内容、实验与例题组织更完整。' },
          { title: '九年级', status: '已上线', href: '/knowledge/grade-9', description: '中考复习、专题突破、模考订正和各学科冲刺内容已上线。' }
        ]
      },
      {
        id: 'high-school',
        type: 'cardGrid',
        title: '高中学段',
        cards: [
          { title: '高一', status: '已上线', href: '/knowledge/senior-1', description: '已补充语数英和物化生学科详情页，适合完成初高衔接和高中学习体系搭建。' },
          { title: '高二', status: '已上线', href: '/knowledge/senior-2', description: '已补充语数英和物化生学科详情页，适合进行专题深化、选科推进和高三前置准备。' },
          { title: '高三', status: '已上线', href: '/knowledge/senior-3', description: '已补充语数英和物化生学科详情页，适合进行轮次复习、模考订正和考前收口。' }
        ]
      },
      {
        id: 'reading-path',
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
  }
};
