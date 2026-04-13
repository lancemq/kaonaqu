import Link from 'next/link';

function KnowledgeToolbar() {
  return (
    <div className="knowledge-next-toolbar" aria-label="知识体系页面操作">
      <Link href="/knowledge" className="knowledge-next-chip">知识体系首页</Link>
      <Link href="/knowledge/grade-8" className="knowledge-next-chip">八年级总览</Link>
      <Link href="/news" className="knowledge-next-chip">相关政策新闻</Link>
    </div>
  );
}

function Hero({ hero }) {
  return (
    <section className="knowledge-front-hero">
      <div className="knowledge-front-layout">
        <div className="knowledge-front-copy">
          <p className="knowledge-front-kicker">{hero.kicker}</p>
          <h1>{hero.title}</h1>
          <p className="knowledge-front-summary">{hero.summary}</p>
        </div>
        <div className="knowledge-front-stats" aria-label="知识体系概览">
          {hero.stats.map((stat) => (
            <article className="knowledge-stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadCards({ cards = [] }) {
  if (!cards.length) return null;

  return (
    <section className="knowledge-lead-grid">
      {cards.map((card) => (
        <article className="lead-card knowledge-note-card" key={card.title}>
          <h2>{card.title}</h2>
          {card.description ? <p>{card.description}</p> : null}
          {card.list?.length ? (
            <ul>
              {card.list.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </article>
      ))}
    </section>
  );
}

function HeaderPanel({ header }) {
  if (!header) return null;

  return (
    <div className="page-header">
      <h1>{header.title}</h1>
      <p>{header.description}</p>
      {header.actions?.length ? (
        <div className="page-header-actions">
          {header.actions.map((action) => (
            <Link className="action-link" href={action.href} key={action.href}>{action.label}</Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Ribbons({ ribbons = [] }) {
  if (!ribbons.length) return null;

  return (
    <section className="stage-ribbon" aria-label="知识体系阅读重点">
      {ribbons.map((item) => (
        <article className="ribbon-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
        </article>
      ))}
    </section>
  );
}

function CardGrid({ section }) {
  return (
    <section className={section.type === 'cardGrid' ? 'subjects' : 'chapter'} id={section.id}>
      <h2>{section.title}</h2>
      <div className={section.type === 'cardGrid' ? 'subject-grid grade-grid' : 'grade-overview-grid'}>
        {section.cards.map((card) => {
          const content = (
            <>
              <div className="grade-card-top">
                <h3>{card.title}</h3>
                {card.status ? <span className="status-pill status-pill-live">{card.status}</span> : null}
              </div>
              <p>{card.description}</p>
            </>
          );

          return card.href ? (
            <Link href={card.href} className="subject-card grade-card active-grade" key={card.title}>
              {content}
            </Link>
          ) : (
            <article className="overview-card" key={card.title}>{content}</article>
          );
        })}
      </div>
    </section>
  );
}

function ListSection({ section }) {
  return (
    <section className="tips" id={section.id}>
      <h2>{section.title}</h2>
      <ul>
        {section.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function Section({ section }) {
  if (section.type === 'cardGrid' || section.type === 'overviewGrid') {
    return <CardGrid section={section} />;
  }
  if (section.type === 'list') {
    return <ListSection section={section} />;
  }
  return null;
}

function StructuredKnowledgePage({ page }) {
  return (
    <div className="knowledge-next-content">
      <Hero hero={page.hero} />
      <LeadCards cards={page.leadCards} />
      <HeaderPanel header={page.header} />
      <Ribbons ribbons={page.ribbons} />
      {page.sections.map((section) => <Section section={section} key={section.id} />)}
    </div>
  );
}

export default function KnowledgePage({ page }) {
  return (
    <main className="knowledge-next-page" data-knowledge-slug={page.slug}>
      <KnowledgeToolbar />
      {page.renderMode === 'structured' ? (
        <StructuredKnowledgePage page={page} />
      ) : (
        <div className="knowledge-next-content" dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
      )}
    </main>
  );
}
