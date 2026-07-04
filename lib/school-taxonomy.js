// 标准化学校分类法：四校/八大/市重点/特色/区重点/一般 等
// 用于：
// 1) 给每所学校打上稳定的 category（学校层级分类）
// 2) 给每所学校打上 specializations（特色方向分类）
// 3) 规范化 group 名称（去除「系成员校」「集团成员校」等冗余后缀）
// 4) 提供 slug + 描述，方便 SEO 页面

// 学校层级分类（核心分类）
export const SCHOOL_CATEGORIES = [
  {
    id: 'si-fen',
    slug: 'four-schools',
    label: '四校',
    shortLabel: '四校',
    tier: ['四校'],
    description: '上海中学、华东师大二附中、复旦附中、交大附中四所委属市重点高中，清北复交录取稳定，竞赛、综评双线领先。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 1
  },
  {
    id: 'ba-da',
    slug: 'eight-schools',
    label: '八大',
    shortLabel: '八大',
    tier: ['八大'],
    description: '七宝、南模、建平、大同、格致、控江、复兴、延安八所传统市重点，复交录取率高，是中考裸考高分段的首选梯队。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 2
  },
  {
    id: 'si-fen-branch',
    slug: 'four-schools-branches',
    label: '四校分校',
    shortLabel: '四校分校',
    tier: ['四校分校'],
    description: '四校在浦东、嘉定、宝山、闵行等区设立的校区或分校，复交录取与四校本部一脉相承。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 3
  },
  {
    id: 'ba-da-branch',
    slug: 'eight-schools-branches',
    label: '八大分校',
    shortLabel: '八大分校',
    tier: ['八大分校'],
    description: '八大学校在浦东新城、闵行浦江等区域设立的分校，是各区头部高中的重要补充。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 4
  },
  {
    id: 'shi-shi-fan',
    slug: 'shi-fan',
    label: '市实验性示范性高中',
    shortLabel: '市实验示范',
    tier: ['市实验性示范性高中'],
    description: '上海市教委认证的实验性、示范性高中，整体办学水平高，是区内中考高分段的首要目标。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 5
  },
  {
    id: 'shi-zhongdian',
    slug: 'shi-key',
    label: '市重点高中',
    shortLabel: '市重点',
    tier: ['市重点'],
    description: '由上海市教委直接管理的市重点高中，整体招生分数线较高，升学路径成熟。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 6
  },
  {
    id: 'shi-tese',
    slug: 'shi-tese',
    label: '市特色普通高中',
    shortLabel: '市特色',
    tier: ['市特色普通高中'],
    description: '在科技、艺术、体育、外语等单一领域形成突出特色的市特色普通高中，可享受自主招生优惠。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 7
  },
  {
    id: 'qu-zhongdian',
    slug: 'qu-key',
    label: '区重点高中',
    shortLabel: '区重点',
    tier: ['区重点'],
    description: '各区教育局评定的区重点高中，是本区中考中分段的核心去向。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 8
  },
  {
    id: 'yiban-gaozhong',
    slug: 'regular-senior',
    label: '一般高中',
    shortLabel: '一般高中',
    tier: ['一般高中'],
    description: '面向区域招生的普通高中，是中考中低分段的主要去向。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 9
  },
  {
    id: 'guoji-kecheng',
    slug: 'international-curriculum',
    label: '国际课程班',
    shortLabel: '国际课程',
    tier: ['国际课程'],
    description: '开设 A-Level、IBDP、AP、OSSD 等国际课程的中外合办高中或公办国际部，升学方向以海外大学为主。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 10
  },
  {
    id: 'minban-gaozhong',
    slug: 'private-senior',
    label: '民办高中',
    shortLabel: '民办高中',
    tier: ['民办高中'],
    description: '民办性质的高中，部分学校提供双轨制（普通高考+国际课程）升学路径。',
    schoolStage: ['senior_high', 'complete'],
    sortOrder: 11
  },
  {
    id: 'gongban-chuzhong',
    slug: 'public-junior',
    label: '公办初中',
    shortLabel: '公办初中',
    tier: ['公办初中'],
    description: '公办初级中学，按地段对口或学籍对口入学。',
    schoolStage: ['junior', 'complete'],
    sortOrder: 12
  },
  {
    id: 'minban-chuzhong',
    slug: 'private-junior',
    label: '民办初中',
    shortLabel: '民办初中',
    tier: ['民办初中'],
    description: '民办初级中学，部分通过摇号招生。',
    schoolStage: ['junior', 'complete'],
    sortOrder: 13
  },
  {
    id: 'minban-shuangyu',
    slug: 'private-bilingual',
    label: '民办双语',
    shortLabel: '民办双语',
    tier: ['民办双语', '民办双语 / 国际化'],
    description: '提供国内+海外双轨升学路径的民办双语学校，多为 9/12 年一贯制。',
    schoolStage: ['junior', 'complete', 'senior_high'],
    sortOrder: 14
  },
  {
    id: 'guoji-xuexiao',
    slug: 'foreign-international',
    label: '国际 / 外籍',
    shortLabel: '国际学校',
    tier: ['国际', '外籍人员子女学校'],
    description: '招收外籍或港澳台学生，部分也招收大陆籍的国际学校，升学方向以海外大学为主。',
    schoolStage: ['junior', 'complete', 'senior_high'],
    sortOrder: 15
  }
];

