import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../components/site-shell';
import { formatConfidence, getNewsCategoryLabel, getSchoolAdmissionInfo, getSchoolDistrictName, getSchoolFeatureTags, getSchoolStage, getSchoolType } from '../lib/site-utils';

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

  return (
    <SiteShell>
      <header className="hero" id="top">
        <section className="search-panel home-hero-panel" aria-label="网站概览">
          <div className="search-panel-head">
            <h2>上海学生成长与升学信息平台</h2>
            <p>把新闻政策、学校信息、知识体系整理成三条清晰主线：首页只展示重点入口，进入二级页面后再进行完整浏览和筛选。</p>
          </div>
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
              <p>按区域浏览学校介绍、特色、标签、梯队和来源信息。</p>
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
          <div className="district-preview-grid">
            {districts.slice(0, 6).map((district) => (
              <article key={district.id} className="district-preview-card">
                <h3>{district.name || district.districtName}</h3>
                <p>{district.description || '暂无说明'}</p>
              </article>
            ))}
          </div>
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
                  {getSchoolFeatureTags(school).length
                    ? getSchoolFeatureTags(school).map((feature) => <span key={feature} className="meta-chip">{feature}</span>)
                    : <span className="meta-chip meta-chip-muted">暂无特色标签</span>}
                </div>
              </article>
            ))}
          </div>
          <Link className="module-link" href="/schools">查看学校信息</Link>
        </section>
      </main>
    </SiteShell>
  );
}
