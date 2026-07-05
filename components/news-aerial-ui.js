import Link from 'next/link';

export function NewsAerialNav() {
  return (
    <nav className="news-aerial-nav" aria-label="顶部导航">
      <Link className="news-aerial-brand" href="/" aria-label="考哪去首页">
        <strong>考哪去</strong>
        <span>SHANGHAI EDUCATION</span>
      </Link>
      <div className="news-aerial-nav-links">
        <Link href="/">首页</Link>
        <Link className="is-active" href="/news">新闻</Link>
        <Link href="/schools">学校</Link>
        <Link href="/knowledge">知识</Link>
      </div>
    </nav>
  );
}

export function NewsAerialKicker({ children }) {
  return (
    <div className="channel-kicker">
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

export function NewsAerialHero({ kicker, title, description, imageClass = '' }) {
  return (
    <header className={`news-special-aerial-hero ${imageClass}`}>
      <section className="news-special-aerial-hero-content" aria-label={title}>
        <div className="news-special-aerial-hero-copy">
          <div className="news-special-aerial-breadcrumb">
            <Link href="/news">新闻</Link>
            <span>/</span>
            <strong>{title}</strong>
          </div>
          <NewsAerialKicker>{kicker}</NewsAerialKicker>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
    </header>
  );
}

export function NewsAerialFooter() {
  return (
    <>
      <div className="channel-color-bar" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <footer className="channel-footer">
        <div>
          <strong>考哪去</strong>
          <span>SHANGHAI EDUCATION PLATFORM</span>
        </div>
        <nav aria-label="页脚导航">
          <Link href="/">首页</Link>
          <Link href="/news">新闻</Link>
          <Link href="/schools">学校</Link>
          <Link href="/knowledge">知识</Link>
        </nav>
        <p>© 2026 考哪去</p>
      </footer>
    </>
  );
}
