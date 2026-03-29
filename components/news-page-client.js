'use client';

import { useMemo, useState } from 'react';
import admissionTimeline from '../lib/admission-timeline';
import policyGlossary from '../lib/policy-glossary';
import { filterNews, formatConfidence, getNewsCategoryLabel } from '../lib/site-utils';

function EmptyState() {
  return (
    <div className="empty-state">
      <h3>暂无数据</h3>
      <p>当前条件下没有匹配结果。</p>
    </div>
  );
}

function sanitizePolicyText(text, title = '') {
  let value = String(text || '');
  if (!value) return '';

  value = value
    .replace(/无障碍 首页[\s\S]*?内容概述\s*/g, '')
    .replace(/索取号：[^。]*?/g, '')
    .replace(/发布日期：\d{4}-\d{2}-\d{2}/g, '')
    .replace(/字体 \[ 大 中 小 ]/g, '')
    .replace(/查阅全文[\s\S]*$/g, '')
    .replace(/\[返回上一页][\s\S]*$/g, '')
    .replace(/不能读取[\s\S]*$/g, '')
    .replace(/if\s*\(isMobile\.any\(\)\)\s*\{[\s\S]*$/g, '')
    .replace(/const token =[\s\S]*$/g, '')
    .replace(/function UUID\(\) \{[\s\S]*$/g, '')
    .replace(/jQuery\(document\)\.ready\([\s\S]*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (title && value.startsWith(title)) {
    value = value.slice(title.length).trim();
  }

  return value;
}

function clipText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

function getPolicySummaryText(policy) {
  const summary = sanitizePolicyText(policy.summary, policy.title);
  const content = sanitizePolicyText(policy.content, policy.title);
  return clipText(summary || content || '暂无摘要', 160);
}

function getPolicyDetailText(policy) {
  const content = sanitizePolicyText(policy.content, policy.title);
  if (!content) return '';
  return clipText(content, 360);
}

function getCurrentYear(news, policies) {
  const years = [...news, ...policies]
    .map((item) => {
      const value = String(item?.publishedAt || item?.date || '');
      return Number(value.slice(0, 4)) || Number(item?.year) || 0;
    })
    .filter(Boolean)
    .sort((a, b) => b - a);
  return years[0] || new Date().getFullYear();
}

function isCurrentYearItem(item, year) {
  const publishedYear = Number(String(item?.publishedAt || item?.date || '').slice(0, 4)) || Number(item?.year) || 0;
  return publishedYear === year;
}

function isRenderablePolicy(policy, currentYear) {
  const title = String(policy?.title || '').trim();
  if (!title || title === '上海市教育委员会') return false;
  if (!isCurrentYearItem(policy, currentYear)) return false;
  return policy.source?.type === 'official' || String(policy.source?.name || '').includes('上海市教育委员会');
}

export default function NewsPageClient({ news, policies }) {
  const currentYear = useMemo(() => getCurrentYear(news, policies), [news, policies]);
  const currentYearNews = useMemo(
    () => news.filter((item) => isCurrentYearItem(item, currentYear)).sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))),
    [news, currentYear]
  );
  const currentYearPolicies = useMemo(
    () => policies.filter((item) => isRenderablePolicy(item, currentYear)).sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))),
    [policies, currentYear]
  );
  const [activeFilter, setActiveFilter] = useState('all');
  const visibleNews = useMemo(() => filterNews(currentYearNews, activeFilter), [currentYearNews, activeFilter]);

  const [headline, ...restNews] = visibleNews;
  const latestWireNews = currentYearNews.slice(0, 6);
  const zhongkaoDesk = currentYearNews.filter((item) => item.examType === 'zhongkao').slice(0, 5);
  const gaokaoDesk = currentYearNews.filter((item) => item.examType === 'gaokao').slice(0, 5);
  const schoolDesk = currentYearNews.filter((item) => item.newsType === 'school').slice(0, 4);
  const monthArchive = useMemo(() => {
    const groups = new Map();
    currentYearNews.forEach((item) => {
      const month = String(item.publishedAt || '').slice(0, 7);
      if (!groups.has(month)) {
        groups.set(month, []);
      }
      groups.get(month).push(item);
    });
    return Array.from(groups.entries());
  }, [currentYearNews]);
  const examCount = currentYearNews.filter((item) => item.newsType === 'exam').length;
  const admissionCount = currentYearNews.filter((item) => item.newsType === 'admission').length;
  const schoolCount = currentYearNews.filter((item) => item.newsType === 'school').length;

  return (
    <main className="layout">
      <section className="panel newsroom-front-panel">
        <div className="section-heading newsroom-section-heading">
          <h2>{currentYear} 年度教育资讯首页</h2>
          <p>页面聚焦 {currentYear} 年上海当年公开新闻与政策，不再把旧年份内容混在头部信息流里。</p>
        </div>
        <div className="newsroom-front-grid">
          {headline ? (
            <article className="frontline-story newsroom-lead-story">
              <div className="frontline-meta">
                <span className="pill">{getNewsCategoryLabel(headline)}</span>
                <span>{headline.publishedAt || '暂无日期'}</span>
              </div>
              <h3>{headline.title}</h3>
              <p>{headline.summary || '暂无摘要'}</p>
              <div className="newsroom-lead-footer">
                <span className="news-source">来源：{headline.source?.name || '未知'} · 可信度 {formatConfidence(headline.source?.confidence)}</span>
                {headline.source?.url ? <a className="action-link-chip action-link-chip-strong" href={headline.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
              </div>
            </article>
          ) : <EmptyState />}

          <aside className="panel newsroom-brief-panel">
            <div className="section-heading">
              <h2>年度统计</h2>
              <p>把当年资讯按考试、招生和学校动态三条线拆开看。</p>
            </div>
            <div className="tracker-grid">
              <article className="tracker-card">
                <span>考试新闻</span>
                <strong>{examCount}</strong>
                <p>聚焦考试安排、报名、准考证、成绩和考前提示。</p>
              </article>
              <article className="tracker-card">
                <span>招生新闻</span>
                <strong>{admissionCount}</strong>
                <p>集中看报名、填报、确认、公示和录取链路。</p>
              </article>
              <article className="tracker-card">
                <span>学校动态</span>
                <strong>{schoolCount}</strong>
                <p>围绕学校官网、开放日和校园观察做辅助阅读。</p>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section className="news-wire-strip" aria-label="最新快讯">
        {latestWireNews.map((item) => (
          <article key={item.id} className="wire-card">
            <p className="briefing-meta">{getNewsCategoryLabel(item)} · {item.publishedAt}</p>
            <h3>{item.title}</h3>
          </article>
        ))}
      </section>

      <section className="topic-entry-grid" aria-label="频道专题入口">
        <a className="topic-entry-card" href="#zhongzhao-desk">
          <span className="overview-label">专题一</span>
          <h3>中招专题</h3>
          <p>优先看中考政策、报名安排、政策问答和关键考试节点。</p>
        </a>
        <a className="topic-entry-card" href="#gaokao-desk">
          <span className="overview-label">专题二</span>
          <h3>高招专题</h3>
          <p>集中查看春招、秋招、学业考、体艺类与报名确认链路。</p>
        </a>
        <a className="topic-entry-card" href="#policies">
          <span className="overview-label">专题三</span>
          <h3>政策深读</h3>
          <p>只保留当年官方政策与制度文件，适合快速理解框架变化。</p>
        </a>
        <a className="topic-entry-card" href="#school-watch">
          <span className="overview-label">专题四</span>
          <h3>学校观察</h3>
          <p>把学校官网、开放日和校园更新单独组织，不和政策混看。</p>
        </a>
      </section>

      <section className="panel newsroom-archive-panel" id="archive">
        <div className="section-heading">
          <h2>时间轴与月度归档</h2>
          <p>如果想按月份回看 {currentYear} 年资讯，可以直接从这里切进去，不必在长列表里反复滚动。</p>
        </div>
        <div className="archive-grid">
          {monthArchive.map(([month, items]) => (
            <article key={month} className="archive-card">
              <div className="archive-card-head">
                <h3>{month}</h3>
                <span>{items.length} 条</span>
              </div>
              <div className="archive-list">
                {items.slice(0, 4).map((item) => (
                  <article key={item.id} className="archive-item">
                    <span>{String(item.publishedAt || '').slice(5)}</span>
                    <div>
                      <p>{getNewsCategoryLabel(item)}</p>
                      <h4>{item.title}</h4>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="news-channel-grid">
        <section className="panel news-column-panel" id="zhongzhao-desk">
          <div className="section-heading">
            <h2>中招焦点</h2>
            <p>优先看中考政策、报名节点和当年操作口径。</p>
          </div>
          <div className="compact-news-list">
            {zhongkaoDesk.length ? zhongkaoDesk.map((item) => (
              <article key={item.id} className="compact-news-card">
                <span className="pill">{item.publishedAt || '暂无日期'}</span>
                <h3>{item.title}</h3>
                <p>{item.summary || '暂无摘要'}</p>
              </article>
            )) : <EmptyState />}
          </div>
        </section>
        <section className="panel news-column-panel" id="gaokao-desk">
          <div className="section-heading">
            <h2>高招焦点</h2>
            <p>单独看春招、秋招、体艺类和学业考新闻。</p>
          </div>
          <div className="compact-news-list">
            {gaokaoDesk.length ? gaokaoDesk.map((item) => (
              <article key={item.id} className="compact-news-card">
                <span className="pill">{item.publishedAt || '暂无日期'}</span>
                <h3>{item.title}</h3>
                <p>{item.summary || '暂无摘要'}</p>
              </article>
            )) : <EmptyState />}
          </div>
        </section>
        <section className="panel news-column-panel" id="school-watch">
          <div className="section-heading">
            <h2>学校观察</h2>
            <p>把学校官网和校园开放入口当作辅助阅读线索，不和政策混在一起。</p>
          </div>
          <div className="compact-news-list">
            {schoolDesk.length ? schoolDesk.map((item) => (
              <article key={item.id} className="compact-news-card">
                <span className="pill">{item.publishedAt || '暂无日期'}</span>
                <h3>{item.title}</h3>
                <p>{item.summary || '暂无摘要'}</p>
              </article>
            )) : <EmptyState />}
          </div>
        </section>
      </section>

      <section className="panel news-panel" id="news">
        <div className="section-heading">
          <h2>年度新闻总览</h2>
          <p>按资讯频道的阅读方式组织 {currentYear} 年新闻，首条优先展示当天最值得先看的更新。</p>
        </div>
        <div className="news-toolbar" aria-label="新闻分类筛选">
          {[
            ['all', '全部'],
            ['exam', '考试新闻'],
            ['admission', '招生新闻'],
            ['school', '学校动态']
          ].map(([value, label]) => (
            <button
              key={value}
              className={`news-filter${activeFilter === value ? ' news-filter-active' : ''}`}
              type="button"
              onClick={() => setActiveFilter(value)}
            >
              {label}
            </button>
          ))}
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
                {headline.source?.url ? <a className="action-link-chip action-link-chip-strong" href={headline.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
              </article>
            </div>
            <div className="news-grid">
              {restNews.slice(0, 8).map((item) => (
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
        ) : <EmptyState />}
      </section>

      <section className="panel newsroom-policy-desk" id="policies">
        <div className="section-heading">
          <h2>政策深读</h2>
          <p>这里只保留 {currentYear} 年官方政策文件和配套通知，避免第三方内容和旧年份文件混进主版面。</p>
        </div>
        <div className="policy-list">
          {currentYearPolicies.length ? currentYearPolicies.map((policy) => (
            <article key={policy.id} className="policy-card">
              <div className="policy-card-header">
                <h3>{policy.title}</h3>
                <span className="pill">{policy.districtName || policy.district || '全市'}</span>
              </div>
              <p className="policy-summary">{getPolicySummaryText(policy)}</p>
              <p className="policy-meta">{policy.year || ''}{policy.publishedAt ? ` | ${policy.publishedAt}` : ''}</p>
              {getPolicyDetailText(policy) ? (
                <details className="policy-details">
                  <summary>查看政策要点</summary>
                  <p className="policy-content">{getPolicyDetailText(policy)}</p>
                </details>
              ) : null}
              <div className="newsroom-policy-footer">
                <p className="policy-source">来源：{policy.source?.name || '未知'} · 可信度 {formatConfidence(policy.source?.confidence)}</p>
                {policy.source?.url ? <a className="text-link" href={policy.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
              </div>
            </article>
          )) : <EmptyState />}
        </div>
      </section>

      <section className="panel policy-timeline-panel" id="admission-timeline">
        <div className="section-heading">
          <h2>官方招生日程提醒</h2>
          <p>把最容易错过的时间窗口放到一块看，适合先掌握全年关键节奏。</p>
        </div>
        <div className="policy-glossary timeline-grid">
          {admissionTimeline.map((item) => (
            <article key={item.title} className="glossary-card timeline-card">
              <div className="glossary-meta timeline-meta">
                <span className="pill">{item.tag}</span>
                <span className="glossary-date timeline-window">{item.window}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="glossary-summary">{item.summary}</p>
              <p className="glossary-detail">{item.detail}</p>
              <p className="glossary-source">{item.source}</p>
              <div className="glossary-links">
                {item.links.map((link) => (
                  <a key={link.href} className="text-link" href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel policy-glossary-panel" id="policy-glossary">
        <div className="section-heading">
          <h2>政策概念速查</h2>
          <p>把新闻里高频出现、最容易混淆的术语集中拆开解释。</p>
        </div>
        <div className="policy-glossary">
          {policyGlossary.map((item) => (
            <article key={item.title} className="glossary-card">
              <div className="glossary-meta">
                <span className="pill">{item.pill}</span>
                <span className="glossary-date">{item.date}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="glossary-summary">{item.summary}</p>
              <p className="glossary-detail">{item.detail}</p>
              <p className="glossary-source">{item.source}</p>
              <div className="glossary-links">
                {item.links.map((link) => (
                  <a key={link.href} className="text-link" href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
