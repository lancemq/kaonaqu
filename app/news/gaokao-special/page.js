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

function groupGaokaoNews(news) {
  return {
    spring: news.filter((item) => /春考|春招|自主招生|专科/.test(`${item.title}${item.summary}`)),
    exam: news.filter((item) => /高考|学业|等级|合格|成绩|考试/.test(`${item.title}${item.summary}`)),
    special: news.filter((item) => /体育|三校生|保送|外国语|专项/.test(`${item.title}${item.summary}`))
  };
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
  const groups = groupGaokaoNews(gaokaoNews);
  const stageEntries = [
    { label: '春招与自招', title: '先看春招和专科自主招生', description: '适合正在跟进春考、自主招生和征求志愿的家庭。', count: groups.spring.length, anchor: '#gaokao-spring' },
    { label: '考试与学考', title: '再看高考与学业考试', description: '重点看高考、学考、成绩和考试安排。', count: groups.exam.length, anchor: '#gaokao-exam' },
    { label: '专项路径', title: '最后看体育类和三校生', description: '集中查看体育类、三校生、保送等专项路径。', count: groups.special.length, anchor: '#gaokao-special-track' }
  ];

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-gaokao" aria-label="高招专题">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 高招专题</p>
              <h1>{currentYear} 上海高招专题</h1>
              <p className="school-prototype-subtitle">面向上海高中升学家庭，把春招、高考、学业考试、体育类和三校生相关信息按路径整理，方便按当前进度快速进入。</p>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#gaokao-list">查看专题内容</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">适合谁看</p>
                <h2>适合正在准备 2026 上海高招、想先分清不同升学路径和当前阶段任务的家庭。</h2>
                <p>这页会把高招内容按路径拆开，而不是只按时间顺序堆叠。</p>
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
            <p className="overview-label">当前路径入口</p>
            <h2>先判断自己现在更该进入哪一条高招路径</h2>
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

          <section id="gaokao-spring" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">春招与自招</p>
            <h2>春考、专科自主招生与征求志愿</h2>
            <div className="news-glossary-list">
              {groups.spring.map((item) => (
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

          <section id="gaokao-exam" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">考试与学考</p>
            <h2>高考、学业考试与成绩相关内容</h2>
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

          <section id="gaokao-special-track" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">专项路径</p>
            <h2>体育类、三校生与其他专项招生</h2>
            <div className="news-glossary-list">
              {groups.special.map((item) => (
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

        <aside className="school-prototype-side">
          <section className="school-prototype-side-card">
            <p className="overview-label">路径提示</p>
            <p>上海高招最容易混淆的是春招、高考、体育类、三校生这几条路径。建议先确认自己属于哪一类，再继续读对应内容。</p>
          </section>

          <section className="school-prototype-side-card">
            <p className="overview-label">下一步入口</p>
            <a className="school-prototype-side-link" href="/news/admission-timeline">查看官方招生日程</a>
            <a className="school-prototype-side-link" href="/news">返回新闻频道</a>
          </section>
        </aside>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 高招专题页</span>
        <span>高招新闻 / 高招政策 / 考试与录取</span>
      </footer>
    </SiteShell>
  );
}
