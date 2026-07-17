import { createRequire } from 'module';
import { NewsTopicSpecialPage } from '../../../components/news-topic-special-ui';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { getNewsCategoryLabel, getPolicyExamType } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadNewsList } = require('../../../shared/data-store');

export const metadata = {
  title: '上海中招政策详解 | 考哪去',
  description: '以 2026 年上海市中招办法为依据，系统说明上海中考招生录取的三大批次、750 分构成、名额分配综合评价、自主招生、志愿填报与政策性照顾加分，附关键时间节点与常见误区。',
  alternates: { canonical: '/news/zhongkao-special' }
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

function groupZhongkaoNews(news) {
  return {
    registration: news.filter((item) => /报名|确认|资格/.test(`${item.title}${item.summary}`)),
    exam: news.filter((item) => /考试|成绩|准考证|听说|实验/.test(`${item.title}${item.summary}`)),
    admission: news.filter((item) => /录取|志愿|招生|特长|体育|艺术|自主/.test(`${item.title}${item.summary}`))
  };
}

function pickItemsById(items, ids) {
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
}

function getDetailHref(item) {
  return getPolicyDetailHref(item);
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
    id: 'zk-batches',
    wrapper: 'policy-process-section',
    type: 'process',
    flow: true,
    kicker: '录取批次',
    title: '三大批次依次录取：自主招生 → 名额分配综合评价 → 统一招生',
    intro: '三批次按顺序投档，一旦被前一批次正式录取，其后所有志愿自动失效。冲自招也要认真填后面的保底。',
    steps: [
      {
        label: '批次一',
        title: '自主招生录取',
        tags: ['市实验/特色高中 2 志愿', '中职自招平行志愿', '签约预录取'],
        desc: '含市实验性示范性高中、市特色普通高中、国际课程班及中职校自主招生。高中自招须校测并签约预录取，仅可签 1 所。'
      },
      {
        label: '批次二',
        title: '名额分配综合评价录取',
        tags: ['到区 1 志愿', '到校 2 平行志愿', '含综评 50 分'],
        desc: '市实验性示范性高中约 65% 计划用于名额分配，按"学业考 750 + 综评 50 = 800 分"排序投档。'
      },
      {
        label: '批次三',
        title: '统一招生录取',
        tags: ['1–15 平行志愿', '征求志愿', '按分录取'],
        desc: '未在前两批录取者进入统一招生，按分数优先原则录取；未录满学校组织征求志愿。'
      }
    ]
  },
  {
    id: 'zk-score',
    wrapper: 'policy-relation-section',
    type: 'relation',
    kicker: '考试总分',
    title: '初中学业水平考试：750 分如何构成',
    intro: '闭卷笔试、开卷笔试、日常考核与多项提前测试共同组成 750 分。道德与法治、历史为开卷且各含 30 分日常考核，体育含 15 分日常考核。',
    items: [
      { value: '150', title: '语文', detail: '闭卷笔试，100 分钟。' },
      { value: '150', title: '数学', detail: '闭卷笔试，100 分钟。' },
      { value: '150', title: '外语', detail: '笔试 140（含听力 25）+ 听说测试 10。' },
      { value: '60', title: '道德与法治', detail: '开卷笔试 30 + 日常考核 30。' },
      { value: '60', title: '历史', detail: '开卷笔试 30 + 日常考核 30。' },
      { value: '30', title: '体育与健身', detail: '统一测试 15 + 日常考核 15。' },
      { value: '150', title: '综合测试', detail: '物理 70 + 化学 50 + 跨学科案例分析 15 + 理化实验操作 15。' },
      { value: '750', title: '合计', detail: '以上七科合计满分为 750 分。' }
    ]
  },
  {
    id: 'zk-allocation',
    wrapper: 'policy-glossary-list',
    type: 'glossary',
    kicker: '名额分配',
    title: '名额分配综合评价：65% 计划怎么分、800 分怎么算',
    intro: '名额分配是市实验性示范性高中招生主渠道，核心看"含综评的 800 分"。',
    groups: [
      {
        heading: '计划比例与计分',
        terms: [
          {
            term: '名额分配占本校计划约 65%',
            meta: [{ label: '委属', value: '65%' }, { label: '区属', value: '50%–65%' }],
            details: [
              { label: '到区', value: '委属约 80% / 区属约 30%（其中 90%–95% 分配到外区）' },
              { label: '到校', value: '委属约 20% / 区属约 70%，须覆盖本区每所不选择生源初中' }
            ],
            source: '沪教委规〔2021〕2号'
          },
          {
            term: '综合素质评价 50 分',
            details: [
              { label: '合格', value: '直接赋 50 分' },
              { label: '不合格', value: '酌情扣分，影响名额分配排序' }
            ],
            desc: '以《上海市初中学生综合素质纪实报告》为依据，须公示并由家长签字确认后报市考试院。'
          },
          {
            term: '合成总分 800 分',
            details: [{ label: '公式', value: '学业考试 750 + 综合素质评价 50' }],
            desc: '按 800 分排序投档；同分末位依次比较综合素质评价、语数外合计、数学、语文、综合测试成绩。'
          }
        ]
      }
    ]
  },
  {
    id: 'zk-zizhao',
    wrapper: 'policy-relation-section',
    type: 'relation',
    kicker: '自主招生',
    title: '自主招生四类：招生计划与签约规则',
    items: [
      { value: '约10%', title: '市实验/特色高中自招', detail: '市实验性示范性高中自招约 10%、市特色高中不超过 15%、拔尖创新基地约 30%；填 2 志愿，校测后签约预录取，只可签 1 所。' },
      { value: '≥15%', title: '体艺自招', detail: '体育/艺术骨干生自招计划合计不低于全市该类 15%；须先取得资格确认再填 2 志愿，足额签约。' },
      { value: '单列', title: '国际课程班', detail: '计划单列，由学校自行组织（不在招考热线填报）；民办非沪生源计划原则不超 50%。' },
      { value: '平行', title: '中职校自招', detail: '中本贯通 2 平行（仅沪籍、须达普高线）、五年一贯+中高职贯通 5 平行、中职提前招生 3 平行。' }
    ]
  },
  {
    id: 'zk-zhiyuan',
    wrapper: 'policy-glossary-list',
    type: 'glossary',
    kicker: '志愿填报',
    title: '志愿填报与书面确认：时间、规则与红线',
    groups: [
      {
        heading: '时间与规则',
        terms: [
          {
            term: '考后知分前填报',
            meta: [{ label: '2026 网报', value: '6月23–26日' }, { label: '书面确认', value: '6月27–28日' }],
            details: [
              { label: '平台', value: '上海招考热线 www.shmeea.edu.cn' },
              { label: '确认要求', value: '学生及家长本人签字，未确认则该批次志愿无效' }
            ],
            desc: '所有批次志愿统一在学业考试后、成绩公布前网上填报。'
          },
          {
            term: '各批次志愿数量',
            details: [
              { label: '自主招生', value: '市实验/特色高中 2 志愿；中职自招多组平行' },
              { label: '名额分配', value: '到区 1 + 到校 2 平行' },
              { label: '统一招生', value: '1–15 平行志愿 + 征求志愿' }
            ],
            desc: '自主招生一旦正式录取，名额分配与统一招生志愿全部失效。'
          },
          {
            term: '三条红线',
            details: [
              { label: '截止', value: '6月26日15:00 后任何人不得修改或补报' },
              { label: '代码', value: '核对 6 位招生代码、本部/分校、公/民办、住宿收费' },
              { label: '确认', value: '签字确认后不可更改任何志愿信息' }
            ],
            desc: '错过书面确认等于弃报该批次，招考机构不受理更改、顺延、放弃、补填。'
          }
        ]
      }
    ]
  },
  {
    id: 'zk-zengfen',
    wrapper: 'policy-relation-section',
    type: 'relation',
    kicker: '政策加分',
    title: '政策性照顾加分与同分优先（2026 主要类别）',
    items: [
      { value: '+20', title: '烈士子女', detail: '须区退役军人事务局证明。' },
      { value: '+20', title: '特定军人子女', detail: '现役三类以上艰苦边远、二类以上岛屿、西藏、飞行潜艇航天涉核等高风险岗位军人子女。' },
      { value: '+10', title: '作战/因公牺牲/伤残军人子女', detail: '一至四级残疾军人子女、平时二等功或战时三等功以上军人子女。' },
      { value: '+10', title: '消防救援/公安民警子女', detail: '英模及因公牺牲、一至四级伤残人员子女，驻边远艰苦地区人员子女。' },
      { value: '+5', title: '归侨/华侨/台生', detail: '归侨青年、归侨子女、华侨在国内子女、台湾省学生。' },
      { value: '+5', title: '少数民族学生', detail: '2026 起收窄：仅初中阶段从边疆、山区、牧区、少数民族聚居区转学来沪就读者加 5 分。' },
      { value: '同分', title: '其他军人/消防子女', detail: '不加分，仅在名额分配与统一招生批次享受同分优先。' },
      { value: '取一', title: '多项不累计', detail: '加分只取最高一项，且最高不超过 20 分。' }
    ]
  },
  {
    id: 'zk-timeline',
    wrapper: 'policy-process-section',
    type: 'process',
    flow: false,
    kicker: '全年节点',
    title: '2026 中招关键时间链',
    intro: '以 2026 年办法为准，与 2025 年相比整体后移约一周；最低投档控制线于 7 月 14 日公布。',
    steps: [
      { label: '2–3月', title: '政策与报名', desc: '市教委发布年度中招意见（2/26）；学业考试报名由学校集体办理。' },
      { label: '4–5月', title: '体育统测与测试', desc: '体育统一测试；5/16–17 外语听说测试与理化实验操作；5 月底前中职自招面试测试。' },
      { label: '6月', title: '笔试与填报', desc: '6/1 体育与综评结果公布；6/20–21 学业考试笔试；6/23–26 网报志愿；6/27–28 书面确认。' },
      { label: '7月', title: '自招与成绩', desc: '7/1–3 高中自招综合测试；7/5 预录取签约；7/14 公布成绩与最低投档控制线。' },
      { label: '7月后', title: '统一招生录取', desc: '统一招生录取、征求志愿由各区在 7 月中旬后组织。' }
    ]
  },
  {
    id: 'zk-faq',
    wrapper: 'policy-glossary-list',
    type: 'faq',
    kicker: '常见误区',
    title: '家长最该避开的几个坑',
    items: [
      { question: '“填了自主招生就不用管后面的志愿”？', answer: '错。自主招生志愿也应同步填名额分配和统一招生作为保底；一旦自招正式录取，后续志愿才自动失效。' },
      { question: '“名额分配到校谁都能报”？', answer: '仅限不选择生源初中在籍在读满 3 年的应届生；往届生、返沪生、跨区报名应届生、选择生源校学生不能填报。' },
      { question: '“少数民族都加 5 分”？', answer: '2026 起收窄为“初中阶段从边疆、山区、牧区、少数民族聚居地区转学来沪就读”的少数民族学生，一般在本市就读的不再加分。' },
      { question: '“随迁子女也能读普高”？', answer: '积分未满分仅能报中职类；想读普通高中须父母一方居住证积分满 120 分。' },
      { question: '“实验/听说考砸了就没救”？', answer: '理化实验操作可参加 2 次、取较好成绩计入；体育设缓考补考，因伤病可申请，别错过窗口。' },
      { question: '“加分能叠加”？', answer: '多项加分不累计，只取最高一项且最高不超 20 分；部分军人/消防子女仅为同分优先而非加分。' }
    ]
  }
];

