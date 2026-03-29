import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../components/site-shell';
import { formatConfidence, getNewsCategoryLabel, getSchoolAdmissionInfo, getSchoolDistrictName, getSchoolDisplayTags, getSchoolStage, getSchoolType } from '../lib/site-utils';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../shared/data-store');

export const dynamic = 'force-dynamic';

function getSchoolPreviewScore(school) {
  const tags = Array.isArray(school.tags) ? school.tags.length : 0;
  const features = Array.isArray(school.features) ? school.features.length : 0;
  const metadataFields = [school.address, school.phone, school.website, school.admissionNotes].filter(Boolean).length;
  return tags * 2 + features * 2 + metadataFields;
}

function resolveFeaturedSchool(schools, keyword, preferredName) {
  return schools.find((entry) => entry.name === preferredName)
    || schools.find((entry) => entry.name === keyword)
    || schools.find((entry) => entry.name.includes(keyword) || keyword.includes(entry.name))
    || null;
}

export default async function HomePage() {
  const { districts, schools, news } = await loadDataStore();
  const sortedNews = news.slice().sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')));
  const [headline, ...restNews] = sortedNews;
  const examNews = sortedNews.filter((item) => item.newsType === 'exam').slice(0, 4);
  const admissionNews = sortedNews.filter((item) => item.newsType === 'admission').slice(0, 3);
  const schoolNews = sortedNews.filter((item) => item.newsType === 'school').slice(0, 3);
  const topSchools = schools
    .slice()
    .sort((left, right) => {
      const scoreDiff = getSchoolPreviewScore(right) - getSchoolPreviewScore(left);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
    })
    .slice(0, 15);
  const featuredSchoolPicks = [
    { keyword: '上海中学', preferredName: '上海中学', eyebrow: '徐汇头部学校', blurb: '拔尖创新、竞赛课程和连续培养关注度高。' },
    { keyword: '华东师范大学第二附属中学', preferredName: '华东师范大学第二附属中学', eyebrow: '华二体系', blurb: '科技创新与竞赛培养辨识度很强。' },
    { keyword: '复旦大学附属中学', eyebrow: '复附专题', blurb: '寄宿、人文科技并重，大学附属资源明显。' },
    { keyword: '上海交通大学附属中学', preferredName: '上海交通大学附属中学', eyebrow: '交附专题', blurb: '工程科技特色鲜明，附中体系关注度高。' },
    { keyword: '上海市建平中学', eyebrow: '浦东重点', blurb: '浦东传统强校，课程选择和国际理解教育较强。' },
    { keyword: '上海市七宝中学', eyebrow: '闵行重点', blurb: '科创与人文并重，区域影响力稳定。' }
  ]
    .map((item) => {
      const school = resolveFeaturedSchool(schools, item.keyword, item.preferredName);
      if (!school) {
        return null;
      }
      return { ...item, school };
    })
    .filter(Boolean);

  return (
    <SiteShell>
      <header className="hero" id="top">
        <section className="search-panel home-hero-panel newsroom-hero" aria-label="网站概览">
          <div className="newsroom-kicker-row">
            <span className="newsroom-kicker">教育新闻台</span>
            <span className="newsroom-edition">Shanghai Daily Brief</span>
          </div>
          <div className="search-panel-head newsroom-head">
            <div className="newsroom-head-copy">
              <h2>上海升学新闻、学校信息与学习内容一站查看</h2>
              <p>聚合考试动态、招生政策、学校数据库和年级知识体系，帮助家长和学生更快找到当前真正需要关注的信息。</p>
            </div>
            <div className="newsroom-scoreboard" aria-label="站点统计">
              <article>
                <span>学校库</span>
                <strong>{schools.length}</strong>
              </article>
              <article>
                <span>新闻政策</span>
                <strong>{news.length}</strong>
              </article>
              <article>
                <span>覆盖区域</span>
                <strong>{districts.length}</strong>
              </article>
            </div>
          </div>
          {headline ? (
            <article className="frontline-story">
              <div className="frontline-meta">
                <span className="pill">{getNewsCategoryLabel(headline)}</span>
                <span>{headline.publishedAt || '暂无日期'}</span>
              </div>
              <h3>{headline.title}</h3>
              <p>{headline.summary || '暂无摘要'}</p>
              <a className="text-link" href="/news">进入新闻政策版面</a>
            </article>
          ) : null}
          <div className="module-entry-grid">
            <Link className="module-entry-card" href="/news">
              <span className="module-glyph module-glyph-news" aria-hidden="true"></span>
              <p className="overview-label">主线一</p>
              <h3>新闻、头条与政策</h3>
              <p>查看中考、高考的考试新闻、关键时间节点与官方政策文件。</p>
            </Link>
            <Link className="module-entry-card" href="/schools">
              <span className="module-glyph module-glyph-schools" aria-hidden="true"></span>
              <p className="overview-label">主线二</p>
              <h3>学校信息</h3>
              <p>按区域浏览学校介绍、特色、标签和梯队信息。</p>
            </Link>
            <Link className="module-entry-card" href="/knowledge">
              <span className="module-glyph module-glyph-knowledge" aria-hidden="true"></span>
              <p className="overview-label">主线三</p>
              <h3>知识体系</h3>
              <p>从初一到高三，按学段查看知识点结构与已上线内容。</p>
            </Link>
          </div>
        </section>
      </header>

      <main className="layout">
        <section className="front-page-grid" aria-label="首页导读版面">
          <article className="panel briefing-panel">
            <div className="section-heading">
              <h2>今日快讯</h2>
              <p>按阅读速度优先排列，适合先扫一遍关键节点。</p>
            </div>
            <div className="briefing-list">
              {sortedNews.slice(0, 5).map((item, index) => (
                <article key={item.id} className="briefing-item">
                  <span className="briefing-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="briefing-meta">{getNewsCategoryLabel(item)} · {item.publishedAt || '暂无日期'}</p>
                    <h3>{item.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          </article>
          <article className="panel tracker-panel">
            <div className="section-heading">
              <h2>专题追踪</h2>
              <p>围绕升学决策最常见的三类信息组织浏览。</p>
            </div>
            <div className="tracker-grid">
              <div className="tracker-card">
                <span>考试新闻</span>
                <strong>{examNews.length}</strong>
                <p>聚焦报名、考试安排、准考证和成绩相关动态。</p>
              </div>
              <div className="tracker-card">
                <span>招生新闻</span>
                <strong>{admissionNews.length}</strong>
                <p>关注自主招生、开放日、中本贯通和志愿提醒。</p>
              </div>
              <div className="tracker-card">
                <span>学校动态</span>
                <strong>{schoolNews.length}</strong>
                <p>校内通知、校园开放活动和办学动态整理。</p>
              </div>
            </div>
          </article>
        </section>

        <section className="panel news-panel" id="news">
          <div className="section-heading">
            <h2>新闻政策</h2>
            <p>首页展示近期头条和部分动态，完整新闻和政策请进入对应页面查看。</p>
          </div>
          {headline ? (
            <>
              <div className="featured-news">
                <article className="featured-news-card">
                  <div className="news-meta-row">
                    <span className="pill">{getNewsCategoryLabel(headline)}</span>
                    <span className="news-date">{headline.publishedAt || '暂无日期'}</span>
                  </div>
                  <h3>{headline.title}</h3>
                  <p className="news-summary">{headline.summary || '暂无摘要'}</p>
                  <p className="news-source">来源：{headline.source?.name || '未知'} · 可信度 {formatConfidence(headline.source?.confidence)}</p>
                  {headline.source?.url ? <a className="text-link" href={headline.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
                </article>
              </div>
              <div className="news-grid">
                {restNews.slice(0, 3).map((item) => (
                  <article key={item.id} className="news-card">
                    <div className="news-card-header">
                      <div className="news-meta-row">
                        <span className="pill">{getNewsCategoryLabel(item)}</span>
                        <span className="news-date">{item.publishedAt || '暂无日期'}</span>
                      </div>
                      <h3>{item.title}</h3>
                    </div>
                    <p className="news-summary">{item.summary || '暂无摘要'}</p>
                    <p className="news-source">来源：{item.source?.name || '未知'} · 可信度 {formatConfidence(item.source?.confidence)}</p>
                    {item.source?.url ? <a className="text-link" href={item.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
                  </article>
                ))}
              </div>
            </>
          ) : null}
          <div className="home-topic-strip" aria-label="首页专题条">
            {admissionNews.map((item) => (
              <article key={item.id} className="topic-strip-card">
                <span className="pill">{getNewsCategoryLabel(item)}</span>
                <h3>{item.title}</h3>
                <p>{item.summary || '暂无摘要'}</p>
              </article>
            ))}
          </div>
          <Link className="module-link" href="/news">查看新闻政策</Link>
        </section>

        <section className="panel knowledge-panel" id="knowledge">
          <div className="section-heading">
            <h2>知识点体系</h2>
            <p>首页展示体系方向和当前已上线重点，完整学段结构请进入知识体系首页。</p>
          </div>
          <div className="knowledge-grid">
            <Link className="knowledge-card" href="/knowledge">
              <h3>初高中知识体系</h3>
              <p>按初中、高中学段查看全部年级入口与学习路径。</p>
            </Link>
            <Link className="knowledge-card" href="/knowledge/grade-7">
              <h3>七年级重点内容</h3>
              <p>聚焦初中起步期的学科框架、学习习惯和向八年级的衔接准备。</p>
            </Link>
            <Link className="knowledge-card" href="/knowledge/grade-8">
              <h3>八年级已上线</h3>
              <p>语文、数学、英语、物理、化学、历史、道法等内容可直接访问。</p>
            </Link>
            <Link className="knowledge-card" href="/knowledge/grade-9">
              <h3>九年级重点内容</h3>
              <p>已补齐中考年复习节奏、专题突破、模考调整和学科复习焦点。</p>
            </Link>
            <Link className="knowledge-card" href="/knowledge/senior-1">
              <h3>高中学段导航</h3>
              <p>高一到高三均已补齐年级内容，可按阶段查看专题深化、总复习与冲刺重点。</p>
            </Link>
            <Link className="knowledge-card" href="/knowledge/physics-grade8-plan">
              <h3>学习计划</h3>
              <p>保留学科计划入口，便于后续扩展到更多年级和科目。</p>
            </Link>
          </div>
          <Link className="module-link" href="/knowledge">查看知识体系</Link>
        </section>

        <section className="panel schools-panel" id="schools">
          <div className="section-heading">
            <h2>学校信息</h2>
            <p>首页只预览部分学校和区域摘要，完整区域筛选、学校介绍和特色信息请进入对应页面查看。</p>
          </div>
          <div className="school-topic-band">
            <article className="school-topic-card">
              <span>国际化学校</span>
              <strong>{schools.filter((school) => (school.tags || []).includes('国际化')).length}</strong>
              <p>集中查看双语、国际课程和外籍学校线索。</p>
            </article>
            <article className="school-topic-card">
              <span>示范性高中</span>
              <strong>{schools.filter((school) => (school.tags || []).includes('示范性高中')).length}</strong>
              <p>适合按区快速定位重点高中和寄宿资源。</p>
            </article>
            <article className="school-topic-card">
              <span>九年一贯</span>
              <strong>{schools.filter((school) => (school.tags || []).includes('九年一贯')).length}</strong>
              <p>优先查看连续培养路径和集团化办学学校。</p>
            </article>
          </div>
          <div className="district-preview-grid">
            {districts.slice(0, 6).map((district) => (
              <Link key={district.id} href={`/schools/district/${district.id}`} className="district-preview-card">
                <h3>{district.name || district.districtName}</h3>
                <p>{district.description || '暂无说明'}</p>
              </Link>
            ))}
          </div>
          {featuredSchoolPicks.length ? (
            <section className="featured-school-launcher" aria-label="重点学校快捷入口">
              <div className="section-heading" style={{ marginBottom: 14 }}>
                <h3>重点学校快捷入口</h3>
                <p>下面这 6 所不是学校列表结果，而是专题导航卡。点击后会直接进入学校页并带入对应筛选条件。</p>
              </div>
              <div className="featured-school-strip">
                {featuredSchoolPicks.map(({ keyword, eyebrow, blurb, school }) => (
                  <Link
                    key={school.id}
                    className="featured-school-chip"
                    href={`/schools?district=${encodeURIComponent(school.districtId || 'all')}&stage=${encodeURIComponent(school.schoolStage || 'all')}&query=${encodeURIComponent(keyword)}`}
                  >
                    <p className="featured-school-eyebrow">{eyebrow}</p>
                    <h3>{school.name}</h3>
                    <p>{blurb}</p>
                    <div className="featured-school-meta">
                      <span>{school.districtName}</span>
                      <span>{getSchoolStage(school)}</span>
                      <span>点击进入专题筛选</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          <div className="school-grid">
            {topSchools.map((school) => (
              <article key={school.id} className="school-card">
                <div className="school-card-header">
                  <div>
                    <h3>{school.name}</h3>
                    <p>{getSchoolDistrictName(school)}</p>
                  </div>
                  <span className="pill">{getSchoolStage(school)} · {getSchoolType(school)}</span>
                </div>
                  <p className="school-summary">{getSchoolAdmissionInfo(school)}</p>
                  <div className="school-highlights">
                    {getSchoolDisplayTags(school).length
                      ? getSchoolDisplayTags(school).map((tag) => <span key={tag} className="meta-chip">{tag}</span>)
                      : <span className="meta-chip meta-chip-muted">暂无标签</span>}
                  </div>
                  <Link className="text-link" href={`/schools/${school.id}`}>查看学校详情</Link>
              </article>
            ))}
          </div>
          <div className="district-card-actions">
            <Link className="module-link" href="/schools">查看学校信息</Link>
            <Link className="text-link" href="/schools/compare">进入学校对比</Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
