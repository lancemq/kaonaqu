// 知识自测题库（轻量、零后端）
//
// 按 slug 提供选择题。每题：
//   { id, question, options:[...], answer: <正确选项下标>, explanation, difficulty? }
// 错题本由前端组件基于 localStorage 维护，本模块只负责提供题目。
// 题目依据上海初中/高中课程标准编写，仅作知识点自测，不替代官方练习。

const QUIZZES = {
  'math-grade9': [
    {
      id: 'mg9-1',
      question: '二次函数 y = ax² + bx + c（a ≠ 0）的顶点横坐标公式是？',
      options: ['x = -b/(2a)', 'x = b/(2a)', 'x = -c/(2a)', 'x = -b/a'],
      answer: 0,
      explanation: '由配方法 y = a(x + b/(2a))² + … 可得顶点横坐标为 x = -b/(2a)。',
      difficulty: 2
    },
    {
      id: 'mg9-2',
      question: '若关于 x 的一元二次方程 ax² + bx + c = 0 有两个相等实根，则判别式满足？',
      options: ['Δ > 0', 'Δ = 0', 'Δ < 0', 'Δ 无意义'],
      answer: 1,
      explanation: 'Δ = b² - 4ac；两个相等实根 ⇔ Δ = 0。',
      difficulty: 1
    },
    {
      id: 'mg9-3',
      question: '圆的标准方程为 (x-a)² + (y-b)² = r²，其中 r 表示？',
      options: ['圆心横坐标', '圆心纵坐标', '半径', '直径'],
      answer: 2,
      explanation: 'r 为圆的半径，(a, b) 为圆心坐标。',
      difficulty: 1
    }
  ],
  'physics-senior1': [
    {
      id: 'ps1-1',
      question: '牛顿第二定律的表达式（合力与加速度关系）是？',
      options: ['F = ma', 'F = mv', 'F = m/a', 'F = mgh'],
      answer: 0,
      explanation: '牛顿第二定律：物体加速度与合力成正比、与质量成反比，F合 = ma。',
      difficulty: 1
    },
    {
      id: 'ps1-2',
      question: '一物体做匀速直线运动时，其受力情况是？',
      options: ['受非零合力', '合力为零', '只受重力', '只受摩擦力'],
      answer: 1,
      explanation: '匀速直线运动（含静止）属于平衡状态，合力为零。',
      difficulty: 1
    },
    {
      id: 'ps1-3',
      question: '自由落体运动的加速度 g 在地球上约为？',
      options: ['9.8 m/s²', '3.0×10⁸ m/s', '6.6×10⁻³⁴ J·s', '1.6×10⁻¹⁹ C'],
      answer: 0,
      explanation: '地球表面附近自由落体加速度 g ≈ 9.8 m/s²（常取 10 m/s² 估算）。',
      difficulty: 1
    }
  ],
  'chemistry-senior2': [
    {
      id: 'cs2-1',
      question: '有机化合物中官能团“羟基”的结构简式是？',
      options: ['-COOH', '-OH', '-CHO', '-NH₂'],
      answer: 1,
      explanation: '羟基为 -OH；-COOH 是羧基，-CHO 是醛基，-NH₂ 是氨基。',
      difficulty: 2
    },
    {
      id: 'cs2-2',
      question: '甲烷（CH₄）与氯气在光照下发生的主要反应类型是？',
      options: ['加成反应', '取代反应', '消去反应', '加聚反应'],
      answer: 1,
      explanation: '甲烷的氢被氯原子逐步取代，属于自由基取代反应。',
      difficulty: 2
    },
    {
      id: 'cs2-3',
      question: '乙醇的结构简式是？',
      options: ['CH₃COOH', 'CH₃CH₂OH', 'CH₃CHO', 'CH₃OCH₃'],
      answer: 1,
      explanation: '乙醇为 CH₃CH₂OH；CH₃COOH 是乙酸，CH₃CHO 是乙醛，CH₃OCH₃ 是二甲醚。',
      difficulty: 1
    }
  ],
  'grade-9': [
    {
      id: 'g9-1',
      question: '上海中考总分（满分）通常为？',
      options: ['750 分', '630 分', '800 分', '600 分'],
      answer: 0,
      explanation: '上海中考满分一般为 750 分（语数英各 150 + 综合测试 150 + 道德与法治 60 + 历史 60 + 体育 30，折算后合计 750）。具体以当年官方公布为准。',
      difficulty: 1
    },
    {
      id: 'g9-2',
      question: '下列物理量中，国际单位制基本单位的是？',
      options: ['牛顿', '焦耳', '千克', '瓦特'],
      answer: 2,
      explanation: '千克是质量的基本单位；牛顿、焦耳、瓦特均为导出单位。',
      difficulty: 2
    },
    {
      id: 'g9-3',
      question: '化学中“质量守恒定律”指的是？',
      options: [
        '反应前后物质种类不变',
        '反应前后总质量不变',
        '反应前后体积不变',
        '反应前后分子数不变'
      ],
      answer: 1,
      explanation: '参加反应的各物质质量总和等于生成的各物质质量总和。',
      difficulty: 1
    }
  ],
  'senior-3': [
    {
      id: 's3-1',
      question: '上海高考“3+3”模式中，选考科目（等级考）一般有几门？',
      options: ['1 门', '3 门', '6 门', '不限'],
      answer: 1,
      explanation: '“3+3”指语文、数学、外语 3 门统考 + 从 6 门等级考科目中自主选择 3 门。',
      difficulty: 1
    },
    {
      id: 's3-2',
      question: '下列属于高校“综合评价”录取特点的是？',
      options: [
        '只看高考总分',
        '综合高考、校测与学业水平等多元评价',
        '仅需合格考通过',
        '仅面向艺术特长生'
      ],
      answer: 1,
      explanation: '综合评价按高考成绩、校测（面试/笔试）与高中学业水平等综合折算录取，路径多元。',
      difficulty: 2
    }
  ],
  'zhongkao-zhenti': [
    {
      id: 'zkz-1',
      question: '跨学科案例分析题（综合测试中的 15 分题）常见答题结构是？',
      options: [
        '现象—原因—对策',
        '定义—举例—联想',
        '背诵—默写—套用',
        '计算—作图—说明'
      ],
      answer: 0,
      explanation: '跨学科案例多以真实情境切入，建议用“现象描述—原因分析—解决对策”的结构组织答案。',
      difficulty: 2
    },
    {
      id: 'zkz-2',
      question: '上海中考体育与健身科目满分约为？',
      options: ['30 分', '15 分', '50 分', '60 分'],
      answer: 0,
      explanation: '体育与健身科目平时考核与统一测试合计一般约 30 分，具体以当年政策为准。',
      difficulty: 1
    }
  ]
};

export function getQuizzesForSlug(slug) {
  if (!slug) return [];
  return QUIZZES[slug] || [];
}
