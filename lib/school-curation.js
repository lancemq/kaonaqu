export const SCHOOL_SYSTEM_DEFINITIONS = [
  { id: 'shs', name: '上海中学体系', description: '主校与东校并行，适合关注连续培养和校区差异。', keywords: ['上海中学', '上海中学东校'] },
  { id: 'hsefz', name: '华二体系', description: '包括本部、紫竹校区和普陀校区，辨认校区非常重要。', keywords: ['华东师范大学第二附属中学'] },
  { id: 'sjtu', name: '交附体系', description: '主校之外还包含嘉定分校、浦东实验高中等延展校。', keywords: ['上海交通大学附属中学'] },
  { id: 'jianping', name: '建平体系', description: '主校与筠溪分校并存，浦东家长关注度很高。', keywords: ['建平中学'] },
  { id: 'qibao', name: '七宝体系', description: '主校与浦江分校口径不同，适合分开查看。', keywords: ['七宝中学'] },
  { id: 'fdfz', name: '复附体系', description: '以主校为核心，适合关注寄宿与附中资源。', keywords: ['复旦大学附属中学'] },
  { id: 'gezhi', name: '格致体系', description: '黄浦主校和奉贤校区并存，适合分开看区域落点。', keywords: ['格致中学'] },
  { id: 'datong', name: '大同体系', description: '主校与分校关系清晰，适合一起比较。', keywords: ['大同中学'] },
  { id: 'xiangming', name: '向明体系', description: '主校和浦江分校定位不同，适合分开跟进。', keywords: ['向明中学'] },
  { id: 'shixi', name: '市西体系', description: '静安主校与新城分校并存，适合同时查看。', keywords: ['市西中学'] },
  { id: 'yanan', name: '延安体系', description: '主校与新城分校并存，注意不要和西延安中学混看。', keywords: ['延安中学'], excludeKeywords: ['西延安中学'] },
  { id: 'kongjiang', name: '控江体系', description: '高中主校和附属学校同时存在，适合区分学段定位。', keywords: ['控江中学'] },
  { id: 'jincai', name: '进才体系', description: '主校之外还可见北校、南校，适合按学段和校区拆开看。', keywords: ['进才中学'] }
];

export const TRAINING_DIRECTION_DEFINITIONS = [
  { id: 'innovation', label: '科创竞赛', keywords: ['科技', '科创', '创新', '竞赛', '研究', '工程', '实验室', '拔尖'] },
  { id: 'humanities', label: '人文综合', keywords: ['人文', '综合', '领导力', '文科', '社科', '通识'] },
  { id: 'international', label: '国际课程', keywords: ['国际化', '国际课程', '双语', 'ib', 'ap', 'alevel', '融合'] },
  { id: 'boarding', label: '寄宿管理', keywords: ['寄宿', '住宿', '全寄宿', '走读'] },
  { id: 'continuity', label: '贯通培养', keywords: ['贯通', '一贯', '衔接', '完全中学', '连续培养', '十年一贯'] },
  { id: 'language', label: '外语特色', keywords: ['外语', '外国语', '英语', '双语'] }
];

export const DISTRICT_TOPIC_INTROS = {
  huangpu: '黄浦区更适合把传统老牌高中、中心城区交通便利度和历史底蕴一起看。',
  xuhui: '徐汇区头部学校集中，适合重点比较名校本部、附校和特色课程资源。',
  changning: '长宁区国际化学校和外语特色学校相对集中，适合把课程路径一起比较。',
  jingan: '静安区学校整体完成度较高，适合看学校气质、区位与课程稳定性。',
  putuo: '普陀区既有老牌学校也有新校区，比较时适合分清主校和分校口径。',
  hongkou: '虹口区学校有较强历史积淀，适合横向看民办初中与公办高中组合。',
  yangpu: '杨浦区大学附属资源密集，适合把大学背景、课程风格和学术氛围一起看。',
  minhang: '闵行区学校数量多且差异大，既有头部公办，也有大量双语和国际化学校。',
  baoshan: '宝山区适合看区域内学校梯度和新城板块学校的成长性。',
  jiading: '嘉定区适合重点关注新城学校、寄宿高中和附中体系延伸学校。',
  pudong: '浦东新区学校类型最丰富，比较时建议先按赛道分组，再看学校本身。',
  jinshan: '金山区学校更适合结合区位、寄宿条件和连续培养路径一起看。',
  songjiang: '松江区学校适合同时看大学城氛围、片区分布和学校成长性。',
  qingpu: '青浦区近年国际化和双语学校增多，适合把公办与民办赛道拆开看。',
  fengxian: '奉贤区适合重点看传统高中、附属学校和新校的办学完成度。',
  chongming: '崇明区学校数量相对少，更适合结合区域通勤与贯通培养路径一起判断。'
};

export function getSchoolRelationMetaByName(name = '') {
  if (name.includes('附属学校')) {
    return { label: '附校', className: 'relation-badge relation-badge-affiliate', relation: 'affiliate' };
  }
  if (name.includes('分校')) {
    return { label: '分校', className: 'relation-badge relation-badge-branch', relation: 'branch' };
  }
  if (name.includes('校区') || name.includes('东校') || name.includes('西校') || name.includes('南校') || name.includes('北校')) {
    return { label: '校区', className: 'relation-badge relation-badge-campus', relation: 'campus' };
  }
  return { label: '主校', className: 'relation-badge relation-badge-main', relation: 'main' };
}

export function matchSchoolSystem(school) {
  const name = String(school?.name || '');
  return SCHOOL_SYSTEM_DEFINITIONS.find((group) => {
    const included = group.keywords.some((keyword) => name.includes(keyword));
    const excluded = (group.excludeKeywords || []).some((keyword) => name.includes(keyword));
    return included && !excluded;
  }) || null;
}

export function inferTrainingDirections(school) {
  const haystack = [
    school?.name,
    ...(Array.isArray(school?.tags) ? school.tags : []),
    ...(Array.isArray(school?.features) ? school.features : []),
    school?.schoolDescription,
    school?.admissionNotes,
    school?.schoolTypeLabel
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matched = TRAINING_DIRECTION_DEFINITIONS.filter((item) =>
    item.keywords.some((keyword) => haystack.includes(String(keyword).toLowerCase()))
  ).map((item) => item.label);

  if (!matched.length) {
    if (school?.schoolStage === 'complete') {
      return ['贯通培养'];
    }
    if (String(school?.schoolTypeLabel || '').includes('市重点')) {
      return ['人文综合'];
    }
  }

  return Array.from(new Set(matched)).slice(0, 3);
}

export function getDistrictTopicIntro(districtId) {
  return DISTRICT_TOPIC_INTROS[districtId] || '适合从区域整体梯度、学校差异和培养方向三个角度一起看。';
}
