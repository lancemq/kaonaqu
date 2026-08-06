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
    title: `${label}中考政策详解 | 考哪去`,
    description: `系统梳理${label}中考录取批次、四市六区招生格局、指标生 70% 均衡到校、740 分构成与体育中考，附先填后出分下的志愿填报与录取时间节点。`,
    alternates: { canonical: `/${region}/news/suzhou-zhongkao` }
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

function groupSuzhouZhongkaoNews(news) {
  return {
    batches: news.filter((item) =>
      /批次|志愿|跨区|提前批|第一批|第二批|第三批|统招|分数线|收官|扩容|四市六区|高中段|录取时间/.test(`${item.title}${item.summary}`)),
    quota: news.filter((item) => /指标生|均衡到校|均衡分配/.test(`${item.title}${item.summary}`)),
    score: news.filter((item) =>
      /740|分怎么算|体育中考|体育50|日常考核|统一考试|两考合一|艺术等级|分值/.test(`${item.title}${item.summary}`)),
    qualification: news.filter((item) => /非苏籍|积分入学|报名|资格|随迁|居住证/.test(`${item.title}${item.summary}`))
  };
}

function pickItemsById(items, ids) {
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
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

export default async function SuzhouZhongkaoSpecialPage() {
  const { region, config } = await getRegionContext();
  const news = await loadNewsList(region);
  const currentYear = getCurrentYear(news);
  const zhongkaoNews = news
    .filter((item) => item.examType === 'zhongkao' && isCurrentYearItem(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const zhongkaoPolicies = zhongkaoNews.filter((item) => item.newsType === 'policy');

  const leadNews = zhongkaoNews[0] || null;
  const groups = groupSuzhouZhongkaoNews(zhongkaoNews);
  const officialFocus = pickItemsById([...zhongkaoNews, ...zhongkaoPolicies], [
    'suzhou-2026-sixing-zhibiaosheng-0805',
    'suzhou-2026-sishi-liuqu-geju-0805'
  ]);

  function getCurrentPhaseLabel() {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month >= 1 && month <= 5) return '政策发布与备考阶段，建议先把 740 分构成、四市六区招生格局与指标生 70% 均衡规则这三项框架看清。';
    if (month === 6) return '中考与志愿填报阶段，6/17-19 笔试、6/21-23 填志愿（先填后出分），重点核对志愿代码与跨区 10 个平行志愿。';
    if (month >= 7 && month <= 8) return '录取阶段，关注跨区招生、提前批、第一批及后续批次投档，跟踪指标生与统招分数线。';
    return '建议优先关注下一年度中招政策发布与报名信息采集。';
  }

  const currentChecklist = [
    getCurrentPhaseLabel(),
    '指标生家庭重点看校内位次而非跨校绝对分——四星高中 70% 计划均衡到校，"家门口初中"的校内排名更具决定性。',
    '跨区家庭把姑苏/园区/新区三区互跨规则与跨区招生 10 个平行志愿拆开看，避免把区内竞争和跨区机会混在一起。'
  ];

  const keyFacts = [
    { title: '总分 740 分', detail: '语数各 130、英语 130（书面 100+听力口语 30）、物化各 100、道德与法治/历史/体育各 50；艺术等级呈现不计分，但 B 等及以上方可报四星高中。两考合一。' },
    { title: '四市六区招生格局', detail: '姑苏区、工业园区、高新区三区可互跨；吴中、吴江、相城及常熟、张家港、昆山、太仓仅填本区高中。部分四星与热点高中面向六区跨区招生，设 10 个平行志愿。' },
    { title: '指标生 70% 均衡到校', detail: '四星级普通高中指标生比例为招生计划的 70%，按各初中符合条件的毕业生人数均衡分配到校，校内位次比跨校绝对分更关键。' },
    { title: '五批次先填后出分', detail: '志愿 6/21-23 填报（中考 6/17-19 后、成绩 6/29 前）。录取依次推进：跨区招生 → 提前批 → 第一批 → 第二批 → 第三批。' }
  ];

  const sectionDefs = [
    { id: 'sz-zk-batches', kicker: 'BATCHES', title: '录取批次、志愿与招生格局', desc: '录取批次顺序、跨区志愿与四市六区招生格局', group: 'batches' },
    { id: 'sz-zk-quota', kicker: 'QUOTA', title: '指标生均衡分配', desc: '70% 计划如何均衡分配到校', group: 'quota' },
    { id: 'sz-zk-score', kicker: 'SCORE', title: '分数构成与体育中考', desc: '740 分各科构成与体育 50 分评分', group: 'score' },
    { id: 'sz-zk-qualification', kicker: 'QUALIFICATION', title: '报名资格与随迁子女升学', desc: '非苏籍家庭报名资格与积分入学', group: 'qualification' }
  ];
  const sections = sectionDefs
    .map((def) => ({ id: def.id, kicker: def.kicker, title: def.title, items: groups[def.group].map(toTopicEntry) }))
    .filter((section) => section.items.length > 0);
  const stageEntries = sections.map((section) => {
    const def = sectionDefs.find((d) => d.id === section.id);
    return { label: section.kicker, title: section.title, description: def.desc, count: section.items.length, anchor: `#${section.id}` };
  });
  const officialItems = (officialFocus.length ? officialFocus : zhongkaoPolicies.length ? zhongkaoPolicies : zhongkaoNews).map(toTopicEntry);

  return (
    <NewsTopicSpecialPage
      kicker="SUZHOU ZHONGKAO"
      title={`${currentYear} ${config.label}中考政策详解`}
      description={`以 ${currentYear} 年苏州市高中阶段学校招生工作意见为依据，系统说明苏州中考录取批次、四市六区招生格局、指标生均衡分配、740 分构成与体育中考。`}
      heroStats={[
        { value: '740', label: '中考录取总分' },
        { value: '5', label: '录取批次' },
        { value: '70%', label: '四星高中指标生比例' },
        { value: zhongkaoNews.length || '0', label: '当年动态' }
      ]}
      facts={keyFacts}
      stageTitle="先看清自己现在更该看哪一段"
      stageDescription="专题按家庭最常遇到的决策顺序拆开：批次与志愿、指标生、分数与体育、报名资格。每段都能直接跳转到对应资料。"
      stageEntries={stageEntries}
      lead={leadNews ? toTopicEntry(leadNews) : null}
      checklist={currentChecklist}
      officialTitle="这几份政策文件决定了今年苏州中招怎么走"
      officialItems={officialItems}
      sections={sections}
      policyTitle="当年中招政策与说明"
      policyItems={officialItems}
      sideLinks={sections.map((section) => ({ label: section.title, href: `#${section.id}` }))}
      sideNotes={[
        '苏州中招最易混的是"四市六区招生格局"与"指标生 70% 均衡到校"两条线：前者决定能报哪些高中，后者决定校内竞争规则。',
        `${currentYear} 年核心时间链：中考 6/17-19、志愿 6/21-23、成绩 6/29、录取 6/30 起跨区招生。`
      ]}
      contentId="suzhou-zhongkao-list"
    />
  );
}
