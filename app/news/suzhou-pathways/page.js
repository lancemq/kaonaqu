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
    title: `${label}升学路径专题 | 考哪去`,
    description: `梳理${label}中考后的多元升学通道：职教高考班、中高职贯通（3+4、5+2）与现代职教贯通，以及国际课程与中外合作办学高中（A-Level/AP/IBDP 等）的代表校与课程差异。`,
    alternates: { canonical: `/${region}/news/suzhou-pathways` }
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

function isPathwayItem(item) {
  const text = `${item.title || ''}${item.summary || ''}`;
  return /职教|贯通|3\+4|5\+2|职教高考|国际课程|中外合作|UWC|A-Level|IBDP|国际学校|国际教育/.test(text);
}

function groupPathwayNews(news) {
  return {
    vocational: news.filter((item) =>
      /职教|贯通|3\+4|5\+2|职教高考|职业本科/.test(`${item.title}${item.summary}`)),
    international: news.filter((item) =>
      /国际课程|中外合作|UWC|A-Level|IBDP|国际学校|国际教育|课程方向/.test(`${item.title}${item.summary}`))
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

export default async function SuzhouPathwaysSpecialPage() {
  const { region, config } = await getRegionContext();
  const news = await loadNewsList(region);
  const currentYear = getCurrentYear(news);
  const pathwayNews = news
    .filter((item) => isCurrentYearItem(item, currentYear) && isPathwayItem(item))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const pathwayPolicies = pathwayNews.filter((item) => item.newsType === 'policy');

  const leadNews = pathwayNews[0] || null;
  const groups = groupPathwayNews(pathwayNews);

  const currentChecklist = [
    '职教通道适合"就业与升学并重"取向：3+4 中职衔接本科、5+2 高职衔接本科可直接取得本科学历，在第一批按中考总分统一投档。',
    '国际课程择校先定课程方向（A-Level/AP/IBDP/加拿大 BC/香港 DSE/中日），再比代表校升学成果与年学费区间（数万到三四十万）。',
    '普高与职教贯通、国际课程可在第一批混合填报，统一按中考总分从高到低投档，建议保底与冲刺搭配。'
  ];

  const keyFacts = [
    { title: '职教高考班与贯通', detail: '职教高考班、3+4（中职 3 年+本科 4 年）、5+2（高职 5 年+本科 2 年）等项目在第一批设置 10 个平行志愿，按中考总分从高到低统一投档。' },
    { title: '苏州职业技术大学', detail: '市属职业本科院校，在普通类本科批次与专科批次均有招生计划，是职教升学上升路径的重要终点。' },
    { title: '国际课程方向', detail: 'A-Level、AP、IBDP、加拿大 BC、香港 DSE、中日等方向并存；常熟 UWC 以 IBDP 见长、藤校录取突出。' },
    { title: '代表校与学费', detail: '常熟 UWC、苏州外国语（三轨制）、苏州领科（双轨）、德威、阿德科特、中加枫华等；年学费从数万到三四十万不等。' }
  ];

  const sectionDefs = [
    { id: 'sz-pw-vocational', kicker: 'VOCATIONAL', title: '职教升学通道：贯通与职教高考', desc: '3+4、5+2 贯通与职教高考班的填报与投档', group: 'vocational' },
    { id: 'sz-pw-international', kicker: 'INTERNATIONAL', title: '国际课程与中外合作办学高中', desc: '课程方向、代表校与择校对比', group: 'international' }
  ];
  const sections = sectionDefs
    .map((def) => ({ id: def.id, kicker: def.kicker, title: def.title, items: groups[def.group].map(toTopicEntry) }))
    .filter((section) => section.items.length > 0);
  const stageEntries = sections.map((section) => {
    const def = sectionDefs.find((d) => d.id === section.id);
    return { label: section.kicker, title: section.title, description: def.desc, count: section.items.length, anchor: `#${section.id}` };
  });
  const officialItems = (pathwayPolicies.length ? pathwayPolicies : pathwayNews).map(toTopicEntry);

  return (
    <NewsTopicSpecialPage
      kicker="SUZHOU PATHWAYS"
      title={`${currentYear} ${config.label}升学路径专题`}
      description="梳理苏州中考后的多元升学通道：职教高考班、中高职贯通（3+4、5+2）与国际课程高中，帮家庭按取向选对路径。"
      heroStats={[
        { value: '10', label: '第一批平行志愿' },
        { value: '3+4 / 5+2', label: '贯通项目' },
        { value: '6+', label: '国际课程方向' },
        { value: pathwayNews.length || '0', label: '专题动态' }
      ]}
      facts={keyFacts}
      stageTitle="先判断走职教通道还是国际课程"
      stageDescription="两条路径取向不同：职教贯通重就业与升学并重、按中考总分投档；国际课程重海外升学、由学校自招。"
      stageEntries={stageEntries}
      lead={leadNews ? toTopicEntry(leadNews) : null}
      checklist={currentChecklist}
      officialTitle="职教与国际化办学的政策依据"
      officialItems={officialItems}
      sections={sections}
      policyTitle="当年升学路径相关政策与说明"
      policyItems={officialItems}
      sideLinks={sections.map((section) => ({ label: section.title, href: `#${section.id}` }))}
      sideNotes={[
        '苏州升学路径最易混的是"职教贯通"与"国际课程"两条线：前者走中考统一投档、重学历上升；后者走学校自招、重海外升学。',
        '职教 3+4、5+2 在第一批与普高混合填报、按中考总分投档；国际课程班多由学校自行组织招生。'
      ]}
      contentId="suzhou-pathways-list"
    />
  );
}
