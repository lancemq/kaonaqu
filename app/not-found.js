import Link from 'next/link';

export const metadata = {
  title: '页面未找到 | 考哪去',
  description: '抱歉，您访问的页面不存在或已被移动。从下方入口继续浏览上海中考高考资讯。'
};

function NotFoundNav() {
  return (
    <nav className="channel-nav" aria-label="顶部导航">
      <Link className="channel-brand" href="/" aria-label="考哪去首页">
        <strong>考哪去</strong>
        <span>SHANGHAI EDUCATION</span>
      </Link>
      <div className="channel-nav-links">
        <Link href="/">首页</Link>
        <Link href="/news">新闻</Link>
        <Link href="/schools">学校</Link>
        <Link href="/knowledge">知识</Link>
      </div>
    </nav>
  );
}

function NotFoundFooter() {
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

export default function NotFound() {
  return (
    <main className="not-found-page">
      <NotFoundNav />
      <section className="not-found-body">
        <p className="not-found-eyebrow">404</p>
        <h1>页面走丢了</h1>
        <p className="not-found-desc">
          您访问的页面不存在、已被移动，或正在维护中。试试从下方入口继续浏览上海中考、高考的最新资讯。
        </p>
        <div className="not-found-actions">
          <Link className="not-found-btn is-primary" href="/">返回首页</Link>
          <Link className="not-found-btn" href="/news">浏览新闻</Link>
          <Link className="not-found-btn" href="/schools">查找学校</Link>
          <Link className="not-found-btn" href="/knowledge">升学知识</Link>
        </div>
      </section>
      <NotFoundFooter />
    </main>
  );
}
