import Link from 'next/link';
import { NewsAerialFooter, NewsAerialNav } from './news-aerial-ui';

export function PolicyToolLabel({ children }) {
  return (
    <div className="special-label">
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

export function PolicyToolHero({ variant, kicker, title, description, stats }) {
  return (
    <header className={`special-hero is-${variant}`}>
      <div className="special-hero-shade" aria-hidden="true"></div>
      <section className="special-hero-inner" aria-label={title}>
        <div className="special-hero-copy">
          <PolicyToolLabel>{kicker}</PolicyToolLabel>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <aside className="special-hero-panel" aria-label="专题数据摘要">
          {stats.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </aside>
      </section>
    </header>
  );
}

export function PolicyToolShell({ variant, hero, children }) {
  return (
    <main className={`special-page is-${variant}`}>
      <NewsAerialNav />
      <PolicyToolHero variant={variant} {...hero} />
      {children}
      <NewsAerialFooter />
    </main>
  );
}

export function PolicyToolCards({ kicker, title, items }) {
  return (
    <section className="special-cards">
      <PolicyToolLabel>{kicker}</PolicyToolLabel>
      <h2>{title}</h2>
      <div className="special-card-grid">
        {items.map((item, index) => (
          <article key={item.title}>
            <span>{`0${index + 1}`}</span>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PolicyToolSideCard({ dark = false, label, children }) {
  return (
    <article className={`special-side-card${dark ? ' is-dark' : ''}`}>
      <PolicyToolLabel>{label}</PolicyToolLabel>
      {children}
    </article>
  );
}

export function PolicyToolLinks({ links }) {
  return links.map((link) => (
    <Link key={link.href} href={link.href}>{link.label}</Link>
  ));
}
