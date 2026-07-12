import { createRequire } from 'module';
import { NewsTopicSpecialPage } from '../../../components/news-topic-special-ui';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { getNewsCategoryLabel, getPolicyExamType } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海高招政策详解 | 考哪去',
  description: '以 2026 年上海市普通高校招生办法为依据，系统说明上海高考"3+3"模式与 660 分构成、综合评价与强基计划、院校专业组平行志愿、学业水平考试、艺体招生与政策性照顾加分，附关键时间节点与常见误区。',
  alternates: { canonical: '/news/gaokao-special' }
};

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

function groupGaokaoNews(news) {
  return {
    spring: news.filter((item) => /春考|春招|自主招生|专科/.test(`${item.title}${item.summary}`)),
    exam: news.filter((item) => /高考|学业|等级|合格|成绩|考试/.test(`${item.title}${item.summary}`)),
    special: news.filter((item) => /体育|三校生|保送|外国语|专项/.test(`${item.title}${item.summary}`))
  };
}

function pickItemsById(items, ids) {
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
}

function getDetailHref(item) {
  return item?.newsType ? `/news/${item.id}` : getPolicyDetailHref(item);
}

function toTopicEntry(item) {
  return {
    id: item.id,
    href: getDetailHref(item),
    date: item.publishedAt || item.year || '暂无日期',
    source: item.source?.name || getNewsCategoryLabel(item),
    title: item.title,
    summary: item.summary
  };
}

