import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../components/site-shell';
import { readNewsMarkdownFile } from '../lib/news-content-files.mjs';
import { getNewsCategoryLabel, getNewsPriorityScore, getNewsSection, getSchoolAdmissionInfo, getSchoolDistrictName, getSchoolStage, getSchoolType } from '../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

export const dynamic = 'force-dynamic';

const CORE_FEATURED_SCHOOL_NAMES = [
  '上海中学',
  '华东师范大学第二附属中学',
  '复旦大学附属中学',
  '上海交通大学附属中学'
];

const HERO_DECISION_PATHS = [
  {
    label: '看政策',
    title: '中考、高考、招生节点先看清',
    description: '先看今年政策、时间线和关键问答，避免错过报名、确认、考试和录取节点。',
    links: [
      { label: '中考专题', href: '/news/zhongkao-special' },
      { label: '高考专题', href: '/news/gaokao-special' },
      { label: '招生日程', href: '/news/admission-timeline' }
    ]
  },
  {
    label: '查学校',
    title: '按区、学段、对比查学校',
    description: '从学校库、区县专题和学校对比进入，把目标学校放到同区和同类型里看。',
    links: [
      { label: '学校库', href: '/schools' },
      { label: '区县专题', href: '/schools/district' },
      { label: '学校对比', href: '/schools/compare' }
    ]
  },
  {
    label: '补学习',
    title: '七八九年级学习路径接上',
    description: '七年级打基础，八年级补主学科和理化，九年级进入中考复习和专题突破。',
    links: [
      { label: '九年级总览', href: '/knowledge/grade-9' },
      { label: '八年级总览', href: '/knowledge/grade-8' },
      { label: '知识体系', href: '/knowledge' }
    ]
  }
];

const HOME_KNOWLEDGE_COURSES = [
  {
    subject: '中考',
    title: '九年级中考复习总览',
    description: '把全年复习节奏、模考订正、专题突破和冲刺安排放到一条线上看。',
    href: '/knowledge/grade-9',
    status: '九年级已上线',
    priority: true
  },
  {
    subject: '数学',
    title: '九年级数学',
    description: '函数、圆与相似、动点几何、统计概率和压轴题分层突破。',
    href: '/knowledge/math-grade9',
    status: '中考重点',
    priority: true
  },
  {
    subject: '物理',
    title: '九年级物理',
    description: '力学、电学、实验设计和综合压轴，适合配合模考订正。',
    href: '/knowledge/physics-grade9',
    status: '中考重点',
    priority: true
  },
  {
    subject: '化学',
    title: '九年级化学',
    description: '化学用语、物质性质、实验探究、酸碱盐和综合计算。',
    href: '/knowledge/chemistry-grade9',
    status: '中考重点',
    priority: true
  },
  {
    subject: '英语',
    title: '九年级英语',
    description: '词汇语法、阅读完形、听说训练和中考写作一起复盘。',
    href: '/knowledge/english-grade9',
    status: '九年级'
  },
  {
    subject: '物理',
    title: '沪科版八年级物理',
    description: '测量、声光、运动和力、压强浮力、简单机械与热现象，配套实验和学习计划。',
    href: '/knowledge/physics-grade8',
    status: '八年级'
  },
  {
    subject: '化学',
    title: '沪教版八年级化学',
    description: '开启化学之门、空气、氧气、水与生命、微粒观、化学用语和质量守恒。',
    href: '/knowledge/chemistry-grade8',
    status: '八年级'
  },
  {
    subject: '七年级',
    title: '七年级学习总览',
    description: '语文、数学、英语和科学综合入口，适合先搭主学科框架。',
    href: '/knowledge/grade-7',
    status: '基础框架'
  }
];

function getSchoolPreviewScore(school) {
  const tags = Array.isArray(school.tags) ? school.tags.length : 0;
  const features = Array.isArray(school.features) ? school.features.length : 0;
  const metadataFields = [school.address, school.phone, school.website, school.admissionNotes].filter(Boolean).length;
  return tags * 2 + features * 2 + metadataFields;
}

