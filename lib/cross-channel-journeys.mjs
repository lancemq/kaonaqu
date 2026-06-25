function toTimestamp(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function normalizeSchoolName(name) {
  return String(name || '')
    .replace(/[（(].*?[)）]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function getKnowledgeContext(slug = '') {
  const subjectMatch = String(slug).match(/^([a-z]+)-grade(\d)$/);
  if (subjectMatch) {
    return { subject: subjectMatch[1], grade: Number(subjectMatch[2]), kind: 'subject' };
  }

  const gradeMatch = String(slug).match(/^grade-(\d)$/);
  if (gradeMatch) {
    return { subject: null, grade: Number(gradeMatch[1]), kind: 'grade' };
  }

  return { subject: null, grade: null, kind: slug === 'index' ? 'channel' : 'other' };
}

const SUBJECT_META = {
  chinese: { label: '语文', keywords: ['语文', '作文', '阅读', '古诗文', '文言文'] },
  math: { label: '数学', keywords: ['数学', '函数', '几何', '代数', '压轴'] },
  english: { label: '英语', keywords: ['英语', '阅读', '完形', '写作', '语法'] },
  physics: { label: '物理', keywords: ['物理', '力学', '电学', '实验'] },
  chemistry: { label: '化学', keywords: ['化学', '实验', '酸碱盐', '方程式'] },
  history: { label: '历史', keywords: ['历史', '材料题', '近代史', '时序'] },
  politics: { label: '道德与法治', keywords: ['道德与法治', '法治', '时政', '责任'] }
};

function scoreKnowledgeNewsItem(item, context) {
  const text = normalizeText(`${item.title} ${item.summary} ${item.content}`);
  let score = 0;

  if (context.grade >= 8 && item.examType === 'zhongkao') score += 5;
  if (item.newsType === 'policy' || item.newsType === 'admission') score += 2;
  if (context.grade === 9 && /(中考|招生|志愿|复习|模考)/.test(text)) score += 4;

  const subjectMeta = SUBJECT_META[context.subject];
  if (subjectMeta) {
    for (const keyword of subjectMeta.keywords) {
      if (text.includes(keyword)) score += 3;
    }
  }

  return score;
}

function selectKnowledgeNews(news = [], context) {
  const scored = news
    .map((item) => ({ item, score: scoreKnowledgeNewsItem(item, context) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || toTimestamp(right.item.updatedAt || right.item.publishedAt) - toTimestamp(left.item.updatedAt || left.item.publishedAt))
    .slice(0, 3)
    .map(({ item }) => ({
      href: `/news/${item.id}`,
      title: item.title,
      description: item.summary || '政策重点与后续安排。',
      meta: item.category || item.newsType || '新闻政策'
    }));

  if (scored.length) return scored;

  return news
    .filter((item) => item.examType === 'zhongkao' || item.newsType === 'policy' || item.newsType === 'admission')
    .sort((left, right) => toTimestamp(right.updatedAt || right.publishedAt) - toTimestamp(left.updatedAt || left.publishedAt))
    .slice(0, 3)
    .map((item) => ({
      href: `/news/${item.id}`,
      title: item.title,
      description: item.summary || '继续看这条内容的政策重点和后续安排。',
      meta: item.category || item.newsType || '新闻政策'
    }));
}

function buildKnowledgeSchoolLinks(context) {
  if (context.grade === 9) {
    return [
      {
        href: '/schools',
        title: '看学校库和招生口径',
        description: '复习重点 × 目标学校招生定位。',
        meta: '学校信息'
      },
      {
        href: '/schools/compare',
        title: '横向比较目标学校',
        description: '区位、属性与公开信息横向对照。',
        meta: '学校对比'
      },
      {
        href: '/schools/district',
        title: '按区看学校差异',
        description: '所在区学校密度与分布。',
        meta: '区县专题'
      }
    ];
  }

  return [
    {
      href: '/schools',
      title: '先看学校库',
      description: '学习节奏 × 学校类型与培养方向。',
      meta: '学校信息'
    },
    {
      href: '/schools/district',
      title: '按区找学校',
      description: '各区学校资源与风格差别。',
      meta: '区县专题'
    },
    {
      href: '/news',
      title: '继续看政策新闻',
      description: '知识点 × 时间节点与政策变化。',
      meta: '新闻政策'
    }
  ];
}

export function getKnowledgeChannelJourney(page, { news = [] } = {}) {
  const context = getKnowledgeContext(page?.slug);
  if (context.kind !== 'grade' && context.kind !== 'subject') {
    return null;
  }

  const subjectMeta = SUBJECT_META[context.subject];
  const title = subjectMeta
    ? `${subjectMeta.label}：下一步看什么`
    : `${context.grade}年级：下一步看什么`;

  return {
    kicker: '频道联动',
    title,
    summary: subjectMeta
      ? `${subjectMeta.label}知识点 × 升学政策 × 学校信息。`
      : '年级节奏 × 政策节点 × 学校信息。',
    groups: [
      {
        id: 'news',
        label: '相关政策与动态',
        items: selectKnowledgeNews(news, context)
      },
      {
        id: 'schools',
        label: '学校信息入口',
        items: buildKnowledgeSchoolLinks(context)
      }
    ]
  };
}

function buildSchoolKnowledgeLinks(school) {
  const stage = school?.schoolStage;

  if (stage === 'senior_high') {
    return [
      {
        href: '/knowledge/grade-9',
        title: '九年级中考复习总览',
        description: '冲刺节奏与目标高中。',
        meta: '知识体系'
      },
      {
        href: '/knowledge/math-grade9',
        title: '九年级数学专题',
        description: '函数、圆、几何综合与压轴题，筛选度高。',
        meta: '数学'
      },
      {
        href: '/knowledge/english-grade9',
        title: '九年级英语专题',
        description: '阅读、写作与语法稳定性，影响总分。',
        meta: '英语'
      }
    ];
  }

  return [
    {
      href: '/knowledge/grade-7',
      title: '七年级知识体系',
      description: '主学科基础与周复盘节奏。',
      meta: '七年级'
    },
    {
      href: '/knowledge/grade-8',
      title: '八年级知识体系',
      description: '主学科与理化阶段提升。',
      meta: '八年级'
    },
    {
      href: '/knowledge/grade-9',
      title: '九年级知识体系',
      description: '复习安排 × 志愿阶段目标。',
      meta: '九年级'
    }
  ];
}

function inferNewsKnowledgeLinks(item) {
  const text = `${item?.title || ''} ${item?.summary || ''} ${item?.content || ''}`;
  const links = [];

  if (item?.examType === 'zhongkao' || /(中考|初三|九年级|志愿|招生|录取)/.test(text)) {
    links.push({
      href: '/knowledge/grade-9',
      title: '九年级中考复习总览',
      description: '政策节点 × 各学科复习节奏。',
      meta: '九年级'
    });
  }

  for (const [subject, meta] of Object.entries(SUBJECT_META)) {
    if (meta.keywords.some((keyword) => text.includes(keyword))) {
      const grade = item?.examType === 'zhongkao' || /(中考|九年级|初三)/.test(text) ? 9 : 8;
      links.push({
        href: `/knowledge/${subject}-grade${grade}`,
        title: `${grade === 9 ? '九年级' : '八年级'}${meta.label}专题`,
        description: `涉及${meta.label}：知识点、易错点与复习安排。`,
        meta: meta.label
      });
    }
  }

  if (!links.some((item) => item.href === '/knowledge/grade-9')) {
    links.push({
      href: '/knowledge',
      title: '知识体系首页',
      description: '按年级与学科继续查。',
      meta: '知识体系'
    });
  }

  return links.slice(0, 3);
}

function scoreSchoolNewsItem(item, school) {
  const text = normalizeText(`${item.title} ${item.summary} ${item.content}`);
  const schoolName = normalizeSchoolName(school?.name);
  const groupName = normalizeText(school?.group);
  let score = 0;

  if (item.primarySchoolId && item.primarySchoolId === school?.id) score += 12;
  if (schoolName && normalizeSchoolName(item.title).includes(schoolName)) score += 7;
  if (schoolName && normalizeSchoolName(item.summary).includes(schoolName)) score += 4;
  if (groupName && text.includes(groupName)) score += 3;
  if (school?.districtName && text.includes(normalizeText(school.districtName)) && (item.newsType === 'school' || item.newsType === 'admission')) score += 2;

  return score;
}

function selectSchoolNews(news = [], school) {
  const scored = news
    .map((item) => ({ item, score: scoreSchoolNewsItem(item, school) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || toTimestamp(right.item.updatedAt || right.item.publishedAt) - toTimestamp(left.item.updatedAt || left.item.publishedAt))
    .slice(0, 3)
    .map(({ item }) => ({
      href: `/news/${item.id}`,
      title: item.title,
      description: item.summary || '继续看这条学校或招生动态。',
      meta: item.category || item.newsType || '新闻政策'
    }));

  if (scored.length) return scored;

  return news
    .filter((item) => item.newsType === 'admission' || item.newsType === 'school' || item.newsType === 'policy')
    .sort((left, right) => toTimestamp(right.updatedAt || right.publishedAt) - toTimestamp(left.updatedAt || left.publishedAt))
    .slice(0, 3)
    .map((item) => ({
      href: `/news/${item.id}`,
      title: item.title,
      description: item.summary || '继续看这条学校或招生动态。',
      meta: item.category || item.newsType || '新闻政策'
    }));
}

export function getSchoolChannelJourney(school, { news = [] } = {}) {
  return {
    kicker: '继续看',
    title: '把学校、政策和学习准备放在一起看',
    summary: '学校详情适合回答“这所学校是什么样”，接下来再看政策和学习准备，判断会更稳。',
    groups: [
      {
        id: 'news',
        label: '相关政策与动态',
        items: selectSchoolNews(news, school)
      },
      {
        id: 'knowledge',
        label: '对应学习入口',
        items: buildSchoolKnowledgeLinks(school)
      }
    ]
  };
}

export function getNewsChannelJourney(item, { schools = [] } = {}) {
  const schoolMap = new Map(schools.map((school) => [school.id, school]));
  const linkedSchool = item?.primarySchoolId ? schoolMap.get(item.primarySchoolId) || null : null;
  const schoolItems = linkedSchool
    ? [
        {
          href: `/schools/${linkedSchool.id}`,
          title: linkedSchool.name,
          description: '学校定位、招生口径与同区对照。',
          meta: linkedSchool.districtName || '学校信息'
        },
        {
          href: '/schools/compare',
          title: '加入学校横向比较',
          description: '与同区、同类型学校对照。',
          meta: '学校对比'
        }
      ]
    : [
        {
          href: '/schools',
          title: '进入学校信息库',
          description: '学校类型、区域与公开招生信息。',
          meta: '学校信息'
        },
        {
          href: '/schools/district',
          title: '按区查看学校专题',
          description: '区域学校分布。',
          meta: '区县专题'
        }
      ];

  return {
    kicker: '继续看',
    title: '这条新闻的下一步',
    summary: '新闻讲“发生了什么”，接到学校与知识体系判断“怎么准备”。',
    groups: [
      {
        id: 'schools',
        label: '学校信息入口',
        items: schoolItems
      },
      {
        id: 'knowledge',
        label: '对应学习入口',
        items: inferNewsKnowledgeLinks(item)
      }
    ]
  };
}
