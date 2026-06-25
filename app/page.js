import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../components/site-shell';
import { readNewsMarkdownFile } from '../lib/news-content-files.mjs';
import { getNewsCategoryLabel, getNewsPriorityScore, getNewsSection, getSchoolAdmissionInfo, getSchoolDistrictName, getSchoolStage, getSchoolType } from '../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

export const revalidate = 3600;

const CORE_FEATURED_SCHOOL_NAMES = [
  '上海中学',
  '华东师范大学第二附属中学',
  '复旦大学附属中学',
  '上海交通大学附属中学'
];

const HERO_DECISION_PATHS = [
  {
    label: '政策解读',
    title: '中招高招政策一页看懂',
    description: '报名条件、批次顺序、名额分配、录取规则，帮你理清时间线和关键节点。',
    links: [
      { label: '中考专题', href: '/news/zhongkao-special' },
      { label: '高考专题', href: '/news/gaokao-special' },
      { label: '招生日程', href: '/news/admission-timeline' }
    ]
  },
  {
    label: '学校查询',
    title: '883 所学校按需筛选',
    description: '按区县、办学性质、特色方向查找，比较分数线和升学去向。',
    links: [
      { label: '学校库', href: '/schools' },
      { label: '按分类', href: '/schools/category' },
      { label: '区县专题', href: '/schools/district' }
    ]
  },
  {
    label: '知识体系',
    title: '初一到高三学习路径',
    description: '按年级和学科整理知识点、例题和中考真题，配套复习计划。',
    links: [
      { label: '九年级', href: '/knowledge/grade-9' },
      { label: '高中', href: '/knowledge/senior-1' },
      { label: '全部', href: '/knowledge' }
    ]
  }
];

