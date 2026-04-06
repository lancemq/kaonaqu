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

function groupZhongkaoNews(news) {
  return {
    registration: news.filter((item) => /报名|确认|资格/.test(`${item.title}${item.summary}`)),
    exam: news.filter((item) => /考试|成绩|准考证|听说|实验/.test(`${item.title}${item.summary}`)),
    admission: news.filter((item) => /录取|志愿|招生|特长|体育|艺术|自主/.test(`${item.title}${item.summary}`))
  };
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
  const groups = groupZhongkaoNews(zhongkaoNews);
  const stageEntries = [
    { label: '报名前后', title: '先确认报名与资格', description: '适合先看报名、确认、补报名和资格类新闻。', count: groups.registration.length, anchor: '#zhongkao-registration' },
    { label: '考试阶段', title: '再看考试与成绩安排', description: '重点看听说、实验、笔试和成绩发布时间。', count: groups.exam.length, anchor: '#zhongkao-exam' },
    { label: '录取阶段', title: '最后看志愿与录取', description: '集中看志愿、特长生、自主招生和录取节点。', count: groups.admission.length, anchor: '#zhongkao-admission' }
  ];

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-zhongkao" aria-label="中招专题">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 中招专题</p>
              <h1>{currentYear} 上海中招专题</h1>
              <p className="school-prototype-subtitle">面向上海初三家庭，把中招报名、考试、录取和专项招生相关内容按阶段整理，方便按当前进度快速进入。</p>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#zhongkao-list">查看专题内容</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">适合谁看</p>
                <h2>适合正在准备 2026 上海中考、想先分清报名、考试、录取节奏的家庭。</h2>
                <p>这页不是单纯新闻汇总，而是按当前阶段整理好的中招专题入口。</p>
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
            <p className="overview-label">当前阶段入口</p>
            <h2>先判断自己现在更该看哪一段</h2>
            <div className="news-special-stage-grid">
              {stageEntries.map((item, index) => (
                <a key={item.label} className={`news-special-stage-card${index === 1 ? ' news-special-stage-card-warm' : ''}`} href={item.anchor}>
                  <span>{item.label}</span>
                  <strong>{item.count} 条内容</strong>
                  <p>{item.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section id="zhongkao-registration" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">报名前后</p>
            <h2>报名、确认与资格相关内容</h2>
            <div className="news-glossary-list">
              {groups.registration.map((item) => (
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

          <section id="zhongkao-exam" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">考试阶段</p>
            <h2>考试、成绩与时间安排</h2>
            <div className="news-glossary-list">
              {groups.exam.map((item) => (
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

          <section id="zhongkao-admission" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">录取阶段</p>
            <h2>志愿、专项招生与录取相关内容</h2>
            <div className="news-glossary-list">
              {groups.admission.map((item) => (
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

        <aside className="school-prototype-side">
          <section className="school-prototype-side-card">
            <p className="overview-label">高频概念</p>
            <p>自主招生、名额分配综合评价录取、统一招生录取，是上海中招最需要先分清的三条主线。</p>
          </section>

          <section className="school-prototype-side-card">
            <p className="overview-label">下一步入口</p>
            <a className="school-prototype-side-link" href="/news/admission-timeline">查看官方招生日程</a>
            <a className="school-prototype-side-link" href="/news">返回新闻频道</a>
          </section>
        </aside>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 中招专题页</span>
        <span>中招新闻 / 中招政策 / 报名与录取</span>
      </footer>
    </SiteShell>
  );
}
