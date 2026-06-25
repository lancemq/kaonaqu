import SiteShell from '../../components/site-shell';
import { createRequire } from 'module';
import Link from 'next/link';
import NewsPageClient from '../../components/news-page-client';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../shared/data-store');

export const metadata = {
  title: '上海中考高考新闻政策 | 考哪去',
  description: '上海中考、高考最新政策、考试安排、招生消息与学校动态聚合，帮你少翻信息，先抓重点。',
  keywords: ['上海中考新闻', '上海高考政策', '中招安排', '高招消息', '上海升学动态']
};

export const revalidate = 3600;

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

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': '上海升学新闻政策列表',
    'description': `${currentYear}年上海中考高考新闻政策汇总`,
    'numberOfItems': news.length
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel news-channel-hero">
          <div className="news-channel-hero-grid">
            <div className="news-channel-hero-main">
              <p className="overview-label">上海升学新闻</p>
              <h1>{currentYear} 上海升学新闻</h1>
              <p className="news-channel-subtitle">
                报名、考试、录取、学校动态每日更新，挑出真正影响选择的消息。
              </p>
              <p>本周重点 + 政策与时间线专题。</p>
              <div className="news-channel-tag-row">
                <Link className="pill news-channel-tag-link" href="/news/zhongkao-special">中考重点</Link>
                <Link className="pill news-channel-tag-link" href="/news/gaokao-special">高考重点</Link>
                <Link className="pill news-channel-tag-link" href="/news/admission-timeline">关键时间</Link>
                <Link className="pill news-channel-tag-link" href="/schools">上海学校</Link>
              </div>
            </div>
            <aside className="news-channel-hero-side">
              {latestLocalHeadline ? (
                <Link className="news-channel-focus-link" href={`/news/${latestLocalHeadline.id}`}>
                  <article className="news-channel-focus-card">
                    <span className="overview-label">最新一条</span>
                    <h2>{latestLocalHeadline.title}</h2>
                    <p className="news-channel-focus-summary">{latestLocalHeadline.summary || '与近期上海升学节奏相关。'}</p>
                    <div className="news-channel-focus-meta">
                      <span>{latestLocalHeadline.publishedAt || '—'}</span>
                      <span>查看</span>
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
        <span>上海升学观察 / {currentYear} 新闻与政策</span>
        <span>当年新闻 {currentYearNews.length} / 当年政策 {currentYearPolicies.length} / 学校动态 {schoolCount}</span>
      </footer>
    </SiteShell>
    </>
  );
}
