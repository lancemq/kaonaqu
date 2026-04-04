import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import { getNewsCategoryLabel, getPolicyExamType } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '高招专题 | 考哪去',
  description: '集中查看上海高招相关的当年新闻、政策、报名与录取信息，方便家长和学生按专题快速了解。'
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

export default async function GaokaoSpecialPage() {
  const { news, policies } = await loadDataStore();
  const currentYear = getCurrentYear(news, policies);
  const gaokaoNews = news
    .filter((item) => item.examType === 'gaokao' && isCurrentYearItem(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const gaokaoPolicies = policies
    .filter((item) => isCurrentYearItem(item, currentYear) && getPolicyExamType(item) === 'gaokao')
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const leadNews = gaokaoNews[0] || null;

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-gaokao" aria-label="高招专题">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 高招专题</p>
              <h1>{currentYear} 上海高招专题</h1>
              <p className="school-prototype-subtitle">集中查看和上海高招有关的新闻、政策、春考及相关录取信息，方便按专题连续阅读。</p>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#gaokao-list">查看专题内容</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">专题重点</p>
                <h2>把高招相关的重要新闻和政策放到一页集中查看，更方便连续了解考试、成绩、录取和高校招生变化。</h2>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-glossary-stats news-special-stats">
        <article>
          <strong>{gaokaoNews.length}</strong>
          <span>高招新闻</span>
        </article>
        <article>
          <strong>{gaokaoPolicies.length}</strong>
          <span>相关政策</span>
        </article>
        <article>
          <strong>考试 / 录取</strong>
          <span>按专题集中查看</span>
        </article>
        <article>
          <strong>适合当前阶段</strong>
          <span>高中升学家庭优先阅读</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="gaokao-list">
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
            <p className="overview-label">高招新闻</p>
            <h2>当年高招相关更新</h2>
            <div className="news-glossary-list">
              {gaokaoNews.map((item) => (
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
            <h2>当年高招政策与说明</h2>
            <div className="news-glossary-list">
              {gaokaoPolicies.map((item) => (
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
        <span>上海升学观察 / 高招专题页</span>
        <span>高招新闻 / 高招政策 / 考试与录取</span>
      </footer>
    </SiteShell>
  );
}
