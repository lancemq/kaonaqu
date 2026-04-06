import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../components/site-shell';
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

export default async function HomePage() {
  const { districts, schools, news } = await loadDataStore();
  const sortedNews = news.slice().sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));
  const [headline] = sortedNews;
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
    { label: '上海中考', title: '看上海中招政策与录取批次', description: '先看本市年度政策、问答、报名和志愿安排。', href: '/news/zhongzhao-special' },
    { label: '上海高考', title: '看上海高招与春招时间线', description: '集中查看本市春招、高考、体育类和学考节点。', href: '/news/gaokao-special' },
    { label: '上海学校', title: '查上海学校详情与办学特点', description: '按上海区县、学段、办学类型快速进入学校页。', href: '/schools' },
    { label: '上海 16 区', title: '比较上海各区教育格局', description: '先看本市区县资源分布，再继续筛学校和政策。', href: '/schools/district/xuhui' }
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
                <span className="newsroom-edition">本市信息导航</span>
              </div>
              <div className="home-prototype-copy">
                <div className="home-hero-tag-row">
                  <div className="home-hero-tag">上海 · 2026</div>
                  <p className="home-hero-micro-note">只聚焦上海家长和学生最需要的升学信息</p>
                </div>
                <h1>上海升学这件事，不必再到处打听。</h1>
                <p className="home-hero-description">考哪去只做上海，把分散在政策通知、考试安排、学校公开信息和学习内容里的关键线索重新整理成可直接判断的升学入口，让家长和学生少走弯路，更快看清时间点、学校差异和下一步选择。</p>
                <div className="home-hero-inline-meta">
                  <span>只做上海升学</span>
                  <span>政策与时间线一站看清</span>
                  <span>学校库 × 知识体系</span>
                </div>
                <div className="home-hero-density-grid">
                  <article className="home-hero-density-card">
                    <p className="home-hero-density-label">这几件事先看</p>
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
                    <p className="home-hero-density-label">来到这里能直接解决</p>
                    <div className="home-hero-density-points">
                      <span>今年上海中高考政策到底怎么变</span>
                      <span>下一阶段该盯哪些时间节点</span>
                      <span>学校、区县和学习路径怎么对比</span>
                    </div>
                  </article>
                </div>
                <div className="home-hero-route-strip" aria-label="首页快捷入口">
                  <Link className="home-hero-route-link" href="/news/zhongzhao-special">
                    <span>中考专题</span>
                    <strong>批次政策</strong>
                  </Link>
                  <Link className="home-hero-route-link" href="/news/gaokao-special">
                    <span>高考专题</span>
                    <strong>时间线</strong>
                  </Link>
                  <Link className="home-hero-route-link" href="/schools">
                    <span>学校查询</span>
                    <strong>查学校</strong>
                  </Link>
                  <Link className="home-hero-route-link" href="/knowledge">
                    <span>知识体系</span>
                    <strong>看学习路径</strong>
                  </Link>
                </div>
              </div>
              <div className="home-hero-actions">
                <Link className="home-cta-button home-cta-button-primary" href="/news">看上海最新政策</Link>
                <Link className="home-cta-button home-cta-button-secondary" href="/schools">查上海学校与区县</Link>
              </div>
            </div>
            <aside className="home-prototype-side" aria-label="首页信息盒">
              {headline ? (
                <div className="prototype-side-stack">
                  <Link className="prototype-side-card prototype-side-lead prototype-side-card-link" href={headline.id ? `/news/${headline.id}` : '/news'}>
                    <p className="overview-label">本周重要事项</p>
                    <div className="news-meta-row">
                      <span className="pill">{getNewsCategoryLabel(headline)}</span>
                      <span className="news-date">{headline.publishedAt || '暂无日期'}</span>
                    </div>
                    <h2>{headline.title}</h2>
                    <p>{headline.summary || '暂无摘要'}</p>
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
                  <span>上海区县</span>
                  <strong>{districts.length} 区</strong>
                </article>
                <article>
                  <span>上海学校</span>
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
              <h2>先看和本市升学决策最相关的信息</h2>
            </div>
            <div className="home-editorial-section-tools">
              <Link className="home-editorial-mini-link" href="/news">进入新闻频道</Link>
            </div>
          </div>

          <div className="home-editorial-news-grid">
            {featuredStories.map((item, index) => (
              <Link
                key={item.id}
                className={`home-editorial-news-card home-editorial-news-card-stage${index === 1 ? ' home-editorial-news-card-warm' : ''}`}
                href={`/news/${item.id}`}
              >
                <p className="home-editorial-card-kicker">{getNewsCategoryLabel(item)} / {item.publishedAt || '暂无日期'}</p>
                <h3>{item.title}</h3>
                <p>{item.summary || '暂无摘要'}</p>
              </Link>
            ))}
          </div>

          <div className="home-editorial-columns">
            <section className="home-editorial-main-col">
              <div className="home-editorial-section-head">
                <div>
                  <p className="overview-label">上海时间线</p>
                  <h2>接下来要关注的本市关键节点</h2>
                </div>
                <div className="home-editorial-section-tools">
                  <Link className="home-editorial-mini-link" href="/news/admission-timeline">查看完整时间线</Link>
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
                  <h2>信息最完整的上海重点学校</h2>
                </div>
                <div className="home-editorial-section-tools">
                  <Link className="home-editorial-mini-link" href="/schools">查看学校列表</Link>
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
                        <strong>进入学校详情</strong>
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
                <h3>先按上海区县进入，再比较本地学校资源与办学差异。</h3>
                <div className="home-district-list">
                  {districtHighlights.map((district) => (
                    <Link key={district.id} className="home-district-link" href={`/schools/district/${district.id}`}>
                      <span>{district.name}</span>
                      <strong>{district.schoolCount} 所学校</strong>
                    </Link>
                  ))}
                </div>
                <Link className="text-link" href="/news">进入新闻政策页</Link>
              </article>
            </aside>
          </div>

          <div className="home-editorial-cta">
            <div className="home-editorial-cta-copy">
              <p className="overview-label">继续查看上海升学</p>
              <h2>进入新闻频道或学校库，继续看更完整的上海政策、考试和学校详情。</h2>
            </div>
            <div className="home-editorial-cta-actions">
              <Link className="home-cta-button home-cta-button-primary" href="/news">进入新闻政策</Link>
              <Link className="home-cta-button home-cta-button-secondary" href="/schools">进入学校库</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 · 初中、高中升学新闻与学校信息平台</span>
        <span>区县政策 / 学校详情 / 开放日 / 志愿填报</span>
      </footer>
    </SiteShell>
  );
}
