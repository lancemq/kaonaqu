import Link from 'next/link';
import SiteShell from '../../../components/site-shell';
import policyGlossary from '../../../lib/policy-glossary';

export const metadata = {
  title: '政策概念速查 | 考哪去',
  description: '集中查看上海升学常见政策术语，包括中本贯通、名额到区、名额到校、自主招生录取等重点概念。'
};

function groupByPill(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.pill || '其他';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return Array.from(groups.entries());
}

export default function PolicyGlossaryPage() {
  const groups = groupByPill(policyGlossary);

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-glossary" aria-label="政策概念速查">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 政策概念速查</p>
              <h1>上海升学政策概念速查</h1>
              <p className="school-prototype-subtitle">把升学中反复出现、又最容易混淆的政策术语集中整理，方便家长和学生快速查明白。</p>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#glossary-list">开始查看</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">适合先看</p>
                <h2>对中本贯通、名额到区、名额到校、自主招生录取这些术语不太熟的家长和学生。</h2>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-glossary-stats news-special-stats">
        <article>
          <strong>{policyGlossary.length}</strong>
          <span>核心术语</span>
        </article>
        <article>
          <strong>{groups.length}</strong>
          <span>分类主题</span>
        </article>
        <article>
          <strong>官方口径</strong>
          <span>按公开政策整理</span>
        </article>
        <article>
          <strong>适合收藏</strong>
          <span>查新闻和政策时可随时回看</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="glossary-list">
        <section className="school-prototype-main">
          {groups.map(([pill, items]) => (
            <section key={pill} className="school-prototype-panel news-glossary-panel news-special-panel">
              <p className="overview-label">{pill}</p>
              <h2>{pill === '职业教育' ? '职业教育相关概念' : pill === '录取批次' ? '录取批次相关概念' : `${pill}相关概念`}</h2>
              <div className="news-glossary-list">
                {items.map((item) => (
                  <article key={item.title} className="news-glossary-card news-special-card">
                    <div className="news-prototype-glossary-meta">
                      <span className="pill">{item.pill}</span>
                      <span>{item.date}</span>
                    </div>
                    <h3>{item.title}</h3>
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
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 政策概念速查专题页</span>
        <span>术语解释 / 官方口径</span>
      </footer>
    </SiteShell>
  );
}
