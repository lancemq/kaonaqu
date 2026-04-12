import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
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

function pickItemsById(items, ids) {
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
}

function getDetailHref(item) {
  return item?.newsType ? `/news/${item.id}` : getPolicyDetailHref(item);
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
  const officialFocus = pickItemsById(
    [...zhongkaoNews, ...zhongkaoPolicies],
    [
      'exam-2026-zhongzhao-opinion',
      'exam-2026-zhongzhao-implementation-rules',
      'admission-2026-outstanding-sports-students',
      'admission-2026-secondary-vocational-self',
      'admission-2026-special-education-high-school'
    ]
  );
  const stageEntries = [
    { label: '报名前后', title: '先确认报名与资格', description: '适合先看报名、确认、补报名和资格类新闻。', count: groups.registration.length, anchor: '#zhongkao-registration' },
    { label: '考试阶段', title: '再看考试与成绩安排', description: '重点看听说、实验、笔试和成绩发布时间。', count: groups.exam.length, anchor: '#zhongkao-exam' },
    { label: '录取阶段', title: '最后看志愿与录取', description: '集中看志愿、特长生、自主招生和录取节点。', count: groups.admission.length, anchor: '#zhongkao-admission' }
  ];
  const currentChecklist = [
    '截至 2026 年 4 月 6 日，中招政策主文件和实施细则已经发布，先把“总分构成、考试日期、志愿规则”这三项看清。',
    '如果你走优秀体育学生、艺术骨干或中职自主招生路径，4 月前后更要持续跟学校资格确认方案和后续测试安排。',
    '普通中招家庭现在更适合把 4 至 5 月体育与健身测试、5 月 16 日至 17 日听说和实验、6 月 20 日至 21 日笔试串成一条准备线。'
  ];
  const keyFacts = [
    { title: '录取总成绩', detail: '上海中招录取总分为 750 分，包含语数外、道法、历史、体育与健身和综合测试。' },
    { title: '笔试日期', detail: '2026 年初中学业水平考试笔试安排在 6 月 20 日至 21 日。' },
    { title: '志愿填报', detail: '网上志愿填报统一在 6 月 23 日至 26 日进行，6 月 27 日至 28 日完成书面确认。' }
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
                <a className="action-button" href="#zhongkao-list">查看专题内容</a>
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
              <Link className="news-panel-link" href={`/news/${leadNews.id}`}>
                <h2>{leadNews.title}</h2>
                <p className="news-glossary-summary">{leadNews.summary || '暂无摘要'}</p>
              </Link>
            </section>
          ) : null}

          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">官方校准</p>
            <h2>先用这几条官方信息校准中招判断框架</h2>
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
            <h2>截至 2026 年 4 月 6 日，中招专题更适合这样使用</h2>
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
            <h2>这几份文件决定了今年上海中招怎么走</h2>
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

          <section id="zhongkao-exam" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">考试阶段</p>
            <h2>考试、成绩与时间安排</h2>
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

          <section id="zhongkao-admission" className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">录取阶段</p>
            <h2>志愿、专项招生与录取相关内容</h2>
            <div className="news-glossary-list">
              {groups.admission.map((item) => (
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
            <h2>当年中招政策与说明</h2>
            <div className="news-glossary-list">
              {zhongkaoPolicies.map((item) => (
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
            <p className="overview-label">高频概念</p>
            <p>自主招生、名额分配综合评价录取、统一招生录取，是上海中招最需要先分清的三条主线。看不清时先去术语页，再回来读这一页会更顺。</p>
          </section>

          <section className="school-prototype-side-card">
            <p className="overview-label">官方节点</p>
            <p>5 月 16 日至 17 日听说和实验、6 月 20 日至 21 日笔试、6 月 23 日至 26 日志愿填报、6 月 27 日至 28 日书面确认，是今年最核心的中招时间链。</p>
          </section>

          <section className="school-prototype-side-card">
            <p className="overview-label">下一步入口</p>
            <a className="school-prototype-side-link" href="/news/admission-timeline">查看官方招生日程</a>
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