const policyBlocks = [
  {
    id: 'gk-mode',
    wrapper: 'policy-relation-section',
    type: 'relation',
    kicker: '考试模式',
    title: '上海高考"3+3"：660 分怎么算',
    intro: '上海秋考为 660 分制，与其他多数省份 750 分制不可直接比较。外语一年两考取较高分；选考为等级性考试，按"5 等 11 级"赋分。',
    items: [
      { value: '150×3', title: '统考语数外', detail: '语文、数学、外语每科 150 分原始分计入，合计 450 分；外语 1 月与 6 月两考取高。' },
      { value: '70×3', title: '选考 3 科', detail: '政史地物化生 6 选 3，等级考每科满分 70 分，合计 210 分。' },
      { value: '660', title: '高考总分', detail: '450 + 210 = 660 分（满分）。' },
      { value: '5等11级', title: '等级赋分', detail: 'A+（70）至 E（40），相邻两级差 3 分；A+ 约 5%、A 约 10%。' },
      { value: '当年', title: '等级考有效期', detail: '自 2024 年起等级考成绩仅当年有效（2023 级及以后），往届生需重考。' }
    ]
  },
  {
    id: 'gk-batches',
    wrapper: 'policy-process-section',
    type: 'process',
    flow: false,
    kicker: '录取批次',
    title: '本科录取批次与志愿数量（秋招）',
    intro: '本科阶段按顺序录取；艺体类与提前批不得兼报；本科普通批设 24 个院校专业组平行志愿。',
    steps: [
      { label: '批次1', title: '综合评价批次', tags: ['4 平行志愿'], desc: '11 所试点院校，高考 85% + 校测 15% 综合分；须先报名初审。' },
      { label: '批次2', title: '零志愿批次', tags: ['3 平行志愿'], desc: '清华大学、北京大学，单独投放计划。' },
      { label: '批次3', title: '提前 / 艺体批次', tags: ['提前 4 顺序', '艺体甲/乙'], desc: '本科提前批与本科艺体类批二者不得兼报。' },
      { label: '批次4', title: '农村专项 / 特殊类型', tags: ['专项 4 顺序'], desc: '地方农村专项须本市农村户籍且达本科线；强基、高水平运动队在相应批次。' },
      { label: '批次5', title: '本科普通批次', tags: ['24 平行志愿'], desc: '主体批次，院校专业组平行志愿，1:1 投档，含 2 次征求志愿。' },
      { label: '专科', title: '高职专科批次', tags: ['专科普通 8 平行'], desc: '本科录取结束后填报，含提前、艺体、普通批。' }
    ]
  },
  {
    id: 'gk-zongping',
    wrapper: 'policy-glossary-list',
    type: 'glossary',
    kicker: '综合评价',
    title: '综合评价录取：11 所院校、85%+15%',
    groups: [
      {
        heading: '核心规则',
        terms: [
          {
            term: '11 所试点院校',
            meta: [{ label: '含', value: '复旦、交大、同济、华师大、华理、东华、上外、上财、上中医、上大、浙大' }],
            details: [{ label: '计划', value: '每年合计 2200+ 个' }],
            source: '阳光高考'
          },
          {
            term: '综合分 = 85% + 15%',
            details: [
              { label: '公式', value: '高考分÷660×850 + 校测分（满分 150）' },
              { label: '入围', value: '按招生计划 1.5 倍确定校测名单' }
            ],
            desc: '校测以面试为主，结合综合素质评价档案；不参加校测计 0 分。'
          },
          {
            term: '硬门槛',
            details: [
              { label: '报名', value: '5 月须先网上报名初审，否则不能填综评批志愿' },
              { label: '线', value: '高考成绩须达特殊类型招生控制线（2025 为 505 分）' }
            ],
            desc: '综评批在零志愿、提前批之前录取，一旦录取不再参加后续批次。'
          }
        ]
      }
    ]
  },
  {
    id: 'gk-qiangji',
    wrapper: 'policy-relation-section',
    type: 'relation',
    kicker: '强基计划',
    title: '强基计划：在沪招生与报考流程',
    items: [
      { value: '4+', title: '在沪试点高校', detail: '复旦、交大、同济、华师大等本地高校，及清北等全国分省计划高校。' },
      { value: '4月', title: '报名', detail: '登录教育部阳光高考强基平台（bm.chsi.com.cn），限报 1 所。' },
      { value: '6月', title: '校测', detail: '高考后出分前初试，出分前后复试（笔试+面试+体育测试）；入围分省计划 ≤4 倍。' },
      { value: '优先', title: '录取顺序', detail: '在所有本科批次前完成；综合分 = 高考（不含加分）85% + 校测 15%，录取即锁定。' },
      { value: '体测', title: '体育测试必参加', detail: '无故缺席取消校测成绩；破格生（金银牌）免初试直入复试。' }
    ]
  },
  {
    id: 'gk-zhuanyezu',
    wrapper: 'policy-glossary-list',
    type: 'glossary',
    kicker: '院校专业组',
    title: '院校专业组与平行志愿：退档风险在哪',
    groups: [
      {
        heading: '规则要点',
        terms: [
          {
            term: '院校专业组是投档单位',
            details: [{ label: '定义', value: '高校按专业科目要求设置，同组内科目要求相同；一所高校可设多个组，组间计划原则不调剂' }],
            desc: '选考科目须与专业组要求相符才具填报资格（单科含即符，多科须全含）。'
          },
          {
            term: '24 个平行志愿',
            meta: [{ label: '每组', value: '4 个专业志愿 + 调剂选项' }],
            details: [{ label: '规则', value: '分数优先、遵循志愿、一轮投档；1:1 比例投档' }],
            desc: '本科普通批 24 个院校专业组平行志愿，每组内可填 4 个专业并选择是否服从组内调剂。'
          },
          {
            term: '退档风险',
            details: [{ label: '一轮投档', value: '被投出后因不服从调剂/身体条件被退档，本批次其余 23 个志愿同时失效，只能等征求' }],
            desc: '建议"冲稳保"拉开梯度并谨慎选服从调剂；调剂仅限所投档的专业组内。'
          }
        ]
      }
    ]
  },
  {
    id: 'gk-xuekao',
    wrapper: 'policy-relation-section',
    type: 'relation',
    kicker: '学业水平',
    title: '学业水平考试：合格考与等级考',
    items: [
      { value: '合格', title: '合格性考试', detail: '覆盖语数外等 10 科，成绩合格/不合格；是高中毕业与报考等级考、春考/秋考的前提。' },
      { value: '6选3', title: '等级性考试', detail: '仅政史地物化生 6 科，考生最多选 3 门，每门满分 70 分，按 5 等 11 级折算。' },
      { value: '长期', title: '合格考有效期', detail: '合格成绩长期有效。' },
      { value: '当年', title: '等级考有效期', detail: '自 2024 年起仅当年有效（2023 级及以后），规划须前置。' },
      { value: '门槛', title: '报考关系', detail: '合格考合格方可报对应等级考；应届生 7 门合格考合格方可报春考、至少 3 门合格方可报秋考。' }
    ]
  },
  {
    id: 'gk-channels',
    wrapper: 'policy-process-section',
    type: 'process',
    flow: false,
    kicker: '升学通道',
    title: '三类通道：专科自招 / 三校生 / 秋考',
    intro: '三条路径层次与对象不同，且多数互斥——一旦被录取即失去后续考试资格。',
    steps: [
      { label: '3月', title: '专科自主招生', tags: ['专科', '可免笔试'], desc: '以学业考/文化素质 + 职业适应性（技能）测试录取；一般限报 1 所，录取后不可再考。' },
      { label: '5月', title: '三校生高考', tags: ['仅应届三校生'], desc: '中专/职校/技校应届生，文化 300 + 技能 200 = 500 分；含本科与专科，顺序志愿。' },
      { label: '6月', title: '秋季统一高考', tags: ['面最广'], desc: '3+3、660 分、院校专业组平行志愿；普高为主，三校生亦可报但不可与三校生高考兼报。' }
    ]
  },
  {
    id: 'gk-yiti',
    wrapper: 'policy-relation-section',
    type: 'relation',
    kicker: '艺体招生',
    title: '体育类、艺术类招生：文化与专业双过线',
    items: [
      { value: '统考', title: '专业统考', detail: '艺术类含美术、音乐、舞蹈、播音、表导、书法等；体育类设体育专业统考，合格方可填报。' },
      { value: '302', title: '艺术本科文化线', detail: '2025 为 302 分（舞蹈/戏曲类 220），不低于本科线 402 的 75%。' },
      { value: '281', title: '体育本科文化线', detail: '2025 为 281 分，不低于本科线的 70%。' },
      { value: '50/50', title: '艺术投档', detail: '平行段投档分 = 文化 50% + 专业统考 50%。' },
      { value: '30/70', title: '体育投档', detail: '投档分 = 文化 30% + 专业统考 70%。' },
      { value: '不兼报', title: '提前 vs 艺体', detail: '本科提前批与本科艺体类批不得兼报；艺体类仅设一次征求（乙批次）。' }
    ]
  },
  {
    id: 'gk-timeline',
    wrapper: 'policy-process-section',
    type: 'process',
    flow: false,
    kicker: '全年节点',
    title: '上海高招关键时间链（以 2025 实际为参照）',
    intro: '2026 年结构相同、日期相近，以"上海招考热线"及市考试院官微公布为准。',
    steps: [
      { label: '6月', title: '高考与放榜', desc: '6/7–9 统考；6/23 左右公布成绩、位序与本科各批次控制线。' },
      { label: '7月初', title: '志愿填报', desc: '7/1–2 填报本科阶段志愿（含综合评价批）；7/3 综评校测资格线。' },
      { label: '7月上', title: '校测与录取', desc: '7/5 前强基校测录取；7/6–7 综评校测；7/9 综评批、零志愿批录取查询。' },
      { label: '7月中', title: '普通批录取', desc: '7/16–29 本科普通批录取（含 2 次征求）；7/19 投档线、7/23 普通批查询+第一次征求。' },
      { label: '7月底–8月', title: '专科阶段', desc: '7/29 专科控制线；7/30 专科志愿；8/5 前专科各批次录取结束。' }
    ]
  },
  {
    id: 'gk-faq',
    wrapper: 'policy-glossary-list',
    type: 'faq',
    kicker: '常见误区',
    title: '考生最该避开的几个坑',
    items: [
      { question: '“平行志愿退档无所谓，后面还有 23 个”？', answer: '错。一轮投档下，被投出后因不服从调剂或体检不符被退档，本批次其余志愿同时失效，只能等征求志愿。' },
      { question: '“专业调剂能跨组”？', answer: '不能。调剂只在被投档的院校专业组内，不能跨组；填报前务必看清组内是否含无法接受的专业。' },
      { question: '“综评只看高考分”？', answer: '综评须 5 月先报名初审，否则无资格；校测为面试，重学科特长与综合素质档案，应提前准备。' },
      { question: '“加分能叠加”？', answer: '不累加，取最高一项且最高不超 20 分；且不用于艺术类专业、高水平运动队、高校专项等不分省计划项目。' },
      { question: '“春考录取还能再冲秋考”？', answer: '不能。春考一旦被录取，不得再参加当年秋季高考及后续录取，路径互斥。' },
      { question: '“三校生和秋考可二选一”？', answer: '三校生高考与秋季高考不可兼报；专科自主招生录取后也失去 5 月、6 月考试资格。' }
    ]
  }
];

