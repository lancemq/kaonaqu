'use client';

import { RegionLink } from './region-link';
import { useRegion } from './region-context';
import { RegionSelector } from './region-selector';

export function NewsAerialNav() {
  const { brandSuffix, brandSuffixFull, features } = useRegion();
  return (
    <nav className="channel-nav" aria-label="顶部导航">
      <RegionLink className="channel-brand" href="/" aria-label="考哪去首页">
        <strong>考哪去</strong>
        <span>{brandSuffix}</span>
      </RegionLink>
      <div className="channel-nav-links">
        <RegionLink href="/">首页</RegionLink>
        <RegionLink className="is-active" href="/news">新闻</RegionLink>
        {features.schools && <RegionLink href="/schools">学校</RegionLink>}
        {features.knowledge && <RegionLink href="/knowledge">知识</RegionLink>}
        <RegionSelector />
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
            <RegionLink href="/news">新闻</RegionLink>
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
  const { brandSuffix, brandSuffixFull, features } = useRegion();
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
          <span>{brandSuffixFull}</span>
        </div>
        <nav aria-label="页脚导航">
          <RegionLink href="/">首页</RegionLink>
          <RegionLink href="/news">新闻</RegionLink>
          {features.schools && <RegionLink href="/schools">学校</RegionLink>}
          {features.knowledge && <RegionLink href="/knowledge">知识</RegionLink>}
        </nav>
        <p>© 2026 考哪去</p>
      </footer>
    </>
  );
}
