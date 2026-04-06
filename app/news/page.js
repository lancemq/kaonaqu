import SiteShell from '../../components/site-shell';
import { createRequire } from 'module';
import Link from 'next/link';
import NewsPageClient from '../../components/news-page-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

export const metadata = {
  title: '上海教育资讯频道 | 考哪去',
  description: '把上海当年最值得先看的中招、高招、入学政策、考试安排、招生消息和学校动态放在一起，帮你少翻信息，先抓重点。'
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const { news, policies } = await loadDataStore();
  const currentYear = Math.max(
    ...news.map((item) => Number(String(item.publishedAt || '').slice(0, 4)) || 0),
    ...policies.map((item) => Number(item.year) || Number(String(item.publishedAt || '').slice(0, 4)) || 0),
    new Date().getFullYear()
  );
  const currentYearNews = news.filter((item) => Number(String(item.publishedAt || '').slice(0, 4)) === currentYear);
  const currentYearPolicies = policies.filter((item) => (Number(item.year) || Number(String(item.publishedAt || '').slice(0, 4))) === currentYear);
  const schoolCount = currentYearNews.filter((item) => item.newsType === 'school').length;
  const examCount = currentYearNews.filter((item) => item.newsType === 'exam').length;
  const admissionCount = currentYearNews.filter((item) => item.newsType === 'admission').length;
  const latestLocalHeadline = currentYearNews[0] || null;

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel news-channel-hero">
          <div className="news-channel-hero-grid">
            <div className="news-channel-hero-main">
              <p className="overview-label">上海升学新闻</p>
              <h1>{currentYear} 上海升学，这里先看最重要的消息</h1>
              <p className="news-channel-subtitle">
                报名、考试、录取、学校动态每天都在更新，但真正会影响选择的消息，不该靠你自己一点点翻。
              </p>
              <p>先看这周最值得关注的消息，再去专题页把政策、时间线和关键规则看明白。</p>
              <div className="news-channel-tag-row">
                <Link className="pill news-channel-tag-link" href="/news/zhongkao-special">先看中考重点</Link>
                <Link className="pill news-channel-tag-link" href="/news/gaokao-special">先看高考重点</Link>
                <Link className="pill news-channel-tag-link" href="/news/admission-timeline">先看关键时间</Link>
                <Link className="pill news-channel-tag-link" href="/schools">再看上海学校</Link>
              </div>
            </div>
            <aside className="news-channel-hero-side">
              {latestLocalHeadline ? (
                <Link className="news-channel-focus-link" href={`/news/${latestLocalHeadline.id}`}>
                  <article className="news-channel-focus-card">
                    <span className="overview-label">这条最值得先看</span>
                    <h2>{latestLocalHeadline.title}</h2>
                    <p className="news-channel-focus-summary">{latestLocalHeadline.summary || '这条消息和最近的上海升学节奏最相关，适合先看清楚再安排下一步。'}</p>
                    <div className="news-channel-focus-meta">
                      <span>{latestLocalHeadline.publishedAt || '暂无日期'}</span>
                      <span>现在去看</span>
                    </div>
                  </article>
                </Link>
              ) : null}
            </aside>
          </div>
        </section>
      </header>
      <NewsPageClient news={news} policies={policies} />

      <footer className="prototype-page-footer">
        <span>上海升学观察 / {currentYear} 最值得先看的消息与政策</span>
        <span>当年新闻 {currentYearNews.length} / 当年政策 {currentYearPolicies.length} / 学校动态 {schoolCount}</span>
      </footer>
    </SiteShell>
  );
}
