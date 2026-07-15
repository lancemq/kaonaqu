import Link from 'next/link';
import { Fragment } from 'react';
import { NewsAerialFooter, NewsAerialNav } from './news-aerial-ui';

export function TopicSectionLabel({ children }) {
  return (
    <div className="special-section-label">
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

export function TopicEntry({ item }) {
  return (
    <Link className="special-entry" href={item.href}>
      <div className="special-entry-date">{item.date || '暂无日期'}</div>
      <div className="special-entry-body">
        <div className="special-entry-meta">
          <span>{item.source || '官方来源'}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary || '暂无摘要'}</p>
      </div>
    </Link>
  );
}

function PolicyProcessFlow({ steps, flow }) {
  if (flow) {
    return (
      <div className="policy-process-flow">
        {steps.map((step, index) => (
          <Fragment key={step.title}>
            <article className="policy-process-card">
              <span className="policy-process-label">{step.label}</span>
              <h3>{step.title}</h3>
              {step.tags?.length ? (
                <div className="policy-process-tags">
                  {step.tags.map((tag) => (<span key={tag}>{tag}</span>))}
                </div>
              ) : null}
              {step.desc ? <p>{step.desc}</p> : null}
            </article>
            {index < steps.length - 1 ? (
              <div className="policy-process-arrow" aria-hidden="true">→</div>
            ) : null}
          </Fragment>
        ))}
      </div>
    );
  }
  return (
    <div className="special-card-grid">
      {steps.map((step) => (
        <article key={step.title} className="policy-process-card">
          <span className="policy-process-label">{step.label}</span>
          <h3>{step.title}</h3>
          {step.tags?.length ? (
            <div className="policy-process-tags">
              {step.tags.map((tag) => (<span key={tag}>{tag}</span>))}
            </div>
          ) : null}
          {step.desc ? <p>{step.desc}</p> : null}
        </article>
      ))}
    </div>
  );
}

function PolicyRelationGrid({ items }) {
  return (
    <div className="policy-relation-grid">
      {items.map((item) => (
        <article key={item.title}>
          <span className="policy-process-label">{item.value}</span>
          <h3>{item.title}</h3>
          {item.detail ? <p>{item.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}

function PolicyGlossary({ groups }) {
  return (
    <div className="policy-term-stack">
      {groups.map((group) => (
        <div key={group.heading} className="policy-term-group">
          <h3>{group.heading}</h3>
          <div className="policy-term-stack">
            {group.terms.map((term) => (
              <article key={term.term} className="policy-term-card">
                {term.meta?.length ? (
                  <div className="policy-term-meta">
                    {term.meta.map((m) => (<span key={m.label}>{m.label}：{m.value}</span>))}
                  </div>
                ) : null}
                <h4>{term.term}</h4>
                {term.details?.length ? (
                  <div className="policy-term-detail-grid">
                    {term.details.map((d) => (
                      <article key={d.label}>
                        <span>{d.label}</span>
                        <p>{d.value}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
                {term.desc ? <p>{term.desc}</p> : null}
                {term.source ? <span className="policy-term-source">来源：{term.source}</span> : null}
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PolicyFaqStack({ items }) {
  return (
    <div className="policy-faq-stack">
      {items.map((item, index) => (
        <article key={item.question} className="policy-faq-card">
          <span className="policy-faq-index">{String(index + 1).padStart(2, '0')}</span>
          <div className="policy-faq-body">
            <h3>{item.question}</h3>
            <p className="policy-faq-answer">{item.answer}</p>
            {item.meta?.length ? (
              <div className="policy-faq-meta">
                {item.meta.map((m) => (
                  <article key={m.label}>
                    <span>{m.label}</span>
                    <p>{m.value}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function PolicyBlock({ block }) {
  const wrapper = block.wrapper || 'policy-process-section';
  return (
    <section id={block.id} className={wrapper} aria-label={block.title}>
      <TopicSectionLabel>{block.kicker}</TopicSectionLabel>
      <h2>{block.title}</h2>
      {block.intro ? <p className="policy-block-intro">{block.intro}</p> : null}
      {block.type === 'process' ? <PolicyProcessFlow steps={block.steps} flow={block.flow} /> : null}
      {block.type === 'relation' ? <PolicyRelationGrid items={block.items} /> : null}
      {block.type === 'glossary' ? <PolicyGlossary groups={block.groups} /> : null}
      {block.type === 'faq' ? <PolicyFaqStack items={block.items} /> : null}
    </section>
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
  policyBlocks,
  contentId
}) {
  const variantHref = {
    zhongkao: '/news/zhongkao-special',
    gaokao: '/news/gaokao-special',
    sports: '/news/sports-reform'
  }[variant];
  const collectionJsonLd = variantHref ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `https://kaonaqu.xyz${variantHref}`,
    description,
    isPartOf: { '@type': 'WebSite', name: '考哪去', url: 'https://kaonaqu.xyz' }
  } : null;

  return (
    <main className={`special-page ${variant ? `is-${variant}` : ''}`}>
      {collectionJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
        />
      ) : null}
      <NewsAerialNav />

      <header className="special-hero">
        <div className="special-hero-shade" aria-hidden="true"></div>
        <section className="special-hero-inner" aria-label={title}>
          <div className="special-hero-copy">
            <TopicSectionLabel>{kicker}</TopicSectionLabel>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <aside className="special-hero-panel" aria-label="专题数据摘要">
            {heroStats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </aside>
        </section>
      </header>

      {facts && facts.length > 0 ? (
        <section className="special-facts" aria-label="专题核心信息">
          <TopicSectionLabel>READ FIRST</TopicSectionLabel>
          <h2>先校准判断框架</h2>
          <div className="special-fact-grid">
            {facts.map((item, index) => (
              <article key={item.title}>
                <span>{`0${index + 1}`}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {stageEntries && stageEntries.length > 0 ? (
        <section className="special-stage-wrap" aria-label="专题阅读路径">
          <div className="special-stage-head">
            <TopicSectionLabel>PATH</TopicSectionLabel>
            <h2>{stageTitle}</h2>
            <p>{stageDescription}</p>
          </div>
          <div className="special-stage-grid">
            {stageEntries.map((item, index) => (
              <a key={item.label} href={item.anchor} className="special-stage-card">
                <span>{item.label}</span>
                <strong>{item.count} 条内容</strong>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <b>{String(index + 1).padStart(2, '0')}</b>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {policyBlocks && policyBlocks.length > 0
        ? policyBlocks.map((block) => <PolicyBlock key={block.id} block={block} />)
        : null}

      <section className="special-content" id={contentId}>
        <section className="special-main">
          {lead ? (
            <section className="special-lead">
              <TopicSectionLabel>TOP STORY</TopicSectionLabel>
              <Link href={lead.href}>
                <h2>{lead.title}</h2>
                <p>{lead.summary || '暂无摘要'}</p>
              </Link>
            </section>
          ) : null}

          <section className="special-checklist">
            <TopicSectionLabel>CURRENT PHASE</TopicSectionLabel>
            <h2>按当前阶段，更适合这样使用专题</h2>
            <div className="special-check-grid">
              {checklist.map((item, index) => (
                <article key={item}>
                  <span>{`0${index + 1}`}</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="special-section">
            <TopicSectionLabel>OFFICIAL FILES</TopicSectionLabel>
            <h2>{officialTitle}</h2>
            <div className="special-entry-stack">
              {officialItems.map((item) => (
                <TopicEntry key={item.id} item={item} />
              ))}
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="special-section">
              <TopicSectionLabel>{section.kicker}</TopicSectionLabel>
              <h2>{section.title}</h2>
              <div className="special-entry-stack">
                {section.items.map((item) => (
                  <TopicEntry key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}

          <section className="special-section">
            <TopicSectionLabel>POLICIES</TopicSectionLabel>
            <h2>{policyTitle}</h2>
            <div className="special-entry-stack">
              {policyItems.map((item) => (
                <TopicEntry key={item.id} item={item} />
              ))}
            </div>
          </section>
        </section>

        <aside className="special-side">
          {sideNotes.map((note, index) => (
            <section key={note} className={`channel-side-card${index === 0 ? ' is-dark' : ''}`}>
              <TopicSectionLabel>{index === 0 ? 'NOTE' : 'DATE LINE'}</TopicSectionLabel>
              <p>{note}</p>
            </section>
          ))}

          <section className="channel-side-card is-dark compact">
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