// 特色方向分类（每所学校可同时具有多个）
export const SPECIALIZATION_CATEGORIES = [
  {
    id: 'science-innovation',
    slug: 'science-innovation',
    label: '科创竞赛',
    shortLabel: '科创',
    keywords: ['科创', '科技', '创新', '竞赛', '奥赛', '数竞', '物理竞赛', '化学竞赛', '生物竞赛', '信息竞赛', '编程', '机器人', '工程', '实验室', 'STEM', '人工智能', 'AI', '创客'],
    description: '在数学、物理、化学、生物、信息学等学科竞赛或科技类创新活动中表现突出的学校。'
  },
  {
    id: 'humanities-arts',
    slug: 'humanities-arts',
    label: '人文艺术',
    shortLabel: '人文',
    keywords: ['人文', '文学', '写作', '语文', '国学', '文科', '历史', '哲学', '辩论', '模拟联合国', '戏剧', '话剧', '艺术', '美术', '音乐', '舞蹈', '书法', '美育', '茶艺', '戏曲'],
    description: '在文学、写作、人文社科、艺术审美等领域形成办学特色的学校。'
  },
  {
    id: 'sports-health',
    slug: 'sports-health',
    label: '体育健康',
    shortLabel: '体育',
    keywords: ['体育', '运动', '球类', '田径', '游泳', '体操', '武术', '跆拳道', '击剑', '乒乓', '羽毛球', '篮球', '足球', '心理健康', '身心健康', '体育特长', '体育特色'],
    description: '在体育专项训练或心理健康教育方面形成显著特色的学校。'
  },
  {
    id: 'international-curriculum',
    slug: 'international-curriculum',
    label: '国际化',
    shortLabel: '国际化',
    keywords: ['国际化', '国际', '海外', '留学', '境外', '外籍', 'IB', 'A-Level', 'AP', 'OSSD', 'BC', '融合课程', '国际部', '国际班', '国际学校'],
    description: '提供国际课程、对外交流或以海外升学为主要方向的学校。'
  },
  {
    id: 'foreign-language',
    slug: 'foreign-language',
    label: '外语特色',
    shortLabel: '外语',
    keywords: ['外语', '外国语', '英语', '小语种', '日语', '法语', '德语', '西班牙语', '韩语', '双语', '英语特色', '英语特长', '多语种'],
    description: '在外语教学或小语种课程方面形成明显优势的外国语学校。'
  },
  {
    id: 'science-math',
    slug: 'science-math',
    label: '理工优势',
    shortLabel: '理工',
    keywords: ['数学', '物理', '化学', '生物', '理工', '理科', '实验', '探究', '研究性学习', '工程', '拔尖', '基础学科', '自然科学'],
    description: '在数理化生等基础学科上具有强势教学资源和升学表现。'
  },
  {
    id: 'comprehensive-quality',
    slug: 'comprehensive-quality',
    label: '综合素养',
    shortLabel: '综合',
    keywords: ['五育并举', '全面发展', '综合', '素养', '德育', '行为规范', '社会实践', '志愿服务', '综合素质', '思想品德', '思政'],
    description: '在学生综合素质培养方面均衡发展，特色不集中于单一领域。'
  },
  {
    id: 'continuity',
    slug: 'continuity',
    label: '贯通培养',
    shortLabel: '贯通',
    keywords: ['一贯制', '贯通', '完全中学', '初中高中', '直升', '连续培养', '初高中衔接', '十二年一贯', '九年一贯'],
    description: '提供从小学到初中、初中到高中贯通培养路径的学校。'
  },
  {
    id: 'boarding',
    slug: 'boarding',
    label: '寄宿管理',
    shortLabel: '寄宿',
    keywords: ['寄宿', '住宿', '全寄宿', '寄宿制', '内宿', '住宿管理'],
    description: '提供寄宿服务和管理能力突出的学校。'
  },
  {
    id: 'research-inquiry',
    slug: 'research-inquiry',
    label: '研究探究',
    shortLabel: '探究',
    keywords: ['研究', '探究', '项目', 'PBL', '课题', '研究性', '小课题', '学术', '研究能力', '批判性思维'],
    description: '注重研究性学习、批判性思维和课题项目式学习。'
  }
];

// Group 名称规范化（去除「系成员校」「集团成员校」等冗余后缀）
const GROUP_SUFFIX_PATTERNS = [
  /系成员校$/,
  /集团成员校$/,
  /教育集团成员校$/,
  /成员校$/,
  /教育集团$/,
  /集团$/
];

