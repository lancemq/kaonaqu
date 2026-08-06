import { createRequire } from 'module';
import { NewsTopicSpecialPage } from '../../../components/news-topic-special-ui';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { getNewsCategoryLabel } from '../../../lib/site-utils';
import { getRegionContext } from '../../../lib/region-server.mjs';

const require = createRequire(import.meta.url);
const { loadNewsList } = require('../../../shared/data-store');

export async function generateMetadata() {
  const { region, config } = await getRegionContext();
  const label = config.label;
  return {
    title: `${label}高考与选考专题 | 考哪去`,
    description: `梳理${label}所属江苏高考"3+1+2"模式、2027 版选考科目要求（物化双选占比 46.73%）与 2026 录取时间轴、省控线与苏州高校投档线。`,
    alternates: { canonical: `/${region}/news/suzhou-gaokao` }
  };
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

function groupGaokaoNews(news) {
  return {
    subjects: news.filter((item) =>
      /选考|选科|科目要求|3\+1\+2|物化|首选|再选|双新/.test(`${item.title}${item.summary}`)),
    admission: news.filter((item) =>
      /录取|投档|时间轴|省控线|分数线|批次|通知书|查询/.test(`${item.title}${item.summary}`))
  };
}

function toTopicEntry(item) {
  return {
    id: item.id,
    href: getPolicyDetailHref(item),
    date: item.publishedAt || item.year || '暂无日期',
    source: item.source?.name || getNewsCategoryLabel(item),
    title: item.title,
    summary: item.summary
  };
}

export default async function SuzhouGaokaoSpecialPage() {
  const { region, config } = await getRegionContext();
  const news = await loadNewsList(region);
  const currentYear = getCurrentYear(news);
  const gaokaoNews = news
    .filter((item) => item.examType === 'gaokao' && isCurrentYearItem(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const gaokaoPolicies = gaokaoNews.filter((item) => item.newsType === 'policy');

  const leadNews = gaokaoNews[0] || null;
  const groups = groupGaokaoNews(gaokaoNews);

  function getCurrentPhaseLabel() {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month >= 1 && month <= 5) return '备考与选科阶段，建议先把"3+1+2"模式与 2027 版选考科目要求看清，尤其物化双选的覆盖面与收紧趋势。';
    if (month === 6) return '高考与志愿填报阶段，6 月统考后关注成绩公布与本科批志愿填报规则。';
    if (month >= 7 && month <= 8) return '录取阶段，跟踪提前批、本科批、专科批时间轴与苏州高校投档线、通知书发放。';
    return '建议优先关注下一年度选考科目要求与高考报名安排。';
  }

  const currentChecklist = [
    getCurrentPhaseLabel(),
    '选科先看 2027 版要求：物化双选专业占比 46.73% 且持续收紧，理工方向建议物化双选以扩大专业覆盖。',
    '录取时间链：提前批 7/8-14、本科批 7/18-25、专科批 8/1-7，关注苏州高校投档线与通知书发放进度。'
  ];

  const keyFacts = [
    { title: '3+1+2 模式', detail: '语数外统考 + 物理/历史首选 1 科 + 化学/生物/思政/地理再选 2 科，满分 750 分。江苏高考延续此模式。' },
    { title: '2027 版选考要求', detail: '物化双选专业占比 46.73%，较 2024 版提升 1.96 个百分点，理工科"物化捆绑"继续收紧；中医等部分专业也要求物化。' },
    { title: '2026 录取时间轴', detail: '7/8 启动、8 月中旬结束。提前批 7/8-14、本科批 7/18-25、专科批 8/1-7、专科补录其后。' },
    { title: '省控线与计划', detail: '本科批物理类 456/历史类 484；特招线物理 513/历史 532；专科 220。本科批 1070 所院校、计划招生 233457 人。' }
  ];

  const sectionDefs = [
    { id: 'sz-gk-subjects', kicker: 'SUBJECTS', title: '选考科目要求与"3+1+2"', desc: '选科组合、物化双选覆盖面与收紧趋势', group: 'subjects' },
    { id: 'sz-gk-admission', kicker: 'ADMISSION', title: '录取时间轴与省控线', desc: '批次时间、省控线与苏州高校投档线', group: 'admission' }
  ];
  const sections = sectionDefs
    .map((def) => ({ id: def.id, kicker: def.kicker, title: def.title, items: groups[def.group].map(toTopicEntry) }))
    .filter((section) => section.items.length > 0);
  const stageEntries = sections.map((section) => {
    const def = sectionDefs.find((d) => d.id === section.id);
    return { label: section.kicker, title: section.title, description: def.desc, count: section.items.length, anchor: `#${section.id}` };
  });
  const officialItems = (gaokaoPolicies.length ? gaokaoPolicies : gaokaoNews).map(toTopicEntry);

  return (
    <NewsTopicSpecialPage
      kicker="SUZHOU GAOKAO"
      title={`${currentYear} ${config.label}高考与选考专题`}
      description="把江苏高考「3+1+2」模式、2027 版选考科目要求与 2026 录取时间轴、省控线串成一条清晰的行动线。"
      heroStats={[
        { value: '750', label: '高考总分' },
        { value: '3+1+2', label: '考试模式' },
        { value: '46.73%', label: '物化双选专业占比' },
        { value: gaokaoNews.length || '0', label: '专题动态' }
      ]}
      facts={keyFacts}
      stageTitle="先看清选科还是先盯录取"
      stageDescription="两条主线：选科决定专业覆盖面，录取时间轴决定各批次跟进节奏。每段都能直接跳转到对应资料。"
      stageEntries={stageEntries}
      lead={leadNews ? toTopicEntry(leadNews) : null}
      checklist={currentChecklist}
      officialTitle="这几份文件决定了今年江苏高考与选考怎么走"
      officialItems={officialItems}
      sections={sections}
      policyTitle="当年高考与选考相关政策与说明"
      policyItems={officialItems}
      sideLinks={sections.map((section) => ({ label: section.title, href: `#${section.id}` }))}
      sideNotes={[
        '苏州高考最易混的是"3+1+2 模式"与"2027 版选考科目要求"：前者是考试结构，后者决定专业覆盖面，两者要一起看。',
        '2026 录取核心时间链：提前批 7/8-14、本科批 7/18-25、专科批 8/1-7；苏州高校投档线与通知书在本科批后陆续公布。'
      ]}
      contentId="suzhou-gaokao-list"
    />
  );
}
