import Link from 'next/link';
import { NewsAerialFooter, NewsAerialNav } from './news-aerial-ui';

export function TopicSectionLabel({ children }) {
  return (
    <div className="topic-special-section-label">
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

export function TopicEntry({ item }) {
  return (
    <Link className="topic-special-entry" href={item.href}>
      <div className="topic-special-entry-date">{item.date || '暂无日期'}</div>
      <div className="topic-special-entry-body">
        <div className="topic-special-entry-meta">
          <span>{item.source || '官方来源'}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary || '暂无摘要'}</p>
      </div>
    </Link>
  );
}

export function NewsTopicSpecialPage({
  variant,
  kicker,
  title,
  description,
  heroStats,
  facts,
  stageTitle,
  stageDescription,
  stageEntries,
  lead,
  checklist,
  officialTitle,
  officialItems,
  sections,
  policyTitle,
  policyItems,
  sideLinks,
  sideNotes,
  contentId
}) {
  return (
    <main className={`topic-special-page ${variant ? `is-${variant}` : ''}`}>
      <NewsAerialNav />

      <header className="topic-special-hero">
        <div className="topic-special-hero-shade" aria-hidden="true"></div>
        <section className="topic-special-hero-inner" aria-label={title}>
          <div className="topic-special-hero-copy">
            <TopicSectionLabel>{kicker}</TopicSectionLabel>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <aside className="topic-special-hero-panel" aria-label="专题数据摘要">
            {heroStats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </aside>
        </section>
      </header>

      <section className="topic-special-facts" aria-label="专题核心信息">
        <TopicSectionLabel>READ FIRST</TopicSectionLabel>
        <h2>先校准判断框架</h2>
        <div className="topic-special-fact-grid">
          {facts.map((item, index) => (
            <article key={item.title}>
              <span>{`0${index + 1}`}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-special-stage-wrap" aria-label="专题阅读路径">
        <div className="topic-special-stage-head">
          <TopicSectionLabel>PATH</TopicSectionLabel>
          <h2>{stageTitle}</h2>
          <p>{stageDescription}</p>
        </div>
        <div className="topic-special-stage-grid">
          {stageEntries.map((item, index) => (
            <a key={item.label} href={item.anchor} className="topic-special-stage-card">
              <span>{item.label}</span>
              <strong>{item.count} 条内容</strong>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <b>{String(index + 1).padStart(2, '0')}</b>
            </a>
          ))}
        </div>
      </section>

      <section className="topic-special-content" id={contentId}>
        <section className="topic-special-main">
          {lead ? (
            <section className="topic-special-lead">
              <TopicSectionLabel>TOP STORY</TopicSectionLabel>
              <Link href={lead.href}>
                <h2>{lead.title}</h2>
                <p>{lead.summary || '暂无摘要'}</p>
              </Link>
            </section>
          ) : null}

          <section className="topic-special-checklist">
            <TopicSectionLabel>CURRENT PHASE</TopicSectionLabel>
            <h2>按当前阶段，更适合这样使用专题</h2>
            <div className="topic-special-check-grid">
              {checklist.map((item, index) => (
                <article key={item}>
                  <span>{`0${index + 1}`}</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="topic-special-section">
            <TopicSectionLabel>OFFICIAL FILES</TopicSectionLabel>
            <h2>{officialTitle}</h2>
            <div className="topic-special-entry-stack">
              {officialItems.map((item) => (
                <TopicEntry key={item.id} item={item} />
              ))}
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="topic-special-section">
              <TopicSectionLabel>{section.kicker}</TopicSectionLabel>
              <h2>{section.title}</h2>
              <div className="topic-special-entry-stack">
                {section.items.map((item) => (
                  <TopicEntry key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}

          <section className="topic-special-section">
            <TopicSectionLabel>POLICIES</TopicSectionLabel>
            <h2>{policyTitle}</h2>
            <div className="topic-special-entry-stack">
              {policyItems.map((item) => (
                <TopicEntry key={item.id} item={item} />
              ))}
            </div>
          </section>
        </section>

        <aside className="topic-special-side">
          {sideNotes.map((note, index) => (
            <section key={note} className={`topic-special-side-card${index === 0 ? ' is-dark' : ''}`}>
              <TopicSectionLabel>{index === 0 ? 'NOTE' : 'DATE LINE'}</TopicSectionLabel>
              <p>{note}</p>
            </section>
          ))}

          <section className="topic-special-side-card is-dark compact">
            <TopicSectionLabel>JUMP</TopicSectionLabel>
            {sideLinks.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
            <Link href="/news/admission-timeline">查看官方招生日程</Link>
          </section>
        </aside>
      </section>

      <NewsAerialFooter />
    </main>
  );
}
