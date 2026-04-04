import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../components/site-shell';
import { getNewsCategoryLabel, getSchoolAdmissionInfo, getSchoolDistrictName, getSchoolStage, getSchoolType } from '../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

export const dynamic = 'force-dynamic';

function getSchoolPreviewScore(school) {
  const tags = Array.isArray(school.tags) ? school.tags.length : 0;
  const features = Array.isArray(school.features) ? school.features.length : 0;
  const metadataFields = [school.address, school.phone, school.website, school.admissionNotes].filter(Boolean).length;
  return tags * 2 + features * 2 + metadataFields;
}

export default async function HomePage() {
  const { districts, schools, news } = await loadDataStore();
  const sortedNews = news.slice().sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));
  const [headline, ...restNews] = sortedNews;
  const featuredStories = restNews.slice(0, 3);
  const tickerNews = sortedNews.slice(0, 4);
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
                <span className="newsroom-kicker">首页头版</span>
                <span className="newsroom-edition">Shanghai Education Desk</span>
              </div>
              <div className="home-prototype-copy">
                <div className="home-hero-tag">升学 · 2026</div>
                <h1>把上海初中、高中升学新闻、学校信息与关键时间线，整理成一张清晰的城市教育地图。</h1>
                <p>覆盖上海主要区县的招生政策、学校特色、开放日与择校线索，先看重点，再决定往哪条线继续深入。</p>
              </div>
              <div className="home-hero-actions">
                <Link className="home-cta-button home-cta-button-primary" href="/news">开始查看</Link>
                <Link className="home-cta-button home-cta-button-secondary" href="/schools">学校信息</Link>
              </div>
            </div>
            <aside className="home-prototype-side" aria-label="首页信息盒">
              {headline ? (
                <div className="prototype-side-stack">
                  <article className="prototype-side-card prototype-side-lead">
                    <p className="overview-label">今日关注</p>
                    <div className="news-meta-row">
                      <span className="pill">{getNewsCategoryLabel(headline)}</span>
                      <span className="news-date">{headline.publishedAt || '暂无日期'}</span>
                    </div>
                    <h2>{headline.title}</h2>
                    <p>{headline.summary || '暂无摘要'}</p>
                    <Link className="text-link" href={headline.id ? `/news/${headline.id}` : '/news'}>查看这条新闻</Link>
                  </article>
                </div>
              ) : null}
              <div className="prototype-side-metrics">
                <article>
                  <span>覆盖区域</span>
                  <strong>{districts.length} 区</strong>
                </article>
                <article>
                  <span>学校信息</span>
                  <strong>{schools.length}+</strong>
                </article>
                <article>
                  <span>每日更新</span>
                  <strong>{news.length}</strong>
                </article>
              </div>
            </aside>
          </div>
          <div className="home-ticker-bar" aria-label="今日快讯">
            <span className="home-ticker-label">今日快讯</span>
            <div className="home-ticker-track">
              {tickerNews.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`} className="home-ticker-link">{item.title}</Link>
              ))}
            </div>
          </div>
        </section>
      </header>

      <main className="layout home-prototype-main-layout">
        <section className="home-editorial">
          <div className="home-editorial-section-head home-editorial-news-head">
            <div>
              <p className="overview-label">今日升学栏目</p>
              <h2>今天先看这 3 条主线</h2>
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
                  <p className="overview-label">学校图景与详情入口</p>
                  <h2>从一所重点学校开始，再继续看同类学校</h2>
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
                <p className="overview-label">新闻政策入口</p>
                <h3>先看政策和时间线，再决定要继续研究哪一所学校。</h3>
                <Link className="text-link" href="/news">进入新闻政策页</Link>
              </article>
            </aside>
          </div>

          <div className="home-editorial-cta">
            <div className="home-editorial-cta-copy">
              <p className="overview-label">继续阅读</p>
              <h2>进入新闻政策页，继续看更完整的时间线和专题内容。</h2>
            </div>
            <div className="home-editorial-cta-actions">
              <Link className="home-cta-button home-cta-button-primary" href="/news">进入新闻政策</Link>
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
