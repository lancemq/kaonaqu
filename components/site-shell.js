import Link from 'next/link';
import SiteBreadcrumbs from './site-breadcrumbs';

const SITE_URL = 'https://kaonaqu.xyz';

export default function SiteShell({ children, hideKnowledgeNav = false, breadcrumbItems }) {
  const breadcrumbJsonLd = Array.isArray(breadcrumbItems) && breadcrumbItems.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': '首页', 'item': SITE_URL },
          ...breadcrumbItems.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 2,
            'name': item.label,
            ...(item.href ? { 'item': `${SITE_URL}${item.href}` } : {})
          }))
        ]
      }
    : null;

  return (
    <div className="page-shell">
      {breadcrumbJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      ) : null}
      <div className="masthead-rail" aria-label="站点导览">
        <div className="masthead-rail-inner">
          <p className="masthead-note">KAONAQU EDUCATION DESK</p>
          <div className="masthead-tags">
            <span>中高考政策</span>
            <span>学校选择</span>
            <span>上海 16 区</span>
            <span>学习路径</span>
          </div>
        </div>
      </div>
      <header className="topbar" aria-label="顶部导航">
        <Link className="brand-mark" href="/" aria-label="考哪去首页">
          <span className="brand-badge" aria-hidden="true">
            <span className="brand-dot brand-dot-blue"></span>
            <span className="brand-dot brand-dot-red"></span>
            <span className="brand-dot brand-dot-yellow"></span>
            <span className="brand-dot brand-dot-green"></span>
          </span>
          <span className="brand-text">
            <strong>考哪去</strong>
            <span>Shanghai Education Newsroom</span>
          </span>
        </Link>
        <nav className="top-links">
          <Link href="/">首页</Link>
          <Link href="/news">新闻政策</Link>
          <Link href="/schools">学校信息</Link>
          <Link href="/knowledge">知识体系</Link>
        </nav>
        <div className="topbar-desk">
          <span className="desk-label">先看什么</span>
          <strong>政策 · 学校 · 学习</strong>
        </div>
      </header>
      <SiteBreadcrumbs items={breadcrumbItems} />
      {children}
    </div>
  );
}
