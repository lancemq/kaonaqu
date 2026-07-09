import { createRequire } from 'module';
import { NewsTopicSpecialPage } from '../../../components/news-topic-special-ui';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { getNewsCategoryLabel, getPolicyExamType } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '中招专题 | 考哪去',
  description: '集中查看上海中招相关的当年新闻、政策、报名与录取信息，方便家长和学生按专题快速了解。',
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

export default async function ZhongkaoSpecialPage() {
  const { news } = await loadDataStore();
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
  const stageEntries = [
    { label: '报名前后', title: '先确认报名与资格', description: '适合先看报名、确认、补报名和资格类新闻。', count: groups.registration.length, anchor: '#zhongkao-registration' },
    { label: '考试阶段', title: '再看考试与成绩安排', description: '重点看听说、实验、笔试和成绩发布时间。', count: groups.exam.length, anchor: '#zhongkao-exam' },
    { label: '录取阶段', title: '最后看志愿与录取', description: '集中看志愿、特长生、自主招生和录取节点。', count: groups.admission.length, anchor: '#zhongkao-admission' }
  ];
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
    '如果你走优秀体育学生、艺术骨干或中职自主招生路径，建议持续跟踪学校资格确认方案和后续测试安排。',
    '普通中招家庭建议把体育与健身测试、听说实验和笔试串成一条完整的准备线来规划。'
  ];
  return (
    <NewsTopicSpecialPage
      variant="zhongkao"
      kicker="ZHONGKAO SPECIAL"
      title={`${currentYear} 上海中招专题`}
      description="面向上海初三家庭，把中招报名、考试、录取和专项招生相关内容按阶段整理，方便按当前进度快速进入。"
      heroStats={[
        { value: zhongkaoNews.length, label: '中招新闻' },
        { value: zhongkaoPolicies.length, label: '相关政策' },
        { value: officialFocus.length, label: '重点文件' }
      ]}
      stageTitle="先判断自己现在更该看哪一段"
      stageDescription="从报名资格到考试安排，再到志愿录取，把中招路径拆成三个能直接行动的阶段。"
      stageEntries={stageEntries}
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
      sideLinks={stageEntries.map((item) => ({ label: item.label, href: item.anchor }))}
      sideNotes={[
        '自主招生、名额分配综合评价录取、统一招生录取，是上海中招最需要先分清的三条主线。',
        '5 月 16 日至 17 日听说和实验、6 月 20 日至 21 日笔试、6 月 23 日至 26 日志愿填报、6 月 27 日至 28 日书面确认，是今年最核心的中招时间链。'
      ]}
      contentId="zhongkao-list"
    />
  );
}
