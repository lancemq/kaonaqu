import { createRequire } from 'module';
import { NewsTopicSpecialPage } from '../../../components/news-topic-special-ui';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { getNewsCategoryLabel } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海体育考试改革专题 | 考哪去',
  description: '集中查看上海中考体育改革、过程性评价、统一考试时间表、伤病免缓考与体育特长生招生相关信息，方便家长和学生按专题快速了解。',
  alternates: { canonical: '/news/sports-reform' }
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

function isSportsItem(item) {
  const contentText = Array.isArray(item?.content)
    ? item.content.map((b) => b.text || (Array.isArray(b.items) ? b.items.join(' ') : '')).join(' ')
    : (item?.content || '');
  return /体育/.test(`${item?.title || ''}${item?.summary || ''}${contentText}`);
}

function groupSportsNews(news) {
  return {
    reform: news.filter((item) => /新规|改革|过程性评价|满分/.test(`${item.title}${item.summary}`)),
    exam: news.filter((item) => /时间表|统一考|日常考核|时间安排|考试/.test(`${item.title}${item.summary}`)),
    injury: news.filter((item) => /伤病|免考|缓考|免修/.test(`${item.title}${item.summary}`)),
    recruit: news.filter((item) => /优秀体育|高水平|招收|招生|特长/.test(`${item.title}${item.summary}`)),
    school: news.filter((item) => /体育特色|篮球|田径|游泳|特色/.test(`${item.title}${item.summary}`))
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

export default async function SportsReformPage() {
  const { news } = await loadDataStore();
  const currentYear = getCurrentYear(news);
  const sportsNews = news
    .filter((item) => isCurrentYearItem(item, currentYear) && isSportsItem(item))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const sportsPolicies = news
    .filter((n) => n.newsType === 'policy')
    .filter((item) => isCurrentYearItem(item, currentYear) && isSportsItem(item))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const leadNews = sportsNews[0] || null;
  const groups = groupSportsNews(sportsNews);
  const officialFocus = pickItemsById(
    [...sportsNews, ...sportsPolicies],
    [
      'policy-2026-sports-exam-reform',
      'policy-2026-sports-injury-rules',
      'policy-2026-gaoshuiping-yundong',
      '2026-tiyu-zhaosheng',
      'school-2026-kongjiang-sports'
    ]
  );
  const stageEntries = [
    { label: '改革解读', title: '先看清体育新规怎么改', description: '重点看过程性评价、统一考试与日常考核的构成变化。', count: groups.reform.length, anchor: '#sports-reform' },
    { label: '考试安排', title: '再看考试时间与项目', description: '集中看 4 月统一考时间表、日常考核节点和项目安排。', count: groups.exam.length, anchor: '#sports-exam' },
    { label: '伤病规则', title: '遇到伤病怎么申请', description: '了解免考、缓考、免修的适用条件与申请窗口。', count: groups.injury.length, anchor: '#sports-injury' },
    { label: '招生通道', title: '最后看体育特长生招生', description: '跟踪优秀体育学生、高水平运动员等专项招生路径。', count: groups.recruit.length, anchor: '#sports-recruit' }
  ];
  function getCurrentPhaseLabel() {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month >= 1 && month <= 3) return '政策发布与日常考核累计阶段，建议先把体育考试总分构成、过程性评价要求和统一考时间这三项框架看清。';
    if (month === 4 || month === 5) return '统一考试与伤病申请阶段，建议重点跟进 4 月统一考时间表和伤病免考/缓考申请窗口。';
    if (month === 6) return '考试与志愿衔接阶段，考后关注体育成绩计入与志愿填报安排。';
    if (month >= 7 && month <= 8) return '录取阶段，体育特长生家庭重点跟踪优秀体育学生与高水平运动员招生结果。';
    return '建议优先关注下一年度体育改革动向与日常考核累计要求。';
  }

  const currentChecklist = [
    getCurrentPhaseLabel(),
    '如果你走优秀体育学生或高水平运动员路径，建议持续跟踪资格确认方案、统考安排与合格线这一条完整链路。',
    '普通中招家庭建议把过程性评价、日常考核和 4 月统一考拆开看，避免把改革解读和考试安排混在一起。'
  ];
  const keyFacts = [
    { title: '总分构成', detail: '上海中考体育与健身满分为 30 分，由日常考核与统一考试两部分组成，计入中考录取总分。' },
    { title: '统一考试', detail: '4 月进行统一考试，覆盖体能与技能项目，是体育改革后最受关注的变化之一。' },
    { title: '招生通道', detail: '优秀体育学生、高水平运动员招生为体育特长生提供单独通道，需单独完成报名、测试与确认。' }
  ];

  const sections = [
    { id: 'sports-reform', kicker: 'REFORM', title: '改革解读与过程性评价相关内容', items: groups.reform.map(toTopicEntry) },
    { id: 'sports-exam', kicker: 'EXAM', title: '统一考试与时间安排相关内容', items: groups.exam.map(toTopicEntry) },
    { id: 'sports-injury', kicker: 'INJURY RULES', title: '伤病免考与缓考相关内容', items: groups.injury.map(toTopicEntry) },
    { id: 'sports-recruit', kicker: 'RECRUIT', title: '体育特长生与高水平运动员招生', items: groups.recruit.map(toTopicEntry) }
  ];
  if (groups.school.length) {
    sections.push({ id: 'sports-school', kicker: 'SCHOOL', title: '体育特色学校相关内容', items: groups.school.map(toTopicEntry) });
  }

  return (
    <NewsTopicSpecialPage
      variant="sports"
      kicker="SPORTS REFORM SPECIAL"
      title={`${currentYear} 上海体育考试改革专题`}
      description="把中考体育改革、过程性评价、统一考试时间表、伤病免缓考和体育特长生招生串成一条清晰的行动线。"
      heroStats={[
        { value: sportsNews.length, label: '体育新闻' },
        { value: sportsPolicies.length, label: '相关政策' },
        { value: officialFocus.length, label: '重点文件' }
      ]}
      facts={keyFacts}
      stageTitle="先判断自己现在更该看哪一段"
      stageDescription="专题按家庭最常遇到的决策顺序拆开：规则、考试、伤病、招生。每段都能直接跳转到对应资料。"
      stageEntries={stageEntries}
      lead={leadNews ? toTopicEntry(leadNews) : null}
      checklist={currentChecklist}
      officialTitle="这几份文件决定了今年上海体育考试改革怎么走"
      officialItems={officialFocus.map(toTopicEntry)}
      sections={sections}
      policyTitle="当年体育相关招生政策与说明"
      policyItems={sportsPolicies.map(toTopicEntry)}
      sideLinks={stageEntries.map((item) => ({ label: item.label, href: item.anchor }))}
      sideNotes={[
        '上海体育考试改革最容易混淆的是「过程性评价」「日常考核」「统一考试」三个概念。看不清时先分清这三者，再读这一页会更顺。',
        '4 月统一考试、伤病免缓考申请窗口、优秀体育学生资格确认，是今年体育改革专题里最核心的时间链。'
      ]}
      contentId="sports-list"
    />
  );
}
