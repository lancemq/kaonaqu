import Link from 'next/link';
import { createRequire } from 'module';
import { NewsAerialFooter, NewsAerialHero, NewsAerialKicker, NewsAerialNav } from '../../../components/news-aerial-ui';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { getNewsCategoryLabel } from '../../../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '上海体育考试改革专题 | 考哪去',
  description: '集中查看上海中考体育改革、过程性评价、统一考试时间表、伤病免缓考与体育特长生招生相关信息，方便家长和学生按专题快速了解。'
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

function isSportsItem(item) {
  return /体育/.test(`${item?.title || ''}${item?.summary || ''}${item?.content || ''}`);
}

function groupSportsNews(news) {
  return {
    reform: news.filter((item) => /新规|改革|过程性评价|满分/.test(`${item.title}${item.summary}`)),
    exam: news.filter((item) => /时间表|统一考|日常考核|时间安排|考试/.test(`${item.title}${item.summary}`)),
    injury: news.filter((item) => /伤病|免考|缓考|免修/.test(`${item.title}${item.summary}`)),
    recruit: news.filter((item) => /优秀体育|高水平|招收|招生|特长/.test(`${item.title}${item.summary}`)),
    school: news.filter((item) => /体育特色|篮球|田径|游泳|特色/.test(`${item.title}${item.summary}`))
  };
}

function pickItemsById(items, ids) {
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
}

function getDetailHref(item) {
  return item?.newsType ? `/news/${item.id}` : getPolicyDetailHref(item);
}