function findSchoolByName(schools, targetName) {
  return schools.find((school) => school.name === targetName)
    || schools.find((school) => school.name.includes(targetName));
}

function getHomeFeaturedSchools(schools) {
  const picked = CORE_FEATURED_SCHOOL_NAMES
    .map((name) => findSchoolByName(schools, name))
    .filter(Boolean);
  const usedIds = new Set(picked.map((school) => school.id));
  const fallback = schools
    .filter((school) => !usedIds.has(school.id))
    .sort((left, right) => {
      const scoreDiff = getSchoolPreviewScore(right) - getSchoolPreviewScore(left);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
    });

  return [...picked, ...fallback].slice(0, 4);
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
    .map((district) => ({
      ...district,
      visibleSchoolCount: schools.filter((school) => school.districtId === district.id).length
    }))
    .sort((left, right) => (right.visibleSchoolCount || 0) - (left.visibleSchoolCount || 0))
    .slice(0, 8);
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
  const topSchools = getHomeFeaturedSchools(schools);
  const [featuredSchool, ...supportSchools] = topSchools;
  // JSON-LD for WebSite Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "考哪去",
    "url": "https://kaonaqu.com",
    "description": "上海升学观察 · 把复杂信息整理成更容易读懂的判断入口。涵盖政策消息、学校信息、区县差异与学习路径。",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kaonaqu.com/schools?query={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteShell>
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
                  <p className="home-hero-micro-note">先选路径，再看细节</p>
                </div>
                <h1>上海升学，先从三件事看清楚</h1>
                <p className="home-hero-description">政策决定时间和规则，学校决定目标和取舍，学习路径决定现在怎么准备。首页先帮你把这三条线分开，再把它们接起来。</p>
                <div className="home-hero-inline-meta">
                  <span>看政策</span>
                  <span>查学校</span>
                  <span>补学习</span>
                </div>
                <div className="home-hero-path-grid" aria-label="首页三条主路径">
                  {HERO_DECISION_PATHS.map((path) => (
                    <article className="home-hero-path-card" key={path.label}>
                      <span>{path.label}</span>
                      <h2>{path.title}</h2>
                      <p>{path.description}</p>
                      <div className="home-hero-path-links">
                        {path.links.map((link) => (
                          <Link href={link.href} key={link.href}>{link.label}</Link>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
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

          <section className="home-knowledge-panel" aria-label="上海初中知识体系课程">
            <div className="home-knowledge-head">
              <div>
                <p className="overview-label">知识体系</p>
                <h2>七八九年级学习路径，现在可以连起来看</h2>
                <p>七年级搭框架，八年级补主学科和理化基础，九年级进入中考复习、模考订正和专题突破。</p>
              </div>
              <div className="home-knowledge-actions">
                <Link className="home-editorial-mini-link" href="/knowledge/grade-7">七年级总览</Link>
                <Link className="home-editorial-mini-link" href="/knowledge/grade-8">八年级总览</Link>
                <Link className="home-editorial-mini-link" href="/knowledge/grade-9">九年级总览</Link>
              </div>
            </div>
            <div className="home-grade8-course-grid">
              {HOME_KNOWLEDGE_COURSES.map((course) => (
                <Link
                  key={course.href}
                  className={`home-grade8-course-card${course.priority ? ' home-grade8-course-card-priority' : ''}`}
                  href={course.href}
                >
                  <span>{course.status}</span>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <strong>{course.subject}课程</strong>
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
                  <h2>先从这几所最重点的学校开始看，会更容易找到方向</h2>
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
                      <strong>{district.visibleSchoolCount || district.schoolCount} 所学校</strong>
                    </Link>
                  ))}
                </div>
                <Link className="text-link" href="/schools/district">查看全部区域专题</Link>
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
    </>
  );
}
