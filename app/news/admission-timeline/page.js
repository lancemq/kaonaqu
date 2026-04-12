import SiteShell from '../../../components/site-shell';
import admissionTimeline from '../../../lib/admission-timeline';

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
  const todayValue = 406;
  const upcomingItems = sortedTimeline.filter((item) => parseWindowValue(item.window) >= todayValue);
  const recentPastItems = [...sortedTimeline]
    .filter((item) => parseWindowValue(item.window) < todayValue)
    .sort((a, b) => parseWindowValue(b.window) - parseWindowValue(a.window));
  const nextItems = [...upcomingItems, ...recentPastItems].slice(0, 4);
  const groupSummary = [
    { label: '报名与确认', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '报名与确认').length, hint: '先看资格、补报名和现场确认。', anchor: '#timeline-group-registration' },
    { label: '体育考试', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '体育考试').length, hint: '补上体育类专业考试、确认和成绩节点。', anchor: '#timeline-group-sports' },
    { label: '考试节点', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '考试节点').length, hint: '重点关注听说、实验和笔试安排。', anchor: '#timeline-group-exam' },
    { label: '志愿录取', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '志愿录取').length, hint: '别漏掉网上填报后的签字确认。', anchor: '#timeline-group-volunteer' },
    { label: '特殊教育', count: sortedTimeline.filter((item) => getTimelineGroup(item) === '特殊教育').length, hint: '单独列出特教中招的关键操作时间。', anchor: '#timeline-group-special' }
  ];

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-timeline" aria-label="官方招生日程">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 官方招生日程</p>
              <h1>上海升学官方招生日程</h1>
              <p className="school-prototype-subtitle">把上海中考报名、个别报名、体育类考试、志愿确认、统考和特殊教育招生的关键时间节点集中整理，适合家长先查时间，再继续看专题和单条政策。</p>
              <div className="school-prototype-action-row">
                <a className="action-button" href="#timeline-list">查看日程</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">适合先看</p>
                <h2>正在准备上海报名、确认、考试或志愿填报的家庭，可以先用这页把关键时间节点理清楚。</h2>
                <p>这页更适合当作“查节点工具页”使用，再配合新闻频道和专题页判断下一步。</p>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-glossary-stats news-special-stats">
        <article>
          <strong>{admissionTimeline.length}</strong>
          <span>关键节点</span>
        </article>
        <article>
          <strong>报名 / 体育 / 志愿</strong>
          <span>覆盖主要流程</span>
        </article>
        <article>
          <strong>官方来源</strong>
          <span>按教委公开口径整理</span>
        </article>
        <article>
          <strong>适合收藏</strong>
          <span>查时间时可直接回看</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="timeline-list">
        <section className="school-prototype-main">
          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">阶段入口</p>
            <h2>先按阶段确认自己现在该看哪一段</h2>
            <div className="news-special-stage-grid">
              {groupSummary.map((item, index) => (
                <a key={item.label} className={`news-special-stage-card${item.label === '体育考试' ? ' news-special-stage-card-warm' : ''}`} href={item.anchor}>
                  <span>{item.label}</span>
                  <strong>{item.count} 个节点</strong>
                  <p>{item.hint}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">近期优先看</p>
            <h2>先看这些关键时间点</h2>
            <div className="news-special-compact-grid">
              {nextItems.map((item) => (
                <article key={`${item.tag}-${item.window}-${item.title}`} className="news-special-compact-card">
                  <div className="news-prototype-glossary-meta">
                    <span className="pill">{item.tag}</span>
                    <span>{item.window}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </article>
              ))}
            </div>
          </section>

          {groupSummary.map((group) => {
            const items = sortedTimeline.filter((entry) => getTimelineGroup(entry) === group.label);
            const anchorId = group.label === '报名与确认'
              ? 'timeline-group-registration'
              : group.label === '体育考试'
                ? 'timeline-group-sports'
                : group.label === '考试节点'
                  ? 'timeline-group-exam'
                  : group.label === '志愿录取'
                    ? 'timeline-group-volunteer'
                  : 'timeline-group-special';
            return (
              <section key={group.label} id={anchorId} className="school-prototype-panel news-glossary-panel news-special-panel">
                <p className="overview-label">{group.label}</p>
                <h2>{group.label}相关时间点</h2>
                <div className="news-special-timeline-list">
                  {items.map((item) => (
                    <article key={`${item.tag}-${item.window}-${item.title}`} className="news-special-timeline-card">
                      <div className="news-special-timeline-date">
                        <span>{item.window}</span>
                      </div>
                      <div className="news-special-timeline-copy">
                        <div className="news-prototype-glossary-meta">
                          <span className="pill">{item.tag}</span>
                          <span>{item.source}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="news-glossary-summary">{item.summary}</p>
                        <p>{item.detail}</p>
                        {item.links?.length ? (
                          <div className="news-glossary-links">
                            {item.links.map((link) => (
                              <a key={link.href} className="text-link" href={link.href} target="_blank" rel="noreferrer">
                                {link.label}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </section>

        <aside className="school-prototype-side">
          <section className="school-prototype-side-card">
            <p className="overview-label">使用建议</p>
            <p>先看“近期优先看”，再跳到对应阶段。查到节点后，继续进入中招专题或新闻详情页确认规则和口径。</p>
          </section>

          <section className="school-prototype-side-card">
            <p className="overview-label">下一步入口</p>
            <a className="school-prototype-side-link" href="/news/zhongkao-special">进入中招专题</a>
          </section>
        </aside>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 官方招生日程专题页</span>
        <span>关键节点 / 官方时间</span>
      </footer>
    </SiteShell>
  );
}
