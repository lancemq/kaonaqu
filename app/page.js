import '../styles/channels/home.css';
import Link from 'next/link';
import { createRequire } from 'module';
import {
  getNewsCategoryLabel,
  getNewsSection,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolFeatures,
  getSchoolStage
} from '../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadSchoolsList, loadNewsList } = require('../shared/data-store');
const { DISTRICT_CATALOG } = require('../shared/data-schema');

const FEATURED_SCHOOL_NAMES = [
  '复旦大学附属中学',
  '上海中学',
  '华东师范大学第二附属中学',
  '上海交通大学附属中学'
];

const QUICK_LINKS = [
  { label: '中考政策', href: '/news/zhongkao-special' },
  { label: '高考指南', href: '/news/gaokao-special' },
  { label: '学校对比', href: '/schools/compare' },
  { label: '知识专题', href: '/knowledge' }
];

const NEWS_SPECIALS = [
  {
    title: '中招专题',
    label: '热门',
    icon: '中',
    href: '/news/zhongkao-special',
    description: '上海中考招生政策、志愿填报、录取节奏与关键节点汇总'
  },
  {
    title: '高招专题',
    label: '必读',
    icon: '高',
    href: '/news/gaokao-special',
    description: '高考综合改革、考试安排、招生录取等权威政策解读'
  },
  {
    title: '体育改革',
    label: 'NEW',
    icon: '体',
    href: '/news/sports-reform',
    description: '体育考试改革、评价方式、项目规则与训练准备集中追踪'
  },
  {
    title: '政策速查',
    label: 'TOOLS',
    icon: '策',
    href: '/news/policy-glossary',
    description: '把常见政策概念、录取术语和问答入口整理成可快速查阅的工具'
  }
];

// FOCUS 区块：首页右侧"平台更新动态"面板（动态指标，非专题入口）

const KNOWLEDGE_TOPICS = [
  { label: '九年级中考总览', meta: 'GRADE 9', href: '/knowledge/grade-9' },
  { label: '数学压轴题路径', meta: 'MATH', href: '/knowledge/math-grade9' },
  { label: '物理实验专题', meta: 'PHYSICS', href: '/knowledge/physics-grade9' },
  { label: '高中衔接准备', meta: 'SENIOR', href: '/knowledge/grade-7' }
];

function getNewsHref(item) {
  return item?.id ? `/news/${encodeURIComponent(item.id)}` : '/news';
}

// 选取最新的新闻展示，优先覆盖不同分区（保持多样性）
function pickFeaturedNews(news, count = 4) {
  // news 已按 publishedAt 降序排列
  const picked = [];
  const usedSections = new Set();

  // 第一轮：按时间取，每个分区最多 1 条
  for (const item of news) {
    if (picked.length >= count) break;
    const section = getNewsSection(item);
    if (usedSections.has(section)) continue;
    usedSections.add(section);
    picked.push(item);
  }

  // 第二轮：分区不够，按时间补足
  for (const item of news) {
    if (picked.length >= count) break;
    if (picked.some((existing) => existing.id === item.id)) continue;
    picked.push(item);
  }

  return picked.slice(0, count);
}

function sortNews(news) {
  // 按发布时间降序，最新的排前面
  return news
    .slice()
    .sort((left, right) =>
      String(right.publishedAt || '').localeCompare(String(left.publishedAt || ''))
    );
}

function findSchoolByName(schools, name) {
  return schools.find((school) => school.name === name)
    || schools.find((school) => school.name.includes(name));
}

function getSchoolCompletenessScore(school) {
  const tags = Array.isArray(school.tags) ? school.tags.length : 0;
  const features = Array.isArray(school.features) ? school.features.length : 0;
  return tags * 2 + features * 2 + [school.address, school.phone, school.website, school.admissionInfo?.notes].filter(Boolean).length;
}

// 层级徽标：剥离「(高中)/(初中)」后缀，如「市重点(高中)」→「市重点」
function getSchoolKeyLevelLabel(school) {
  const raw = String(school?.schoolKeyLevel || '').trim();
  return raw ? raw.replace(/[（(].*?[）)]/g, '') : '';
}

// 层级权重（用于区县代表学校排序），与 data-store 的 KEY_LEVEL_PRIORITY 对齐
function keyLevelRank(school) {
  const raw = String(school?.schoolKeyLevel || '').replace(/[（(].*?[）)]/g, '').trim();
  const PRIORITY = {
    '市重点': 100, '三公': 95, '区重点': 80, '顶级民办': 70,
    '优质公办': 65, '一般高中': 60, '一般初中': 40
  };
  return PRIORITY[raw] || 0;
}

function getFeaturedSchools(schools) {
  const selected = FEATURED_SCHOOL_NAMES.map((name) => findSchoolByName(schools, name)).filter(Boolean);
  const selectedIds = new Set(selected.map((school) => school.id));
  const fallback = schools
    .filter((school) => !selectedIds.has(school.id))
    .sort((left, right) => getSchoolCompletenessScore(right) - getSchoolCompletenessScore(left));

  return [...selected, ...fallback].slice(0, 4);
}

