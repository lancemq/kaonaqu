import Link from 'next/link';
import admissionTimeline from '../../../lib/admission-timeline';
import { NewsAerialFooter, NewsAerialHero, NewsAerialKicker, NewsAerialNav } from '../../../components/news-aerial-ui';

export const metadata = {
  title: '官方招生日程 | 考哪去',
  description: '集中查看上海升学官方招生日程，包括中招报名、体育类考试、补报名、志愿确认、考试安排和特殊教育招生关键时间节点。'
};

function getTimelineGroup(item) {
  if (item.tag.includes('体育')) return '体育考试';
  if (item.tag.includes('志愿')) return '志愿录取';
  if (item.tag.includes('报名')) return '报名与确认';
  if (item.tag.includes('考试')) return '考试节点';
  if (item.tag.includes('特殊教育')) return '特殊教育';
  return '综合安排';
}

function parseWindowValue(windowText) {
  const dayMatch = String(windowText || '').match(/(\d{1,2})月(\d{1,2})日/);
  if (dayMatch) return Number(dayMatch[1]) * 100 + Number(dayMatch[2]);
  const monthMatch = String(windowText || '').match(/(\d{1,2})月/);
  if (monthMatch) return Number(monthMatch[1]) * 100;
  return 9999;
}

export default function AdmissionTimelinePage() {
  const sortedTimeline = [...admissionTimeline].sort((a, b) => parseWindowValue(a.window) - parseWindowValue(b.window));
  const today = new Date();
  const todayValue = (today.getMonth() + 1) * 100 + today.getDate();
  const upcomingItems = sortedTimeline.filter((item) => parseWindowValue(item.window) >= todayValue);
  const recentPastItems = [...sortedTimeline]
    .filter((item) => parseWindowValue(item.window) < todayValue)
    .sort((a, b) => parseWindowValue(b.window) - parseWindowValue(a.window));
  const nextItems = [...upcomingItems, ...recentPastItems].slice(0, 4);
  const groupSummary = [
    { label: '报名与确认', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '报名与确认').length, hint: '先看资格、补报名和现场确认。' },
    { label: '体育考试', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '体育考试').length, hint: '补上体育类专业考试、确认和成绩节点。' },
    { label: '考试节点', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '考试节点').length, hint: '重点关注听说、实验和笔试安排。' },
    { label: '志愿录取', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '志愿录取').length, hint: '别漏掉网上填报后的签字确认。' },
    { label: '特殊教育', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '特殊教育').length, hint: '单独列出特教中招的关键操作时间。' }
  ];

  return (
    <main className="news-special-aerial-page">
      <NewsAerialNav />
      <NewsAerialHero
        kicker="ADMISSION TIMELINE"
        title="官方招生日程"
        description="把上海中考报名、个别报名、体育类考试、志愿确认、统考和特殊教育招生的关键时间节点集中整理。"
        imageClass="is-timeline"
      />

      <section className="news-special-aerial-stats" aria-label="招生日程统计">
        <article><strong>{admissionTimeline.length}</strong><span>关键节点</span></article>
        <article><strong>{groupSummary.length}</strong><span>流程阶段</span></article>
        <article><strong>{nextItems.length}</strong><span>近期优先</span></article>
        <article><strong>官方来源</strong><span>按公开口径整理</span></article>
      </section>

      <section className="news-special-aerial-content" id="timeline-list">
        <div className="news-special-aerial-main">
          <section className="news-special-aerial-section">
            <NewsAerialKicker>STAGE MAP</NewsAerialKicker>
            <h2>先按阶段确认自己现在该看哪一段</h2>
            <div className="news-special-aerial-card-grid">
              {groupSummary.slice(0, 3).map((item) => (
                <article className="news-special-aerial-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.count} 个节点</strong>
                  <p>{item.hint}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="news-special-aerial-section">
            <NewsAerialKicker>NEXT</NewsAerialKicker>
            <h2>近期优先看这些关键时间点</h2>
            <div className="news-special-aerial-stack">
              {nextItems.map((item) => (
                <article className="news-special-aerial-entry" key={`${item.tag}-${item.window}-${item.title}`}>
                  <span>{item.tag} / {item.window}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="news-special-aerial-section">
            <NewsAerialKicker>FULL TIMELINE</NewsAerialKicker>
            <h2>完整时间轴</h2>
            <div>
              {sortedTimeline.map((item) => (
                <article className="news-special-aerial-timeline-item" key={`${item.tag}-${item.window}-${item.title}`}>
                  <div className="news-special-aerial-timeline-date">{item.window}</div>
                  <div className="news-special-aerial-entry">
                    <span>{item.tag} / {item.source}</span>
                    <h3>{item.title}</h3>
                    <p>{item.detail || item.summary}</p>
                    {item.links?.length ? (
                      <p>{item.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="news-special-aerial-side">
          <section className="news-special-aerial-side-card is-dark">
            <NewsAerialKicker>HOW TO USE</NewsAerialKicker>
            <h2>使用建议</h2>
            <p>先看“近期优先看”，再回到对应阶段。查到节点后，继续进入中招专题或新闻详情页确认规则和口径。</p>
          </section>
          <section className="news-special-aerial-side-card">
            <span>NEXT</span>
            <Link href="/news/zhongkao-special">进入中招专题</Link>
            <Link href="/news/gaokao-special">进入高招专题</Link>
            <Link href="/news/policy-faq">查看政策问答</Link>
          </section>
        </aside>
      </section>

      <NewsAerialFooter />
    </main>
  );
}
