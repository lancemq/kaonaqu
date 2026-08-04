import '../styles/pages/not-found.css';
import { RegionLink } from '../components/region-link';
import { getRegionContext } from '../lib/region-server.mjs';
import { RegionSelector } from '../components/region-selector';

export async function generateMetadata() {
  const { config } = await getRegionContext();
  const label = config.label;
  return {
    title: '页面未找到 | 考哪去',
    description: `抱歉，您访问的页面不存在或已被移动。从下方入口继续浏览${label}中考高考资讯。`
  };
}

function NotFoundNav({ config }) {
  return (
    <nav className="channel-nav" aria-label="顶部导航">
      <RegionLink className="channel-brand" href="/" aria-label="考哪去首页">
        <strong>考哪去</strong>
        <span>{config.brandSuffix}</span>
      </RegionLink>
      <div className="channel-nav-links">
        <RegionLink href="/">首页</RegionLink>
        <RegionLink href="/news">新闻</RegionLink>
        <RegionLink href="/schools">学校</RegionLink>
        <RegionLink href="/knowledge">知识</RegionLink>
        <RegionSelector />
      </div>
    </nav>
  );
}

function NotFoundFooter({ config }) {
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
          <span>{config.brandSuffixFull}</span>
        </div>
        <nav aria-label="页脚导航">
          <RegionLink href="/">首页</RegionLink>
          <RegionLink href="/news">新闻</RegionLink>
          <RegionLink href="/schools">学校</RegionLink>
          <RegionLink href="/knowledge">知识</RegionLink>
        </nav>
        <p>© 2026 考哪去</p>
      </footer>
    </>
  );
}

export default async function NotFound() {
  const { config } = await getRegionContext();
  return (
    <main className="not-found-page">
      <NotFoundNav config={config} />
      <section className="not-found-body">
        <p className="not-found-eyebrow">404</p>
        <h1>页面走丢了</h1>
        <p className="not-found-desc">
          您访问的页面不存在、已被移动，或正在维护中。试试从下方入口继续浏览上海中考、高考的最新资讯。
        </p>
        <div className="not-found-actions">
          <RegionLink className="not-found-btn is-primary" href="/">返回首页</RegionLink>
          <RegionLink className="not-found-btn" href="/news">浏览新闻</RegionLink>
          <RegionLink className="not-found-btn" href="/schools">查找学校</RegionLink>
          <RegionLink className="not-found-btn" href="/knowledge">升学知识</RegionLink>
        </div>
      </section>
      <NotFoundFooter config={config} />
    </main>
  );
}