function getDistrictHighlights(districts, schools) {
  return districts
    .map((district) => {
      const inDistrict = schools.filter((school) => school.districtId === district.id);
      const topSchool = inDistrict
        .slice()
        .sort((left, right) => keyLevelRank(right) - keyLevelRank(left))[0];
      return {
        ...district,
        visibleSchoolCount: inDistrict.length,
        topSchoolName: topSchool ? topSchool.name : ''
      };
    })
    .sort((left, right) => (right.visibleSchoolCount || 0) - (left.visibleSchoolCount || 0))
    .slice(0, 6);
}

function SectionLabel({ children }) {
  return (
    <div className="channel-kicker">
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

export default async function HomePage() {
  const [schools, news] = await Promise.all([loadSchoolsList(), loadNewsList()]);
  const districts = DISTRICT_CATALOG;
  const sortedNews = sortNews(news);
  const featuredNews = pickFeaturedNews(sortedNews, 4);
  const headlineNews = sortedNews
    .filter((item) => !featuredNews.some((featured) => featured.id === item.id))
    .slice(0, 5);

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const recentNewsCount = news.filter((item) => String(item.publishedAt || '') >= weekAgo).length;

  const featuredSchools = getFeaturedSchools(schools);
  const districtHighlights = getDistrictHighlights(districts, schools);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: '考哪去',
        url: 'https://kaonaqu.xyz',
        description: '上海升学信息平台，聚合中考高考政策、学校信息、区县专题和初高中知识体系。',
        areaServed: '上海'
      },
      {
        '@type': 'WebSite',
        name: '考哪去',
        url: 'https://kaonaqu.xyz',
        description: '上海升学信息平台，聚合中考高考政策、学校信息、区县专题和初高中知识体系。',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://kaonaqu.xyz/schools?query={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };

  return (
    <main className="home-aerial-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="channel-nav" aria-label="顶部导航">
        <Link className="channel-brand" href="/" aria-label="考哪去首页">
          <strong>考哪去</strong>
          <span>SHANGHAI EDUCATION</span>
        </Link>
        <div className="channel-nav-links">
          <Link className="is-active" href="/">首页</Link>
          <Link href="/news">新闻</Link>
          <Link href="/schools">学校</Link>
          <Link href="/knowledge">知识</Link>
        </div>
      </nav>

      <header className="channel-hero">
        <div className="channel-hero-grid" aria-hidden="true"></div>
        <section className="channel-hero-content" aria-label="首页概览">
          <div className="channel-hero-copy">
            <SectionLabel>SHANGHAI EDUCATION SIGNAL</SectionLabel>
            <h1>上海升学信息，从这里俯瞰全局</h1>
            <p>
              政策动态、重点学校、知识路径和区县判断收束在一个入口。先看全局，再进入具体选择。
            </p>
            <div className="home-hero-actions">
              <Link href="/news">查看最新动态</Link>
              <Link href="/schools">进入学校库</Link>
            </div>
          </div>

          <aside className="channel-hero-stats" aria-label="首页数据摘要">
            <article>
              <span>01 / NEWS</span>
              <strong>{news.length}</strong>
              <p>本市升学动态</p>
            </article>
            <article>
              <span>02 / DISTRICTS</span>
              <strong>{districts.length}</strong>
              <p>覆盖区县</p>
            </article>
            <article>
              <span>03 / SCHOOLS</span>
              <strong>{schools.length}</strong>
              <p>收录学校</p>
            </article>
          </aside>
        </section>
      </header>

      <section className="home-news-slab">
        <div className="home-news-column">
          <SectionLabel>LATEST NEWS</SectionLabel>
          <h2>最新升学动态</h2>
          <p className="home-section-intro">汇集上海中考、高考最新政策发布与新闻动态，一站式掌握升学关键信息。</p>

          <div className="home-news-grid">
            {featuredNews.map((item) => (
              <Link className="home-news-card" href={getNewsHref(item)} key={item.id}>
                <span>{getNewsCategoryLabel(item)} / {item.publishedAt || 'DATE PENDING'}</span>
                <h3>{item.title}</h3>
                <p>{item.summary || '进入详情查看完整内容。'}</p>
              </Link>
            ))}
          </div>

          <div className="home-news-list">
            {headlineNews.map((item) => (
              <Link className="home-news-list-item" href={getNewsHref(item)} key={item.id}>
                <span>{item.publishedAt || 'DATE PENDING'}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </div>

          <Link className="home-text-link" href="/news">查看全部新闻</Link>
        </div>

        <aside className="home-feature-panel home-focus-panel">
          <SectionLabel>FOCUS</SectionLabel>
          <h2>平台更新动态</h2>
          <p className="home-focus-intro">我们持续校正学校信息、追踪官方政策发布，让升学数据保持新鲜可信。</p>
          <div className="home-focus-stats">
            <div>
              <strong>{recentNewsCount}</strong>
              <span>近 7 天新增升学动态</span>
            </div>
          </div>
          <Link className="home-focus-topic-link" href="/news">查看全部动态 →</Link>
        </aside>
      </section>

      <section className="home-news-specials-slab">
        <div className="home-news-specials-overlay">
          <div className="home-news-specials-head">
            <div>
              <SectionLabel>TOPIC ENTRIES</SectionLabel>
              <h2>新闻专题</h2>
              <p>按专题分类浏览，快速找到您关心的升学信息。</p>
            </div>
            <Link href="/news">全部新闻 →</Link>
          </div>

          <div className="home-news-specials-grid">
            {NEWS_SPECIALS.map((special) => (
              <Link className="home-news-special-card" href={special.href} key={special.href}>
                <div className="home-news-special-card-top">
                  <span aria-hidden="true">{special.icon}</span>
                  <strong>{special.label}</strong>
                </div>
                <h3>{special.title}</h3>
                <p>{special.description}</p>
                <em>查看专题 →</em>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-schools-slab">
        <SectionLabel>FEATURED SCHOOLS</SectionLabel>
        <div className="home-section-heading-row">
          <h2>重点学校一览</h2>
          <div className="home-school-stats" aria-label="学校摘要">
            <span>{schools.length}+ 所学校</span>
            <span>{districts.length} 个区县</span>
            <span>市重点 / 区重点 / 特色高中</span>
            <Link href="/schools">全部学校</Link>
          </div>
        </div>

        <div className="home-school-grid">
          {featuredSchools.map((school) => {
            const features = getSchoolFeatures(school).slice(0, 3);
            const keyLevel = getSchoolKeyLevelLabel(school);
            return (
              <Link className="home-school-card" href={`/schools/${school.id}`} key={school.id}>
                <div className="home-school-card-top">
                  <span className="home-school-meta">{getSchoolDistrictName(school)} / {getSchoolStage(school)}</span>
                </div>
                <h3>{school.name}</h3>
                {keyLevel && <span className="home-school-level">{keyLevel}</span>}
                <p>{getSchoolAdmissionInfo(school)}</p>
                {features.length > 0 && (
                  <div className="home-school-tags">
                    {features.map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="home-photo-slab home-school-photo-slab">
        <div>
          <SectionLabel>SCHOOL LANDSCAPE</SectionLabel>
          <h2>先看区域格局，再比较具体学校</h2>
          <p>把学校放回区县和升学路径里看，择校判断会更接近真实场景。</p>
          <Link href="/schools/district">查看区县专题</Link>
        </div>
      </section>

      <section className="home-knowledge-districts">
        <div className="home-knowledge-column">
          <SectionLabel>KNOWLEDGE INDEX</SectionLabel>
          <h2>知识专题</h2>
          <p>覆盖初中到高中全学段学科知识，按年级、科目精准定位，助力系统性学习与备考。</p>
          <div className="home-topic-grid">
            {KNOWLEDGE_TOPICS.map((topic) => (
              <Link href={topic.href} key={topic.href}>
                <span>{topic.meta}</span>
                <strong>{topic.label}</strong>
              </Link>
            ))}
          </div>
          <Link className="home-text-link" href="/knowledge">进入知识体系</Link>
        </div>

        <aside className="home-district-column">
          <SectionLabel>DISTRICTS</SectionLabel>
          <h2>热门区县</h2>
          <div className="home-district-list">
            {districtHighlights.map((district) => (
              <Link href={`/schools/district/${district.id}`} key={district.id}>
                <span>{district.name}</span>
                <strong>{district.visibleSchoolCount || district.schoolCount || 0} 所学校</strong>
                {district.topSchoolName && <em>代表：{district.topSchoolName}</em>}
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <div className="channel-color-bar" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <section className="home-cta-slab">
        <div className="home-cta-copy">
          <SectionLabel>NEXT STEP</SectionLabel>
          <h2>继续探索上海升学路径</h2>
          <p>从政策时间线、学校数据库、区县专题和知识体系里选择下一步。</p>
          <div className="home-cta-actions">
            <Link href="/news">查看升学动态</Link>
            <Link href="/schools">查询学校信息</Link>
          </div>
        </div>

        <aside className="home-floating-links">
          <SectionLabel>QUICK ENTRY</SectionLabel>
          <h3>快速入口</h3>
          {QUICK_LINKS.map((item) => (
            <Link href={item.href} key={item.href}>
              <span>{item.label}</span>
              <strong>→</strong>
            </Link>
          ))}
        </aside>
      </section>

      <footer className="channel-footer">
        <div>
          <strong>考哪去</strong>
          <span>SHANGHAI EDUCATION PLATFORM</span>
        </div>
        <nav aria-label="页脚导航">
          <Link href="/news">新闻政策</Link>
          <Link href="/schools">学校信息</Link>
          <Link href="/knowledge">知识体系</Link>
          <Link href="/schools/district">区县专题</Link>
        </nav>
        <p>© 2026 考哪去</p>
      </footer>
    </main>
  );
}
