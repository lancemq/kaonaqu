import Link from 'next/link';
import admissionTimeline from '../../../lib/admission-timeline';
import { NewsAerialFooter, NewsAerialKicker, NewsAerialNav } from '../../../components/news-aerial-ui';

export const metadata = {
  title: '官方招生日程 | 考哪去',
  description: '集中查看上海升学官方招生日程，包括中招报名、体育类考试、补报名、志愿确认、考试安排和特殊教育招生关键时间节点。'
};

const TRACK_LABELS = {
  zhongkao: '中招',
  gaokao: '高招'
};

function getTimelineTrack(item) {
  return /中招|中考|高中阶段|体育统一考试/.test(`${item.tag}${item.title}${item.summary}`)
    ? 'zhongkao'
    : 'gaokao';
}

function getTimelineGroup(item) {
  if (item.tag.includes('体育')) return '体育考试';
  if (item.tag.includes('志愿')) return '志愿录取';
  if (item.tag.includes('报名')) return '报名与确认';
  if (item.tag.includes('考试')) return '考试节点';
  if (item.tag.includes('特殊教育')) return '特殊教育';
  return '综合安排';
}

function parseWindowValue(windowText) {
  const yearMatch = String(windowText || '').match(/(20\d{2})年/);
  const monthMatch = String(windowText || '').match(/(\d{1,2})月/);
  const dayMatch = String(windowText || '').match(/(\d{1,2})月(\d{1,2})日/);
  const year = yearMatch ? Number(yearMatch[1]) : 2026;
  const month = monthMatch ? Number(monthMatch[1]) : 12;
  const day = dayMatch ? Number(dayMatch[2]) : 1;
  return year * 10000 + month * 100 + day;
}

function getMonthLabel(windowText) {
  const rangeMatch = String(windowText || '').match(/(\d{1,2})月.*?(\d{1,2})月/);
  if (rangeMatch && rangeMatch[1] !== rangeMatch[2]) return `${rangeMatch[1]}-${rangeMatch[2]}月`;
  const monthMatch = String(windowText || '').match(/(\d{1,2})月/);
  return monthMatch ? `${monthMatch[1]}月` : '待定';
}

function getTimelineRows(items) {
  const rows = new Map();
  for (const item of items) {
    const month = getMonthLabel(item.window);
    const existing = rows.get(month) || {
      month,
      order: parseWindowValue(item.window),
      zhongkao: [],
      gaokao: []
    };
    existing.order = Math.min(existing.order, parseWindowValue(item.window));
    existing[getTimelineTrack(item)].push(item);
    rows.set(month, existing);
  }

  return [...rows.values()].sort((a, b) => a.order - b.order);
}

