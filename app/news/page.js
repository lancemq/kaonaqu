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

function toTimestamp(value) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getCurrentYear(news, policies) {
  const years = [...news, ...policies]
    .map((item) => {
      const value = String(item?.publishedAt || item?.date || '');
      return Number(value.slice(0, 4)) || Number(item?.year) || 0;
    })
    .filter(Boolean)
    .sort((a, b) => b - a);
  return years[0] || new Date().getFullYear();
}

function isCurrentYearItem(item, year) {
  const publishedYear = Number(String(item?.publishedAt || item?.date || '').slice(0, 4)) || Number(item?.year) || 0;
  return publishedYear === year;
}

function isRenderablePolicy(policy, currentYear) {
  const title = String(policy?.title || '').trim();
  if (!title || title === '上海市教育委员会') return false;
  if (!isCurrentYearItem(policy, currentYear)) return false;
  return policy.source?.type === 'official' || String(policy.source?.name || '').includes('上海市教育委员会');
}

export default async function NewsPage() {
  const { news, policies, schools } = await loadDataStore();
  const schoolNamesById = Object.fromEntries(
    schools.map((school) => [school.id, school.name || ''])
  );
  const currentYear = getCurrentYear(news, policies);
  const currentYearNews = news.filter((item) => isCurrentYearItem(item, currentYear));
  const currentYearPolicies = policies.filter((item) => isRenderablePolicy(item, currentYear));
  const schoolCount = currentYearNews.filter((item) => item.newsType === 'school').length;
  const latestLocalHeadline = currentYearNews
    .slice()
    .sort((left, right) => {
      const publishedDiff = toTimestamp(right.publishedAt) - toTimestamp(left.publishedAt);
      if (publishedDiff !== 0) return publishedDiff;

      const updatedDiff = toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
      if (updatedDiff !== 0) return updatedDiff;

      return String(left.id || '').localeCompare(String(right.id || ''));
    })[0] || null;

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
      <NewsPageClient news={news} policies={policies} schoolNamesById={schoolNamesById} />

      <footer className="prototype-page-footer">
        <span>上海升学观察 / {currentYear} 最值得先看的消息与政策</span>
        <span>当年新闻 {currentYearNews.length} / 当年政策 {currentYearPolicies.length} / 学校动态 {schoolCount}</span>
      </footer>
    </SiteShell>
  );
}
