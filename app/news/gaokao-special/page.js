import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
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

function pickItemsById(items, ids) {
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
}

function getDetailHref(item) {
  return item?.newsType ? `/news/${item.id}` : getPolicyDetailHref(item);
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
  const officialFocus = pickItemsById(
    [...gaokaoNews, ...gaokaoPolicies],
    [
      'admission-2026-gaokao-sports-implementation',
      'exam-2026-gaokao-sports-guide',
      'admission-2026-gaokao-sports-confirmation',
      'admission-2026-sanxiaosheng-implementation',
      'exam-2026-xuekao-seven-subject-requirements'
    ]
  );
  const stageEntries = [
    { label: '春招与自招', title: '先看春招和专科自主招生', description: '适合正在跟进春考、自主招生和征求志愿的家庭。', count: groups.spring.length, anchor: '#gaokao-spring' },
    { label: '考试与学考', title: '再看高考与学业考试', description: '重点看高考、学考、成绩和考试安排。', count: groups.exam.length, anchor: '#gaokao-exam' },
    { label: '专项路径', title: '最后看体育类和三校生', description: '集中查看体育类、三校生、保送等专项路径。', count: groups.special.length, anchor: '#gaokao-special-track' }
  ];
  const currentChecklist = [
    '截至 2026 年 4 月 6 日，春招和专科自主招生已经进入结果与征求志愿尾段，更适合回看是否还有补录机会，而不是再从头看政策。',
    '体育类路径当前最关键的是把 3 月确认、考试、成绩与合格线这一条链看完整，确认自己后续是否具备填报资格。',
    '普通高考家庭现阶段更适合把高考主流程、学业水平考试命题要求和三校生等专项路径拆开看，避免把不同通道混在一起。'
  ];
  const keyFacts = [
    { title: '高招总入口', detail: '2026 年上海普通高校考试招生包含春季考试招生、专科层次依法自主招生、三校生高考和秋季统一高考。' },
    { title: '体育类链路', detail: '体育类专业招生需要单独完成项目勾选、网上确认、付费、统考、成绩与合格线确认。' },
    { title: '学考用途', detail: '学业水平合格性考试和等级考相关信息不只是考试提醒，也直接影响部分升学路径与学校培养安排。' }
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
                <a className="action-button" href="#gaokao-list">查看专题内容</a>
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
              <Link className="news-panel-link" href={`/news/${leadNews.id}`}>
                <h2>{leadNews.title}</h2>
                <p className="news-glossary-summary">{leadNews.summary || '暂无摘要'}</p>
              </Link>
            </section>
          ) : null}

          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">官方校准</p>
            <h2>先用这几条官方信息校准高招路径</h2>
            <div className="news-special-annotation-grid">
              {keyFacts.map((item) => (
                <article key={item.title}>
                  <span>{item.title}</span>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">当前该看什么</p>
            <h2>截至 2026 年 4 月 6 日，高招专题更适合这样使用</h2>
            <div className="news-special-brief-grid">
              {currentChecklist.map((item, index) => (
                <article key={item} className="news-special-brief-card">
                  <span>{`0${index + 1}`}</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">官方文件先看</p>
            <h2>这几份文件决定了今年上海高招几条主要路径</h2>
            <div className="news-glossary-list">
              {officialFocus.map((item) => (
                <Link
                  key={item.id}
                  className="news-glossary-card news-special-card news-glossary-card-link"
                  href={getDetailHref(item)}
                >
                  <div className="news-prototype-glossary-meta">
                    <span className="pill">{item.publishedAt || item.year || '暂无日期'}</span>
                    <span>{item.source?.name || getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

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
                <Link key={item.id} className="news-glossary-card news-special-card news-glossary-card-link" href={`/news/${item.id}`}>
                  <div className="news-prototype-glossary-meta">
                    <span className="pill">{item.publishedAt || '暂无日期'}</span>
                    <span>{getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

          <section id="gaokao-exam" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">考试与学考</p>
            <h2>高考、学业考试与成绩相关内容</h2>
            <div className="news-glossary-list">
              {groups.exam.map((item) => (
                <Link key={item.id} className="news-glossary-card news-special-card news-glossary-card-link" href={`/news/${item.id}`}>
                  <div className="news-prototype-glossary-meta">
                    <span className="pill">{item.publishedAt || '暂无日期'}</span>
                    <span>{getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

          <section id="gaokao-special-track" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">专项路径</p>
            <h2>体育类、三校生与其他专项招生</h2>
            <div className="news-glossary-list">
              {groups.special.map((item) => (
                <Link key={item.id} className="news-glossary-card news-special-card news-glossary-card-link" href={`/news/${item.id}`}>
                  <div className="news-prototype-glossary-meta">
                    <span className="pill">{item.publishedAt || '暂无日期'}</span>
                    <span>{getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">相关政策</p>
            <h2>当年高招政策与说明</h2>
            <div className="news-glossary-list">
              {gaokaoPolicies.map((item) => (
                <Link key={item.id} className="news-glossary-card news-special-card news-glossary-card-link" href={getPolicyDetailHref(item)}>
                  <div className="news-prototype-glossary-meta">
                    <span className="pill">{item.publishedAt || item.year || '暂无日期'}</span>
                    <span>{item.source?.name || '官方来源'}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
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
            <p className="overview-label">当前重点</p>
            <p>2026 年 4 月初这一阶段，专题里最值得优先看的通常是专科自主招生征求志愿、体育类成绩与合格线、三校生实施办法和学考命题要求。</p>
          </section>

          <section className="school-prototype-side-card">
            <p className="overview-label">下一步入口</p>
            <a className="school-prototype-side-link" href="/news/admission-timeline">查看官方招生日程</a>
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
