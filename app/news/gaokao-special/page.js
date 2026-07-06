import { createRequire } from 'module';
import { NewsTopicSpecialPage } from '../../../components/news-topic-special-ui';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { getNewsCategoryLabel, getPolicyExamType } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '高招专题 | 考哪去',
  description: '集中查看上海高招相关的当年新闻、政策、报名与录取信息，方便家长和学生按专题快速了解。',
  alternates: { canonical: '/news/gaokao-special' }
};

function getCurrentYear(news, policies) {
  const years = [...news, ...policies]
    .map((item) => Number(String(item?.publishedAt || '').slice(0, 4)) || Number(item?.year) || 0)
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

export default async function GaokaoSpecialPage() {
  const { news, policies } = await loadDataStore();
  const currentYear = getCurrentYear(news, policies);
  const gaokaoNews = news
    .filter((item) => item.examType === 'gaokao' && isCurrentYearItem(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const gaokaoPolicies = policies
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
    { label: '春招与自招', title: '先看春招和专科自主招生', description: '适合正在跟进春考、自主招生和征求志愿的家庭。', count: groups.spring.length, anchor: '#gaokao-spring' },
    { label: '考试与学考', title: '再看高考与学业考试', description: '重点看高考、学考、成绩和考试安排。', count: groups.exam.length, anchor: '#gaokao-exam' },
    { label: '专项路径', title: '最后看体育类和三校生', description: '集中查看体育类、三校生、保送等专项路径。', count: groups.special.length, anchor: '#gaokao-special-track' }
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
      kicker="GAOKAO SPECIAL"
      title={`${currentYear} 上海高招专题`}
      description="面向上海高中升学家庭，把春招、高考、学业考试、体育类和三校生相关信息按路径整理，方便按当前进度快速进入。"
      heroStats={[
        { value: gaokaoNews.length, label: '高招新闻' },
        { value: gaokaoPolicies.length, label: '相关政策' },
        { value: officialFocus.length, label: '重点文件' }
      ]}
      stageTitle="先判断自己现在更该进入哪一条高招路径"
      stageDescription="春招与自招、高考与学考、专项升学路径分开读，避免把不同批次和不同资格要求混在一起。"
      stageEntries={stageEntries}
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
      sideLinks={stageEntries.map((item) => ({ label: item.label, href: item.anchor }))}
      sideNotes={[
        '上海高招最容易混淆的是春招、高考、体育类、三校生这几条路径。建议先确认自己属于哪一类，再继续读对应内容。',
        '2026 年 4 月初这一阶段，专题里最值得优先看的通常是专科自主招生征求志愿、体育类成绩与合格线、三校生实施办法和学考命题要求。'
      ]}
      contentId="gaokao-list"
    />
  );
}
