// 新闻专题页公共取数与组装逻辑（zhongkao-special / gaokao-special 共用）。
// 政策正文来自地区配置 content/special-policies/{region}/{variant}.json；
// 未配置的地区走精简模式，只用 examTotal 事实 + 当年动态列表，不套用其他城市口径。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_ROOT = path.join(__dirname, '..', 'content', 'special-policies');

const DEFAULT_OFFICIAL_IDS = {
  zhongkao: [
    'exam-2026-zhongzhao-opinion',
    'exam-2026-zhongzhao-implementation-rules',
    'admission-2026-outstanding-sports-students',
    'admission-2026-secondary-vocational-self',
    'admission-2026-special-education-high-school'
  ],
  gaokao: [
    'admission-2026-gaokao-sports-implementation',
    'exam-2026-gaokao-sports-guide',
    'admission-2026-gaokao-sports-confirmation',
    'admission-2026-sanxiaosheng-implementation',
    'exam-2026-xuekao-seven-subject-requirements'
  ]
};

const DEFAULT_GROUPS = {
  zhongkao: {
    registration: /报名|确认|资格/,
    exam: /考试|成绩|准考证|听说|实验/,
    admission: /录取|志愿|招生|特长|体育|艺术|自主/
  },
  gaokao: {
    spring: /春考|春招|自主招生|专科/,
    exam: /高考|学业|等级|合格|成绩|考试/,
    special: /体育|三校生|保送|外国语|专项/
  }
};

const SECTION_DEFS = {
  zhongkao: [
    { id: 'zhongkao-registration', kicker: 'REGISTRATION', title: '报名、确认与资格相关内容', key: 'registration' },
    { id: 'zhongkao-exam', kicker: 'EXAM', title: '考试、成绩与时间安排', key: 'exam' },
    { id: 'zhongkao-admission', kicker: 'ADMISSION', title: '志愿、专项招生与录取相关内容', key: 'admission' }
  ],
  gaokao: [
    { id: 'gaokao-spring', kicker: 'SPRING', title: '春考、专科自主招生与征求志愿', key: 'spring' },
    { id: 'gaokao-exam', kicker: 'EXAM', title: '高考、学业考试与成绩相关内容', key: 'exam' },
    { id: 'gaokao-special-track', kicker: 'SPECIAL TRACK', title: '体育类、三校生与其他专项招生', key: 'special' }
  ]
};

const SHANGHAI_SIDE_LINKS = {
  zhongkao: [
    { label: '三大批次', href: '#zk-batches' },
    { label: '分数构成', href: '#zk-score' },
    { label: '名额分配', href: '#zk-allocation' },
    { label: '自主招生', href: '#zk-zizhao' },
    { label: '志愿填报', href: '#zk-zhiyuan' },
    { label: '加分项目', href: '#zk-zengfen' },
    { label: '时间节点', href: '#zk-timeline' },
    { label: '常见误区', href: '#zk-faq' }
  ],
  gaokao: [
    { label: '考试模式', href: '#gk-mode' },
    { label: '录取批次', href: '#gk-batches' },
    { label: '综合评价', href: '#gk-zongping' },
    { label: '强基计划', href: '#gk-qiangji' },
    { label: '院校专业组', href: '#gk-zhuanyezu' },
    { label: '学业水平', href: '#gk-xuekao' },
    { label: '三通道', href: '#gk-channels' },
    { label: '艺体招生', href: '#gk-yiti' },
    { label: '时间节点', href: '#gk-timeline' },
    { label: '常见误区', href: '#gk-faq' }
  ]
};

const SHANGHAI_SIDE_NOTES = {
  zhongkao: [
    '自主招生、名额分配综合评价录取、统一招生录取，是上海中招最需要先分清的三条主线。',
    '2026 年核心时间链：5/16–17 听说与实验、6/20–21 笔试、6/23–26 志愿填报、6/27–28 书面确认、7/14 成绩与控分线公布。'
  ],
  gaokao: [
    '上海高招最容易混淆的是春招、高考、体育类、三校生这几条路径。建议先确认自己属于哪一类，再继续读对应内容。',
    '本科普通批 24 个院校专业组平行志愿采用"分数优先、遵循志愿、一轮投档"；达线被投出后若不服调剂或体检不符会被退档，本批次其余志愿同时失效。'
  ]
};

const SHANGHAI_TITLE = { zhongkao: '上海中招政策详解', gaokao: '上海高招政策详解' };
const SHANGHAI_DESC = {
  zhongkao: '以 2026 年上海市高中阶段学校招生办法为依据，系统说明上海中考招生录取的批次、计分、名额分配、自主招生、志愿填报与加分规则。',
  gaokao: '以 2026 年上海市普通高校招生办法为依据，系统说明上海高考“3+3”模式与 660 分构成、综合评价与强基计划、院校专业组平行志愿、学业水平考试、艺体招生与加分规则。'
};
const SHANGHAI_OFFICIAL_TITLE = {
  zhongkao: '这几份文件决定了今年上海中招怎么走',
  gaokao: '这几份文件决定了今年上海高招几条主要路径'
};

