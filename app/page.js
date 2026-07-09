import Link from 'next/link';
import { createRequire } from 'module';
import {
  getNewsCategoryLabel,
  getNewsPriorityScore,
  getNewsSection,
  getSchoolAdmissionInfo,
  getSchoolDistrictName,
  getSchoolStage,
  getSchoolType
} from '../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

export const revalidate = 3600;

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

const KNOWLEDGE_TOPICS = [
  { label: '九年级中考总览', meta: 'GRADE 9', href: '/knowledge/grade-9' },
  { label: '数学压轴题路径', meta: 'MATH', href: '/knowledge/math-grade9' },
  { label: '物理实验专题', meta: 'PHYSICS', href: '/knowledge/physics-grade9' },
  { label: '高中衔接准备', meta: 'SENIOR', href: '/knowledge/grade-7' }
];

function getNewsHref(item) {
  return item?.id ? `/news/${encodeURIComponent(item.id)}` : '/news';
}

const NEWS_FILLER_HEADINGS = new Set([
  '核心信息', '这条信息为什么值得看', '适合谁先看', '阅读提示', '官方原文', '这条文件最适合看什么'
]);

function getNewsRichness(item) {
  const content = item.content;
  if (!content || (Array.isArray(content) && !content.length)) return 0;

  // block 数组（新格式）
  if (Array.isArray(content)) {
    let inFiller = false, subst = 0;
    for (const block of content) {
      if (block.type === 'heading') {
        inFiller = NEWS_FILLER_HEADINGS.has(block.text);
        continue;
      }
      if (block.type === 'divider') continue;
      const text = block.text || (Array.isArray(block.items) ? block.items.join('') : '');
      const clean = String(text).replace(/[#>*_`~\-\[\]\(\)!]/g, '').replace(/\s+/g, '');
      if (!clean || inFiller) continue;
      subst += clean.length;
    }
    return subst;
  }

  // 旧 Markdown 字符串（兼容）
  const raw = String(content);
  let inFiller = false, overviewSeen = false, overviewDone = false, subst = 0;
  for (const line of raw.split('\n')) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const title = heading[1].trim();
      inFiller = NEWS_FILLER_HEADINGS.has(title);
      if (title === '新闻概览') { overviewSeen = true; inFiller = false; overviewDone = false; }
      continue;
    }
    if (line.startsWith('---')) continue;
    const clean = line.replace(/[#>*_`~\-\[\]\(\)!]/g, '').replace(/\s+/g, '');
    if (!clean) continue;
    if (inFiller) continue;
    if (overviewSeen && !overviewDone) { overviewDone = true; continue; }
    subst += clean.length;
  }
  return subst;
}

function pickFeaturedNews(news) {
  const ranked = news
    .slice()
    .map((item) => ({ item, richness: getNewsRichness(item) }))
    .sort((a, b) => b.richness - a.richness);
  const picked = [];
  const usedSections = new Set();
  for (const { item } of ranked) {
    if (picked.length >= 4) break;
    const section = getNewsSection(item);
    if (usedSections.has(section)) continue;
    usedSections.add(section);
    picked.push(item);
  }
  for (const { item } of ranked) {
    if (picked.length >= 4) break;
    if (picked.some((existing) => existing.id === item.id)) continue;
    picked.push(item);
  }
  return picked.slice(0, 4);
}

function sortNews(news) {
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

function findSchoolByName(schools, name) {
  return schools.find((school) => school.name === name)
    || schools.find((school) => school.name.includes(name));
}

function getSchoolCompletenessScore(school) {
  const tags = Array.isArray(school.tags) ? school.tags.length : 0;
  const features = Array.isArray(school.features) ? school.features.length : 0;
  return tags * 2 + features * 2 + [school.address, school.phone, school.website, school.admissionNotes].filter(Boolean).length;
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
    .map((district) => ({
      ...district,
      visibleSchoolCount: schools.filter((school) => school.districtId === district.id).length
    }))
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
  const { districts, schools, news } = await loadDataStore();
  const sortedNews = sortNews(news);
  const headline = sortedNews[0] || null;
  const featuredNews = pickFeaturedNews(sortedNews);
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
              <span>02 / SCHOOLS</span>
              <strong>{schools.length}+</strong>
              <p>可查询学校</p>
            </article>
            <article>
              <span>03 / DISTRICTS</span>
              <strong>{districts.length}</strong>
              <p>覆盖区县</p>
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

          <Link className="home-text-link" href="/news">查看全部新闻</Link>
        </div>

        <aside className="home-feature-panel">
          <SectionLabel>FOCUS</SectionLabel>
          <h2>{headline?.title || '本周重点'}</h2>
          <p>{headline?.summary || '从所有动态中挑出真正影响选择的信息，帮你抓住时间窗口。'}</p>
          <Link href={getNewsHref(headline)}>阅读全文</Link>
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
          {featuredSchools.map((school) => (
            <Link className="home-school-card" href={`/schools/${school.id}`} key={school.id}>
              <span>{getSchoolDistrictName(school)} / {getSchoolStage(school)}</span>
              <h3>{school.name}</h3>
              <p>{getSchoolAdmissionInfo(school)}</p>
              <strong>{getSchoolType(school)}</strong>
            </Link>
          ))}
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
