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

function RichTextNodes({ nodes = [] }) {
  return nodes.map((node, index) => <RichTextNode node={node} key={`${node.type}-${node.tag || 'text'}-${index}`} />);
}

function RichTextNode({ node }) {
  if (!node) return null;

  if (node.type === 'text') {
    return node.text;
  }

  const children = <RichTextNodes nodes={node.children} />;
  const props = {};
  if (node.className) props.className = node.className;
  if (node.id) props.id = node.id;
  if (node['aria-label']) props['aria-label'] = node['aria-label'];

  if (node.tag === 'a') {
    const href = node.href || '#';
    if (href.startsWith('/')) {
      return <Link {...props} href={href}>{children}</Link>;
    }
    return (
      <a {...props} href={href} target={node.target} rel={node.rel || (node.target === '_blank' ? 'noopener noreferrer' : undefined)}>
        {children}
      </a>
    );
  }

  switch (node.tag) {
    case 'article':
      return <article {...props}>{children}</article>;
    case 'br':
      return <br />;
    case 'code':
      return <code {...props}>{children}</code>;
    case 'div':
      return <div {...props}>{children}</div>;
    case 'h1':
      return <h1 {...props}>{children}</h1>;
    case 'h2':
      return <h2 {...props}>{children}</h2>;
    case 'h3':
      return <h3 {...props}>{children}</h3>;
    case 'h4':
      return <h4 {...props}>{children}</h4>;
    case 'li':
      return <li {...props}>{children}</li>;
    case 'ol':
      return <ol {...props}>{children}</ol>;
    case 'p':
      return <p {...props}>{children}</p>;
    case 'section':
      return <section {...props}>{children}</section>;
    case 'span':
      return <span {...props}>{children}</span>;
    case 'strong':
      return <strong {...props}>{children}</strong>;
    case 'table':
      return <table {...props}>{children}</table>;
    case 'tbody':
      return <tbody {...props}>{children}</tbody>;
    case 'td':
      return <td {...props}>{children}</td>;
    case 'th':
      return <th {...props}>{children}</th>;
    case 'tr':
      return <tr {...props}>{children}</tr>;
    case 'ul':
      return <ul {...props}>{children}</ul>;
    default:
      return null;
  }
}

function RichKnowledgePage({ page }) {
  return (
    <div className="knowledge-next-content">
      <RichTextNodes nodes={page.richBlocks} />
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
        <RichKnowledgePage page={page} />
      )}
    </main>
  );
}