export default async function GaokaoSpecialPage() {
  const { news } = await loadDataStore();
  const currentYear = getCurrentYear(news);
  const gaokaoNews = news
    .filter((item) => item.examType === 'gaokao' && isCurrentYearItem(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const gaokaoPolicies = news
    .filter((n) => n.newsType === 'policy')
    .filter((item) => isCurrentYearItem(item, currentYear) && getPolicyExamType(item) === 'gaokao')
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const leadNews = gaokaoNews[0] || null;
  const groups = groupGaokaoNews(gaokaoNews);
  const officialFocus = pickItemsById(
    [...gaokaoNews, ...gaokaoPolicies],
    [
      'admission-2026-gaokao-sports-implementation',
      'exam-2026-gaokao-sports-guide',
      'admission-2026-gaokao-sports-confirmation',
      'admission-2026-sanxiaosheng-implementation',
      'exam-2026-xuekao-seven-subject-requirements'
    ]
  );
  const stageEntries = [
    { label: '模式与批次', title: '先看清考试与录取框架', description: '3+3 与 660 分、本科各批次与志愿数量。', count: 2, anchor: '#gk-mode' },
    { label: '特殊路径', title: '再看综评、强基与艺体', description: '综合评价、强基计划、院校专业组与艺体招生。', count: 4, anchor: '#gk-zongping' },
    { label: '志愿与时间', title: '吃透平行志愿与时间线', description: '院校专业组、学业水平、三通道与常见误区。', count: 4, anchor: '#gk-zhuanyezu' }
  ];
  function getCurrentPhaseLabel() {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month >= 1 && month <= 3) return '春招考试与成绩公布阶段，建议优先关注春考志愿填报和自主测试安排。';
    if (month === 4 || month === 5) return '综评和强基报名阶段，建议同步跟进高考主流程和学考等级考复习节奏。';
    if (month === 6) return '高考笔试与校测阶段，考后重点关注综合评价校测和志愿填报准备。';
    if (month >= 7 && month <= 8) return '录取阶段，集中关注各批次投档结果和征求志愿时间。';
    return '建议优先关注下一年度春招、艺考和高考报名信息采集安排。';
  }

  const currentChecklist = [
    getCurrentPhaseLabel(),
    '体育类路径当前最关键的是把确认、考试、成绩与合格线这一条链看完整，确认自己后续是否具备填报资格。',
    '普通高考家庭建议把高考主流程、学业水平考试命题要求和三校生等专项路径拆开看，避免把不同通道混在一起。'
  ];
  return (
    <NewsTopicSpecialPage
      variant="gaokao"
      kicker="GAOKAO POLICY"
      title="上海高招政策详解"
      description="以 2026 年上海市普通高校招生办法为依据，系统说明上海高考“3+3”模式与 660 分构成、综合评价与强基计划、院校专业组平行志愿、学业水平考试、艺体招生与加分规则。"
      heroStats={[
        { value: '660', label: '高考总分' },
        { value: '11', label: '综评试点院校' },
        { value: '24', label: '普通批平行志愿' },
        { value: gaokaoNews.length || '0', label: '当年动态' }
      ]}
      facts={[
        { title: '总分是 660 不是 750', detail: '上海秋考 3+3 满分为 660 分，与外省市 750 分制不可直接比较。' },
        { title: '院校专业组是投档单位', detail: '本科普通批 24 个院校专业组平行志愿，调剂仅限组内，存在一轮投档退档风险。' },
        { title: '综评要看校测', detail: '11 所院校高考 85% + 校测 15%，且须 5 月先报名初审，否则无资格。' }
      ]}
      stageTitle="先判断自己现在更该进入哪一条高招路径"
      stageDescription="考试模式、录取批次、综合评价与强基、院校专业组与艺体，分开读避免把不同批次和资格混在一起。"
      stageEntries={stageEntries}
      policyBlocks={policyBlocks}
      lead={leadNews ? toTopicEntry(leadNews) : null}
      checklist={currentChecklist}
      officialTitle="这几份文件决定了今年上海高招几条主要路径"
      officialItems={officialFocus.map(toTopicEntry)}
      sections={[
        { id: 'gaokao-spring', kicker: 'SPRING', title: '春考、专科自主招生与征求志愿', items: groups.spring.map(toTopicEntry) },
        { id: 'gaokao-exam', kicker: 'EXAM', title: '高考、学业考试与成绩相关内容', items: groups.exam.map(toTopicEntry) },
        { id: 'gaokao-special-track', kicker: 'SPECIAL TRACK', title: '体育类、三校生与其他专项招生', items: groups.special.map(toTopicEntry) }
      ]}
      policyTitle="当年高招政策与说明"
      policyItems={gaokaoPolicies.map(toTopicEntry)}
      sideLinks={[
        { label: '3+3 模式', href: '#gk-mode' },
        { label: '录取批次', href: '#gk-batches' },
        { label: '综合评价', href: '#gk-zongping' },
        { label: '强基计划', href: '#gk-qiangji' },
        { label: '院校专业组', href: '#gk-zhuanyezu' },
        { label: '学业水平', href: '#gk-xuekao' },
        { label: '三通道', href: '#gk-channels' },
        { label: '艺体招生', href: '#gk-yiti' },
        { label: '时间节点', href: '#gk-timeline' },
        { label: '常见误区', href: '#gk-faq' }
      ]}
      sideNotes={[
        '上海高招最容易混淆的是春招、高考、体育类、三校生这几条路径。建议先确认自己属于哪一类，再继续读对应内容。',
        '本科普通批 24 个院校专业组平行志愿采用"分数优先、遵循志愿、一轮投档"；达线被投出后若不服调剂或体检不符会被退档，本批次其余志愿同时失效。'
      ]}
      contentId="gaokao-list"
    />
  );
}
