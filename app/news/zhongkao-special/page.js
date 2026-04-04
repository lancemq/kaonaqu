import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import { getNewsCategoryLabel, getPolicyExamType } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '中招专题 | 考哪去',
  description: '集中查看上海中招相关的当年新闻、政策、报名与录取信息，方便家长和学生按专题快速了解。'
};

function getCurrentYear(news, policies) {
  const years = [...news, ...policies]
    .map((item) => Number(String(item?.publishedAt || '').slice(0, 4)) || Number(item?.year) || 0)
    .filter(Boolean)
    .sort((a, b) => b - a);
  return years[0] || new Date().getFullYear();
}

function isCurrentYearItem(item, year) {
  return (Number(String(item?.publishedAt || '').slice(0, 4)) || Number(item?.year) || 0) === year;
}

export default async function ZhongkaoSpecialPage() {
  const { news, policies } = await loadDataStore();
  const currentYear = getCurrentYear(news, policies);
  const zhongkaoNews = news
    .filter((item) => item.examType === 'zhongkao' && isCurrentYearItem(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const zhongkaoPolicies = policies
    .filter((item) => isCurrentYearItem(item, currentYear) && getPolicyExamType(item) === 'zhongkao')
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const leadNews = zhongkaoNews[0] || null;

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-zhongkao" aria-label="中招专题">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 中招专题</p>
              <h1>{currentYear} 上海中招专题</h1>
              <p className="school-prototype-subtitle">集中查看和上海中招有关的新闻、政策、报名与录取信息，方便按专题连续阅读。</p>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#zhongkao-list">查看专题内容</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">专题重点</p>
                <h2>把中招相关的重要新闻和政策放到一页集中查看，更容易判断哪些变化和自己当前最相关。</h2>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-glossary-stats news-special-stats">
        <article>
          <strong>{zhongkaoNews.length}</strong>
          <span>中招新闻</span>
        </article>
        <article>
          <strong>{zhongkaoPolicies.length}</strong>
          <span>相关政策</span>
        </article>
        <article>
          <strong>报名 / 录取</strong>
          <span>按专题集中查看</span>
        </article>
        <article>
          <strong>适合当前阶段</strong>
          <span>初中升学家庭优先阅读</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="zhongkao-list">
        <section className="school-prototype-main">
          {leadNews ? (
            <section className="school-prototype-panel news-glossary-panel news-special-panel">
              <p className="overview-label">专题导读</p>
              <h2>{leadNews.title}</h2>
              <p className="news-glossary-summary">{leadNews.summary || '暂无摘要'}</p>
              <div className="news-glossary-links">
                <Link className="text-link" href={`/news/${leadNews.id}`}>查看详情</Link>
              </div>
            </section>
          ) : null}

          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">中招新闻</p>
            <h2>当年中招相关更新</h2>
            <div className="news-glossary-list">
              {zhongkaoNews.map((item) => (
                <article key={item.id} className="news-glossary-card news-special-card">
                  <div className="news-prototype-glossary-meta">
                    <span className="pill">{item.publishedAt || '暂无日期'}</span>
                    <span>{getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                  <div className="news-glossary-links">
                    <Link className="text-link" href={`/news/${item.id}`}>查看详情</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">相关政策</p>
            <h2>当年中招政策与说明</h2>
            <div className="news-glossary-list">
              {zhongkaoPolicies.map((item) => (
                <article key={item.id} className="news-glossary-card news-special-card">
                  <div className="news-prototype-glossary-meta">
                    <span className="pill">{item.publishedAt || item.year || '暂无日期'}</span>
                    <span>{item.source?.name || '官方来源'}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                  <div className="news-glossary-links">
                    {item.source?.url ? <a className="text-link" href={item.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 中招专题页</span>
        <span>中招新闻 / 中招政策 / 报名与录取</span>
      </footer>
    </SiteShell>
  );
}
