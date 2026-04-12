import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../components/site-shell';
import { readNewsMarkdownFile } from '../lib/news-content-files.mjs';
import { getNewsCategoryLabel, getNewsPriorityScore, getNewsSection, getSchoolAdmissionInfo, getSchoolDistrictName, getSchoolStage, getSchoolType } from '../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

export const dynamic = 'force-dynamic';

function getSchoolPreviewScore(school) {
  const tags = Array.isArray(school.tags) ? school.tags.length : 0;
  const features = Array.isArray(school.features) ? school.features.length : 0;
  const metadataFields = [school.address, school.phone, school.website, school.admissionNotes].filter(Boolean).length;
  return tags * 2 + features * 2 + metadataFields;
}

function sortNewsByPriority(news) {
  return news
    .slice()
    .sort((left, right) => {
      const scoreDiff = getNewsPriorityScore(right) - getNewsPriorityScore(left);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return String(right.publishedAt || '').localeCompare(String(left.publishedAt || ''));
    });
}

function getNewsDetailHref(item) {
  return item?.id ? `/news/${encodeURIComponent(item.id)}` : '/news';
}

export default async function HomePage() {
  const { districts, schools, news } = await loadDataStore();
  const sortedNews = news.slice().sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));
  const headline = sortedNews.find((item) => readNewsMarkdownFile(item)) || sortedNews[0] || null;
  const topNewsByPriority = sortNewsByPriority(news);
  const featuredPolicy = topNewsByPriority.find((item) => getNewsSection(item) === 'admission') || sortedNews[0] || null;
  const featuredExam = topNewsByPriority.find((item) => getNewsSection(item) === 'exam') || sortedNews[1] || null;
  const featuredSchoolNews = topNewsByPriority.find((item) => getNewsSection(item) === 'school') || sortedNews[2] || null;
  const featuredStories = [featuredPolicy, featuredExam, featuredSchoolNews].filter(Boolean);
  const districtHighlights = districts
    .slice()
    .sort((left, right) => (right.schoolCount || 0) - (left.schoolCount || 0))
    .slice(0, 4);
  const timelineItems = [
    { date: '4月10日', title: '义务教育入学系统开放', description: '信息登记、报名和核验开始集中进行。', href: '/news/admission-2026-compulsory-education-opinion' },
    { date: '5月16日-17日', title: '中招听说与理化实验', description: '外语听说测试及理化实验操作考试。', href: '/news/exam-2026-zhongzhao-opinion' },
    { date: '6月7日-9日', title: '全国统一高考', description: '高三考生进入年度最关键考试窗口。', href: '/news/exam-2026-shmeea-calendar' },
    { date: '6月20日-21日', title: '上海中考笔试', description: '初三考生进行初中学业水平考试笔试。', href: '/news/exam-2026-zhongzhao-opinion' }
  ];
  const decisionEntries = [
    { label: '上海中考', title: '今年中招怎么招，先从这里看明白', description: '报名、志愿、批次顺序和关键问答，适合家长先看全局。', href: '/news/zhongkao-special' },
    { label: '上海高考', title: '春考、高考、成绩和录取节点一页看全', description: '把今年高招最容易错过的时间和政策集中放在一起。', href: '/news/gaokao-special' },
    { label: '上海学校', title: '哪所学校更适合孩子，先查真实信息', description: '按区县、学段和办学类型筛学校，少走弯路。', href: '/schools' },
    { label: '上海 16 区', title: '先看区，再看学校，择校会快很多', description: '不同区的学校资源和升学氛围差别很大，值得先看一眼。', href: '/schools/district/xuhui' }
  ];
  const darkFeatureCards = [
    {
      label: '本周先看',
      title: '先盯住会影响报名和录取的那几件事',
      description: '有些消息只是热闹，有些节点会直接影响后面的选择，这里先帮你挑出来。',
      href: '/news'
    },
    {
      label: '专题入口',
      title: '看不懂术语、拿不准规则，就从这条线往下读',
      description: '先搞懂概念，再看常见问题，最后回到原文，很多焦虑会一下子清楚不少。',
      href: '/news/policy-glossary'
    },
    {
      label: '区域判断',
      title: '很多择校问题，答案其实先藏在区里',
      description: '先看区县教育格局，再去比较具体学校，判断会更稳。',
      href: '/schools/district/xuhui'
    }
  ];
  const darkQuickLinks = [
    { label: '政策概念速查', value: '先把关键词看懂', href: '/news/policy-glossary' },
    { label: '高频政策问答', value: '先解答最常见疑问', href: '/news/policy-faq' },
    { label: '政策深读', value: '再回到正式文件核对', href: '/news/policy-deep-dive' },
    { label: '官方招生日程', value: '最后盯紧关键日期', href: '/news/admission-timeline' }
  ];
  const topSchools = schools
    .slice()
    .sort((left, right) => {
      const scoreDiff = getSchoolPreviewScore(right) - getSchoolPreviewScore(left);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
    })
    .slice(0, 4);
  const [featuredSchool, ...supportSchools] = topSchools;
  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero" id="top">
        <section className="search-panel home-hero-panel home-prototype-hero" aria-label="网站概览">
          <div className="home-prototype-grid">
            <div className="home-prototype-main">
              <div className="newsroom-kicker-row prototype-kicker-row">
                <span className="newsroom-kicker">上海升学</span>
                <span className="newsroom-edition">给家长和学生看的关键信息</span>
              </div>
              <div className="home-prototype-copy">
                <div className="home-hero-tag-row">
                  <div className="home-hero-tag">上海 · 2026</div>
                  <p className="home-hero-micro-note">把今年上海升学最该看的信息，整理到一个入口</p>
                </div>
                <h1>上海升学这件事，不必再到处打听</h1>
                <p className="home-hero-description">从今年的中考、高考政策，到上海 16 区学校信息，再到真正能用上的知识体系，考哪去把最容易让人焦虑、也最需要尽快看懂的内容放到一起，帮你少刷无效信息，更快看清下一步。</p>
                <div className="home-hero-inline-meta">
                  <span>只看上海升学</span>
                  <span>政策和时间一页理清</span>
                  <span>学校信息和学习路径一起看</span>
                </div>
                <div className="home-hero-density-grid">
                  <article className="home-hero-density-card">
                    <p className="home-hero-density-label">最近最该盯住</p>
                    <div className="home-hero-density-list">
                      {timelineItems.slice(0, 3).map((item) => (
                        <Link key={item.title} className="home-hero-density-item" href={item.href}>
                          <strong>{item.date}</strong>
                          <span>{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </article>
                  <article className="home-hero-density-card home-hero-density-card-warm">
                    <p className="home-hero-density-label">来这里先解决</p>
                    <div className="home-hero-density-points">
                      <span>今年上海中高考政策到底变了什么</span>
                      <span>接下来哪些节点最不能错过</span>
                      <span>学校、区县和学习路径该怎么一起看</span>
                    </div>
                  </article>
                </div>
                <div className="home-hero-route-strip" aria-label="首页快捷入口">
                  <Link className="home-hero-route-link" href="/news/zhongkao-special">
                    <span>中考专题</span>
                    <strong>先看报名和批次</strong>
                  </Link>
                  <Link className="home-hero-route-link" href="/news/gaokao-special">
                    <span>高考专题</span>
                    <strong>先看时间线</strong>
                  </Link>
                  <Link className="home-hero-route-link" href="/schools">
                    <span>学校查询</span>
                    <strong>直接查学校</strong>
                  </Link>
                  <Link className="home-hero-route-link" href="/knowledge">
                    <span>知识体系</span>
                    <strong>补学习路径</strong>
                  </Link>
                </div>
              </div>
              <div className="home-hero-actions">
                <Link className="home-cta-button home-cta-button-primary" href="/news">先看最新政策</Link>
                <Link className="home-cta-button home-cta-button-secondary" href="/schools">再查学校和区县</Link>
              </div>
            </div>
            <aside className="home-prototype-side" aria-label="首页信息盒">
              {headline ? (
                <div className="prototype-side-stack">
                  <Link className="prototype-side-card prototype-side-lead prototype-side-card-link" href={getNewsDetailHref(headline)}>
                    <p className="overview-label">这周最值得先看</p>
                    <div className="news-meta-row">
                      <span className="pill">{getNewsCategoryLabel(headline)}</span>
                      <span className="news-date">{headline.publishedAt || '暂无日期'}</span>
                    </div>
                    <h2>{headline.title}</h2>
                    <p>{headline.summary || '暂无摘要'}</p>
                    <span className="prototype-side-readmore">阅读全文</span>
                  </Link>
                  <div className="home-side-timeline">
                    {timelineItems.slice(0, 3).map((item) => (
                      <Link key={item.title} className="home-side-timeline-item" href={item.href}>
                        <strong>{item.date}</strong>
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="prototype-side-metrics">
                <article>
                  <span>覆盖区县</span>
                  <strong>{districts.length} 区</strong>
                </article>
                <article>
                  <span>可查学校</span>
                  <strong>{schools.length}+</strong>
                </article>
                <article>
                  <span>本市动态</span>
                  <strong>{news.length}</strong>
                </article>
              </div>
            </aside>
          </div>
        </section>
      </header>

      <main className="layout home-prototype-main-layout">
        <section className="home-editorial">
          <div className="home-decision-grid">
            {decisionEntries.map((entry) => (
              <Link key={entry.title} className="home-decision-card" href={entry.href}>
                <p className="home-editorial-card-kicker">{entry.label}</p>
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
              </Link>
            ))}
          </div>

          <div className="home-editorial-section-head home-editorial-news-head">
            <div>
              <p className="overview-label">上海关键进度</p>
              <h2>真正会影响选择的消息，先帮你挑出来</h2>
            </div>
            <div className="home-editorial-section-tools">
              <Link className="home-editorial-mini-link" href="/news">新闻频道</Link>
            </div>
          </div>

          <div className="home-editorial-news-grid">
            {featuredStories.map((item, index) => (
              <Link
                key={item.id}
                className={`home-editorial-news-card home-editorial-news-card-stage${index === 1 ? ' home-editorial-news-card-warm' : ''}`}
                href={getNewsDetailHref(item)}
              >
                <p className="home-editorial-card-kicker">{getNewsCategoryLabel(item)} / {item.publishedAt || '暂无日期'}</p>
                <h3>{item.title}</h3>
                <p>{item.summary || '暂无摘要'}</p>
              </Link>
            ))}
          </div>

          <section className="home-dark-band" aria-label="首页深色重点模块">
            <div className="home-dark-band-head">
              <div>
                <p className="overview-label">本周判断重点</p>
                <h2>当信息太多的时候，先抓住这几件最重要的事。</h2>
              </div>
              <Link className="home-dark-band-link" href="/news">专题总览</Link>
            </div>
            <div className="home-dark-feature-grid">
              {darkFeatureCards.map((card) => (
                <Link key={card.title} className="home-dark-feature-card" href={card.href}>
                  <p className="home-dark-feature-label">{card.label}</p>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </Link>
              ))}
            </div>
            <div className="home-dark-quick-strip">
              {darkQuickLinks.map((item) => (
                <Link key={item.label} className="home-dark-quick-link" href={item.href}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </Link>
              ))}
            </div>
          </section>

          <div className="home-editorial-columns">
            <section className="home-editorial-main-col">
              <div className="home-editorial-section-head">
                <div>
                  <p className="overview-label">上海时间线</p>
                  <h2>接下来这些时间点，最好提前记下来</h2>
                </div>
                <div className="home-editorial-section-tools">
                  <Link className="home-editorial-mini-link" href="/news/admission-timeline">完整时间线</Link>
                </div>
              </div>

              <div className="home-timeline-grid">
                {timelineItems.map((item) => (
                  <Link key={item.title} className="home-timeline-card" href={item.href}>
                    <p className="home-timeline-date">{item.date}</p>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </Link>
                ))}
              </div>

              <div className="home-editorial-section-head">
                <div>
                  <p className="overview-label">上海学校信息</p>
                  <h2>先从这些热门学校开始看，会更容易找到方向</h2>
                </div>
                <div className="home-editorial-section-tools">
                  <Link className="home-editorial-mini-link" href="/schools">学校列表</Link>
                </div>
              </div>

              <div className="home-school-stage">
                {featuredSchool ? (
                  <Link href={`/schools/${featuredSchool.id}`} className="home-school-featured-card">
                    <div className="home-school-featured-visual home-school-lead-image-1" aria-hidden="true"></div>
                    <div className="home-school-featured-copy">
                      <p className="home-editorial-card-kicker">{getSchoolDistrictName(featuredSchool)} / {getSchoolStage(featuredSchool)} / 重点学校</p>
                      <h3>{featuredSchool.name}</h3>
                      <p>{getSchoolAdmissionInfo(featuredSchool)}</p>
                      <div className="home-school-featured-meta">
                        <span>{getSchoolType(featuredSchool)}</span>
                        <strong>学校详情</strong>
                      </div>
                    </div>
                  </Link>
                ) : null}

                <div className="home-school-support-grid">
                  {supportSchools.map((school, index) => (
                    <Link key={school.id} href={`/schools/${school.id}`} className="home-school-mini-card">
                      <div className={`home-school-support-image home-school-support-image-${(index % 2) + 1}`} aria-hidden="true"></div>
                      <div className="home-school-mini-copy">
                        <p className="home-editorial-card-kicker">{getSchoolType(school)} / {getSchoolDistrictName(school)}</p>
                        <h3>{school.name}</h3>
                        <p>{getSchoolAdmissionInfo(school)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </section>

            <aside className="home-editorial-side-col">
              <article className="home-editorial-side-card home-editorial-side-card-dark">
                <p className="overview-label">上海 16 区</p>
                <h3>先看你所在的区，再去比较学校，很多问题会一下子清楚。</h3>
                <div className="home-district-list">
                  {districtHighlights.map((district) => (
                    <Link key={district.id} className="home-district-link" href={`/schools/district/${district.id}`}>
                      <span>{district.name}</span>
                      <strong>{district.schoolCount} 所学校</strong>
                    </Link>
                  ))}
                </div>
                <Link className="text-link" href="/news">继续看政策和消息</Link>
              </article>
            </aside>
          </div>

          <div className="home-editorial-cta">
            <div className="home-editorial-cta-copy">
              <p className="overview-label">继续往下看</p>
              <h2>如果你已经知道自己下一步要看什么，就从这里继续。</h2>
            </div>
            <div className="home-editorial-cta-actions">
              <Link className="home-cta-button home-cta-button-primary" href="/news">继续看政策消息</Link>
              <Link className="home-cta-button home-cta-button-secondary" href="/schools">继续查学校</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 · 把复杂信息整理成更容易读懂的判断入口</span>
        <span>政策消息 / 学校信息 / 区县差异 / 学习路径</span>
      </footer>
    </SiteShell>
  );
}