export default async function ZhongkaoSpecialPage() {
  const news = await loadNewsList();
  const currentYear = getCurrentYear(news);
  const zhongkaoNews = news
    .filter((item) => item.examType === 'zhongkao' && isCurrentYearItem(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const zhongkaoPolicies = news
    .filter((n) => n.newsType === 'policy')
    .filter((item) => isCurrentYearItem(item, currentYear) && getPolicyExamType(item) === 'zhongkao')
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const leadNews = zhongkaoNews[0] || null;
  const groups = groupZhongkaoNews(zhongkaoNews);
  const officialFocus = pickItemsById(
    [...zhongkaoNews, ...zhongkaoPolicies],
    [
      'exam-2026-zhongzhao-opinion',
      'exam-2026-zhongzhao-implementation-rules',
      'admission-2026-outstanding-sports-students',
      'admission-2026-secondary-vocational-self',
      'admission-2026-special-education-high-school'
    ]
  );
  function getCurrentPhaseLabel() {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month >= 1 && month <= 3) return '政策发布与报名阶段，建议先把总分构成、考试日期和志愿规则这三项框架看清。';
    if (month === 4 || month === 5) return '考试准备阶段，建议把体育测试、听说实验和笔试串成一条准备线。';
    if (month === 6) return '笔试与志愿填报阶段，考后集中关注志愿填报规则和书面确认时间。';
    if (month >= 7 && month <= 8) return '录取阶段，重点关注批次投档结果和征求志愿安排。';
    return '建议优先关注下一年度中招政策发布和报名信息采集。';
  }

  const currentChecklist = [
    getCurrentPhaseLabel(),
    '若走优秀体育学生、艺术骨干或中职自主招生路径，持续跟踪学校资格确认方案和后续测试安排。',
    '普通中招家庭把体育与健身测试、听说实验和笔试串成一条完整的准备线来规划。'
  ];
  return (
    <NewsTopicSpecialPage
      variant="zhongkao"
      kicker="ZHONGKAO POLICY"
      title="上海中招政策详解"
      description="以 2026 年上海市高中阶段学校招生办法为依据，系统说明上海中考招生录取的批次、计分、名额分配、自主招生、志愿填报与加分规则。"
      heroStats={[
        { value: '750', label: '中考录取总分' },
        { value: '3', label: '招生录取批次' },
        { value: '65%', label: '市重点名额分配比例' },
        { value: zhongkaoNews.length || '0', label: '当年动态' }
      ]}
      policyBlocks={policyBlocks}
      lead={leadNews ? toTopicEntry(leadNews) : null}
      checklist={currentChecklist}
      officialTitle="这几份文件决定了今年上海中招怎么走"
      officialItems={officialFocus.map(toTopicEntry)}
      sections={[
        { id: 'zhongkao-registration', kicker: 'REGISTRATION', title: '报名、确认与资格相关内容', items: groups.registration.map(toTopicEntry) },
        { id: 'zhongkao-exam', kicker: 'EXAM', title: '考试、成绩与时间安排', items: groups.exam.map(toTopicEntry) },
        { id: 'zhongkao-admission', kicker: 'ADMISSION', title: '志愿、专项招生与录取相关内容', items: groups.admission.map(toTopicEntry) }
      ]}
      policyTitle="当年中招政策与说明"
      policyItems={zhongkaoPolicies.map(toTopicEntry)}
      sideLinks={[
        { label: '三大批次', href: '#zk-batches' },
        { label: '750 分构成', href: '#zk-score' },
        { label: '名额分配', href: '#zk-allocation' },
        { label: '自主招生', href: '#zk-zizhao' },
        { label: '志愿填报', href: '#zk-zhiyuan' },
        { label: '加分项目', href: '#zk-zengfen' },
        { label: '时间节点', href: '#zk-timeline' },
        { label: '常见误区', href: '#zk-faq' }
      ]}
      sideNotes={[
        '自主招生、名额分配综合评价录取、统一招生录取，是上海中招最需要先分清的三条主线。',
        '2026 年核心时间链：5/16–17 听说与实验、6/20–21 笔试、6/23–26 志愿填报、6/27–28 书面确认、7/14 成绩与控分线公布。'
      ]}
      contentId="zhongkao-list"
    />
  );
}