const HOME_KNOWLEDGE_COURSES = [
  {
    subject: '中考总览',
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
    subject: '高中衔接',
    title: '高一衔接知识准备',
    description: '初升高过渡：数学函数、物理力学、化学氧化还原基础。',
    href: '/knowledge/grade-7',
    status: '衔接预备'
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
    { date: '6月7-9日', title: '全国统一高考', description: '高三考生进入年度最关键考试窗口。', href: '/news/exam-2026-gaokao-timeline' },
    { date: '6月20-21日', title: '上海中考笔试', description: '初三考生进行初中学业水平考试笔试。', href: '/news/exam-2026-zhongkao-timeline' },
    { date: '6月23日', title: '高考成绩查询', description: '预计6月23日左右公布高考成绩。', href: '/news/exam-2026-gaokao-score-preview' },
    { date: '7月上旬', title: '中考查分+分数线', description: '中考成绩公布，各批次分数线陆续发布。', href: '/news/exam-2026-zhongkao-chafen' },
    { date: '7-8月', title: '录取与报到', description: '各批次录取、民办补录和新生报到。', href: '/news/admission-timeline' }
  ];
  const decisionEntries = [
    { label: '中考', title: '中招全流程：报名到录取', description: '报名条件、志愿批次、名额分配和分数线查询。', href: '/news/zhongkao-special' },
    { label: '高考', title: '高招关键节点和时间线', description: '春考、秋考、综评、强基，别错过每个截止日期。', href: '/news/gaokao-special' },
    { label: '学校库', title: '按区按类型筛选学校', description: '883 所学校，比较分数线、特色班和升学去向。', href: '/schools' },
    { label: '16区', title: '先看区，再选学校', description: '各区教育资源分布和升学氛围差异一览。', href: '/schools/district/xuhui' }
  ];
  const darkFeatureCards = [
    {
      label: '本周重点',
      title: '影响报名和录取的关键节点',
      description: '从所有动态中挑出真正影响选择的信息，帮你抓住时间窗口。',
      href: '/news'
    },
    {
      label: '政策速查',
      title: '术语看不懂？从这里开始',
      description: '先搞懂概念，再看常见问题，最后回到原文核对。',
      href: '/news/policy-glossary'
    },
    {
      label: '区县判断',
      title: '择校问题，答案先藏在区里',
      description: '先看区县教育格局，再比较具体学校，判断会更稳。',
      href: '/schools/district/xuhui'
    }
  ];
  const darkQuickLinks = [
    { label: '政策概念', value: '关键词先看懂', href: '/news/policy-glossary' },
    { label: '常见问答', value: '疑问先解答', href: '/news/policy-faq' },
    { label: '政策深读', value: '原文再核对', href: '/news/policy-deep-dive' },
    { label: '招生日程', value: '日期盯紧', href: '/news/admission-timeline' }
  ];
  const topSchools = getHomeFeaturedSchools(schools);
  const [featuredSchool, ...supportSchools] = topSchools;
  // JSON-LD for WebSite Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "考哪去",
    "url": "https://kaonaqu.xyz",
    "description": "上海升学观察 · 把复杂信息整理成更容易读懂的判断入口。涵盖政策消息、学校信息、区县差异与学习路径。",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kaonaqu.xyz/schools?query={search_term_string}",
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
                  <span className="newsroom-kicker">考哪去</span>
                  <span className="newsroom-edition">上海升学信息平台</span>
                </div>
              <div className="home-prototype-copy">
                <div className="home-hero-tag-row">
                  <div className="home-hero-tag">2026 上海升学指南</div>
                  <p className="home-hero-micro-note">覆盖 16 区 883 所学校</p>
                </div>
                <h1>上海升学<br/>三件事看清楚</h1>
                <p className="home-hero-description">政策决定时间和规则，学校决定目标和取舍，知识路径决定现在怎么准备。三条线分开看，再接起来。</p>
                <div className="home-hero-inline-meta">
                  <span>政策解读</span>
                  <span>学校查询</span>
                  <span>知识体系</span>
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
                    <p className="overview-label">本周重点</p>
                    <div className="news-meta-row">
                      <span className="pill">{getNewsCategoryLabel(headline)}</span>
                      <span className="news-date">{headline.publishedAt || '—'}</span>
                    </div>
                    <h2>{headline.title}</h2>
                    <p>{headline.summary || '—'}</p>
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
              <p className="overview-label">升学动态</p>
              <h2>影响选择的消息，先帮你挑出来</h2>
            </div>
            <div className="home-editorial-section-tools">
              <Link className="home-editorial-mini-link" href="/news">全部新闻</Link>
            </div>
          </div>

          <div className="home-editorial-news-grid">
            {featuredStories.map((item, index) => (
              <Link
                key={item.id}
                className={`home-editorial-news-card home-editorial-news-card-stage${index === 1 ? ' home-editorial-news-card-warm' : ''}`}
                href={getNewsDetailHref(item)}
              >
                <p className="home-editorial-card-kicker">{getNewsCategoryLabel(item)} / {item.publishedAt || '—'}</p>
                <h3>{item.title}</h3>
                <p>{item.summary || '—'}</p>
              </Link>
            ))}
          </div>

          <section className="home-dark-band" aria-label="首页深色重点模块">
            <div className="home-dark-band-head">
              <div>
                <p className="overview-label">本周判断重点</p>
                <h2>信息太多，先抓住这几件事</h2>
              </div>
              <Link className="home-dark-band-link" href="/news">全部专题</Link>
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
                <h2>初一到高三，学习路径连起来看</h2>
                <p>七年级搭框架，八年级补理化基础，九年级进入中考复习。高中三段按高考衔接、专题突破和冲刺逐年推进。</p>
              </div>
              <div className="home-knowledge-actions">
                <Link className="home-editorial-mini-link" href="/knowledge/grade-7">七年级</Link>
                <Link className="home-editorial-mini-link" href="/knowledge/grade-8">八年级</Link>
                <Link className="home-editorial-mini-link" href="/knowledge/grade-9">九年级</Link>
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
                  <p className="overview-label">升学时间线</p>
                  <h2>接下来的关键时间点</h2>
                </div>
                <div className="home-editorial-section-tools">
                  <Link className="home-editorial-mini-link" href="/news/admission-timeline">完整日程</Link>
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
                  <p className="overview-label">学校信息</p>
                  <h2>重点学校，先看这几所</h2>
                </div>
                <div className="home-editorial-section-tools">
                  <Link className="home-editorial-mini-link" href="/schools">全部学校</Link>
                  <Link className="home-editorial-mini-link" href="/schools/category">按分类查看</Link>
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
                <h3>先看你所在的区，再比较学校</h3>
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
              <p className="overview-label">下一步</p>
              <h2>继续探索</h2>
            </div>
            <div className="home-editorial-cta-actions">
              <Link className="home-cta-button home-cta-button-primary" href="/news">查看升学动态</Link>
              <Link className="home-cta-button home-cta-button-secondary" href="/schools">查询学校信息</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>考哪去 · 上海升学信息平台</span>
        <span>政策消息 / 学校信息 / 区县差异 / 学习路径</span>
      </footer>
    </SiteShell>
    </>
  );
}