function loadPolicyConfig(region, variant) {
  const file = path.join(CONFIG_ROOT, String(region || ''), `${String(variant || '')}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getCurrentYear(news) {
  const years = news
    .map((item) => Number(String(item?.publishedAt || '').slice(0, 4)) || 0)
    .filter(Boolean)
    .sort((a, b) => b - a);
  return years[0] || new Date().getFullYear();
}

function isCurrentYearItem(item, year) {
  return (Number(String(item?.publishedAt || '').slice(0, 4)) || Number(item?.year) || 0) === year;
}

function getPolicyExamType(policy) {
  const haystack = `${policy.title || ''} ${policy.summary || ''}`.toLowerCase();
  if (haystack.includes('高考') || haystack.includes('高校') || haystack.includes('春考')) return 'gaokao';
  return 'zhongkao';
}

// 与 lib/site-utils.js getNewsSection + getNewsCategoryLabel 保持同一口径，
// 避免 builder 引入 ESM site-utils 的整条学校依赖链。
function sectionOf(item) {
  const rawType = String(item.newsType || '').toLowerCase();
  if (/^(school|schoolnews|school_news)$/.test(rawType)) return 'school';
  if (/^(admission|admissionnews|admission_news)$/.test(rawType)) return 'admission';
  if (/^(exam|examnews|exam_news)$/.test(rawType)) return 'exam';
  if (/^(policy|policynews|policy_news)$/.test(rawType)) return 'policy';
  if (/^(guide|guidenews|guide_news)$/.test(rawType)) return 'guide';
  const category = String(item.category || '').toLowerCase();
  const srcName = String(item.source?.name || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();
  if (category.includes('学校动态') || srcName.includes('中学官网') || srcName.includes('学校官网')) return 'school';
  if (category.includes('招生')) return 'admission';
  if (category.includes('政策')) return 'policy';
  if (/指南|攻略|备考/.test(category)) return 'guide';
  if (title.includes('学校') && !title.includes('招生')) return 'school';
  if (item.examType === 'zhongkao' || item.examType === 'gaokao') return 'exam';
  return '资讯';
}

function categoryLabel(item) {
  if (item.category) return item.category;
  return {
    exam: '考试新闻', admission: '招生新闻', school: '学校动态',
    policy: '政策解读', guide: '升学指南'
  }[sectionOf(item)] || '新闻';
}

function toTopicEntry(item, detailHref) {
  return {
    id: item.id,
    href: detailHref(item),
    date: item.publishedAt || item.year || '暂无日期',
    source: item.source?.name || categoryLabel(item),
    title: item.title,
    summary: item.summary
  };
}

function pickItemsById(items, ids) {
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
}

function phaseLabel(variant, now) {
  const month = now.getMonth() + 1;
  if (variant === 'zhongkao') {
    if (month >= 1 && month <= 3) return '政策发布与报名阶段，建议先把总分构成、考试日期和志愿规则这三项框架看清。';
    if (month === 4 || month === 5) return '考试准备阶段，建议把体育测试、听说实验和笔试串成一条准备线。';
    if (month === 6) return '笔试与志愿填报阶段，考后集中关注志愿填报规则和书面确认时间。';
    if (month >= 7 && month <= 8) return '录取阶段，重点关注批次投档结果和征求志愿安排。';
    return '建议优先关注下一年度中招政策发布和报名信息采集。';
  }
  if (month >= 1 && month <= 3) return '春招考试与成绩公布阶段，建议优先关注春考志愿填报和自主测试安排。';
  if (month === 4 || month === 5) return '综评和强基报名阶段，建议同步跟进高考主流程和学考等级考复习节奏。';
  if (month === 6) return '高考笔试与校测阶段，考后重点关注综合评价校测和志愿填报准备。';
  if (month >= 7 && month <= 8) return '录取阶段，集中关注各批次投档结果和征求志愿时间。';
  return '建议优先关注下一年度春招、艺考和高考报名信息采集安排。';
}

function shanghaiChecklist(variant, now) {
  const lead = phaseLabel(variant, now);
  return variant === 'zhongkao'
    ? [
        lead,
        '若走优秀体育学生、艺术骨干或中职自主招生路径，持续跟踪学校资格确认方案和后续测试安排。',
        '普通中招家庭把体育与健身测试、听说实验和笔试串成一条完整的准备线来规划。'
      ]
    : [
        lead,
        '体育类路径当前最关键的是把确认、考试、成绩与合格线这一条链看完整，确认自己后续是否具备填报资格。',
        '普通高考家庭建议把高考主流程、学业水平考试命题要求和三校生等专项路径拆开看，避免把不同通道混在一起。'
      ];
}

/**
 * 组装专题页全部 props（不含 region/variant/contentId，由页面传入）。
 * detailHref: (item) => string，用 lib/policy-detail 的 getPolicyDetailHref 注入。
 */
export function buildSpecialProps({ region, regionConfig, variant, news, detailHref, now = new Date() }) {
  const cfg = loadPolicyConfig(region, variant);
  const isShanghai = region === 'shanghai';
  const hasPolicyConfig = !!cfg && Array.isArray(cfg.policyBlocks) && cfg.policyBlocks.length > 0;
  const examTotal = regionConfig?.examTotal?.[variant] || '';
  const label = regionConfig?.label || '';

  const currentYear = getCurrentYear(news);
  const typed = news
    .filter((item) => item.examType === variant && isCurrentYearItem(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const policies = news
    .filter((item) => item.newsType === 'policy')
    .filter((item) => isCurrentYearItem(item, currentYear) && getPolicyExamType(item) === variant)
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const entry = (item) => toTopicEntry(item, detailHref);
  const groupRules = DEFAULT_GROUPS[variant];
  const groups = {};
  for (const [key, re] of Object.entries(groupRules)) {
    groups[key] = typed.filter((item) => re.test(`${item.title}${item.summary}`));
  }
  const sections = SECTION_DEFS[variant].map((def) => ({
    id: def.id, kicker: def.kicker, title: def.title,
    items: groups[def.key].map(entry)
  }));

  const allItems = [...typed, ...policies];
  const officialFocus = isShanghai
    ? pickItemsById(allItems, DEFAULT_OFFICIAL_IDS[variant])
    : hasPolicyConfig
      ? allItems
          .filter((item) => {
            const name = String(item.source?.name || '');
            const url = String(item.source?.url || '');
            return /教委|教育局|考试院|人民政府|招考院/.test(name) || /gov\.cn|edu\.cn/.test(url);
          })
          .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
          .slice(0, 5)
      : [];

  const heroStats = [
    { value: String(examTotal), label: variant === 'zhongkao' ? '中考录取总分' : '高考总分' },
    { value: typed.length || '0', label: '当年动态' }
  ];

  const title = isShanghai ? SHANGHAI_TITLE[variant] : `${label}${variant === 'zhongkao' ? '中招' : '高招'}政策动态`;
  const description = isShanghai
    ? SHANGHAI_DESC[variant]
    : `汇总${label}2026 年${variant === 'zhongkao' ? '中招' : '高校招生'}政策与录取动态，${variant === 'zhongkao' ? '中考' : '高考'}满分 ${examTotal} 分，具体规则以当地教育行政部门发布为准。`;
  const checklist = isShanghai
    ? shanghaiChecklist(variant, now)
    : [
        `${label}${variant === 'zhongkao' ? '中考' : '高考'}总分 ${examTotal} 分，先按当年官方招生办法确认计分与录取规则。`,
        '按当前月份关注报名、考试、志愿填报与录取各阶段安排，具体时间以当地招考机构发布为准。',
        '专项招生、艺术体育类路径以当地当年实施办法为准，避免照搬其他城市规则。'
      ];
  const sideLinks = isShanghai
    ? SHANGHAI_SIDE_LINKS[variant].map((link) =>
        link.href === '#zk-score' ? { ...link, label: `${examTotal} 分构成` } : link)
    : hasPolicyConfig
      ? (cfg.policyBlocks || []).filter((b) => b.id).map((b) => ({ label: b.kicker || b.title, href: `#${b.id}` })).slice(0, 8)
      : [];
  const sideNotes = isShanghai
    ? SHANGHAI_SIDE_NOTES[variant]
    : [`${label}${variant === 'zhongkao' ? '中考' : '高考'}录取总分 ${examTotal} 分；考试模式、批次设置与志愿填报规则以当地教育行政部门当年发布为准。`];

  return {
    title,
    description,
    heroStats,
    policyBlocks: cfg?.policyBlocks || [],
    lead: typed[0] ? entry(typed[0]) : null,
    checklist,
    officialTitle: isShanghai ? SHANGHAI_OFFICIAL_TITLE[variant] : `${label}${variant === 'zhongkao' ? '中招' : '高招'}官方政策文件`,
    officialItems: officialFocus.map(entry),
    sections,
    policyTitle: `当年${variant === 'zhongkao' ? '中招' : '高招'}政策与说明`,
    policyItems: policies.map(entry),
    sideLinks,
    sideNotes
  };
}

export { getCurrentYear, isCurrentYearItem, getPolicyExamType, toTopicEntry, pickItemsById, loadPolicyConfig };