export function getCanonicalGroupName(rawGroup) {
  const group = String(rawGroup || '').trim();
  if (!group) return '';
  let canonical = group;
  for (const pattern of GROUP_SUFFIX_PATTERNS) {
    canonical = canonical.replace(pattern, '');
  }
  return canonical;
}

// Tag 规范化（合并近义 tag）
const TAG_NORMALIZATION_MAP = {
  '公办完全中学': '公办',
  '公办初中': '公办',
  '公办高中': '公办',
  '民办完全中学': '民办',
  '民办初中': '民办',
  '民办高中': '民办',
  '市实验性示范性高中': '市重点',
  '市特色普通高中': '市特色',
  '双语学校': '双语',
  '一贯制学校': '一贯制',
  '九年一贯制学校': '九年一贯',
  '十二年一贯制学校': '十二年一贯',
  '国际学校': '国际化',
  '国际化学校': '国际化'
};

export function normalizeTag(tag) {
  const t = String(tag || '').trim();
  if (!t) return null;
  return TAG_NORMALIZATION_MAP[t] || t;
}

// 根据 tier/schoolType 推断 category
export function inferSchoolCategory(school) {
  const tier = String(school?.tier || '').trim();
  const schoolTypeLabel = String(school?.schoolTypeLabel || '').trim();
  const schoolType = String(school?.schoolType || '').trim();
  const schoolStage = String(school?.schoolStage || '').trim();
  const isInternational = school?.isInternational || schoolTypeLabel.includes('国际') || schoolTypeLabel.includes('外籍');

  // 国际学校优先级最高
  if (schoolTypeLabel.includes('外籍') || (schoolTypeLabel.includes('国际') && !schoolTypeLabel.includes('国际课程'))) {
    return 'foreign-international';
  }
  if (schoolTypeLabel.includes('民办双语')) {
    return 'private-bilingual';
  }
  // tier 优先级
  if (tier === '四校') return 'si-fen';
  if (tier === '八大') return 'ba-da';
  if (tier === '四校分校') return 'si-fen-branch';
  if (tier === '八大分校') return 'ba-da-branch';
  if (tier === '市实验性示范性高中') return 'shi-shi-fan';
  if (tier === '市重点' || schoolTypeLabel === '市重点') return 'shi-zhongdian';
  if (tier === '市特色普通高中' || schoolTypeLabel.includes('市特色')) return 'shi-tese';
  if (tier === '区重点' || schoolTypeLabel === '区重点') return 'qu-zhongdian';
  if (tier === '国际课程') return 'guoji-kecheng';
  if (tier === '民办高中') return 'minban-gaozhong';
  if (tier === '民办初中') return 'minban-chuzhong';
  if (tier === '公办初中') return 'gongban-chuzhong';
  if (tier === '一般高中') return 'yiban-gaozhong';
  if (tier === '公办完全中学' || tier === '民办完全中学') {
    // 完全中学的子分类
    if (schoolTypeLabel.includes('公办')) return 'gongban-chuzhong';
    return 'minban-chuzhong';
  }
  // 兜底
  if (schoolStage === 'senior_high') return 'yiban-gaozhong';
  if (schoolStage === 'junior') return 'gongban-chuzhong';
  return 'gongban-chuzhong';
}

// 从 tags/features/trainingDirections/description 等多源推断 specializations
export function inferSpecializations(school) {
  const text = [
    school?.name,
    school?.description,
    school?.schoolDescription,
    school?.admissionNotes,
    school?.achievements,
    ...(Array.isArray(school?.tags) ? school.tags : []),
    ...(Array.isArray(school?.features) ? school.features : []),
    ...(Array.isArray(school?.trainingDirections) ? school.trainingDirections : []),
    ...(Array.isArray(school?.decisionTags) ? school.decisionTags : [])
  ]
    .filter(Boolean)
    .join(' ');

  const matches = [];
  for (const spec of SPECIALIZATION_CATEGORIES) {
    if (spec.keywords.some((kw) => text.includes(kw))) {
      matches.push(spec.id);
    }
  }

  // 兜底：完全中学保证有「贯通培养」
  if (!matches.includes('continuity') && (school?.schoolStage === 'complete')) {
    matches.push('continuity');
  }
  // 兜底：所有学校都有「综合素养」
  if (!matches.includes('comprehensive-quality')) {
    matches.push('comprehensive-quality');
  }

  return matches.slice(0, 4);
}

// 分类工具：按 id 查 category
export function getCategoryById(id) {
  return SCHOOL_CATEGORIES.find((c) => c.id === id) || null;
}

export function getCategoryBySlug(slug) {
  return SCHOOL_CATEGORIES.find((c) => c.slug === slug) || null;
}

// 分类工具：按 id 查 specialization
export function getSpecializationById(id) {
  return SPECIALIZATION_CATEGORIES.find((s) => s.id === id) || null;
}

export function getSpecializationBySlug(slug) {
  return SPECIALIZATION_CATEGORIES.find((s) => s.slug === slug) || null;
}