export default async function SportsReformPage() {
  const { news, policies } = await loadDataStore();
  const currentYear = getCurrentYear(news, policies);
  const sportsNews = news
    .filter((item) => isCurrentYearItem(item, currentYear) && isSportsItem(item))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const sportsPolicies = policies
    .filter((item) => isCurrentYearItem(item, currentYear) && isSportsItem(item))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const leadNews = sportsNews[0] || null;
  const groups = groupSportsNews(sportsNews);
  const officialFocus = pickItemsById(
    [...sportsNews, ...sportsPolicies],
    [
      'policy-2026-sports-exam-reform',
      'exam-2026-sports-timeline',
      'policy-2026-sports-injury-rules',
      'policy-2026-gaoshuiping-yundong',
      '2026-tiyu-zhaosheng',
      'school-2026-kongjiang-sports'
    ]
  );
  const stageEntries = [
    { label: '改革解读', title: '先看清体育新规怎么改', description: '重点看过程性评价、统一考试与日常考核的构成变化。', count: groups.reform.length, anchor: '#sports-reform' },
    { label: '考试安排', title: '再看考试时间与项目', description: '集中看 4 月统一考时间表、日常考核节点和项目安排。', count: groups.exam.length, anchor: '#sports-exam' },
    { label: '伤病规则', title: '遇到伤病怎么申请', description: '了解免考、缓考、免修的适用条件与申请窗口。', count: groups.injury.length, anchor: '#sports-injury' },
    { label: '招生通道', title: '最后看体育特长生招生', description: '跟踪优秀体育学生、高水平运动员等专项招生路径。', count: groups.recruit.length, anchor: '#sports-recruit' }
  ];
  function getCurrentPhaseLabel() {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month >= 1 && month <= 3) return '政策发布与日常考核累计阶段，建议先把体育考试总分构成、过程性评价要求和统一考时间这三项框架看清。';
    if (month === 4 || month === 5) return '统一考试与伤病申请阶段，建议重点跟进 4 月统一考时间表和伤病免考/缓考申请窗口。';
    if (month === 6) return '考试与志愿衔接阶段，考后关注体育成绩计入与志愿填报安排。';
    if (month >= 7 && month <= 8) return '录取阶段，体育特长生家庭重点跟踪优秀体育学生与高水平运动员招生结果。';
    return '建议优先关注下一年度体育改革动向与日常考核累计要求。';
  }

  const currentChecklist = [
    getCurrentPhaseLabel(),
    '如果你走优秀体育学生或高水平运动员路径，建议持续跟踪资格确认方案、统考安排与合格线这一条完整链路。',
    '普通中招家庭建议把过程性评价、日常考核和 4 月统一考拆开看，避免把改革解读和考试安排混在一起。'
  ];
  const keyFacts = [
    { title: '总分构成', detail: '上海中考体育与健身满分为 30 分，由日常考核与统一考试两部分组成，计入中考录取总分。' },
    { title: '统一考试', detail: '4 月进行统一考试，覆盖体能与技能项目，是体育改革后最受关注的变化之一。' },
    { title: '招生通道', detail: '优秀体育学生、高水平运动员招生为体育特长生提供单独通道，需单独完成报名、测试与确认。' }
  ];

  return (
    <main className="news-special-aerial-page">
      <NewsAerialNav />
      <NewsAerialHero
        kicker="SPORTS REFORM SPECIAL"
        title={`${currentYear} 上海体育考试改革专题`}
        description="面向上海升学家庭，把中考体育改革、过程性评价、统一考试时间表、伤病免缓考和体育特长生招生按阶段整理，方便按当前进度快速进入。"
        imageClass="is-sports"
      />

      <section className="news-special-aerial-stats">
        <article>
          <strong>{sportsNews.length}</strong>
          <span>体育相关新闻</span>
        </article>
        <article>
          <strong>{sportsPolicies.length}</strong>
          <span>相关政策</span>
        </article>
        <article>
          <strong>改革 / 招生</strong>
          <span>按专题集中查看</span>
        </article>
      </section>

      <section className="news-special-aerial-content" id="sports-list">
        <section className="news-special-aerial-main">
          {leadNews ? (
            <section className="news-special-aerial-section">
              <NewsAerialKicker>FOCUS</NewsAerialKicker>
              <Link className="news-panel-link" href={`/news/${leadNews.id}`}>
                <h2>{leadNews.title}</h2>
                <p className="news-glossary-summary">{leadNews.summary || '暂无摘要'}</p>
              </Link>
            </section>
          ) : null}

          <section className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <h2>先用这几条官方信息校准体育改革判断框架</h2>
            <div className="news-special-annotation-grid">
              {keyFacts.map((item) => (
                <article key={item.title}>
                  <span>{item.title}</span>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <h2>按当前阶段，体育改革专题更适合这样使用</h2>
            <div className="news-special-brief-grid">
              {currentChecklist.map((item, index) => (
                <article key={item} className="news-special-aerial-card">
                  <span>{`0${index + 1}`}</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <h2>这几份文件决定了今年上海体育考试改革怎么走</h2>
            <div className="news-special-aerial-stack">
              {officialFocus.map((item) => (
                <Link
                  key={item.id}
                  className="news-special-aerial-entry"
                  href={getDetailHref(item)}
                >
                  <div className="news-special-aerial-entry-meta">
                    <span className="pill">{item.publishedAt || item.year || '暂无日期'}</span>
                    <span>{item.source?.name || getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
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

          <section id="sports-reform" className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <h2>改革解读与过程性评价相关内容</h2>
            <div className="news-special-aerial-stack">
              {groups.reform.map((item) => (
                <Link key={item.id} className="news-special-aerial-entry" href={`/news/${item.id}`}>
                  <div className="news-special-aerial-entry-meta">
                    <span className="pill">{item.publishedAt || '暂无日期'}</span>
                    <span>{getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

          <section id="sports-exam" className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <h2>统一考试与时间安排相关内容</h2>
            <div className="news-special-aerial-stack">
              {groups.exam.map((item) => (
                <Link key={item.id} className="news-special-aerial-entry" href={`/news/${item.id}`}>
                  <div className="news-special-aerial-entry-meta">
                    <span className="pill">{item.publishedAt || '暂无日期'}</span>
                    <span>{getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

          <section id="sports-injury" className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <h2>伤病免考与缓考相关内容</h2>
            <div className="news-special-aerial-stack">
              {groups.injury.map((item) => (
                <Link key={item.id} className="news-special-aerial-entry" href={`/news/${item.id}`}>
                  <div className="news-special-aerial-entry-meta">
                    <span className="pill">{item.publishedAt || '暂无日期'}</span>
                    <span>{getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

          <section id="sports-recruit" className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <h2>体育特长生与高水平运动员招生</h2>
            <div className="news-special-aerial-stack">
              {groups.recruit.map((item) => (
                <Link key={item.id} className="news-special-aerial-entry" href={`/news/${item.id}`}>
                  <div className="news-special-aerial-entry-meta">
                    <span className="pill">{item.publishedAt || '暂无日期'}</span>
                    <span>{getNewsCategoryLabel(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                </Link>
              ))}
            </div>
          </section>

          {groups.school.length ? (
            <section className="news-special-aerial-section">
              <NewsAerialKicker>FOCUS</NewsAerialKicker>
              <h2>体育特色学校相关内容</h2>
              <div className="news-special-aerial-stack">
                {groups.school.map((item) => (
                  <Link key={item.id} className="news-special-aerial-entry" href={`/news/${item.id}`}>
                    <div className="news-special-aerial-entry-meta">
                      <span className="pill">{item.publishedAt || '暂无日期'}</span>
                      <span>{getNewsCategoryLabel(item)}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className="news-glossary-summary">{item.summary || '暂无摘要'}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="news-special-aerial-section">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <h2>当年体育相关招生政策与说明</h2>
            <div className="news-special-aerial-stack">
              {sportsPolicies.map((item) => (
                <Link key={item.id} className="news-special-aerial-entry" href={getPolicyDetailHref(item)}>
                  <div className="news-special-aerial-entry-meta">
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

        <aside className="news-special-aerial-side">
          <section className="news-special-aerial-side-card">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <p>上海体育考试改革最容易混淆的是「过程性评价」「日常考核」「统一考试」三个概念。看不清时先分清这三者，再读这一页会更顺。</p>
          </section>

          <section className="news-special-aerial-side-card">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <p>4 月统一考试、伤病免缓考申请窗口、优秀体育学生资格确认，是今年体育改革专题里最核心的时间链。</p>
          </section>

          <section className="news-special-aerial-side-card">
            <NewsAerialKicker>FOCUS</NewsAerialKicker>
            <a className="news-special-aerial-side-link" href="/news/admission-timeline">查看官方招生日程</a>
          </section>
        </aside>

      </section>

      <NewsAerialFooter />
    </main>
  );
}
