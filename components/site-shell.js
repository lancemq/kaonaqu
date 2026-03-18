import Link from 'next/link';

export default function SiteShell({ children }) {
  return (
    <div className="page-shell">
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
            <span>Shanghai Zhongkao Guide</span>
          </span>
        </Link>
        <nav className="top-links">
          <Link href="/">首页</Link>
          <Link href="/news">新闻政策</Link>
          <Link href="/schools">学校信息</Link>
          <Link href="/knowledge">知识体系</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
