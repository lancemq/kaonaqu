import Link from 'next/link';
import SiteShell from '../../../components/site-shell';
import admissionTimeline from '../../../lib/admission-timeline';

export const metadata = {
  title: '官方招生日程 | 考哪去',
  description: '集中查看上海升学官方招生日程，包括中招报名、补报名、考试安排和特殊教育招生关键时间节点。'
};

export default function AdmissionTimelinePage() {
  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-timeline" aria-label="官方招生日程">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 官方招生日程</p>
              <h1>上海升学官方招生日程</h1>
              <p className="school-prototype-subtitle">把报名、补报名、考试和特殊教育招生的关键时间节点集中整理，方便家长和学生按时间查看。</p>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#timeline-list">查看日程</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">适合先看</p>
                <h2>正在准备报名、确认、考试或志愿填报的家庭，可以先用这页把关键时间节点理清楚。</h2>
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
          <strong>报名 / 考试</strong>
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
          {admissionTimeline.map((item) => (
            <section key={`${item.tag}-${item.window}-${item.title}`} className="school-prototype-panel news-glossary-panel news-special-panel">
              <div className="news-prototype-glossary-meta">
                <span className="pill">{item.tag}</span>
                <span>{item.window}</span>
              </div>
              <h2>{item.title}</h2>
              <p className="news-glossary-summary">{item.summary}</p>
              <p>{item.detail}</p>
              <p className="news-glossary-source">{item.source}</p>
              {item.links?.length ? (
                <div className="news-glossary-links">
                  {item.links.map((link) => (
                    <a key={link.href} className="text-link" href={link.href} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </section>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 官方招生日程专题页</span>
        <span>关键节点 / 官方时间</span>
      </footer>
    </SiteShell>
  );
}