function getTodayValue() {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function TimelineCard({ item, compact = false }) {
  const track = getTimelineTrack(item);
  const isPriority = /考试|志愿|录取|确认/.test(`${item.tag}${item.title}`);

  return (
    <article className={`admission-timeline-card is-${track}${isPriority ? ' is-priority' : ''}${compact ? ' is-compact' : ''}`}>
      <span>{TRACK_LABELS[track]}{isPriority ? ' · 重点' : ''}</span>
      <h3>{item.title}</h3>
      <p>{compact ? item.summary : item.detail || item.summary}</p>
      <div className="admission-timeline-card-meta">
        <strong>{item.window}</strong>
        {item.links?.[0] ? <Link href={item.links[0].href}>{item.links[0].label}</Link> : null}
      </div>
    </article>
  );
}

export default function AdmissionTimelinePage() {
  const sortedTimeline = [...admissionTimeline].sort((a, b) => parseWindowValue(a.window) - parseWindowValue(b.window));
  const todayValue = getTodayValue();
  const upcomingItems = sortedTimeline.filter((item) => parseWindowValue(item.window) >= todayValue);
  const recentPastItems = [...sortedTimeline]
    .filter((item) => parseWindowValue(item.window) < todayValue)
    .sort((a, b) => parseWindowValue(b.window) - parseWindowValue(a.window));
  const nextItems = [...upcomingItems, ...recentPastItems].slice(0, 4);
  const timelineRows = getTimelineRows(sortedTimeline);
  const zhongkaoCount = sortedTimeline.filter((item) => getTimelineTrack(item) === 'zhongkao').length;
  const gaokaoCount = sortedTimeline.length - zhongkaoCount;
  const groupSummary = [
    { label: '关键节点', value: `${sortedTimeline.length}+` },
    { label: '流程阶段', value: new Set(sortedTimeline.map(getTimelineGroup)).size },
    { label: '近期优先', value: nextItems.length },
    { label: '官方来源', value: '公开口径' }
  ];

  return (
    <main className="admission-timeline-page">
      <NewsAerialNav />

      <header className="admission-timeline-hero">
        <section className="admission-timeline-hero-inner" aria-label="官方招生日程">
          <div className="admission-timeline-hero-copy">
            <NewsAerialKicker>ADMISSION TIMELINE</NewsAerialKicker>
            <h1>官方招生日程</h1>
            <p>把上海中考报名、体育类考试、志愿确认、统考和特殊教育招生的关键时间节点按时间轴集中整理。</p>
          </div>
          <aside className="admission-timeline-hero-stats" aria-label="招生日程统计">
            {groupSummary.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </aside>
        </section>
      </header>

      <section className="admission-timeline-priority" aria-label="近期优先节点">
        <div className="admission-timeline-priority-head">
          <NewsAerialKicker>NEXT WINDOW</NewsAerialKicker>
          <h2>近期优先看这些关键时间点</h2>
          <p>先处理最近窗口，再回到完整时间轴里按中招、高招两条线对照查看。</p>
        </div>
        <div className="admission-timeline-priority-grid">
          {nextItems.map((item) => (
            <TimelineCard item={item} compact key={`${item.tag}-${item.window}-${item.title}`} />
          ))}
        </div>
      </section>

      <section className="admission-timeline-body" id="timeline-list">
        <div className="admission-timeline-heading">
          <NewsAerialKicker>DUAL TRACK TIMELINE</NewsAerialKicker>
          <h2>中招 & 高招关键节点一览</h2>
          <p>沿时间轴左右展开，蓝色 = 中招，深色 = 高招。上下对照，一目了然。</p>
          <div className="admission-timeline-legend" aria-label="时间轴图例">
            <span><i></i>中招 {zhongkaoCount} 个节点</span>
            <span><i></i>高招 {gaokaoCount} 个节点</span>
          </div>
        </div>

        <div className="admission-timeline-spine">
          {timelineRows.map((row, index) => (
            <section className="admission-timeline-row" key={row.month}>
              <div className="admission-timeline-track">
                {row.zhongkao.map((item) => (
                  <TimelineCard item={item} key={`${item.tag}-${item.window}-${item.title}`} />
                ))}
              </div>
              <div className="admission-timeline-marker" aria-label={row.month}>
                <strong>{row.month}</strong>
                <span className={row.zhongkao.length ? 'is-zhongkao' : 'is-gaokao'}></span>
                {index < timelineRows.length - 1 ? <i></i> : null}
              </div>
              <div className="admission-timeline-track">
                {row.gaokao.map((item) => (
                  <TimelineCard item={item} key={`${item.tag}-${item.window}-${item.title}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="admission-timeline-next">
        <div>
          <NewsAerialKicker>NEXT STEP</NewsAerialKicker>
          <h2>查完时间，再进入对应专题核对规则</h2>
        </div>
        <nav aria-label="招生日程相关入口">
          <Link href="/news/zhongkao-special">中招专题</Link>
          <Link href="/news/gaokao-special">高招专题</Link>
          <Link href="/news/policy-faq">政策问答</Link>
          <Link href="/news/policy-glossary">政策速查</Link>
        </nav>
      </section>

      <NewsAerialFooter />
    </main>
  );
}
